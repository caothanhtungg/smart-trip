"use client";

import * as React from "react";
import {
  History,
  ArrowRight,
  Utensils,
  Ticket,
  Bike,
  Plus,
} from "lucide-react";
import { TripDetailData, TripRecentExpense } from "@/types/trip";
import { formatMoney } from "@/lib/utils";

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
    <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(24,78,119,0.04)] border border-border-hairline transition-all duration-300 hover:shadow-[0_8px_30px_rgba(24,78,119,0.07)]">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-cerulean shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-yale-blue tracking-tight">
            Hoạt động gần đây
          </h2>
        </div>
        {onOpenExpensesTab && (
          <button
            type="button"
            onClick={onOpenExpensesTab}
            className="text-xs sm:text-sm font-semibold text-cerulean hover:text-baltic-blue flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Tất cả ({trip.expenseCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expense List */}
      <div className="divide-y divide-border-hairline/60">
        {trip.recentExpenses.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm font-medium">
            Chưa có khoản chi nào trong chuyến đi này.
          </div>
        ) : (
          trip.recentExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 hover:bg-hover-row/50 px-2 sm:px-3 rounded-2xl transition-all duration-150 gap-3"
            >
              {/* Left: Icon + Title + Meta */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${renderCategoryBg(
                    expense.category
                  )}`}
                >
                  {renderCategoryIcon(expense.category)}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-yale-blue leading-snug">
                    {expense.title}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted mt-1 font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-yale-blue font-semibold text-[11px]">
                      {expense.categoryLabel}
                    </span>
                    <span className="text-border-hairline" aria-hidden="true">•</span>
                    <span>
                      {expense.paidByName}
                    </span>
                    <span className="text-border-hairline" aria-hidden="true">•</span>
                    <span>{expense.spentAtFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Right: Amounts */}
              <div className="sm:text-right pl-13 sm:pl-0 flex sm:flex-col justify-between items-baseline sm:items-end">
                <div className="text-base sm:text-lg font-extrabold text-yale-blue tabular-nums tracking-tight">
                  {formatMoney(expense.totalAmount)}
                </div>
                <div className="text-xs text-text-muted">
                  Bản thân:{" "}
                  <span className="font-semibold text-cerulean tabular-nums">
                    {formatMoney(expense.userAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Action Bar */}
      {onOpenAddExpenseModal && (
        <div className="flex items-center justify-end gap-3 mt-4 pt-3.5 border-t border-border-hairline">
          <button
            type="button"
            onClick={onOpenAddExpenseModal}
            className="w-full sm:w-auto h-10 px-5 rounded-full bg-cerulean hover:bg-baltic-blue text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(26,117,159,0.25)] hover:shadow-[0_6px_20px_rgba(26,117,159,0.35)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm khoản chi</span>
          </button>
        </div>
      )}
    </section>
  );
}
