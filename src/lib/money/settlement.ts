import type { TripMember, TripExpense } from "@/types/trip";
import type {
  MemberBalanceBreakdown,
  MemberBankInfo,
  SettlementTransfer,
} from "@/types/settlement";
import { simplify } from "./simplify";
import { MAX_MONEY_VND } from "./constants";

export interface CalculateBalancesResult {
  balances: MemberBalanceBreakdown[];
  totalPaid: number;
  totalOwed: number;
  isZeroSum: boolean;
}

/**
 * Tính toán số dư ròng của từng thành viên:
 * - Paid: Tổng tiền thành viên đã ứng trả
 * - Owed: Tổng tiền các phần chia thành viên phải gánh chịu
 * - Net: Paid - Owed (dương = nhận lại, âm = cần trả, 0 = đã cân bằng)
 *
 * Ràng buộc:
 * 1. Bất biến Zero-Sum: Tổng số dư ròng SUM(net) bắt buộc phải bằng 0.
 * 2. Bảo toàn chi tiêu: Tổng tiền đã trả SUM(paid) phải bằng tổng tiền phải gánh SUM(owed).
 * 3. An toàn số nguyên: Tiền luôn là số nguyên VND an toàn.
 */
export function calculateMemberBalances(
  members: readonly TripMember[],
  expenses: readonly TripExpense[],
  bankInfoMap?: Record<string, MemberBankInfo>,
  options?: { includeLeftMembers?: boolean }
): CalculateBalancesResult {
  if (!members || members.length === 0) {
    return {
      balances: [],
      totalPaid: 0,
      totalOwed: 0,
      isZeroSum: true,
    };
  }

  const effectiveMembers = options?.includeLeftMembers
    ? members
    : members.filter((m) => m.status === "ACTIVE");
  const memberMap = new Map<string, TripMember>();
  effectiveMembers.forEach((m) => memberMap.set(m.id, m));

  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();

  // Khởi tạo 0 cho mọi thành viên được xét
  effectiveMembers.forEach((m) => {
    paidMap.set(m.id, 0);
    owedMap.set(m.id, 0);
  });

  // 1. Tổng hợp tiền đã trả từ các khoản chi
  for (const exp of expenses || []) {
    if (typeof exp.amount !== "number" || !Number.isSafeInteger(exp.amount) || exp.amount <= 0) {
      throw new TypeError(`[calculateMemberBalances] Số tiền khoản chi không hợp lệ (phải > 0): ${exp.amount}`);
    }
    if (exp.amount > MAX_MONEY_VND) {
      throw new Error(`[calculateMemberBalances] Số tiền khoản chi vượt quá giới hạn an toàn ${MAX_MONEY_VND} ₫`);
    }

    if (memberMap.has(exp.paidByMemberId)) {
      const currentPaid = paidMap.get(exp.paidByMemberId) || 0;
      paidMap.set(exp.paidByMemberId, currentPaid + exp.amount);
    }

    // 2. Tổng hợp tiền phải gánh chịu từ các phần chia
    for (const share of exp.shares || []) {
      if (typeof share.amount !== "number" || !Number.isSafeInteger(share.amount) || share.amount < 0) {
        throw new TypeError(`[calculateMemberBalances] Phần chia không hợp lệ: ${share.amount}`);
      }
      if (memberMap.has(share.memberId)) {
        const currentOwed = owedMap.get(share.memberId) || 0;
        owedMap.set(share.memberId, currentOwed + share.amount);
      }
    }
  }

  // 3. Xây dựng danh sách MemberBalanceBreakdown
  let totalPaid = 0;
  let totalOwed = 0;
  let sumNet = 0;

  // Giữ thứ tự theo joinOrder của các thành viên
  const sortedMembers = [...effectiveMembers].sort((a, b) => {
    if (a.joinOrder !== b.joinOrder) return a.joinOrder - b.joinOrder;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const balances: MemberBalanceBreakdown[] = sortedMembers.map((m) => {
    const paid = paidMap.get(m.id) || 0;
    const owed = owedMap.get(m.id) || 0;
    const net = paid - owed;

    totalPaid += paid;
    totalOwed += owed;
    sumNet += net;

    return {
      memberId: m.id,
      memberName: m.name,
      paidAmount: paid,
      owedAmount: owed,
      netAmount: net,
      isCurrentUser: !!m.isCurrentUser,
      isHost: m.role === "HOST" || !!m.isHost,
      isNoAccount: !!m.isNoAccount,
      bankInfo: bankInfoMap ? bankInfoMap[m.id] : undefined,
    };
  });

  // 4. Kiểm tra bất biến số học Zero-Sum
  if (sumNet !== 0) {
    throw new Error(
      `[calculateMemberBalances] Lỗi bất biến số học nghiêm trọng: Tổng số dư ròng (${sumNet}) khác 0. Tổng đã trả = ${totalPaid}, Tổng phải gánh = ${totalOwed}.`
    );
  }

  return {
    balances,
    totalPaid,
    totalOwed,
    isZeroSum: true,
  };
}

/**
 * Sinh danh sách các giao dịch thanh toán đề xuất rút gọn bằng thuật toán tham lam (Greedy Debt Simplification):
 * Gọi module simplify(netMap).
 */
export function generateSettlementTransfers(
  settlementId: string,
  balances: readonly MemberBalanceBreakdown[]
): SettlementTransfer[] {
  if (!balances || balances.length === 0) return [];

  const netMap: Record<string, number> = {};
  balances.forEach((b) => {
    netMap[b.memberId] = b.netAmount;
  });

  // Gọi thuật toán rút gọn nợ tham lam
  const transactions = simplify(netMap);

  return transactions.map((tx, idx) => ({
    id: `transfer-${settlementId}-${idx + 1}`,
    settlementId,
    fromMemberId: tx.from,
    toMemberId: tx.to,
    amount: tx.amount,
    status: "UNPAID",
  }));
}

/**
 * Kiểm tra xem Trưởng nhóm có quyền mở lại sổ công nợ hay không:
 * Chỉ được phép mở lại sổ khi TOÀN BỘ các giao dịch chuyển tiền đều có status === "UNPAID" (chưa ai thanh toán).
 * (Quy tắc R7 & Sơ đồ tuần tự SD4).
 */
export function canReopenSettlement(transfers: readonly SettlementTransfer[]): boolean {
  if (!transfers || transfers.length === 0) return true;
  return transfers.every((t) => t.status === "UNPAID");
}

/**
 * Kiểm tra xem toàn bộ các giao dịch công nợ đã hoàn tất hay chưa:
 * Trả về true khi có ít nhất 1 giao dịch và toàn bộ đều là COMPLETED.
 */
export function isSettlementFullyCompleted(transfers: readonly SettlementTransfer[]): boolean {
  if (!transfers || transfers.length === 0) return false;
  return transfers.every((t) => t.status === "COMPLETED");
}
