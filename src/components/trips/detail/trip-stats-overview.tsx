"use client";

import * as React from "react";
import {
  Receipt,
  Wallet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowDownLeft,
} from "lucide-react";
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
    <>
      {/* Stat 1: Tổng chi cả nhóm */}
      <div className="relative overflow-hidden group rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white/90 dark:bg-[#111A2E]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(24,78,119,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:shadow-[0_12px_36px_rgba(20,184,166,0.15)] dark:hover:shadow-[0_12px_36px_rgba(45,212,191,0.15)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-teal-400/30 before:to-transparent">
        {/* Ambient Teal Glow */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-teal-500/10 dark:bg-teal-400/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng chi cả nhóm
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-400/15 border border-teal-500/20 dark:border-teal-400/25 flex items-center justify-center text-teal-600 dark:text-teal-300 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <Receipt className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatMoney(trip.totalSpent)}
            </div>
          </div>
        </div>

        <div className="pt-4 relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500 shadow-[0_0_6px_rgba(45,212,191,0.6)]"></span>
            </span>
            <span className="truncate">{trip.expenseCount} khoản đã ghi nhận</span>
          </div>
        </div>
      </div>

      {/* Stat 2: Bạn đã ứng */}
      <div className="relative overflow-hidden group rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white/90 dark:bg-[#111A2E]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(24,78,119,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_12px_36px_rgba(96,165,250,0.15)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-blue-400/30 before:to-transparent">
        {/* Ambient Blue Glow */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-blue-500/10 dark:bg-blue-400/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bạn đã ứng
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-400/15 border border-blue-500/20 dark:border-blue-400/25 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <Wallet className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatMoney(trip.userSpent)}
            </div>
          </div>
        </div>

        <div className="pt-4 relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></span>
            </span>
            <span className="truncate">Chi trả cho {trip.paidActivitiesCount} mục</span>
          </div>
        </div>
      </div>

      {/* Stat 3: Số dư của bạn (Hero Card) */}
      <div
        className={`relative overflow-hidden group rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white/90 dark:bg-[#111A2E]/90 backdrop-blur-md border shadow-[0_4px_24px_rgba(24,78,119,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent ${
          isReceive
            ? "border-emerald-500/30 dark:border-emerald-400/30 hover:shadow-[0_12px_36px_rgba(16,185,129,0.2)] before:via-emerald-400/40"
            : isPay
            ? "border-amber-500/30 dark:border-amber-400/30 hover:shadow-[0_12px_36px_rgba(245,158,11,0.2)] before:via-amber-400/40"
            : "border-slate-200/80 dark:border-white/[0.08] hover:shadow-[0_12px_36px_rgba(16,185,129,0.15)] before:via-emerald-400/30"
        }`}
      >
        {/* Dynamic Ambient Aura */}
        <div
          className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
            isReceive
              ? "bg-emerald-500/15 dark:bg-emerald-400/20"
              : isPay
              ? "bg-amber-500/15 dark:bg-amber-400/20"
              : "bg-emerald-500/10 dark:bg-emerald-400/15"
          }`}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span
              className={`text-xs font-bold uppercase tracking-wider truncate ${
                isReceive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isPay
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {isReceive
                ? "Bạn nhận lại"
                : isPay
                ? "Bạn cần trả"
                : "Số dư của bạn"}
            </span>

            {/* Dynamic Right Gem Icon */}
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300 ${
                isReceive
                  ? "bg-emerald-500/10 dark:bg-emerald-400/15 border-emerald-500/20 dark:border-emerald-400/25 text-emerald-600 dark:text-emerald-300"
                  : isPay
                  ? "bg-amber-500/10 dark:bg-amber-400/15 border-amber-500/20 dark:border-amber-400/25 text-amber-600 dark:text-amber-300"
                  : "bg-emerald-500/10 dark:bg-emerald-400/15 border-emerald-500/20 dark:border-emerald-400/25 text-emerald-600 dark:text-emerald-300"
              }`}
            >
              {isReceive ? (
                <TrendingUp className="w-4.5 h-4.5 stroke-[2.2]" />
              ) : isPay ? (
                <ArrowDownLeft className="w-4.5 h-4.5 stroke-[2.2]" />
              ) : (
                <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />
              )}
            </div>
          </div>

          <div>
            <div
              className={`text-2xl sm:text-[28px] font-black tracking-tight tabular-nums ${
                isReceive
                  ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                  : isPay
                  ? "text-amber-600 dark:text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {isReceive
                ? `+${formatMoney(trip.userBalance?.amount || 0)}`
                : isPay
                ? `-${formatMoney(trip.userBalance?.amount || 0)}`
                : "0 ₫"}
            </div>
          </div>
        </div>

        <div className="pt-4 relative z-10">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium truncate">
              {isReceive ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Chờ bạn bè chuyển khoản</span>
                </span>
              ) : isPay ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold truncate">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Vào Quyết toán để quét QR</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  <span className="truncate">Đã hoàn tất thanh toán</span>
                </span>
              )}
            </div>

            {/* Pill Gem */}
            <span
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isReceive
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-500/25"
                  : isPay
                  ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300 border-amber-500/25"
                  : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-500/25"
              }`}
            >
              {isReceive ? "Đang dương" : isPay ? "Đang nợ" : getBalanceTypeLabel("SETTLED")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
