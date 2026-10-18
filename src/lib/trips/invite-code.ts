import type { InviteCodeValidationResult } from "@/types/trip";

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

  return {
    isValid: true,
    normalizedCode: normalized,
  };
}
