import type {
  ExpenseItemData,
  ExpenseSurchargeData,
  ItemizedExpenseValidationResult,
  ItemizedExpenseValidationErrors,
  TripMember,
} from "@/types/trip";

/**
 * Xác thực dữ liệu biểu mẫu chia theo món (Giai đoạn 2D.2)
 *
 * Kiểm tra:
 * 1. Phải có ít nhất 1 món ăn.
 * 2. Tên mỗi món: không rỗng, tối đa 200 ký tự.
 * 3. Số tiền mỗi món: số nguyên dương an toàn (> 0).
 * 4. Thành viên mỗi món: ít nhất 1 người, không trùng lặp, phải thuộc chuyến đi và status === "ACTIVE".
 * 5. Phụ phí VAT / phí dịch vụ (nếu có): số nguyên an toàn >= 0.
 * 6. Đối soát tổng: Tổng các món + phụ phí bắt buộc phải khớp 100% với số tiền hóa đơn totalAmount.
 */
export function validateItemizedExpense(
  totalAmount: number | null | undefined,
  items: ExpenseItemData[],
  surcharge: ExpenseSurchargeData | null | undefined,
  tripMembers: TripMember[]
): ItemizedExpenseValidationResult {
  const errors: ItemizedExpenseValidationErrors = {};
  const itemsListErrors: Record<string, { name?: string; amount?: string; members?: string }> = {};

  // 1. Kiểm tra số tiền hóa đơn tổng
  if (
    totalAmount === null ||
    totalAmount === undefined ||
    isNaN(totalAmount) ||
    totalAmount <= 0
  ) {
    errors.amount = "Số tiền hóa đơn phải là số nguyên lớn hơn 0 ₫.";
  } else if (!Number.isSafeInteger(totalAmount)) {
    errors.amount = "Số tiền hóa đơn vượt quá giới hạn an toàn.";
  }

  // 2. Kiểm tra danh sách món
  if (!items || items.length === 0) {
    errors.items = "Vui lòng nhập ít nhất một món ăn.";
  } else {
    const activeMemberMap = new Map<string, TripMember>();
    for (const m of tripMembers) {
      if (m.status === "ACTIVE") {
        activeMemberMap.set(m.id, m);
      }
    }

    let hasItemError = false;

    items.forEach((item, index) => {
      const itemKey = item.id || `item_${index}`;
      const itemErr: { name?: string; amount?: string; members?: string } = {};

      // Tên món
      const trimmedName = item.name ? item.name.trim() : "";
      if (!trimmedName) {
        itemErr.name = "Vui lòng nhập tên món.";
      } else if (trimmedName.length > 200) {
        itemErr.name = "Tên món không được vượt quá 200 ký tự.";
      }

      // Giá món
      if (
        item.amount === null ||
        item.amount === undefined ||
        isNaN(item.amount) ||
        item.amount <= 0
      ) {
        itemErr.amount = "Giá món phải là số nguyên lớn hơn 0 ₫.";
      } else if (!Number.isSafeInteger(item.amount)) {
        itemErr.amount = "Giá món vượt quá giới hạn an toàn.";
      }

      // Thành viên tham gia
      if (!item.assignedMemberIds || item.assignedMemberIds.length === 0) {
        itemErr.members = `Món "${trimmedName || `Món ${index + 1}`}" chưa có người nhận.`;
      } else {
        const seen = new Set<string>();
        for (const memberId of item.assignedMemberIds) {
          if (seen.has(memberId)) {
            itemErr.members = "Phát hiện thành viên trùng lặp trong cùng một món.";
            break;
          }
          seen.add(memberId);

          const member = tripMembers.find((m) => m.id === memberId);
          if (!member) {
            itemErr.members = "Người nhận không thuộc danh sách thành viên chuyến đi.";
            break;
          }
          if (member.status !== "ACTIVE") {
            itemErr.members = `Thành viên "${member.name}" đã rời nhóm, không thể tham gia chia món.`;
            break;
          }
        }
      }

      if (Object.keys(itemErr).length > 0) {
        itemsListErrors[itemKey] = itemErr;
        hasItemError = true;
      }
    });

    if (hasItemError) {
      errors.itemsList = itemsListErrors;
    }
  }

  // 3. Kiểm tra phụ phí VAT / Phí dịch vụ
  let surchargeAmount = 0;
  if (surcharge !== null && surcharge !== undefined) {
    if (
      surcharge.amount === null ||
      surcharge.amount === undefined ||
      isNaN(surcharge.amount) ||
      surcharge.amount < 0
    ) {
      errors.surcharge = "Số tiền phụ phí không được là số âm.";
    } else if (!Number.isSafeInteger(surcharge.amount)) {
      errors.surcharge = "Số tiền phụ phí vượt quá giới hạn an toàn.";
    } else {
      surchargeAmount = surcharge.amount;
    }
  }

  // 4. Đối soát tổng các món + phụ phí với số tiền hóa đơn
  const safeTotal =
    typeof totalAmount === "number" && Number.isSafeInteger(totalAmount) && totalAmount > 0
      ? totalAmount
      : 0;

  const sumItems = items
    ? items.reduce((acc, it) => {
        const amt = typeof it.amount === "number" && Number.isSafeInteger(it.amount) && it.amount > 0 ? it.amount : 0;
        return acc + amt;
      }, 0)
    : 0;

  const totalCalculated = sumItems + surchargeAmount;
  const difference = totalCalculated - safeTotal;

  if (safeTotal > 0 && difference !== 0) {
    if (difference > 0) {
      errors.reconciliation = `Tổng các món và phụ phí (${totalCalculated.toLocaleString("vi-VN")} ₫) đang lớn hơn số tiền hóa đơn (${safeTotal.toLocaleString("vi-VN")} ₫) là ${difference.toLocaleString("vi-VN")} ₫. Vui lòng điều chỉnh lại.`;
    } else {
      const diffAbs = Math.abs(difference);
      errors.reconciliation = `Tổng các món và phụ phí (${totalCalculated.toLocaleString("vi-VN")} ₫) đang nhỏ hơn số tiền hóa đơn (${safeTotal.toLocaleString("vi-VN")} ₫) là ${diffAbs.toLocaleString("vi-VN")} ₫. Vui lòng kiểm tra lại các món.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    difference,
  };
}
