/**
 * Các phép tính tài chính và ngân sách thuần túy (pure functions) cho chuyến đi.
 * Tuân thủ nghiêm ngặt nguyên tắc: Không làm tròn hay kẹp giá trị im lặng.
 * Mọi số tiền phải là số nguyên an toàn trên đơn vị đồng VND (không dùng số thực hay số âm).
 */

import { assertSafeIntegerAmount } from "@/lib/money/format";

export interface BudgetStatus {
  hasBudget: boolean;
  remainingBudget: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
}

/**
 * Tính tổng số tiền đã chi của chuyến đi từ danh sách khoản chi.
 * Ném lỗi nếu bất kỳ khoản chi nào là số thực, NaN, Infinity hoặc số âm.
 */
export function calculateTotalSpent(
  expenses: readonly { amount: number }[]
): number {
  if (!expenses || expenses.length === 0) return 0;

  let total = 0;
  for (const item of expenses) {
    assertSafeIntegerAmount(item.amount, "calculateTotalSpent");
    if (item.amount < 0) {
      throw new RangeError(
        `[calculateTotalSpent] Khoản chi không được là số âm. Nhận được: ${item.amount}`
      );
    }
    total += item.amount;
  }

  return total;
}

/**
 * Tính toán trạng thái ngân sách: có đặt ngân sách không, số dư còn lại, có vượt chi không, số tiền vượt chi.
 * - plannedBudget: number | null. Khi null hoặc 0: hasBudget = false, isOverBudget = false, remainingBudget = 0.
 * - Ném lỗi nếu plannedBudget hoặc totalSpent là số thực, NaN, Infinity hoặc số âm.
 */
export function calculateBudgetStatus(
  plannedBudget: number | null,
  totalSpent: number
): BudgetStatus {
  assertSafeIntegerAmount(totalSpent, "calculateBudgetStatus");
  if (totalSpent < 0) {
    throw new RangeError(
      `[calculateBudgetStatus] Tổng chi tiêu không được là số âm. Nhận được: ${totalSpent}`
    );
  }

  if (plannedBudget === null || plannedBudget === 0) {
    return {
      hasBudget: false,
      remainingBudget: 0,
      isOverBudget: false,
      overBudgetAmount: 0,
    };
  }

  assertSafeIntegerAmount(plannedBudget, "calculateBudgetStatus");
  if (plannedBudget < 0) {
    throw new RangeError(
      `[calculateBudgetStatus] Ngân sách dự kiến không được là số âm. Nhận được: ${plannedBudget}`
    );
  }

  const isOverBudget = totalSpent > plannedBudget;
  const remainingBudget = isOverBudget ? 0 : plannedBudget - totalSpent;
  const overBudgetAmount = isOverBudget ? totalSpent - plannedBudget : 0;

  return {
    hasBudget: true,
    remainingBudget,
    isOverBudget,
    overBudgetAmount,
  };
}

/**
 * Tính mức chi tiêu bình quân trên mỗi thành viên (làm tròn xuống số nguyên VND).
 * Ném lỗi nếu totalSpent không hợp lệ hoặc memberCount <= 0.
 */
export function calculateAvgSpentPerPerson(
  totalSpent: number,
  memberCount: number
): number {
  assertSafeIntegerAmount(totalSpent, "calculateAvgSpentPerPerson");
  if (totalSpent < 0) {
    throw new RangeError(
      `[calculateAvgSpentPerPerson] Tổng chi tiêu không được là số âm. Nhận được: ${totalSpent}`
    );
  }

  if (
    typeof memberCount !== "number" ||
    !Number.isSafeInteger(memberCount) ||
    memberCount <= 0
  ) {
    throw new RangeError(
      `[calculateAvgSpentPerPerson] Số lượng thành viên phải là số nguyên dương lớn hơn 0. Nhận được: ${memberCount}`
    );
  }

  return Math.floor(totalSpent / memberCount);
}

/**
 * Tính tổng số tiền mà một thành viên đã ứng ra thanh toán.
 */
export function calculateUserSpent(
  expenses: readonly { paidByMemberId: string; amount: number }[],
  memberId: string
): number {
  if (!expenses || !memberId) return 0;

  let total = 0;
  for (const e of expenses) {
    if (e.paidByMemberId === memberId) {
      assertSafeIntegerAmount(e.amount, "calculateUserSpent");
      if (e.amount < 0) {
        throw new RangeError(
          `[calculateUserSpent] Khoản chi không được là số âm. Nhận được: ${e.amount}`
        );
      }
      total += e.amount;
    }
  }

  return total;
}

/**
 * Tính tổng số tiền chia mà một thành viên phải chịu qua các khoản chi.
 */
export function calculateUserShareTotal(
  expenses: readonly { shares?: readonly { memberId: string; amount: number }[] }[],
  memberId: string
): number {
  if (!expenses || !memberId) return 0;

  let total = 0;
  for (const exp of expenses) {
    if (exp.shares) {
      const share = exp.shares.find((s) => s.memberId === memberId);
      if (share) {
        assertSafeIntegerAmount(share.amount, "calculateUserShareTotal");
        if (share.amount < 0) {
          throw new RangeError(
            `[calculateUserShareTotal] Số tiền phần chia không được là số âm. Nhận được: ${share.amount}`
          );
        }
        total += share.amount;
      }
    }
  }

  return total;
}
