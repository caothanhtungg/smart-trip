"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney } from "@/lib/utils";

interface TripBudgetCardProps {
  trip: TripDetailData;
}

export function TripBudgetCard({ trip }: TripBudgetCardProps) {
  const percentage = Math.round((trip.totalSpent / trip.plannedBudget) * 100);
  const remaining = Math.max(0, trip.plannedBudget - trip.totalSpent);
  const isOverBudget = percentage >= 100;
  const isNearBudget = percentage >= 70 && percentage < 100;

  // Determine progress bar fill color
  const progressColor = isOverBudget
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
          Hạn mức kế hoạch: {formatMoney(trip.plannedBudget)}
        </span>
      </div>

      {/* Spent Amount Display */}
      <div className="flex flex-wrap items-baseline gap-2 mb-4 relative z-10">
        <span className="text-sm font-medium text-text-muted">Đã chi</span>
        <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-yale-blue tracking-tight tabular-nums">
          {formatMoney(trip.totalSpent)}
        </span>
        <span className="text-base sm:text-lg text-text-muted font-normal">
          / {formatMoney(trip.plannedBudget)}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-[#E9EFE6] h-3 rounded-full overflow-hidden p-0.5 relative z-10"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Tiến độ ngân sách: ${percentage}%`}
      >
        <div
          className={`${progressColor} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Metric Status Chips & Remaining */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-1 relative z-10">
        <div>
          {isOverBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-functional-negative/15 text-functional-negative font-semibold text-xs border border-functional-negative/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Đã vượt ngân sách ({percentage}%)</span>
            </span>
          ) : isNearBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-functional-warning-bg text-functional-warning font-semibold text-xs border border-[#C2410C]/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Sắp chạm trần ngân sách ({percentage}%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF8E8] text-functional-positive font-semibold text-xs border border-[#2E7D5B]/20">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Trong hạn mức an toàn ({percentage}%)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-yale-blue">
          <span className="text-text-muted font-normal">Khả dụng:</span>
          <span className="text-cerulean font-bold">
            Còn lại {formatMoney(remaining)}
          </span>
        </div>
      </div>
    </section>
  );
}
