import {
  UpdateProfileFormData,
  UpdateBankFormData,
  ProfileValidationErrors,
  BankValidationErrors,
} from "@/types/user";
import { POPULAR_BANKS } from "@/lib/mock/banks";

/**
 * Chuẩn hóa tên chủ tài khoản ngân hàng:
 * - Chuyển sang chữ IN HOA
 * - Bỏ toàn bộ dấu tiếng Việt
 * - Loại bỏ ký tự đặc biệt, chỉ giữ lại chữ cái và khoảng trắng đơn
 * Ví dụ: "Nguyễn Phương Lan" -> "NGUYEN PHUONG LAN"
 */
export function normalizeAccountHolderName(name: string): string {
  if (!name) return "";

  const unaccented = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  return unaccented;
}

/**
 * Validate form cập nhật thông tin cá nhân.
 */
export function validateProfileForm(
  data: UpdateProfileFormData
): { isValid: boolean; errors: ProfileValidationErrors } {
  const errors: ProfileValidationErrors = {};

  const trimmedFullName = data.fullName.trim();
  if (!trimmedFullName) {
    errors.fullName = "Vui lòng nhập họ và tên";
  } else if (trimmedFullName.length < 2) {
    errors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
  } else if (trimmedFullName.length > 100) {
    errors.fullName = "Họ và tên không được vượt quá 100 ký tự";
  }

  const trimmedDisplayName = data.displayName.trim();
  if (!trimmedDisplayName) {
    errors.displayName = "Vui lòng nhập tên hiển thị trong nhóm";
  } else if (trimmedDisplayName.length < 2) {
    errors.displayName = "Tên hiển thị phải có ít nhất 2 ký tự";
  } else if (trimmedDisplayName.length > 50) {
    errors.displayName = "Tên hiển thị không được vượt quá 50 ký tự";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate form cập nhật thông tin ngân hàng VietQR.
 */
export function validateBankForm(
  data: UpdateBankFormData
): { isValid: boolean; errors: BankValidationErrors } {
  const errors: BankValidationErrors = {};

  if (!data.bankBin || !POPULAR_BANKS.some((b) => b.bin === data.bankBin)) {
    errors.bankBin = "Vui lòng chọn ngân hàng thụ hưởng hợp lệ";
  }

  const cleanAccountNumber = data.accountNumber.trim();
  if (!cleanAccountNumber) {
    errors.accountNumber = "Vui lòng nhập số tài khoản ngân hàng";
  } else if (!/^[0-9A-Za-z]{6,20}$/.test(cleanAccountNumber)) {
    errors.accountNumber = "Số tài khoản phải từ 6 đến 20 ký tự (chữ hoặc số, không có khoảng trắng)";
  }

  const normalizedHolder = normalizeAccountHolderName(data.accountHolder);
  if (!normalizedHolder) {
    errors.accountHolder = "Vui lòng nhập tên chủ tài khoản";
  } else if (normalizedHolder.length < 2) {
    errors.accountHolder = "Tên chủ tài khoản phải có ít nhất 2 ký tự";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
