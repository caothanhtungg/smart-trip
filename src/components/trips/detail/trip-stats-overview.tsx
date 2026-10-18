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
    <section aria-label="Thống kê tài chính chuyến đi" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {/* Stat 1: Tổng chi */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(24,78,119,0.1)] transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-semibold text-text-muted">Tổng chi</span>
          <div className="w-10 h-10 rounded-xl bg-tropical-teal/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-tropical-teal" />
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-yale-blue tracking-tight tabular-nums">
            {formatMoney(trip.totalSpent)}
          </div>
          <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-tropical-teal inline-block" aria-hidden="true" />
            <span>{trip.expenseCount} khoản chi cả nhóm</span>
          </div>
        </div>
      </div>

      {/* Stat 2: Bạn đã ứng */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(24,78,119,0.1)] transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-semibold text-text-muted">Bạn đã ứng</span>
          <div className="w-10 h-10 rounded-xl bg-cerulean/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-cerulean" />
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-yale-blue tracking-tight tabular-nums">
            {formatMoney(trip.userSpent)}
          </div>
          <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cerulean inline-block" aria-hidden="true" />
            <span>Chi trả cho {trip.paidActivitiesCount} hoạt động</span>
          </div>
        </div>
      </div>

      {/* Stat 3: Số dư ròng cá nhân */}
      <div
        className={`rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border flex flex-col justify-between relative overflow-hidden ${
          isReceive
            ? "bg-gradient-to-br from-hover-row to-mint-green/30 border-functional-positive/20"
            : isPay
            ? "bg-gradient-to-br from-functional-warning-bg/60 to-functional-warning-bg border-functional-warning/20"
            : "bg-gradient-to-br from-bg-canvas to-lime-cream/30 border-light-green"
        }`}
      >
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span
            className={`text-xs sm:text-sm font-semibold ${
              isReceive
                ? "text-functional-positive"
                : isPay
                ? "text-functional-warning"
                : "text-yale-blue"
            }`}
          >
            {isReceive
              ? `Bạn ${getBalanceTypeLabel("RECEIVE").toLowerCase()}`
              : isPay
              ? `Bạn ${getBalanceTypeLabel("PAY").toLowerCase()}`
              : "Số dư của bạn"}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/90 text-xs font-bold shadow-xs">
            {isReceive ? "Đang dương" : isPay ? "Đang nợ" : getBalanceTypeLabel("SETTLED")}
          </span>
        </div>

        <div className="relative z-10">
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${
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
            className={`text-xs mt-1.5 flex items-center gap-1.5 font-medium ${
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
                ? "Số dư ròng sau đối soát"
                : isPay
                ? "Cần chuyển khoản quyết toán"
                : "Mọi khoản nợ đã hoàn tất"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
