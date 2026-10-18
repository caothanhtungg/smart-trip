import {
  TripExpense,
  TripMember,
  ExpenseShare,
  ExpenseCategory,
  SplitMethod,
} from "@/types/trip";
import { getExpenseCategoryLabel, getSplitMethodLabel } from "@/lib/labels";

export interface ExpenseRowView {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  categoryLabel: string;
  paidByMemberId: string;
  paidByName: string;
  splitMethod: SplitMethod;
  splitMethodText: string;
  spentAt: string;
  spentAtFormatted: string;
  locationName?: string;
  note?: string;
  receiptImageUrl?: string;
  shares: ExpenseShare[];
  userShare?: ExpenseShare;
}

/**
 * Định dạng chuỗi ISO spentAt thành định dạng hiển thị tiếng Việt ngắn: "DD/MM - HH:mm"
 */
export function formatExpenseDate(spentAtIso: string | null | undefined): string {
  if (!spentAtIso) return "";
  const d = new Date(spentAtIso);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");

  return `${day}/${month} - ${hours}:${minutes}`;
}

/**
 * Chuyển đổi ngày nhập (YYYY-MM-DD) và giờ tùy chọn (HH:mm) thành chuỗi ISO duy nhất
 */
export function formatDateInputToIso(
  spentAtDate: string,
  spentAtTime?: string
): string {
  const trimmedDate = spentAtDate.trim();
  const time = spentAtTime && spentAtTime.trim() ? spentAtTime.trim() : "12:00";
  return `${trimmedDate}T${time}:00.000Z`;
}

/**
 * Dựng view model cho một dòng chi tiêu từ dữ liệu gốc TripExpense
 */
export function toExpenseRowView(
  expense: TripExpense,
  members: readonly TripMember[],
  currentUserId?: string
): ExpenseRowView {
  const payer = members.find((m) => m.id === expense.paidByMemberId);
  const payerName = payer ? payer.name : "Thành viên";
  const userShare = expense.shares.find((s) => s.memberId === currentUserId);

  let splitMethodText = getSplitMethodLabel(expense.splitMethod);
  if (expense.splitMethod === "EQUAL") {
    splitMethodText = `Chia đều (${expense.shares.length} người)`;
  } else if (expense.splitMethod === "ITEMIZED") {
    const itemCount = expense.items?.length || 0;
    splitMethodText = itemCount > 0 ? `Theo món (${itemCount} món)` : "Theo món";
  }

  return {
    id: expense.id,
    tripId: expense.tripId,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    categoryLabel: getExpenseCategoryLabel(expense.category),
    paidByMemberId: expense.paidByMemberId,
    paidByName: payerName,
    splitMethod: expense.splitMethod,
    splitMethodText,
    spentAt: expense.spentAt,
    spentAtFormatted: formatExpenseDate(expense.spentAt),
    locationName: expense.locationName,
    note: expense.note,
    receiptImageUrl: expense.receiptImageUrl,
    shares: expense.shares,
    userShare,
  };
}

export function toExpenseRowViews(
  expenses: readonly TripExpense[],
  members: readonly TripMember[],
  currentUserId?: string
): ExpenseRowView[] {
  return expenses.map((e) => toExpenseRowView(e, members, currentUserId));
}
