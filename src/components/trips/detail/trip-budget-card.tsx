"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney } from "@/lib/utils";
import { calculateBudgetStatus } from "@/lib/money/budget";

interface TripBudgetCardProps {
  trip: TripDetailData;
}

export function TripBudgetCard({ trip }: TripBudgetCardProps) {
  const planned = trip.plannedBudget ?? trip.budgetAmount ?? null;
  const { hasBudget, remainingBudget, isOverBudget } = calculateBudgetStatus(
    planned,
    trip.totalSpent
  );

  const percentage =
    hasBudget && planned !== null && planned > 0
      ? Math.round((trip.totalSpent / planned) * 100)
      : 0;
  const isNearBudget = hasBudget && percentage >= 70 && percentage < 100;

  // Determine progress bar fill color
  const progressColor = !hasBudget
    ? "bg-transparent"
    : isOverBudget
    ? "bg-functional-negative"
    : isNearBudget
    ? "bg-functional-warning"
    : "bg-emerald";

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div
        className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-lime-cream/35 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cerulean inline-block" aria-hidden="true" />
          <h2 className="text-lg sm:text-xl font-bold text-yale-blue">
            Ngân sách chuyến đi
          </h2>
        </div>
        <span className="text-xs sm:text-sm font-medium text-text-muted">
          {hasBudget && planned !== null
            ? `Hạn mức kế hoạch: ${formatMoney(planned)}`
            : "Chưa đặt ngân sách"}
        </span>
      </div>

      {/* Spent Amount Display */}
      <div className="flex flex-wrap items-baseline gap-2 mb-4 relative z-10">
        <span className="text-sm font-medium text-text-muted">Đã chi</span>
        <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-yale-blue tracking-tight tabular-nums">
          {formatMoney(trip.totalSpent)}
        </span>
        {hasBudget && planned !== null && (
          <span className="text-base sm:text-lg text-text-muted font-normal">
            / {formatMoney(planned)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-hover-row h-3 rounded-full overflow-hidden p-0.5 relative z-10"
        role="progressbar"
        aria-valuenow={hasBudget ? Math.min(percentage, 100) : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          hasBudget ? `Tiến độ ngân sách: ${percentage}%` : "Chưa đặt hạn mức ngân sách"
        }
      >
        <div
          className={`${progressColor} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${hasBudget ? Math.min(percentage, 100) : 0}%` }}
        />
      </div>

      {/* Metric Status Chips & Remaining */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-1 relative z-10">
        <div>
          {!hasBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hover-row text-text-muted font-semibold text-xs border border-border-hairline">
              <span>Chưa đặt ngân sách</span>
            </span>
          ) : isOverBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-functional-negative/15 text-functional-negative font-semibold text-xs border border-functional-negative/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Đã vượt ngân sách ({percentage}%)</span>
            </span>
          ) : isNearBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-functional-warning-bg text-functional-warning font-semibold text-xs border border-functional-warning/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Sắp chạm trần ngân sách ({percentage}%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-fill/15 text-functional-positive font-semibold text-xs border border-functional-positive/20">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Trong hạn mức an toàn ({percentage}%)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-yale-blue">
          <span className="text-text-muted font-normal">Khả dụng:</span>
          {hasBudget ? (
            <span className="text-cerulean font-bold">
              Còn lại {formatMoney(remainingBudget)}
            </span>
          ) : (
            <span className="text-text-muted font-medium">Chưa thiết lập</span>
          )}
        </div>
      </div>
    </section>
  );
}
