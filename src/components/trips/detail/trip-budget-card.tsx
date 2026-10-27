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
    <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(24,78,119,0.04)] border border-border-hairline relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(24,78,119,0.07)]">
      {/* Decorative gentle gradient glow */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-lime-cream/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header Row: Title & Status Badge Pill */}
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cerulean inline-block" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-bold text-yale-blue tracking-tight">
            Ngân sách chuyến đi
          </h2>
        </div>

        {/* Status Pill Badge */}
        <div>
          {!hasBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hover-row text-text-muted font-medium text-xs border border-border-hairline">
              Chưa đặt hạn mức
            </span>
          ) : isOverBudget ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-functional-negative/10 text-functional-negative font-semibold text-xs border border-functional-negative/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Vượt {percentage}%</span>
            </span>
          ) : isNearBudget ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-functional-warning-bg text-functional-warning font-semibold text-xs border border-functional-warning/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Đạt {percentage}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-fill/15 text-functional-positive font-semibold text-xs border border-functional-positive/20">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>An toàn ({percentage}%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Primary Figures: Large Clean Typography */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Đã chi</span>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-yale-blue tracking-tight tabular-nums">
            {formatMoney(trip.totalSpent)}
          </span>
          {hasBudget && planned !== null && (
            <span className="text-sm sm:text-base text-text-muted font-normal">
              / {formatMoney(planned)}
            </span>
          )}
        </div>

        <div className="text-xs sm:text-sm font-medium text-text-muted">
          {hasBudget ? (
            <span>
              Còn lại <strong className="text-cerulean font-bold tabular-nums">{formatMoney(remainingBudget)}</strong>
            </span>
          ) : (
            <span className="text-text-muted">Tự do chi tiêu</span>
          )}
        </div>
      </div>

      {/* Sleek Slim Progress Bar */}
      <div
        className="w-full bg-hover-row h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5 relative z-10"
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
    </section>
  );
}
