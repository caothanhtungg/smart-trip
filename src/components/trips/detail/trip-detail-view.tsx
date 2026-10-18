"use client";

import * as React from "react";
import { TripDetailData, TripExpense, CreateExpenseFormData, ExpenseShare } from "@/types/trip";
import { TripDetailHeader } from "@/components/trips/detail/trip-detail-header";
import { TripDetailTabs } from "@/components/trips/detail/trip-detail-tabs";
import { TripBudgetCard } from "@/components/trips/detail/trip-budget-card";
import { TripStatsOverview } from "@/components/trips/detail/trip-stats-overview";
import { TripRecentExpenses } from "@/components/trips/detail/trip-recent-expenses";
import { TripExpenseDonutChart } from "@/components/trips/detail/trip-expense-donut-chart";
import { TripMembersCard } from "@/components/trips/detail/trip-members-card";
import { TripInfoSidebar } from "@/components/trips/detail/trip-info-sidebar";
import { TripExpensesTab } from "@/components/trips/expenses/trip-expenses-tab";
import { TripExpenseFormModal } from "@/components/trips/expenses/trip-expense-form-modal";
import { computeEqualShares, getCategoryLabel } from "@/lib/split-service";

interface TripDetailViewProps {
  trip: TripDetailData;
  initialTab?: string;
}

export function TripDetailView({ trip, initialTab = "tong-quan" }: TripDetailViewProps) {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  // In-session expenses array initialized with trip.expenses copy
  const [sessionExpenses, setSessionExpenses] = React.useState<TripExpense[]>(() => {
    return [...(trip.expenses || [])];
  });

  // Modal state for quick add expense from overview
  const [isOverviewAddModalOpen, setIsOverviewAddModalOpen] = React.useState(false);
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

  // Dynamically update total spent and expense count for session display
  const sessionTotalSpent = React.useMemo(() => {
    return sessionExpenses.reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0);
  }, [sessionExpenses]);

  // Derived trip object for overview components reflecting session expenses
  const sessionTrip: TripDetailData = React.useMemo(() => {
    // Generate recentExpenses from sessionExpenses (up to 4 newest)
    const recent = sessionExpenses.slice(0, 4).map((e) => {
      const sharesList = e.participants || e.shares || [];
      const userShare = sharesList.find((p) => p.memberId === "mem-1");
      const amt = e.totalAmount || e.amount || 0;
      return {
        id: e.id,
        title: e.title,
        category: e.category,
        categoryLabel: e.categoryLabel,
        paidByName: e.paidByName,
        totalAmount: amt,
        userAmount: userShare ? userShare.amount : 0,
        spentAtFormatted: e.spentAtFormatted,
        splitMethodText: e.splitMethodText,
      };
    });

    const planned = trip.plannedBudget || trip.budget || 0;
    const isOver = sessionTotalSpent > planned;
    const remainingBudget = Math.max(0, planned - sessionTotalSpent);
    const overBudgetAmount = isOver ? sessionTotalSpent - planned : 0;
    const memberCount = Math.max(1, trip.members.length);
    const avgSpentPerPerson = Math.floor(sessionTotalSpent / memberCount);

    return {
      ...trip,
      totalSpent: sessionTotalSpent,
      remainingBudget,
      isOverBudget: isOver,
      overBudgetAmount,
      expenseCount: sessionExpenses.length,
      avgSpentPerPerson,
      expenses: sessionExpenses,
      recentExpenses: recent,
    };
  }, [trip, sessionExpenses, sessionTotalSpent]);

  // Handle adding an expense
  const handleAddExpense = (newExpense: TripExpense) => {
    setSessionExpenses((prev) => [newExpense, ...prev]);
  };

  const handleSaveExpenseFromModal = (formData: CreateExpenseFormData) => {
    const payer = trip.members.find((m) => m.id === formData.paidByMemberId);
    const payerName = payer ? payer.name : "Thành viên";
    const safeAmount = formData.amount || 0;
    const expenseId = `exp-${Date.now()}`;
    const shares: ExpenseShare[] = computeEqualShares(safeAmount, formData.participantMemberIds).map(
      (s, idx) => ({
        id: `share-${expenseId}-${idx + 1}`,
        expenseId,
        memberId: s.memberId,
        amount: s.amount,
        hasRemainderExtra: s.hasRemainderExtra,
      })
    );

    const newExpense: TripExpense = {
      id: expenseId,
      tripId: trip.id,
      title: formData.title,
      category: formData.category,
      categoryLabel: getCategoryLabel(formData.category),
      amount: safeAmount,
      totalAmount: safeAmount,
      paidByMemberId: formData.paidByMemberId,
      paidByName: payerName,
      spentAtDate: formData.spentAtDate,
      spentDate: formData.spentAtDate,
      spentAtFormatted: formData.spentAtDate,
      splitMethod: "EQUAL",
      splitMethodText: `Chia đều (${formData.participantMemberIds.length} người)`,
      location: formData.location || formData.locationName,
      locationName: formData.location || formData.locationName,
      notes: formData.notes || formData.note,
      note: formData.notes || formData.note,
      receiptUrl: formData.receiptUrl || formData.receiptImageUrl,
      receiptImageUrl: formData.receiptUrl || formData.receiptImageUrl,
      shares,
      participants: shares,
      createdAt: new Date().toISOString(),
    };

    handleAddExpense(newExpense);
    setSessionToast(
      `Đã thêm khoản chi "${formData.title}" thành công! (Lưu ý: Dữ liệu chỉ tồn tại trong phiên thử nghiệm, chưa lưu vào PostgreSQL).`
    );
  };

  return (
    <>
      {/* Top Cover Banner & Breadcrumb */}
      <TripDetailHeader trip={sessionTrip} />

      {/* Phased Tabs Bar */}
      <TripDetailTabs activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId)} />

      {/* Workspace Grid Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {sessionToast && (
          <div className="mb-6 p-4 rounded-2xl bg-tropical-teal/10 border border-tropical-teal/30 flex items-start gap-3 shadow-sm animate-fadeIn">
            <span className="text-xs sm:text-sm text-yale-blue">
              <strong className="text-cerulean">Phiên thử nghiệm: </strong>
              {sessionToast}
            </span>
          </div>
        )}

        {/* Tab 1: Tổng quan (Overview) */}
        {activeTab === "tong-quan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Workspace (8 Columns on Desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* 1. Ngân sách chuyến đi */}
              <TripBudgetCard trip={sessionTrip} />

              {/* 2. Bộ 3 chỉ số tài chính */}
              <TripStatsOverview trip={sessionTrip} />

              {/* 3. Hoạt động gần đây */}
              <TripRecentExpenses
                trip={sessionTrip}
                onOpenExpensesTab={() => setActiveTab("chi-tieu")}
                onOpenAddExpenseModal={() => {
                  if (trip.status === "SETTLING" || trip.status === "COMPLETED") {
                    setActiveTab("chi-tieu");
                  } else {
                    setIsOverviewAddModalOpen(true);
                  }
                }}
              />

              {/* 4. Donut Chart phân bổ chi tiêu & Bối cảnh điểm đến */}
              <TripExpenseDonutChart trip={sessionTrip} />
            </div>

            {/* Right Sticky Sidebar (4 Columns on Desktop) */}
            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
              {/* 5. Thành viên chuyến đi */}
              <TripMembersCard trip={sessionTrip} />

              {/* 6. Thông tin chuyến đi (Thời tiết, Mã mời, Bản đồ) */}
              <TripInfoSidebar trip={sessionTrip} />
            </aside>
          </div>
        )}

        {/* Tab 2: Chi tiêu (Expenses List & Management) */}
        {activeTab === "chi-tieu" && (
          <TripExpensesTab
            trip={sessionTrip}
            expenses={sessionExpenses}
            onAddExpense={handleAddExpense}
            currentUserId="mem-1"
          />
        )}
      </div>

      {/* Quick Add Expense Modal from Overview */}
      <TripExpenseFormModal
        isOpen={isOverviewAddModalOpen}
        onClose={() => setIsOverviewAddModalOpen(false)}
        trip={sessionTrip}
        currentUserMemberId="mem-1"
        isHost={true}
        onSaveExpense={handleSaveExpenseFromModal}
      />
    </>
  );
}
