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
import { TripExpenseDeleteModal } from "./trip-expense-delete-modal";
import {
  AlertCircle,
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
import { useOptionalTripSession } from "@/components/trips/detail/trip-session-context";

interface TripExpensesTabProps {
  trip?: TripDetailData;
  expenses?: TripExpense[];
  onAddExpense?: (newExpense: TripExpense) => void;
  onSaveExpenseFromModal?: (
    formData: CreateExpenseFormData
  ) =>
    | Promise<{ success: boolean; message?: string } | void>
    | { success: boolean; message?: string }
    | void;
  onUpdateExpense?: (
    expenseId: string,
    formData: CreateExpenseFormData
  ) =>
    | Promise<{ success: boolean; message?: string } | void>
    | { success: boolean; message?: string }
    | void;
  onDeleteExpense?: (
    expenseId: string
  ) =>
    | Promise<{ success: boolean; message?: string } | void>
    | { success: boolean; message?: string }
    | void;
  currentUserId?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => Promise<void> | void;
}

export function TripExpensesTab(props: TripExpensesTabProps) {
  // Read from TripSessionContext if available
  const sessionCtx = useOptionalTripSession();

  const trip = props.trip || sessionCtx?.sessionTrip;
  const expenses =
    props.expenses !== undefined
      ? props.expenses
      : sessionCtx?.sessionExpenses || [];
  const currentUserId =
    props.currentUserId || sessionCtx?.currentMemberId || "";
  const isLoading =
    props.isLoading !== undefined
      ? props.isLoading
      : sessionCtx?.isExpensesLoading || false;
  const error =
    props.error !== undefined ? props.error : sessionCtx?.expensesError || null;
  const onRetry = props.onRetry || sessionCtx?.refetchExpenses;
  const onSaveExpenseFromModal =
    props.onSaveExpenseFromModal || sessionCtx?.handleSaveExpenseFromModal;
  const onUpdateExpense =
    props.onUpdateExpense || sessionCtx?.handleUpdateExpense;
  const onDeleteExpense =
    props.onDeleteExpense || sessionCtx?.handleDeleteExpense;
  const onAddExpense = props.onAddExpense || sessionCtx?.handleAddExpense;

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<TripExpense | null>(
    null
  );
  const [deletingExpense, setDeletingExpense] = React.useState<TripExpense | null>(
    null
  );
  const [selectedReceiptExpense, setSelectedReceiptExpense] =
    React.useState<TripExpense | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] =
    React.useState<ExpenseFilterCategory>("ALL");
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

  // Loading skeleton state
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải danh sách chi tiêu..."
        className="flex flex-col gap-6 max-w-[1200px] w-full mx-auto pb-12 animate-pulse"
      >
        <div className="h-28 bg-hover-row rounded-2xl w-full" />
        <div className="h-14 bg-hover-row rounded-2xl w-full" />
        <div className="h-72 bg-hover-row rounded-3xl w-full" />
      </div>
    );
  }

  // Error card with retry button
  if (error) {
    return (
      <div
        role="alert"
        className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-functional-negative/20 shadow-sm text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-functional-negative/10 text-functional-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-yale-blue">
            Không thể tải danh sách chi tiêu
          </h3>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
            {error}
          </p>
        </div>
        {onRetry && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onRetry()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cerulean/40 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!trip) return null;

  const isLocked = trip.status === "SETTLING" || trip.status === "COMPLETED";
  const currentUser = trip.members.find((m) => m.id === currentUserId);
  const isHost = currentUser?.role === "HOST" || !!currentUser?.isHost;

  // Calculate category counts
  const categoryCounts: Record<ExpenseFilterCategory, number> = {
    ALL: expenses.length,
    FOOD: 0,
    TRANSPORT: 0,
    LODGING: 0,
    TICKET: 0,
    SHOPPING: 0,
    OTHER: 0,
  };
  expenses.forEach((e) => {
    if (categoryCounts[e.category] !== undefined) {
      categoryCounts[e.category]++;
    }
  });

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
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
      const matchLocation = e.locationName
        ? e.locationName.toLowerCase().includes(query)
        : false;
      const matchNotes = e.note ? e.note.toLowerCase().includes(query) : false;
      const payer = trip.members.find((m) => m.id === e.paidByMemberId);
      const matchPayer = payer
        ? payer.name.toLowerCase().includes(query)
        : false;
      if (!matchTitle && !matchLocation && !matchNotes && !matchPayer) {
        return false;
      }
    }
    return true;
  });

  // Group filtered expenses by date
  const map = new Map<string, TripExpense[]>();
  filteredExpenses.forEach((exp) => {
    const dateKey = exp.spentAt ? exp.spentAt.slice(0, 10) : "Chưa rõ ngày";
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)!.push(exp);
  });

  const groupedByDay: {
    dateKey: string;
    dayLabel: string;
    expenses: TripExpense[];
  }[] = [];
  let dayIndex = 1;

  map.forEach((items, dateKey) => {
    const dayLabel = `Ngày ${dayIndex}`;
    groupedByDay.push({
      dateKey,
      dayLabel,
      expenses: items,
    });
    dayIndex++;
  });

  // Calculate totals using pure money function
  const totalAmount = calculateTotalSpent(expenses);

  // Fallback local adding for legacy mock mode if onSaveExpenseFromModal not passed
  const handleLocalSaveExpense = (formData: CreateExpenseFormData) => {
    const safeAmount = formData.amount || 0;
    const expenseId = `exp-${Date.now()}`;

    const participantsWithOrder = formData.participantMemberIds.map((id) => {
      const m = trip.members.find((member) => member.id === id);
      return { id, joinOrder: m ? m.joinOrder : 0 };
    });

    let shares: ExpenseShare[] = [];
    if (
      formData.splitMethod === "ITEMIZED" &&
      formData.items &&
      formData.items.length > 0
    ) {
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

    const spentAtIso = formatDateInputToIso(
      formData.spentAtDate,
      formData.spentAtTime
    );

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
      itineraryItemId: formData.itineraryItemId ?? null,
      locationName: formData.locationName,
      note: formData.note,
      receiptImageUrl: formData.receiptImageUrl,
      shares,
      createdAt: new Date().toISOString(),
    };

    if (onAddExpense) {
      onAddExpense(newExpense);
    }

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
                Sổ chi tiêu đã chốt (
                {trip.status === "SETTLING"
                  ? "Đang quyết toán"
                  : "Đã hoàn tất"}
                )
              </p>
              <p className="text-xs text-text-muted">
                Các khoản chi tiêu đã được khóa sổ theo quy tắc nghiệp vụ. Không
                thể thêm mới hoặc sửa đổi.
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
              spentDateFormatted={
                group.dateKey !== "Chưa rõ ngày"
                  ? formatDate(group.dateKey)
                  : ""
              }
              expenses={group.expenses}
              currentUserId={currentUserId}
              isHost={isHost}
              tripStatus={trip.status}
              onViewReceipt={(expense) => setSelectedReceiptExpense(expense)}
              onEditExpense={(expense) => setEditingExpense(expense)}
              onDeleteExpense={(expense) => setDeletingExpense(expense)}
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
              {searchQuery ||
              selectedCategory !== "ALL" ||
              selectedMemberId !== "ALL"
                ? "Không có khoản chi nào khớp với bộ lọc hiện tại. Thử thay đổi điều kiện tìm kiếm."
                : "Chuyến đi này chưa có khoản chi tiêu nào được ghi nhận."}
            </p>
            {(searchQuery ||
              selectedCategory !== "ALL" ||
              selectedMemberId !== "ALL") && (
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
            {!isLocked &&
              !searchQuery &&
              selectedCategory === "ALL" &&
              selectedMemberId === "ALL" && (
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
        onSaveExpense={async (formData) => {
          if (onSaveExpenseFromModal) {
            return await onSaveExpenseFromModal(formData);
          }
          handleLocalSaveExpense(formData);
        }}
      />

      {/* Edit Expense Form Modal */}
      {editingExpense && (
        <TripExpenseFormModal
          isOpen={editingExpense !== null}
          onClose={() => setEditingExpense(null)}
          trip={trip}
          currentUserMemberId={currentUserId}
          isHost={isHost}
          initialExpense={editingExpense}
          onSaveExpense={async (formData) => {
            if (onUpdateExpense) {
              const res = await onUpdateExpense(editingExpense.id, formData);
              if (
                res &&
                typeof res === "object" &&
                "success" in res &&
                !res.success
              ) {
                return res;
              }
            }
            setEditingExpense(null);
          }}
          onDeleteExpense={(id) => {
            const expToDelete =
              expenses.find((e) => e.id === id) || editingExpense;
            setEditingExpense(null);
            setDeletingExpense(expToDelete);
          }}
        />
      )}

      {/* Delete Expense Confirmation Modal */}
      <TripExpenseDeleteModal
        isOpen={deletingExpense !== null}
        onClose={() => setDeletingExpense(null)}
        onConfirmDelete={async () => {
          if (deletingExpense && onDeleteExpense) {
            const res = await onDeleteExpense(deletingExpense.id);
            if (
              res &&
              typeof res === "object" &&
              "success" in res &&
              !res.success
            ) {
              return res;
            }
          }
          setDeletingExpense(null);
        }}
        expenseTitle={deletingExpense?.title || ""}
        expenseAmount={deletingExpense?.amount || 0}
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
