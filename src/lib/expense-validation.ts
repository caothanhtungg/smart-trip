import type {
  CreateExpenseFormData,
  ExpenseValidationResult,
  ExpenseValidationErrors,
  TripMember,
} from "../types/trip";

/**
 * Giới hạn số tiền chi tối đa cho một khoản chi (1 tỷ VND)
 * nhằm ngăn chặn lỗi tràn số và nhập liệu nhầm.
 */
export const MAX_EXPENSE_AMOUNT = 1_000_000_000;

/**
 * Chuyển đổi chuỗi nhập tiền (có thể chứa dấu chấm, khoảng trắng, ký hiệu đ) thành số nguyên VND.
 */
export function parseExpenseMoneyInput(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return null;
  const parsed = parseInt(digitsOnly, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Định dạng số nguyên VND thành chuỗi có dấu chấm phân cách hàng nghìn (ví dụ: 1250000 -> "1.250.000")
 */
export function formatExpenseMoneyInput(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount === 0) return "";
  return Math.floor(amount).toLocaleString("vi-VN");
}

/**
 * Xác thực biểu mẫu tạo khoản chi mới theo đúng các quy tắc nghiệp vụ đã phê duyệt:
 * - Tiền: Số nguyên dương VND > 0, không vượt quá 1 tỷ VND (R3).
 * - Tên khoản chi: Bắt buộc, tối đa 200 ký tự (theo ERD varchar(200)).
 * - Danh mục: Thuộc 6 danh mục hợp lệ theo ERD enum.
 * - Quyền người trả tiền (R18 đã duyệt):
 *   + Member thường chỉ được ghi nhận chính mình là người trả.
 *   + Host được phép ghi hộ cho bất kỳ ai (bao gồm thành viên chưa có tài khoản).
 * - Thành viên chia: Phải có ít nhất 1 thành viên tham gia chia khoản chi.
 * - Ngày chi: Bắt buộc, định dạng hợp lệ.
 */
export function validateExpenseForm(
  data: CreateExpenseFormData,
  currentUserMemberId: string,
  isHost: boolean,
  tripMembers: TripMember[]
): ExpenseValidationResult {
  const errors: ExpenseValidationErrors = {};

  // 1. Tên khoản chi
  const trimmedTitle = data.title ? data.title.trim() : "";
  if (!trimmedTitle) {
    errors.title = "Vui lòng nhập tên khoản chi.";
  } else if (trimmedTitle.length > 200) {
    errors.title = "Tên khoản chi không được vượt quá 200 ký tự.";
  }

  // 2. Số tiền chi (R3)
  if (data.amount === null || data.amount === undefined || isNaN(data.amount) || data.amount <= 0) {
    errors.amount = "Số tiền phải là số nguyên lớn hơn 0 ₫.";
  } else if (!Number.isSafeInteger(data.amount)) {
    errors.amount = "Số tiền vượt quá giới hạn an toàn.";
  } else if (data.amount > MAX_EXPENSE_AMOUNT) {
    errors.amount = `Số tiền không được vượt quá ${MAX_EXPENSE_AMOUNT.toLocaleString("vi-VN")} ₫.`;
  }

  // 3. Danh mục chi tiêu
  const validCategories = ["FOOD", "TRANSPORT", "LODGING", "TICKET", "SHOPPING", "OTHER"];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = "Vui lòng chọn danh mục chi tiêu hợp lệ.";
  }

  // 4. Quyền người trả tiền (Quyết định nghiệp vụ R18)
  if (!data.paidByMemberId) {
    errors.paidByMemberId = "Vui lòng chọn người thanh toán.";
  } else {
    const payerExists = tripMembers.some((m) => m.id === data.paidByMemberId);
    if (!payerExists) {
      errors.paidByMemberId = "Người thanh toán không thuộc danh sách thành viên chuyến đi.";
    } else if (!isHost && data.paidByMemberId !== currentUserMemberId) {
      errors.paidByMemberId =
        "Thành viên chỉ được ghi nhận khoản chi do chính mình thanh toán (Quy tắc R18).";
    }
  }

  // 5. Thành viên tham gia chia tiền
  if (!data.participantMemberIds || data.participantMemberIds.length === 0) {
    errors.participants = "Vui lòng chọn ít nhất 1 thành viên tham gia chia tiền.";
  } else {
    const invalidParticipants = data.participantMemberIds.filter(
      (id) => !tripMembers.some((m) => m.id === id)
    );
    if (invalidParticipants.length > 0) {
      errors.participants = "Danh sách người chia có thành viên không thuộc chuyến đi.";
    }
  }

  // 6. Ngày chi
  if (!data.spentAtDate || !data.spentAtDate.trim()) {
    errors.spentAtDate = "Vui lòng chọn ngày phát sinh khoản chi.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
