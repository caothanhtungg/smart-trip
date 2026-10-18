export interface DebtTransaction {
  from: string; // Người phải trả tiền (debtor)
  to: string; // Người được nhận tiền (creditor)
  amount: number; // Số tiền nguyên dương VND cần chuyển
}

/**
 * Thuật toán rút gọn công nợ bằng thuật toán tham lam (Debt Simplification):
 * Ghép người nợ nhiều nhất với người nhận nhiều nhất, tie-break theo ID (thứ tự mã ký tự).
 *
 * Yêu cầu:
 * - Ném lỗi nếu bất kỳ giá trị nào trong `net` không phải là số nguyên an toàn.
 * - Ném lỗi nếu tổng tất cả số dư trong `net` khác 0 (vi phạm bất biến zero-sum).
 * - Nếu tất cả bằng 0: trả về mảng rỗng [] (không có giao dịch nào).
 * - Đảm bảo tính tất định (chạy nhiều lần cho cùng kết quả).
 * - Cho không quá (số người có số dư khác 0) - 1 giao dịch. Đây là thuật toán tham lam (greedy), KHÔNG đảm bảo số giao dịch nhỏ nhất.
 */
export function simplify(net: Record<string, number>): DebtTransaction[] {
  // 1. Kiểm tra tính hợp lệ của từng giá trị và tính tổng
  let totalSum = 0;
  for (const [id, value] of Object.entries(net)) {
    if (typeof value !== "number" || !Number.isSafeInteger(value)) {
      throw new TypeError(
        `[simplify] Số dư của thành viên "${id}" phải là số nguyên an toàn. Nhận được: ${value}`
      );
    }
    totalSum += value;
  }

  // 2. Kiểm tra bất biến zero-sum (tổng các khoản nợ và có phải triệt tiêu lẫn nhau)
  if (totalSum !== 0) {
    throw new Error(
      `[simplify] Tổng số dư ròng (net balance) phải chính xác bằng 0. Tổng hiện tại: ${totalSum}`
    );
  }

  // 3. Phân tách danh sách con nợ (net < 0) và chủ nợ (net > 0)
  interface ParticipantBalance {
    id: string;
    amount: number; // luôn là số dương
  }

  const debtors: ParticipantBalance[] = [];
  const creditors: ParticipantBalance[] = [];

  for (const [id, value] of Object.entries(net)) {
    if (value < 0) {
      debtors.push({ id, amount: -value });
    } else if (value > 0) {
      creditors.push({ id, amount: value });
    }
  }

  if (debtors.length === 0 || creditors.length === 0) {
    return [];
  }

  // Hàm sắp xếp ổn định: số tiền giảm dần, nếu bằng nhau thì so sánh mã ký tự ID
  const sortComparator = (a: ParticipantBalance, b: ParticipantBalance) => {
    if (b.amount !== a.amount) {
      return b.amount - a.amount;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };

  const transactions: DebtTransaction[] = [];

  // 4. Khớp lệnh tham lam (Greedy Matching)
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(sortComparator);
    creditors.sort(sortComparator);

    const maxDebtor = debtors[0];
    const maxCreditor = creditors[0];

    const settleAmount = Math.min(maxDebtor.amount, maxCreditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        from: maxDebtor.id,
        to: maxCreditor.id,
        amount: settleAmount,
      });
    }

    maxDebtor.amount -= settleAmount;
    maxCreditor.amount -= settleAmount;

    if (maxDebtor.amount === 0) {
      debtors.shift();
    }
    if (maxCreditor.amount === 0) {
      creditors.shift();
    }
  }

  return transactions;
}
