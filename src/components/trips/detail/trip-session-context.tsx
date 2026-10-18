"use client";

import * as React from "react";
import {
  TripDetailData,
  TripExpense,
  CreateExpenseFormData,
  ExpenseShare,
  TripRecentExpense,
} from "@/types/trip";
import { computeEqualShares } from "@/lib/money/split";
import {
  calculateTotalSpent,
  calculateBudgetStatus,
  calculateAvgSpentPerPerson,
  calculateUserSpent,
} from "@/lib/money/budget";
import { formatDateInputToIso, formatExpenseDate } from "@/lib/view/expense-row";
import { getExpenseCategoryLabel, getSplitMethodLabel } from "@/lib/labels";
import { TripExpenseFormModal } from "@/components/trips/expenses/trip-expense-form-modal";

interface TripSessionContextValue {
  trip: TripDetailData;
  sessionTrip: TripDetailData;
  sessionExpenses: TripExpense[];
  currentMemberId: string;
  isHost: boolean;
  isOverviewAddModalOpen: boolean;
  setIsOverviewAddModalOpen: (open: boolean) => void;
  handleAddExpense: (newExpense: TripExpense) => void;
  handleSaveExpenseFromModal: (formData: CreateExpenseFormData) => void;
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
  const currentMemberId = initialTrip.currentMemberId;
  const currentMember = initialTrip.members.find((m) => m.id === currentMemberId);
  const isHost = currentMember?.role === "HOST" || !!currentMember?.isHost;

  const [sessionExpenses, setSessionExpenses] = React.useState<TripExpense[]>(() => {
    return [...(initialTrip.expenses || [])];
  });

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
  }, [initialTrip, sessionExpenses, sessionTotalSpent, currentMemberId]);

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

      const shares: ExpenseShare[] = computeEqualShares(safeAmount, participantsWithOrder).map(
        (s, idx) => ({
          id: `share-${expenseId}-${idx + 1}`,
          expenseId,
          memberId: s.memberId,
          amount: s.amount,
          hasRemainderExtra: s.hasRemainderExtra,
        })
      );

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

  return (
    <TripSessionContext.Provider
      value={{
        trip: initialTrip,
        sessionTrip,
        sessionExpenses,
        currentMemberId,
        isHost,
        isOverviewAddModalOpen,
        setIsOverviewAddModalOpen,
        handleAddExpense,
        handleSaveExpenseFromModal,
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
