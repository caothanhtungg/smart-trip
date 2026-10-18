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
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Inbox,
  Info,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { computeEqualShares, getCategoryLabel } from "@/lib/split-service";

interface TripExpensesTabProps {
  trip: TripDetailData;
  expenses: TripExpense[];
  onAddExpense: (newExpense: TripExpense) => void;
  currentUserId?: string;
}

export function TripExpensesTab({
  trip,
  expenses,
  onAddExpense,
  currentUserId = "mem-1",
}: TripExpensesTabProps) {
  // State for filters
  const [selectedCategory, setSelectedCategory] = React.useState<ExpenseFilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMemberId, setSelectedMemberId] = React.useState("ALL");

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [viewingReceiptExpense, setViewingReceiptExpense] = React.useState<TripExpense | null>(null);
  const [isAiScanNoticeOpen, setIsAiScanNoticeOpen] = React.useState(false);

  // Success toast message
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
        const loc = e.location || e.locationName;
        const matchLocation = loc ? loc.toLowerCase().includes(query) : false;
        const n = e.notes || e.note;
        const matchNotes = n ? n.toLowerCase().includes(query) : false;
        const matchPayer = e.paidByName.toLowerCase().includes(query);
        if (!matchTitle && !matchLocation && !matchNotes && !matchPayer) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedMemberId, searchQuery]);

  // Group filtered expenses by date
  const groupedByDay = React.useMemo(() => {
    // Map date string -> list of expenses
    const map = new Map<string, TripExpense[]>();
    filteredExpenses.forEach((exp) => {
      const dateKey = exp.spentAtDate || exp.spentDate || "Chưa rõ ngày";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(exp);
    });

    // Convert map to array and sort by day/date
    const groups: { dateKey: string; dayLabel: string; expenses: TripExpense[] }[] = [];
    let dayIndex = 1;

    map.forEach((items, dateKey) => {
      // Determine day label
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

  // Calculate totals
  const totalAmount = React.useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0);
  }, [expenses]);

  // Handle adding an expense
  const handleSaveExpense = (formData: CreateExpenseFormData) => {
    const payer = trip.members.find((m) => m.id === formData.paidByMemberId);
    const payerName = payer ? payer.name : "Thành viên";
    const safeAmount = formData.amount || 0;
    const expenseId = `exp-${Date.now()}`;

    // Compute shares via safe domain logic (Rule R4)
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
      spentDate: formData.spentAtDate,
      spentAtDate: formData.spentAtDate,
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

    onAddExpense(newExpense);

    // Show session alert toast
    setSessionToast(
      `Đã thêm khoản chi "${formData.title}" thành công! (Lưu ý: Dữ liệu chỉ tồn tại trong phiên thử nghiệm, chưa lưu vào PostgreSQL).`
    );
  };

  return (
    <div className="w-full">
      {/* Session Data Toast / Alert Banner */}
      {sessionToast && (
        <div className="mb-5 p-4 rounded-2xl bg-tropical-teal/10 border border-tropical-teal/30 flex items-start gap-3 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-tropical-teal shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-yale-blue">
            <span className="font-bold">Phiên thử nghiệm: </span>
            {sessionToast}
          </div>
        </div>
      )}

      {/* Locked State Notification if Settling/Completed (Rule R7) */}
      {isLocked && (
        <div className="mb-5 p-4 rounded-2xl bg-functional-warning-bg border border-[#C2410C]/20 flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-yale-blue space-y-0.5">
            <p className="font-bold">
              Sổ quỹ chuyến đi đã khóa (Quy tắc R7)
            </p>
            <p className="text-text-muted text-xs leading-relaxed">
              Chuyến đi đang ở trạng thái {trip.status === "SETTLING" ? "Quyết toán" : "Đã hoàn thành"}. Toàn bộ chức năng thêm và chỉnh sửa khoản chi được vô hiệu hóa để bảo đảm tính toàn vẹn của bảng chốt công nợ.
            </p>
          </div>
        </div>
      )}

      {/* Top Expense Summary Strip */}
      <TripExpenseSummaryBar
        trip={trip}
        totalExpensesAmount={totalAmount}
        expenseCount={expenses.length}
        onOpenAddExpenseModal={() => setIsAddModalOpen(true)}
        onOpenAiScanModal={() => setIsAiScanNoticeOpen(true)}
      />

      {/* Filter and Search Bar */}
      <TripExpenseFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedMemberId={selectedMemberId}
        onSelectMemberId={setSelectedMemberId}
        categoryCounts={categoryCounts}
        members={trip.members}
      />

      {/* Expenses Day Groups or Empty State */}
      {groupedByDay.length > 0 ? (
        <div className="flex flex-col gap-1">
          {groupedByDay.map((group) => (
            <TripExpenseDayGroup
              key={group.dateKey}
              dayLabel={group.dayLabel}
              spentDateFormatted={group.dateKey}
              expenses={group.expenses}
              currentUserId={currentUserId}
              onViewReceipt={(expense) => setViewingReceiptExpense(expense)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-[20px] bg-white border border-border-hairline text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-text-muted mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-yale-blue text-base">
            Không tìm thấy khoản chi nào
          </h4>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-sm">
            {searchQuery || selectedCategory !== "ALL" || selectedMemberId !== "ALL"
              ? "Không có khoản chi nào khớp với bộ lọc hoặc từ khóa hiện tại."
              : "Chưa có khoản chi nào trong chuyến đi này."}
          </p>

          <div className="flex items-center gap-3 mt-4">
            {(searchQuery || selectedCategory !== "ALL" || selectedMemberId !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                  setSelectedMemberId("ALL");
                }}
                className="h-9 px-4 rounded-xl bg-surface-container hover:bg-hover-row text-cerulean font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}

            {!isLocked && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-cerulean hover:bg-baltic-blue text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm khoản chi mới</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <TripExpenseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        trip={trip}
        currentUserMemberId={currentUserId}
        isHost={isHost}
        onSaveExpense={handleSaveExpense}
      />

      {/* Receipt Lightbox Modal */}
      <TripReceiptLightboxModal
        isOpen={viewingReceiptExpense !== null}
        onClose={() => setViewingReceiptExpense(null)}
        expense={viewingReceiptExpense}
      />

      {/* AI Scan Out-of-Scope Notice Modal */}
      <Modal
        isOpen={isAiScanNoticeOpen}
        onClose={() => setIsAiScanNoticeOpen(false)}
        title="Quét hóa đơn AI (OCR)"
        description="Ranh giới phạm vi tính năng theo tài liệu dự án"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-functional-warning-bg border border-[#C2410C]/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
            <div className="text-sm text-yale-blue space-y-1">
              <p className="font-bold">
                Tính năng nằm ngoài phạm vi Release 1
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Theo tài liệu kiến trúc dự án và <code>ENGINEERING_STANDARDS.md</code>, chức năng nhận diện hóa đơn tự động bằng AI / OCR nằm ngoài phạm vi của Release 1. Nút bấm trên giao diện chỉ mang tính chất tham khảo thiết kế và không giả lập xử lý OCR.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAiScanNoticeOpen(false)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
