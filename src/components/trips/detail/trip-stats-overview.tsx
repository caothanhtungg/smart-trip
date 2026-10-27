"use client";

import * as React from "react";
import { Receipt, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney } from "@/lib/utils";

import { getBalanceTypeLabel } from "@/lib/labels";

interface TripStatsOverviewProps {
  trip: TripDetailData;
}

export function TripStatsOverview({ trip }: TripStatsOverviewProps) {
  const isReceive = trip.userBalance?.type === "RECEIVE";
  const isPay = trip.userBalance?.type === "PAY";

  return (
    <section aria-label="Thống kê tài chính chuyến đi" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
      {/* Stat 1: Tổng chi */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(24,78,119,0.04)] border border-border-hairline flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(24,78,119,0.08)] hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tổng chi cả nhóm</span>
          <div className="w-10 h-10 rounded-2xl bg-tropical-teal/10 flex items-center justify-center text-tropical-teal">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-yale-blue tracking-tight tabular-nums">
            {formatMoney(trip.totalSpent)}
          </div>
          <div className="text-xs text-text-muted mt-2 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-tropical-teal inline-block" aria-hidden="true" />
            <span>{trip.expenseCount} khoản đã ghi nhận</span>
          </div>
        </div>
      </div>

      {/* Stat 2: Bạn đã ứng */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(24,78,119,0.04)] border border-border-hairline flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(24,78,119,0.08)] hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Bạn đã ứng</span>
          <div className="w-10 h-10 rounded-2xl bg-cerulean/10 flex items-center justify-center text-cerulean">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-yale-blue tracking-tight tabular-nums">
            {formatMoney(trip.userSpent)}
          </div>
          <div className="text-xs text-text-muted mt-2 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cerulean inline-block" aria-hidden="true" />
            <span>Chi trả cho {trip.paidActivitiesCount} mục</span>
          </div>
        </div>
      </div>

      {/* Stat 3: Số dư ròng cá nhân */}
      <div
        className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(24,78,119,0.04)] border flex flex-col justify-between relative overflow-hidden hover:shadow-[0_8px_30px_rgba(24,78,119,0.08)] hover:-translate-y-0.5 transition-all duration-200 ${
          isReceive
            ? "bg-gradient-to-br from-white via-white to-mint-green/20 border-functional-positive/25"
            : isPay
            ? "bg-gradient-to-br from-white via-white to-functional-warning-bg/40 border-functional-warning/25"
            : "bg-gradient-to-br from-white via-white to-lime-cream/30 border-light-green"
        }`}
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isReceive
                ? "text-functional-positive"
                : isPay
                ? "text-functional-warning"
                : "text-text-muted"
            }`}
          >
            {isReceive
              ? "Bạn nhận lại"
              : isPay
              ? "Bạn cần trả"
              : "Số dư của bạn"}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isReceive
                ? "bg-functional-positive/10 text-functional-positive border-functional-positive/20"
                : isPay
                ? "bg-functional-warning-bg text-functional-warning border-functional-warning/20"
                : "bg-surface-card text-yale-blue border-border-hairline"
            }`}
          >
            {isReceive ? "Đang dương" : isPay ? "Đang nợ" : getBalanceTypeLabel("SETTLED")}
          </span>
        </div>

        <div className="relative z-10">
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
              isReceive
                ? "text-functional-positive"
                : isPay
                ? "text-functional-warning"
                : "text-yale-blue"
            }`}
          >
            {isReceive
              ? `+${formatMoney(trip.userBalance?.amount || 0)}`
              : isPay
              ? `-${formatMoney(trip.userBalance?.amount || 0)}`
              : "0 ₫"}
          </div>
          <div
            className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${
              isReceive
                ? "text-functional-positive/85"
                : isPay
                ? "text-functional-warning/85"
                : "text-text-muted"
            }`}
          >
            {isReceive ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : isPay ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {isReceive
                ? "Chờ các bạn chuyển khoản"
                : isPay
                ? "Vào Quyết toán để quét QR"
                : "Đã hoàn tất thanh toán"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
