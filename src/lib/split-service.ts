import type { ExpenseCategory } from "../types/trip";

export interface EqualShareResult {
  memberId: string;
  amount: number;
  hasRemainderExtra: boolean;
}

/**
 * Thuật toán chia đều có phần dư theo quy tắc R4:
 * - Số tiền cơ sở: Base = floor(Amount / N)
 * - Số dư: Remainder = Amount - (Base * N)
 * - Các thành viên có thứ tự index < Remainder theo join_order nhận thêm 1 VND (Base + 1)
 * - Các thành viên còn lại nhận Base VND
 * - Bất biến: Tổng các phần chia luôn chính xác 100% bằng Amount
 */
export function computeEqualShares(
  totalAmount: number,
  memberIdsInJoinOrder: string[]
): EqualShareResult[] {
  const n = memberIdsInJoinOrder.length;
  if (n === 0 || totalAmount <= 0) {
    return [];
  }

  // Đảm bảo số tiền là số nguyên VND an toàn
  const safeAmount = Math.floor(totalAmount);
  const base = Math.floor(safeAmount / n);
  const remainder = safeAmount - base * n; // 0 <= remainder < n

  let runningSum = 0;
  const results: EqualShareResult[] = memberIdsInJoinOrder.map((id, index) => {
    const hasExtra = index < remainder;
    const share = base + (hasExtra ? 1 : 0);
    runningSum += share;
    return {
      memberId: id,
      amount: share,
      hasRemainderExtra: hasExtra,
    };
  });

  // Kiểm tra bất biến số học nghiêm ngặt (R3, R4)
  if (runningSum !== safeAmount) {
    throw new Error(
      `Lỗi bất biến số học chia tiền: Tổng phần chia (${runningSum}) không khớp số tiền tổng (${safeAmount})`
    );
  }

  return results;
}

/**
 * Trả về nhãn tiếng Việt chuẩn cho từng danh mục chi tiêu theo ERD và Stitch
 */
export function getCategoryLabel(category: ExpenseCategory): string {
  switch (category) {
    case "FOOD":
      return "Ăn uống";
    case "TRANSPORT":
      return "Di chuyển";
    case "LODGING":
      return "Lưu trú";
    case "TICKET":
      return "Vé tham quan";
    case "SHOPPING":
      return "Mua sắm";
    case "OTHER":
    default:
      return "Khác";
  }
}

/**
 * Trả về màu đại diện chuẩn thương hiệu Smart Trip cho từng danh mục
 */
export function getCategoryColor(category: ExpenseCategory): string {
  switch (category) {
    case "FOOD":
      return "#34A0A4"; // Tropical Teal
    case "TRANSPORT":
      return "#1A759F"; // Cerulean
    case "LODGING":
      return "#184E77"; // Yale Blue
    case "TICKET":
      return "#76C893"; // Emerald
    case "SHOPPING":
      return "#D9ED92"; // Lime Cream
    case "OTHER":
    default:
      return "#52B69A"; // Ocean Mist
  }
}
