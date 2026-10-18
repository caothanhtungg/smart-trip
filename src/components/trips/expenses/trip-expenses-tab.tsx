"use client";

import * as React from "react";
import {
  TripDetailData,
  TripExpense,
  ExpenseFilterCategory,
  CreateExpenseFormData,
  ExpenseShare,
} from "@/types/trip";
import { TripExpenseSummaryBar } from "./trip-expense-summary-bar";
import { TripExpenseFilters } from "./trip-expense-filters";
import { TripExpenseDayGroup } from "./trip-expense-day-group";
import { TripExpenseFormModal } from "./trip-expense-form-modal";
import { TripReceiptLightboxModal } from "./trip-receipt-lightbox-modal";
import {
  CheckCircle2,
  Inbox,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { computeEqualShares, computeItemizedShares } from "@/lib/money/split";
import { formatDate } from "@/lib/utils";
import { formatDateInputToIso } from "@/lib/view/expense-row";
import { calculateTotalSpent } from "@/lib/money/budget";

interface TripExpensesTabProps {
  trip: TripDetailData;
  expenses: TripExpense[];
  onAddExpense: (newExpense: TripExpense) => void;
  currentUserId: string;
}

export function TripExpensesTab({
  trip,
  expenses,
  onAddExpense,
  currentUserId,
}: TripExpensesTabProps) {
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [selectedReceiptExpense, setSelectedReceiptExpense] = React.useState<TripExpense | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = React.useState<ExpenseFilterCategory>("ALL");
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // In-session ephemeral toast notification
  const [sessionToast, setSessionToast] = React.useState<string | null>(null);

  // Auto-dismiss session toast after 6s
  React.useEffect(() => {
    if (sessionToast) {
      const timer = setTimeout(() => {
        setSessionToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [sessionToast]);

  const isLocked = trip.status === "SETTLING" || trip.status === "COMPLETED";
  const currentUser = trip.members.find((m) => m.id === currentUserId);
  const isHost = currentUser?.role === "HOST" || !!currentUser?.isHost;

  // Calculate category counts
  const categoryCounts: Record<ExpenseFilterCategory, number> = React.useMemo(() => {
    const counts: Record<ExpenseFilterCategory, number> = {
      ALL: expenses.length,
      FOOD: 0,
      TRANSPORT: 0,
      LODGING: 0,
      TICKET: 0,
      SHOPPING: 0,
      OTHER: 0,
    };
    expenses.forEach((e) => {
      if (counts[e.category] !== undefined) {
        counts[e.category]++;
      }
    });
    return counts;
  }, [expenses]);

  // Filter expenses
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((e) => {
      // Category filter
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
        return false;
      }
      // Member filter
      if (selectedMemberId !== "ALL" && e.paidByMemberId !== selectedMemberId) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = e.title.toLowerCase().includes(query);
        const matchLocation = e.locationName ? e.locationName.toLowerCase().includes(query) : false;
        const matchNotes = e.note ? e.note.toLowerCase().includes(query) : false;
        const payer = trip.members.find((m) => m.id === e.paidByMemberId);
        const matchPayer = payer ? payer.name.toLowerCase().includes(query) : false;
        if (!matchTitle && !matchLocation && !matchNotes && !matchPayer) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedMemberId, searchQuery, trip.members]);

  // Group filtered expenses by date
  const groupedByDay = React.useMemo(() => {
    const map = new Map<string, TripExpense[]>();
    filteredExpenses.forEach((exp) => {
      const dateKey = exp.spentAt ? exp.spentAt.slice(0, 10) : "Chưa rõ ngày";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(exp);
    });

    const groups: { dateKey: string; dayLabel: string; expenses: TripExpense[] }[] = [];
    let dayIndex = 1;

    map.forEach((items, dateKey) => {
      const dayLabel = `Ngày ${dayIndex}`;
      groups.push({
        dateKey,
        dayLabel,
        expenses: items,
      });
      dayIndex++;
    });

    return groups;
  }, [filteredExpenses]);

  // Calculate totals using pure money function
  const totalAmount = React.useMemo(() => {
    return calculateTotalSpent(expenses);
  }, [expenses]);

  // Handle adding an expense
  const handleSaveExpense = (formData: CreateExpenseFormData) => {
    const safeAmount = formData.amount || 0;
    const expenseId = `exp-${Date.now()}`;

    // Sắp xếp participant theo joinOrder của các thành viên trong chuyến đi
    const participantsWithOrder = formData.participantMemberIds.map((id) => {
      const m = trip.members.find((member) => member.id === id);
      return { id, joinOrder: m ? m.joinOrder : 0 };
    });

    // Compute shares via safe domain logic
    let shares: ExpenseShare[] = [];
    if (formData.splitMethod === "ITEMIZED" && formData.items && formData.items.length > 0) {
      const itemizedShares = computeItemizedShares(
        safeAmount,
        formData.items,
        formData.surcharge || null,
        participantsWithOrder
      );
      shares = itemizedShares.map((s, idx) => ({
        id: `share-${expenseId}-${idx + 1}`,
        expenseId,
        memberId: s.memberId,
        amount: s.totalAmount,
      }));
    } else {
      shares = computeEqualShares(safeAmount, participantsWithOrder).map(
        (s, idx) => ({
          id: `share-${expenseId}-${idx + 1}`,
          expenseId,
          memberId: s.memberId,
          amount: s.amount,
          hasRemainderExtra: s.hasRemainderExtra,
        })
      );
    }

    const spentAtIso = formatDateInputToIso(formData.spentAtDate, formData.spentAtTime);

    const newExpense: TripExpense = {
      id: expenseId,
      tripId: trip.id,
      title: formData.title,
      category: formData.category,
      amount: safeAmount,
      paidByMemberId: formData.paidByMemberId,
      spentAt: spentAtIso,
      splitMethod: formData.splitMethod || "EQUAL",
      items: formData.items,
      surcharge: formData.surcharge,
      locationName: formData.locationName,
      note: formData.note,
      receiptImageUrl: formData.receiptImageUrl,
      shares,
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);

    // Show session alert toast
    setSessionToast("Đã thêm khoản chi (dữ liệu demo, chưa được lưu)");
  };

  return (
    <div className="w-full">
      {/* Session Toast Banner */}
      {sessionToast && (
        <div className="mb-6 p-4 rounded-2xl bg-tropical-teal/10 border border-tropical-teal/30 flex items-start gap-3 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-tropical-teal shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm text-yale-blue">
            <span>{sessionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSessionToast(null)}
            className="text-text-muted hover:text-yale-blue text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Locked Status Banner if SETTLING or COMPLETED */}
      {isLocked && (
        <div className="mb-6 p-4 rounded-2xl bg-functional-warning-bg border border-functional-warning/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-functional-warning shrink-0" />
            <div>
              <p className="font-bold text-yale-blue text-sm">
                Sổ chi tiêu đã chốt ({trip.status === "SETTLING" ? "Đang quyết toán" : "Đã hoàn tất"})
              </p>
              <p className="text-xs text-text-muted">
                Các khoản chi tiêu đã được khóa sổ theo quy tắc nghiệp vụ. Không thể thêm mới hoặc sửa đổi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Expense Summary Strip */}
      <TripExpenseSummaryBar
        trip={trip}
        totalExpensesAmount={totalAmount}
        totalExpensesCount={expenses.length}
        onOpenAddExpenseModal={() => setIsFormModalOpen(true)}
        isLocked={isLocked}
      />

      {/* Filter & Search Bar */}
      <TripExpenseFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        members={trip.members}
        selectedMemberId={selectedMemberId}
        onSelectMemberId={setSelectedMemberId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Grouped Expenses List */}
      <div className="space-y-6">
        {groupedByDay.length > 0 ? (
          groupedByDay.map((group) => (
            <TripExpenseDayGroup
              key={group.dateKey}
              dayLabel={group.dayLabel}
              spentDateFormatted={group.dateKey !== "Chưa rõ ngày" ? formatDate(group.dateKey) : ""}
              expenses={group.expenses}
              currentUserId={currentUserId}
              onViewReceipt={(expense) => setSelectedReceiptExpense(expense)}
            />
          ))
        ) : (
          <div className="bg-white rounded-[20px] p-12 text-center border border-border-hairline shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-text-muted mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-yale-blue">
              Không tìm thấy khoản chi nào
            </h4>
            <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "ALL" || selectedMemberId !== "ALL"
                ? "Không có khoản chi nào khớp với bộ lọc hiện tại. Thử thay đổi điều kiện tìm kiếm."
                : "Chuyến đi này chưa có khoản chi tiêu nào được ghi nhận."}
            </p>
            {(searchQuery || selectedCategory !== "ALL" || selectedMemberId !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedMemberId("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-cerulean bg-cerulean/10 hover:bg-cerulean/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
            {!isLocked && !searchQuery && selectedCategory === "ALL" && selectedMemberId === "ALL" && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(true)}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-cerulean text-white text-xs font-semibold hover:bg-baltic-blue shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Ghi khoản chi đầu tiên</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Form Modal */}
      <TripExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        trip={trip}
        currentUserMemberId={currentUserId}
        isHost={isHost}
        onSaveExpense={handleSaveExpense}
      />

      {/* Lightbox Modal for Receipt Proof */}
      <TripReceiptLightboxModal
        isOpen={selectedReceiptExpense !== null}
        onClose={() => setSelectedReceiptExpense(null)}
        expense={selectedReceiptExpense}
      />
    </div>
  );
}
