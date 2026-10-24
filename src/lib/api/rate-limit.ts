import { prisma } from "@/lib/db/prisma";
import type { PrismaClient } from "@/generated/prisma/client";
import { AppError } from "./errors";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
  prismaClient?: PrismaClient;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  resetAt: Date;
  remaining: number;
  limit: number;
}

interface RawRateLimitRow {
  count: number;
  reset_at: Date;
}

/**
 * Kiểm tra địa chỉ IPv4 hợp lệ (0.0.0.0 đến 255.255.255.255)
 */
function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number(part);
    if (num < 0 || num > 255) return false;
    if (part.length > 1 && part.startsWith("0")) return false; // Không cho phép leading zeros
  }
  return true;
}

/**
 * Kiểm tra địa chỉ IPv6 hợp lệ cơ bản
 */
function isValidIpv6(ip: string): boolean {
  if (!ip.includes(":")) return false;
  return /^[0-9a-fA-F:]+$/.test(ip);
}

/**
 * Xác thực địa chỉ IP có phải là IP hợp lệ hay không
 */
export function isValidIp(ip: string | null | undefined): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  return isValidIpv4(trimmed) || isValidIpv6(trimmed);
}

export const ALLOWED_TRUSTED_IP_HEADERS = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

export type AllowedTrustedIpHeader = (typeof ALLOWED_TRUSTED_IP_HEADERS)[number];

export interface GetClientIpOptions {
  /**
   * Tên header đáng tin cậy chỉ định rõ nguồn IP từ hạ tầng proxy.
   * Mặc định lấy từ biến môi trường `process.env.TRUSTED_CLIENT_IP_HEADER`.
   * Chỉ chấp nhận các header trong whitelist: "cf-connecting-ip", "x-real-ip", "x-forwarded-for".
   */
  trustedHeader?: string | null;
}

/**
 * Trích xuất Client IP từ nguồn proxy đáng tin cậy được cấu hình rõ ràng.
 *
 * NGUYÊN TẮC BẢO MẬT CHỐNG IP SPOOFING:
 * 1. Không tự động đoán ứng dụng chạy sau proxy nào. Nguồn IP bắt buộc phải được cấu hình
 *    qua biến môi trường `TRUSTED_CLIENT_IP_HEADER` (hoặc options.trustedHeader).
 * 2. Chỉ chấp nhận các header trong whitelist: 'cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'.
 * 3. Nếu không có cấu hình hoặc cấu hình không thuộc whitelist, KHÔNG tin bất kỳ header nào
 *    do client gửi lên; trả về khóa fallback chung "127.0.0.1" (fail-closed).
 * 4. Khi header tin cậy được chỉ định:
 *    - 'cf-connecting-ip' hoặc 'x-real-ip': chỉ đọc đúng header đó. Nếu thiếu hoặc IP không hợp lệ,
 *      trả về "127.0.0.1", tuyệt đối KHÔNG fallback sang header khác.
 *    - 'x-forwarded-for': Khi reverse proxy chèn thêm IP client, phần tử cuối cùng (rightmost)
 *      là IP do proxy trực tiếp kết nối tới server ghi nhận. Không chọn phần tử đầu tiên để
 *      tránh client tự gửi header giả mạo phía trước.
 */
export function getClientIp(
  req: Request | Headers,
  options?: GetClientIpOptions
): string {
  const headers = req instanceof Request ? req.headers : req;

  const rawConfigured = (
    options?.trustedHeader ??
    process.env.TRUSTED_CLIENT_IP_HEADER ??
    ""
  ).trim().toLowerCase();

  // 1. Không có cấu hình hoặc cấu hình không thuộc whitelist -> Không tin bất kỳ header nào
  if (!ALLOWED_TRUSTED_IP_HEADERS.includes(rawConfigured as AllowedTrustedIpHeader)) {
    return "127.0.0.1";
  }

  const trustedHeader = rawConfigured as AllowedTrustedIpHeader;

  // 2. Chỉ đọc header được cấu hình, không fallback sang header khác
  if (trustedHeader === "cf-connecting-ip") {
    const cfIp = headers.get("cf-connecting-ip")?.trim();
    if (cfIp && isValidIp(cfIp)) {
      return cfIp;
    }
    return "127.0.0.1";
  }

  if (trustedHeader === "x-real-ip") {
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp && isValidIp(realIp)) {
      return realIp;
    }
    return "127.0.0.1";
  }

  if (trustedHeader === "x-forwarded-for") {
    const forwarded = headers.get("x-forwarded-for");
    if (!forwarded) {
      return "127.0.0.1";
    }

    const rawIps = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    if (rawIps.length === 0) {
      return "127.0.0.1";
    }

    // Tuân thủ chính sách proxy tin cậy: phần tử cuối cùng (rightmost) là IP
    // do reverse proxy đáng tin cậy trực tiếp kết nối ghi nhận.
    const candidate = rawIps[rawIps.length - 1];
    if (isValidIp(candidate)) {
      return candidate;
    }

    return "127.0.0.1";
  }

  return "127.0.0.1";
}


/**
 * Thực thi kiểm tra giới hạn tần suất (Rate Limiting) nguyên tử qua bảng `rate_limits` trong PostgreSQL.
 *
 * Sử dụng SQL UPSERT `INSERT ... ON CONFLICT (key) DO UPDATE ... RETURNING`:
 * - Nếu key chưa tồn tại: Chèn dòng mới với count = 1, reset_at = now() + windowSeconds.
 * - Nếu key đã tồn tại và đã qua thời gian reset (reset_at < now()): Đặt lại count = 1, reset_at mới.
 * - Nếu key đã tồn tại và đang trong cửa sổ: Tăng count = count + 1, giữ nguyên reset_at.
 *
 * NGUYÊN TẮC AN TOÀN (Fail-Safe):
 * - Nếu không có kết quả hợp lệ hoặc truy vấn gặp lỗi, tuyệt đối KHÔNG mặc định request được phép.
 * - Thao tác ném AppError 500 an toàn, ngăn chặn việc bypass rate limit khi DB gặp sự cố.
 */
export async function checkPostgresRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options;

  if (!key || typeof key !== "string" || key.trim().length === 0) {
    throw new AppError("Rate limit key không hợp lệ.", {
      statusCode: 500,
      code: "RATE_LIMIT_ERROR",
    });
  }

  if (limit <= 0 || windowSeconds <= 0) {
    throw new AppError("Cấu hình rate limit không hợp lệ.", {
      statusCode: 500,
      code: "RATE_LIMIT_ERROR",
    });
  }

  const db = options.prismaClient ?? prisma;
  const nextResetAt = new Date(Date.now() + windowSeconds * 1000);

  try {
    const rows = await db.$queryRaw<RawRateLimitRow[]>`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${nextResetAt})
      ON CONFLICT (key) DO UPDATE
      SET count = CASE
        WHEN rate_limits.reset_at < now() THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at < now() THEN ${nextResetAt}
        ELSE rate_limits.reset_at
      END
      RETURNING count, reset_at;
    `;

    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]) {
      throw new AppError("Không nhận được kết quả rate limit hợp lệ từ cơ sở dữ liệu.", {
        statusCode: 500,
        code: "RATE_LIMIT_ERROR",
      });
    }

    const row = rows[0];
    const count = Number(row.count);
    const resetAt = new Date(row.reset_at);

    if (isNaN(count) || isNaN(resetAt.getTime())) {
      throw new AppError("Dữ liệu rate limit trả về từ cơ sở dữ liệu bị lỗi định dạng.", {
        statusCode: 500,
        code: "RATE_LIMIT_ERROR",
      });
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      allowed,
      count,
      resetAt,
      remaining,
      limit,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Nếu truy vấn database gặp lỗi, fail-safe bằng cách ném AppError, không cho request đi qua
    throw new AppError(
      "Không thể xác thực giới hạn tần suất truy cập. Vui lòng thử lại sau.",
      {
        statusCode: 500,
        code: "RATE_LIMIT_ERROR",
      }
    );
  }
}
