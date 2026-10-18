"use client";

import * as React from "react";
import {
  TripDetailData,
  TripExpense,
  CreateExpenseFormData,
  ExpenseShare,
  TripRecentExpense,
  TripStatus,
} from "@/types/trip";
import { Settlement, SettlementTransfer, PaymentMethod } from "@/types/settlement";
import { computeEqualShares, computeItemizedShares } from "@/lib/money/split";
import {
  calculateTotalSpent,
  calculateBudgetStatus,
  calculateAvgSpentPerPerson,
  calculateUserSpent,
} from "@/lib/money/budget";
import {
  calculateMemberBalances,
  generateSettlementTransfers,
  canReopenSettlement,
  isSettlementFullyCompleted,
} from "@/lib/money/settlement";
import { formatDateInputToIso, formatExpenseDate } from "@/lib/view/expense-row";
import { getExpenseCategoryLabel, getSplitMethodLabel } from "@/lib/labels";
import { TripExpenseFormModal } from "@/components/trips/expenses/trip-expense-form-modal";

interface TripSessionContextValue {
  trip: TripDetailData;
  sessionTrip: TripDetailData;
  sessionExpenses: TripExpense[];
  sessionStatus: TripStatus;
  sessionTransfers: SettlementTransfer[];
  sessionSettlement: Settlement | null;
  currentMemberId: string;
  setCurrentMemberId: (id: string) => void;
  isHost: boolean;
  isOverviewAddModalOpen: boolean;
  setIsOverviewAddModalOpen: (open: boolean) => void;
  handleAddExpense: (newExpense: TripExpense) => void;
  handleSaveExpenseFromModal: (formData: CreateExpenseFormData) => void;
  handleLockSettlement: () => void;
  handleReopenSettlement: () => { success: boolean; message?: string };
  handleMarkTransferPaid: (
    transferId: string,
    paymentMethod?: PaymentMethod,
    note?: string
  ) => void;
  handleConfirmTransferCompleted: (transferId: string) => void;
  sessionToast: string | null;
  setSessionToast: (toast: string | null) => void;
}

const TripSessionContext = React.createContext<TripSessionContextValue | null>(null);

export function useTripSession(): TripSessionContextValue {
  const context = React.useContext(TripSessionContext);
  if (!context) {
    throw new Error("useTripSession must be used within a TripSessionProvider");
  }
  return context;
}

interface TripSessionProviderProps {
  initialTrip: TripDetailData;
  children: React.ReactNode;
}

export function TripSessionProvider({ initialTrip, children }: TripSessionProviderProps) {
  const [currentMemberId, setCurrentMemberId] = React.useState<string>(
    initialTrip.currentMemberId
  );
  const [sessionStatus, setSessionStatus] = React.useState<TripStatus>(
    initialTrip.status
  );

  const currentMember = initialTrip.members.find((m) => m.id === currentMemberId);
  const isHost = currentMember?.role === "HOST" || !!currentMember?.isHost;

  const [sessionExpenses, setSessionExpenses] = React.useState<TripExpense[]>(() => {
    return [...(initialTrip.expenses || [])];
  });

  const [lockedTransfers, setLockedTransfers] = React.useState<SettlementTransfer[]>([]);
  const [isOverviewAddModalOpen, setIsOverviewAddModalOpen] = React.useState(false);
  const [sessionToast, setSessionToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionToast) {
      const timer = setTimeout(() => {
        setSessionToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [sessionToast]);

  const sessionTotalSpent = React.useMemo(() => {
    return calculateTotalSpent(sessionExpenses);
  }, [sessionExpenses]);

  // Preview transfers computed dynamically in ACTIVE state
  const previewTransfers = React.useMemo(() => {
    const res = calculateMemberBalances(initialTrip.members, sessionExpenses);
    return generateSettlementTransfers(initialTrip.id, res.balances);
  }, [initialTrip.id, sessionExpenses, initialTrip.members]);

  // If in ACTIVE, use preview transfers. Otherwise use lockedTransfers
  const effectiveTransfers = sessionStatus === "ACTIVE" ? previewTransfers : lockedTransfers;

  const sessionSettlement: Settlement | null = React.useMemo(() => {
    if (sessionStatus === "ACTIVE") return null;
    return {
      id: `settle-${initialTrip.id}`,
      tripId: initialTrip.id,
      status: "ACTIVE",
      createdByMemberId: currentMemberId,
      createdAt: new Date().toISOString(),
      transfers: effectiveTransfers,
    };
  }, [sessionStatus, initialTrip.id, currentMemberId, effectiveTransfers]);

  const sessionTrip: TripDetailData = React.useMemo(() => {
    const recent: TripRecentExpense[] = sessionExpenses.slice(0, 4).map((e) => {
      const payer = initialTrip.members.find((m) => m.id === e.paidByMemberId);
      const userShare = e.shares.find((p) => p.memberId === currentMemberId);
      const splitText =
        e.splitMethod === "EQUAL"
          ? `Chia đều (${e.shares.length} người)`
          : getSplitMethodLabel(e.splitMethod);

      return {
        id: e.id,
        title: e.title,
        category: e.category,
        categoryLabel: getExpenseCategoryLabel(e.category),
        paidByName: payer?.name || "Thành viên",
        totalAmount: e.amount,
        userAmount: userShare ? userShare.amount : 0,
        spentAtFormatted: formatExpenseDate(e.spentAt),
        splitMethodText: splitText,
      };
    });

    const planned = initialTrip.plannedBudget ?? initialTrip.budgetAmount ?? null;
    const { hasBudget, remainingBudget, isOverBudget, overBudgetAmount } = calculateBudgetStatus(
      planned,
      sessionTotalSpent
    );
    const avgSpentPerPerson = calculateAvgSpentPerPerson(
      sessionTotalSpent,
      initialTrip.members.length
    );
    const userSpent = calculateUserSpent(sessionExpenses, currentMemberId);

    return {
      ...initialTrip,
      status: sessionStatus,
      currentMemberId,
      totalSpent: sessionTotalSpent,
      hasBudget,
      remainingBudget,
      isOverBudget,
      overBudgetAmount,
      expenseCount: sessionExpenses.length,
      avgSpentPerPerson,
      userSpent,
      expenses: sessionExpenses,
      recentExpenses: recent,
    };
  }, [initialTrip, sessionStatus, sessionExpenses, sessionTotalSpent, currentMemberId]);

  const handleAddExpense = React.useCallback((newExpense: TripExpense) => {
    setSessionExpenses((prev) => [newExpense, ...prev]);
  }, []);

  const handleSaveExpenseFromModal = React.useCallback(
    (formData: CreateExpenseFormData) => {
      const safeAmount = formData.amount || 0;
      const expenseId = `exp-${Date.now()}`;

      const participantsWithOrder = formData.participantMemberIds.map((id) => {
        const m = initialTrip.members.find((member) => member.id === id);
        return { id, joinOrder: m ? m.joinOrder : 0 };
      });

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
        tripId: initialTrip.id,
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

      handleAddExpense(newExpense);
      setSessionToast("Đã thêm khoản chi (dữ liệu demo, chưa được lưu)");
    },
    [initialTrip, handleAddExpense]
  );

  // Settlement Actions
  const handleLockSettlement = React.useCallback(() => {
    // Generate official transfers snapshot from current expenses
    const res = calculateMemberBalances(initialTrip.members, sessionExpenses);
    const transfers = generateSettlementTransfers(initialTrip.id, res.balances);
    setLockedTransfers(transfers);
    setSessionStatus("SETTLING");
    setSessionToast(
      "Đã chốt sổ công nợ! Chuyến đi chuyển sang trạng thái Quyết toán, đã khóa thêm chi tiêu mới."
    );
  }, [initialTrip.id, sessionExpenses, initialTrip.members]);

  const handleReopenSettlement = React.useCallback((): {
    success: boolean;
    message?: string;
  } => {
    if (!canReopenSettlement(lockedTransfers)) {
      return {
        success: false,
        message:
          "Không thể mở lại sổ vì đã có giao dịch được thanh toán hoặc xác nhận hoàn tất.",
      };
    }
    setSessionStatus("ACTIVE");
    setLockedTransfers([]);
    setSessionToast("Đã mở lại sổ công nợ! Chuyến đi trở lại trạng thái Đang diễn ra.");
    return { success: true };
  }, [lockedTransfers]);

  const handleMarkTransferPaid = React.useCallback(
    (transferId: string, paymentMethod: PaymentMethod = "BANK_TRANSFER", note?: string) => {
      setLockedTransfers((prev) =>
        prev.map((t) => {
          if (t.id !== transferId) return t;
          return {
            ...t,
            status: "PAID",
            paymentMethod,
            paidAt: new Date().toISOString(),
            paidMarkedByMemberId: currentMemberId,
            paymentProofNote: note,
          };
        })
      );
      setSessionToast(
        "Đã đánh dấu đã thanh toán! Đang chờ người nhận xác nhận tiền về."
      );
    },
    [currentMemberId]
  );

  const handleConfirmTransferCompleted = React.useCallback(
    (transferId: string) => {
      setLockedTransfers((prev) => {
        const next = prev.map((t) => {
          if (t.id !== transferId) return t;
          return {
            ...t,
            status: "COMPLETED" as const,
            completedAt: new Date().toISOString(),
            completedByMemberId: currentMemberId,
          };
        });

        if (isSettlementFullyCompleted(next)) {
          setSessionStatus("COMPLETED");
          setSessionToast(
            "Tất cả công nợ đã được thanh toán hoàn tất! Chuyến đi được đánh dấu Hoàn thành."
          );
        } else {
          setSessionToast("Đã xác nhận nhận tiền thành công!");
        }

        return next;
      });
    },
    [currentMemberId]
  );

  return (
    <TripSessionContext.Provider
      value={{
        trip: initialTrip,
        sessionTrip,
        sessionExpenses,
        sessionStatus,
        sessionTransfers: effectiveTransfers,
        sessionSettlement,
        currentMemberId,
        setCurrentMemberId,
        isHost,
        isOverviewAddModalOpen,
        setIsOverviewAddModalOpen,
        handleAddExpense,
        handleSaveExpenseFromModal,
        handleLockSettlement,
        handleReopenSettlement,
        handleMarkTransferPaid,
        handleConfirmTransferCompleted,
        sessionToast,
        setSessionToast,
      }}
    >
      {children}

      {/* Global Quick Add Expense Modal from Overview */}
      <TripExpenseFormModal
        isOpen={isOverviewAddModalOpen}
        onClose={() => setIsOverviewAddModalOpen(false)}
        trip={sessionTrip}
        currentUserMemberId={currentMemberId}
        isHost={isHost}
        onSaveExpense={handleSaveExpenseFromModal}
      />
    </TripSessionContext.Provider>
  );
}
