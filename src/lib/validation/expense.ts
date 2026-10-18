import type {
  CreateExpenseFormData,
  ExpenseValidationResult,
  ExpenseValidationErrors,
  TripMember,
} from "@/types/trip";
import { MAX_EXPENSE_AMOUNT, MAX_MONEY_VND } from "@/lib/money/constants";
import { parseCalendarDate } from "@/lib/trip-form-validation";

export { MAX_EXPENSE_AMOUNT, MAX_MONEY_VND };

/**
 * LƯU Ý BẢO MẬT VÀ KIẾN TRÚC:
 * isHost và currentMemberId sẽ được tính toán và xác thực ở phía server từ Session người dùng
 * khi có backend thực tế, tuyệt đối không bao giờ nhận hoặc tin cậy trực tiếp từ request của client.
 *
 * Xác thực biểu mẫu tạo khoản chi mới theo đúng các quy tắc nghiệp vụ đã phê duyệt:
 * - Tiền: Số nguyên dương VND > 0, không vượt quá MAX_EXPENSE_AMOUNT (2 tỷ VND - R3).
 * - Tên khoản chi: Bắt buộc, tối đa 200 ký tự (theo ERD varchar(200)).
 * - Danh mục: Thuộc 6 danh mục hợp lệ theo ERD enum.
 * - Quyền người trả tiền (Quyết định nghiệp vụ R18):
 *   + Member thường chỉ được ghi nhận chính mình là người trả.
 *   + Host được phép ghi hộ cho bất kỳ ai (bao gồm thành viên chưa có tài khoản).
 *   + Người trả tiền bắt buộc phải thuộc chuyến đi và có status === "ACTIVE".
 * - Thành viên chia:
 *   + Phải có ít nhất 1 thành viên tham gia chia tiền.
 *   + Không được chứa ID trùng lặp.
 *   + Tất cả thành viên tham gia chia bắt buộc phải có status === "ACTIVE" (không chọn thành viên LEFT).
 * - Ngày chi: Bắt buộc, phải là ngày lịch hợp lệ (hỗ trợ YYYY-MM-DD hoặc DD/MM/YYYY).
 */
export function validateExpenseForm(
  data: CreateExpenseFormData,
  currentUserMemberId: string,
  isHost: boolean,
  tripMembers: TripMember[],
  currentTripTotalSpent: number = 0
): ExpenseValidationResult {
  const errors: ExpenseValidationErrors = {};

  // 1. Tên khoản chi
  const trimmedTitle = data.title ? data.title.trim() : "";
  if (!trimmedTitle) {
    errors.title = "Vui lòng nhập tên khoản chi.";
  } else if (trimmedTitle.length > 200) {
    errors.title = "Tên khoản chi không được vượt quá 200 ký tự.";
  }

  // 2. Số tiền chi (R3, tối đa 2 tỷ VND)
  if (
    data.amount === null ||
    data.amount === undefined ||
    isNaN(data.amount) ||
    data.amount <= 0
  ) {
    errors.amount = "Số tiền phải là số nguyên lớn hơn 0 ₫.";
  } else if (!Number.isSafeInteger(data.amount)) {
    errors.amount = "Số tiền vượt quá giới hạn an toàn.";
  } else if (data.amount > MAX_EXPENSE_AMOUNT) {
    errors.amount = `Số tiền không được vượt quá ${MAX_EXPENSE_AMOUNT.toLocaleString("vi-VN")} ₫.`;
  } else if (data.amount + currentTripTotalSpent > MAX_MONEY_VND) {
    errors.amount = "Tổng chi tiêu của chuyến đi không được vượt quá 2.000.000.000 ₫.";
  }

  // 3. Danh mục chi tiêu
  const validCategories = ["FOOD", "TRANSPORT", "LODGING", "TICKET", "SHOPPING", "OTHER"];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = "Vui lòng chọn danh mục chi tiêu hợp lệ.";
  }

  // 4. Quyền người trả tiền (Quyết định nghiệp vụ R18 & Trạng thái ACTIVE)
  if (!data.paidByMemberId) {
    errors.paidByMemberId = "Vui lòng chọn người thanh toán.";
  } else {
    const payer = tripMembers.find((m) => m.id === data.paidByMemberId);
    if (!payer) {
      errors.paidByMemberId = "Người thanh toán không thuộc danh sách thành viên chuyến đi.";
    } else if (payer.status !== "ACTIVE") {
      errors.paidByMemberId = `Người thanh toán "${payer.name}" đã rời nhóm hoặc không ở trạng thái hoạt động.`;
    } else if (!isHost && data.paidByMemberId !== currentUserMemberId) {
      errors.paidByMemberId =
        "Thành viên chỉ được ghi nhận khoản chi do chính mình thanh toán (Quy tắc R18).";
    }
  }

  // 5. Thành viên tham gia chia tiền (Không rỗng, Không trùng lặp, Bắt buộc status ACTIVE)
  if (!data.participantMemberIds || data.participantMemberIds.length === 0) {
    errors.participants = "Vui lòng chọn ít nhất 1 thành viên tham gia chia tiền.";
  } else {
    // Kiểm tra trùng lặp ID
    const seenIds = new Set<string>();
    let hasDuplicate = false;
    for (const id of data.participantMemberIds) {
      if (seenIds.has(id)) {
        hasDuplicate = true;
        break;
      }
      seenIds.add(id);
    }

    if (hasDuplicate) {
      errors.participants = "Danh sách người chia không được chứa thành viên trùng lặp.";
    } else {
      // Kiểm tra thành viên tồn tại và có status ACTIVE
      for (const id of data.participantMemberIds) {
        const member = tripMembers.find((m) => m.id === id);
        if (!member) {
          errors.participants = "Danh sách người chia có thành viên không thuộc chuyến đi.";
          break;
        }
        if (member.status !== "ACTIVE") {
          errors.participants = `Thành viên "${member.name}" đã rời nhóm, không thể tham gia chia tiền.`;
          break;
        }
      }
    }
  }

  // 6. Ngày chi (Phải là ngày lịch hợp lệ)
  if (!data.spentAtDate || !data.spentAtDate.trim()) {
    errors.spentAtDate = "Vui lòng chọn ngày phát sinh khoản chi.";
  } else {
    const parsedDate = parseCalendarDate(data.spentAtDate);
    if (!parsedDate) {
      errors.spentAtDate = "Ngày chi không đúng định dạng lịch hợp lệ.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
