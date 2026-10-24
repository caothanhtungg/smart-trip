import {
  apiSuccess,
  apiError,
  handleApiError,
  BadRequestError,
  NotFoundError,
  GoneError,
} from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { validateInviteCode } from "@/lib/trips/invite-code";
import { calculateDurationText } from "@/lib/trip-form-validation";
import { checkPostgresRateLimit, getClientIp } from "@/lib/api/rate-limit";

interface RouteContext {
  params: Promise<{ code: string }> | { code: string };
}

export const RATE_LIMIT_INVITE_PREVIEW = 10;
export const RATE_LIMIT_INVITE_WINDOW_SECONDS = 60;

/**
 * GET /api/invites/[code]
 * Tra cứu thông tin xem trước của chuyến đi qua mã mời (Public endpoint).
 *
 * BẢO MẬT & QUYỀN TRUY CẬP (Rule R19):
 * 1. Giới hạn tần suất (Rate Limiting) tối đa 10 request/phút/IP trên PostgreSQL chống dò quét mã mời.
 * 2. Tuyệt đối KHÔNG yêu cầu người dùng đăng nhập để xem thông tin mời.
 * 3. Tuyệt đối KHÔNG trả về: ngân sách, lịch trình địa điểm, dữ liệu chi tiêu,
 *    thông tin ngân hàng hay thông tin liên hệ (email/SĐT/user ID) của bất kỳ thành viên nào.
 * 4. Chuyến đi ARCHIVED trả về 410 GONE theo chuẩn REST.
 * 5. Chuyến đi SETTLING hoặc COMPLETED trả về preview nhưng đánh dấu isJoinable = false.
 */
export async function GET(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    // 1. Áp dụng Rate Limit trước khi truy vấn database tốn kém
    const clientIp = getClientIp(req);
    const rateLimitKey = `invite:${clientIp}`;

    const rateLimit = await checkPostgresRateLimit({
      key: rateLimitKey,
      limit: RATE_LIMIT_INVITE_PREVIEW,
      windowSeconds: RATE_LIMIT_INVITE_WINDOW_SECONDS,
    });

    const rateLimitHeaders: Record<string, string> = {
      "X-RateLimit-Limit": String(rateLimit.limit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt.getTime() / 1000)),
    };

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      );
      return apiError(
        "Bạn đã vượt quá giới hạn tra cứu mã mời (tối đa 10 lần/phút). Vui lòng thử lại sau.",
        {
          status: 429,
          code: "TOO_MANY_REQUESTS",
          headers: {
            ...rateLimitHeaders,
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    // 2. Lấy params và chuẩn hóa mã mời
    const params = await context.params;
    const rawCode = params.code;

    const validation = validateInviteCode(rawCode);
    if (!validation.isValid || !validation.normalizedCode) {
      throw new BadRequestError(
        validation.error || "Mã mời chuyến đi không đúng định dạng."
      );
    }

    const normalizedCode = validation.normalizedCode;

    // 3. Truy vấn chuyến đi trong DB bằng explicit select (chỉ lấy các trường an toàn)
    const trip = await prisma.trip.findUnique({
      where: { inviteCode: normalizedCode },
      select: {
        id: true,
        name: true,
        destination: true,
        startDate: true,
        endDate: true,
        status: true,
        inviteCode: true,
        members: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            displayName: true,
            role: true,
            joinOrder: true,
            user: {
              select: {
                image: true,
              },
            },
          },
          orderBy: { joinOrder: "asc" },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError("Mã mời không tồn tại hoặc đã bị thu hồi.");
    }

    // 4. Kiểm tra trạng thái chuyến đi
    if (trip.status === "ARCHIVED") {
      throw new GoneError("Chuyến đi này đã được lưu trữ hoặc đóng tham gia.");
    }

    const isJoinable = trip.status === "ACTIVE";

    // 5. Tính toán chuỗi thời lượng (durationText)
    const startDateStr = trip.startDate.toISOString().slice(0, 10);
    const endDateStr = trip.endDate.toISOString().slice(0, 10);
    const durationText =
      calculateDurationText(startDateStr, endDateStr) || "1 ngày";

    // 6. Tìm Trưởng nhóm và ánh xạ thành viên
    const hostMember = trip.members.find((m) => m.role === "HOST");
    const hostName = hostMember?.displayName ?? "Trưởng nhóm";
    const hostAvatarUrl = hostMember?.user?.image ?? null;

    const mappedMembers = trip.members.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      avatarUrl: m.user?.image ?? null,
      role: m.role,
    }));

    // 7. Lọc các thành viên ảo chưa liên kết tài khoản (claimablePlaceholders)
    const claimablePlaceholders = trip.members
      .filter((m) => m.userId === null)
      .map((m) => ({
        id: m.id,
        displayName: m.displayName,
      }));

    const previewData = {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      durationText,
      hostName,
      hostAvatarUrl,
      members: mappedMembers,
      memberCount: trip.members.length,
      status: trip.status,
      inviteCode: trip.inviteCode,
      isJoinable,
      claimablePlaceholders,
    };

    return apiSuccess(previewData, {
      headers: rateLimitHeaders,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
