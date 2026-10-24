import crypto from "crypto";
import type { InviteCodeValidationResult } from "@/types/trip";

export const BASE31_INVITE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const MAX_INVITE_CODE_ATTEMPTS = 5;

/**
 * Kiểm tra xem một lỗi cơ sở dữ liệu có phải là vi phạm ràng buộc duy nhất (Unique Constraint)
 * đối với mã mời (invite_code / inviteCode / trips_invite_code_key) hay không.
 */
export function isInviteCodeUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    code?: string;
    meta?: { target?: unknown; constraint?: unknown };
    message?: string;
  };

  if (e.code !== "P2002") {
    return false;
  }

  // 1. Kiểm tra mảng hoặc chuỗi target từ Prisma
  const target = e.meta?.target;
  if (Array.isArray(target)) {
    if (
      target.some(
        (t) =>
          typeof t === "string" &&
          (t === "invite_code" ||
            t === "inviteCode" ||
            t.includes("invite_code") ||
            t.includes("inviteCode"))
      )
    ) {
      return true;
    }
  } else if (typeof target === "string") {
    if (
      target === "invite_code" ||
      target === "inviteCode" ||
      target.includes("invite_code") ||
      target.includes("inviteCode")
    ) {
      return true;
    }
  }

  // 2. Kiểm tra tên ràng buộc PostgreSQL (ví dụ trips_invite_code_key)
  const constraint = e.meta?.constraint;
  if (typeof constraint === "string" && constraint.includes("invite_code")) {
    return true;
  }

  // 3. Kiểm tra thông điệp lỗi phòng trường hợp mock hoặc adapter custom
  if (
    typeof e.message === "string" &&
    (e.message.includes("invite_code") || e.message.includes("inviteCode"))
  ) {
    return true;
  }

  return false;
}

export const TRIP_MEMBER_USER_ID_KEY = "trip_members_trip_id_user_id_key";

/**
 * Kiểm tra xem một lỗi cơ sở dữ liệu có phải là vi phạm ràng buộc duy nhất (Unique Constraint)
 * đối với thành viên người dùng trong chuyến đi (trip_members_trip_id_user_id_key) hay không.
 */
export function isUserMembershipUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    code?: string;
    meta?: { target?: unknown; constraint?: unknown };
    cause?: { code?: string; constraint?: unknown; message?: string };
    message?: string;
  };

  const isUniqueError =
    e.code === "P2002" ||
    e.code === "23505" ||
    e.cause?.code === "23505" ||
    (typeof e.message === "string" && e.message.includes("unique constraint"));

  if (!isUniqueError) return false;

  // 1. Kiểm tra target từ Prisma
  const target = e.meta?.target;
  if (Array.isArray(target)) {
    if (
      (target.includes("user_id") || target.includes("userId")) &&
      (target.includes("trip_id") || target.includes("tripId"))
    ) {
      return true;
    }
  } else if (typeof target === "string") {
    if (
      (target.includes("user_id") || target.includes("userId")) &&
      (target.includes("trip_id") || target.includes("tripId"))
    ) {
      return true;
    }
  }

  // 2. Kiểm tra tên constraint
  const constraint =
    typeof e.meta?.constraint === "string"
      ? e.meta.constraint
      : typeof e.cause?.constraint === "string"
      ? e.cause.constraint
      : "";

  if (
    constraint.includes(TRIP_MEMBER_USER_ID_KEY) ||
    (constraint.includes("user_id") && constraint.includes("trip_id"))
  ) {
    return true;
  }

  // 3. Kiểm tra thông điệp lỗi
  if (
    typeof e.message === "string" &&
    (e.message.includes(TRIP_MEMBER_USER_ID_KEY) ||
      (e.message.includes("user_id") && e.message.includes("trip_id")))
  ) {
    return true;
  }

  if (
    typeof e.cause?.message === "string" &&
    (e.cause.message.includes(TRIP_MEMBER_USER_ID_KEY) ||
      (e.cause.message.includes("user_id") && e.cause.message.includes("trip_id")))
  ) {
    return true;
  }

  return false;
}

/**
 * Sinh mã mời ngẫu nhiên an toàn mật mã theo chuẩn Base31:
 * - 12 ký tự ngẫu nhiên thuộc bảng ký tự Base31 (loại bỏ 0, O, 1, I, L)
 * - Định dạng XXXXXX-XXXXXX (đúng 13 ký tự khớp trips.invite_code varchar(13))
 */
export function generateInviteCode(): string {
  const bytes = crypto.randomBytes(12);
  let chars = "";
  for (let i = 0; i < 12; i++) {
    chars += BASE31_INVITE_ALPHABET[bytes[i] % BASE31_INVITE_ALPHABET.length];
  }
  return `${chars.slice(0, 6)}-${chars.slice(6, 12)}`;
}

/**
 * Kiểm tra định dạng mã mời theo chuẩn dự án (khớp ERD varchar(13)):
 * - 10-12 ký tự chữ/số không tính dấu gạch nối
 * - Cho phép tối đa 1 dấu gạch nối phân đoạn (độ dài chuỗi thô tối đa 13 ký tự)
 * - Không cho phép dấu gạch nối ở đầu/cuối
 * - Từ chối mã 6 ký tự
 * - Chuẩn hóa khoảng trắng đầu cuối và chuyển thành chữ in hoa
 */
export function validateInviteCode(
  rawCode: string | null | undefined
): InviteCodeValidationResult {
  if (!rawCode) {
    return {
      isValid: false,
      error: "Vui lòng nhập mã mời.",
    };
  }

  // 1. Normalize whitespace & uppercase
  const normalized = rawCode.trim().toUpperCase();

  if (!normalized) {
    return {
      isValid: false,
      error: "Vui lòng nhập mã mời.",
    };
  }

  // 2. Validate allowed characters: only alphanumeric [A-Z0-9] and hyphen [-]
  if (!/^[A-Z0-9-]+$/.test(normalized)) {
    return {
      isValid: false,
      error: "Mã mời chỉ được chứa chữ cái (A-Z), số (0-9) và dấu gạch nối (-).",
    };
  }

  // 3. Validate hyphen formatting & count limit (at most 1 hyphen allowed, e.g. DL3N2D-TRIP99)
  const hyphenCount = (normalized.match(/-/g) || []).length;
  if (hyphenCount > 1) {
    return {
      isValid: false,
      error: "Mã mời chỉ được chứa tối đa 1 dấu gạch nối phân đoạn.",
    };
  }

  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    return {
      isValid: false,
      error: "Dấu gạch nối không đúng định dạng (không được ở đầu hoặc cuối mã mời).",
    };
  }

  // 4. Count alphanumeric characters (excluding hyphens)
  const alnumOnly = normalized.replace(/-/g, "");

  if (alnumOnly.length < 10) {
    return {
      isValid: false,
      error: "Mã mời quá ngắn (phải có từ 10 đến 12 ký tự chữ/số, không tính dấu gạch nối).",
    };
  }

  if (alnumOnly.length > 12) {
    return {
      isValid: false,
      error: "Mã mời quá dài (tối đa 12 ký tự chữ/số, không tính dấu gạch nối).",
    };
  }

  // 5. Total raw string length must not exceed 13 characters (matching ERD varchar(13))
  if (normalized.length > 13) {
    return {
      isValid: false,
      error: "Độ dài mã mời không được vượt quá 13 ký tự.",
    };
  }

  // 6. Chuẩn hóa mã 12 ký tự về canonical format XXXXXX-XXXXXX khớp với định dạng lưu database
  const canonicalCode =
    alnumOnly.length === 12
      ? `${alnumOnly.slice(0, 6)}-${alnumOnly.slice(6, 12)}`
      : normalized;

  return {
    isValid: true,
    normalizedCode: canonicalCode,
  };
}
