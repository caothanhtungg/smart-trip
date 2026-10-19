import * as React from "react";
import { TripExpense } from "@/types/trip";
import { formatMoney } from "@/lib/utils";
import { TripExpenseRow } from "./trip-expense-row";
import { canEditExpense, canDeleteExpense } from "@/lib/validation/expense";

interface TripExpenseDayGroupProps {
  dayLabel: string;
  spentDateFormatted: string;
  expenses: TripExpense[];
  currentUserId?: string;
  isHost?: boolean;
  tripStatus?: string;
  onViewReceipt: (expense: TripExpense) => void;
  onEditExpense?: (expense: TripExpense) => void;
  onDeleteExpense?: (expense: TripExpense) => void;
}

export function TripExpenseDayGroup({
  dayLabel,
  spentDateFormatted,
  expenses,
  currentUserId = "",
  isHost = false,
  tripStatus = "ACTIVE",
  onViewReceipt,
  onEditExpense,
  onDeleteExpense,
}: TripExpenseDayGroupProps) {
  const dailyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <section className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(24,78,119,0.06)] overflow-hidden border border-border-hairline mb-6">
      {/* Day Header with subtle gradient */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-surface-container/60 to-white flex flex-wrap items-center justify-between gap-3 border-b border-border-hairline">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-5 rounded-full bg-cerulean shrink-0" />
          <h3 className="font-bold text-yale-blue text-sm sm:text-base tracking-tight">
            {dayLabel} {spentDateFormatted ? `· ${spentDateFormatted}` : ""}
          </h3>
          <span className="text-xs text-text-muted font-medium bg-white px-2 py-0.5 rounded-full border border-border-hairline">
            {expenses.length} khoản chi
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="text-text-muted">Tổng ngày:</span>
          <span className="font-bold text-yale-blue tabular-nums">
            {formatMoney(dailyTotal)}
          </span>
        </div>
      </div>

      {/* Expenses Rows */}
      <div className="divide-y divide-border-hairline/60">
        {expenses.map((expense) => {
          const canEdit = canEditExpense(expense, currentUserId, isHost, tripStatus);
          const canDelete = canDeleteExpense(expense, currentUserId, isHost, tripStatus);

          return (
            <TripExpenseRow
              key={expense.id}
              expense={expense}
              currentUserId={currentUserId}
              onViewReceipt={onViewReceipt}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
            />
          );
        })}
      </div>
    </section>
  );
}
