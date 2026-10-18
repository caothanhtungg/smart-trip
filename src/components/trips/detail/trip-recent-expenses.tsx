"use client";

import * as React from "react";
import {
  History,
  ArrowRight,
  Utensils,
  Ticket,
  Bike,
  Plus,
  ScanLine,
  Info,
  Sparkles,
} from "lucide-react";
import { TripDetailData, TripRecentExpense } from "@/types/trip";
import { formatMoney } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface TripRecentExpensesProps {
  trip: TripDetailData;
  onOpenExpensesTab?: () => void;
  onOpenAddExpenseModal?: () => void;
}

export function TripRecentExpenses({
  trip,
  onOpenExpensesTab,
  onOpenAddExpenseModal,
}: TripRecentExpensesProps) {
  const [expenseNoticeOpen, setExpenseNoticeOpen] = React.useState(false);
  const [aiScanNoticeOpen, setAiScanNoticeOpen] = React.useState(false);

  // Helper to render category icon
  const renderCategoryIcon = (category: TripRecentExpense["category"]) => {
    switch (category) {
      case "FOOD":
        return <Utensils className="w-5 h-5 text-functional-warning" />;
      case "TICKET":
        return <Ticket className="w-5 h-5 text-tropical-teal" />;
      case "TRANSPORT":
        return <Bike className="w-5 h-5 text-cerulean" />;
      default:
        return <Utensils className="w-5 h-5 text-yale-blue" />;
    }
  };

  const renderCategoryBg = (category: TripRecentExpense["category"]) => {
    switch (category) {
      case "FOOD":
        return "bg-functional-warning-bg";
      case "TICKET":
        return "bg-tropical-teal/15";
      case "TRANSPORT":
        return "bg-cerulean/15";
      default:
        return "bg-surface-container";
    }
  };

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cerulean shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-yale-blue">
            Hoạt động gần đây
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onOpenExpensesTab) {
              onOpenExpensesTab();
            } else {
              setExpenseNoticeOpen(true);
            }
          }}
          className="text-xs sm:text-sm font-semibold text-cerulean hover:text-baltic-blue flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Xem tất cả ({trip.expenseCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Expense List */}
      <div className="divide-y divide-border-hairline/60">
        {trip.recentExpenses.map((expense) => (
          <div
            key={expense.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-hover-row/60 px-2 rounded-xl transition-colors gap-3"
          >
            {/* Left: Icon + Title + Meta */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${renderCategoryBg(
                  expense.category
                )}`}
              >
                {renderCategoryIcon(expense.category)}
              </div>

              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold text-yale-blue leading-snug">
                  {expense.title}
                </span>
                <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted mt-1 font-medium">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-yale-blue font-semibold text-[11px]">
                    {expense.categoryLabel}
                  </span>
                  <span className="text-border-hairline" aria-hidden="true">•</span>
                  <span>
                    Người trả:{" "}
                    <strong className="text-yale-blue font-semibold">
                      {expense.paidByName}
                    </strong>
                  </span>
                  <span className="text-border-hairline" aria-hidden="true">•</span>
                  <span>{expense.spentAtFormatted}</span>
                  <span className="text-border-hairline" aria-hidden="true">•</span>
                  <span className="text-cerulean">{expense.splitMethodText}</span>
                </div>
              </div>
            </div>

            {/* Right: Amounts */}
            <div className="sm:text-right pl-14 sm:pl-0">
              <div className="text-base sm:text-lg font-bold text-yale-blue tabular-nums">
                {formatMoney(expense.totalAmount)}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                Bản thân:{" "}
                <span className="font-semibold text-yale-blue">
                  {formatMoney(expense.userAmount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4 pt-4 border-t border-border-hairline">
        <button
          type="button"
          onClick={() => setAiScanNoticeOpen(true)}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-white hover:bg-hover-row text-cerulean border border-border-hairline font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(24,78,119,0.08)] transition-all cursor-pointer"
        >
          <ScanLine className="w-4 h-4 text-cerulean" />
          <span>Quét hóa đơn AI</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenAddExpenseModal) {
              onOpenAddExpenseModal();
            } else {
              setExpenseNoticeOpen(true);
            }
          }}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-cerulean hover:bg-baltic-blue text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(26,117,159,0.25)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Thêm khoản chi</span>
        </button>
      </div>

      {/* 1. Modal thông báo thêm khoản chi (chưa triển khai trong giai đoạn hiện tại) */}
      <Modal
        isOpen={expenseNoticeOpen}
        onClose={() => setExpenseNoticeOpen(false)}
        title="Thêm khoản chi & Chia tiền (UC11, UC12)"
        description="Thông tin phạm vi phát triển Release 1"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cerulean shrink-0 mt-0.5" />
            <div className="text-sm text-text-body space-y-1">
              <p className="font-bold text-yale-blue">
                Phân hệ Chi tiêu đang phát triển
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Chức năng thêm khoản chi, chọn người trả và chia tiền (chia đều, chia theo món) sẽ được triển khai đầy đủ ở <strong>Giai đoạn 2D</strong> theo kế hoạch đã duyệt.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button
              variant="primary"
              size="md"
              onClick={() => setExpenseNoticeOpen(false)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Modal thông báo Quét hóa đơn AI (ngoài phạm vi Release 1) */}
      <Modal
        isOpen={aiScanNoticeOpen}
        onClose={() => setAiScanNoticeOpen(false)}
        title="Quét hóa đơn AI (OCR)"
        description="Ranh giới phạm vi tính năng theo tài liệu dự án"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-functional-warning-bg border border-[#C2410C]/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
            <div className="text-sm text-text-body space-y-1">
              <p className="font-bold text-yale-blue">
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
              onClick={() => setAiScanNoticeOpen(false)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
