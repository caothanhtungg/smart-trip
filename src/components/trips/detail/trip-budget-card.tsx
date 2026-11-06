"use client";

import * as React from "react";
import { Compass, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
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

  // Determine progress bar fill gradient & glow
  const progressFillClass = !hasBudget
    ? "bg-transparent"
    : isOverBudget
    ? "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
    : isNearBudget
    ? "bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
    : "bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]";

  return (
    <section
      aria-label="Ngân sách chuyến đi"
      className="relative overflow-hidden group rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white/90 dark:bg-[#111A2E]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(24,78,119,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:shadow-[0_12px_36px_rgba(26,117,159,0.15)] dark:hover:shadow-[0_12px_36px_rgba(56,189,248,0.15)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-sky-400/30 before:to-transparent"
    >
      {/* Ambient Celestial Glow */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-sky-500/10 dark:bg-sky-400/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"
        aria-hidden="true"
      />

      {/* Top Header Row */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ngân sách chuyến đi
          </span>

          {/* Artistic Glass Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 border border-sky-500/20 dark:border-sky-400/25 flex items-center justify-center text-sky-600 dark:text-sky-300 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
            <Compass className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
        </div>

        {/* Primary Figures */}
        <div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatMoney(trip.totalSpent)}
            </span>
            {hasBudget && planned !== null && (
              <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-400">
                / {formatMoney(planned)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Remaining Status + Glowing Progress Bar */}
      <div className="pt-4 relative z-10">
        <div className="flex items-center justify-between gap-2 text-xs mb-2">
          <div className="font-medium text-slate-500 dark:text-slate-400">
            <span>{hasBudget ? "Còn lại: " : "Hạn mức: "}</span>
            <span className="tabular-nums">
              {hasBudget ? (
                <strong className="text-sky-600 dark:text-sky-400 font-bold">
                  {formatMoney(remainingBudget)}
                </strong>
              ) : (
                <span className="text-slate-600 dark:text-slate-300 font-medium">Tự do chi tiêu</span>
              )}
            </span>
          </div>

          {/* Micro Status Gem Pill */}
          <div className="shrink-0">
            {!hasBudget ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[11px] border border-slate-200 dark:border-slate-700">
                Chưa đặt
              </span>
            ) : isOverBudget ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-500/25 shadow-xs">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Vượt {percentage}%</span>
              </span>
            ) : isNearBudget ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/25 shadow-xs">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Đạt {percentage}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/25 shadow-xs">
                <CheckCircle className="w-3 h-3 shrink-0" />
                <span>An toàn ({percentage}%)</span>
              </span>
            )}
          </div>
        </div>

        {/* Sleek Luminous Progress Bar */}
        <div
          className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5"
          role="progressbar"
          aria-valuenow={hasBudget ? Math.min(percentage, 100) : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={
            hasBudget ? `Tiến độ ngân sách: ${percentage}%` : "Chưa đặt hạn mức ngân sách"
          }
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressFillClass}`}
            style={{ width: `${hasBudget ? Math.min(percentage, 100) : 0}%` }}
          />
        </div>
      </div>
    </section>
  );
}
