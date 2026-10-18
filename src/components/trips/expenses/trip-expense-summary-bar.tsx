"use client";

import * as React from "react";
import { Plus, ScanLine, PieChart, Wallet, CreditCard, Lock } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney } from "@/lib/utils";

interface TripExpenseSummaryBarProps {
  trip: TripDetailData;
  totalExpensesAmount: number;
  expenseCount: number;
  onOpenAddExpenseModal: () => void;
  onOpenAiScanModal: () => void;
}

export function TripExpenseSummaryBar({
  trip,
  totalExpensesAmount,
  expenseCount,
  onOpenAddExpenseModal,
  onOpenAiScanModal,
}: TripExpenseSummaryBarProps) {
  const memberCount = Math.max(1, trip.members.length);
  const avgPerPerson = Math.floor(totalExpensesAmount / memberCount);
  const budget = trip.budget || trip.plannedBudget || 0;
  const budgetRatio = budget > 0 ? (totalExpensesAmount / budget) * 100 : 0;
  const isLocked = trip.status === "SETTLING" || trip.status === "COMPLETED";

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline mb-6">
      {/* Top Section: Financial Highlights & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-border-hairline">
        {/* Left: Total Spent Big Metric */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-cerulean shrink-0 shadow-sm">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Tổng chi tiêu chuyến đi
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-yale-blue tabular-nums">
                {formatMoney(totalExpensesAmount)}
              </span>
              <span className="text-xs text-text-muted font-medium">
                ({expenseCount} khoản chi)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onOpenAiScanModal}
            className="h-11 px-4 rounded-xl bg-white hover:bg-hover-row text-cerulean border border-border-hairline font-semibold text-sm inline-flex items-center gap-2 shadow-[0_2px_6px_rgba(24,78,119,0.06)] transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-cerulean" />
            <span className="hidden sm:inline">Quét hóa đơn AI</span>
            <span className="sm:hidden">Quét AI</span>
          </button>

          {isLocked ? (
            <button
              type="button"
              disabled
              title="Sổ quỹ đã khóa do chuyến đi đang quyết toán hoặc đã hoàn tất (Quy tắc R7)"
              className="h-11 px-5 rounded-xl bg-gray-100 text-text-muted font-semibold text-sm inline-flex items-center gap-2 border border-border-hairline cursor-not-allowed opacity-75"
            >
              <Lock className="w-4 h-4" />
              <span>Sổ quỹ đã khóa</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAddExpenseModal}
              className="h-11 px-5 rounded-xl bg-cerulean hover:bg-baltic-blue text-white font-semibold text-sm inline-flex items-center gap-2 shadow-[0_4px_12px_rgba(26,117,159,0.25)] transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm khoản chi</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Section: Progress Bar & Secondary Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-center">
        {/* Metric 1: Ngân sách & Tiến độ */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <Wallet className="w-3.5 h-3.5 text-cerulean" />
              <span>Tiến độ ngân sách ({formatMoney(budget)})</span>
            </span>
            <span className="font-bold text-yale-blue tabular-nums">
              {budgetRatio.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetRatio > 100
                  ? "bg-functional-negative"
                  : budgetRatio > 80
                  ? "bg-functional-warning"
                  : "bg-gradient-to-r from-tropical-teal to-cerulean"
              }`}
              style={{ width: `${Math.min(100, budgetRatio)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Bình quân mỗi người */}
        <div className="flex items-center gap-2 md:justify-end text-xs sm:text-sm text-yale-blue">
          <PieChart className="w-4 h-4 text-tropical-teal shrink-0" />
          <span>
            Bình quân:{" "}
            <strong className="text-cerulean font-bold tabular-nums">
              {formatMoney(avgPerPerson)}
            </strong>
            <span className="text-text-muted">/người</span>
          </span>
        </div>
      </div>
    </section>
  );
}
