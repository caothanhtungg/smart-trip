"use client";

import * as React from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { OverallBalanceSummary } from "@/types/trip";
import { LABELS } from "@/lib/labels";

interface TripSummaryStripProps {
  summary: OverallBalanceSummary;
  onViewSettlementDetails?: () => void;
}

export function TripSummaryStrip({
  summary,
  onViewSettlementDetails,
}: TripSummaryStripProps) {
  return (
    <section
      aria-label="Tóm tắt số dư chuyến đi"
      className="bg-white dark:bg-[#141C2E] rounded-[16px] border border-border-hairline dark:border-[#24314A] px-5 sm:px-6 py-4 shadow-[0_4px_16px_rgba(24,78,119,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 text-yale-blue dark:text-white font-semibold text-[15px]">
          <div className="w-8 h-8 rounded-lg bg-cerulean/10 dark:bg-sky-500/10 flex items-center justify-center text-cerulean dark:text-sky-400 shrink-0">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span>Số dư của bạn trong các chuyến đi:</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Positive Balance (To receive) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-cream/50 dark:bg-[#163323] border border-emerald-fill/50 dark:border-[#4ADE80]/30 text-functional-positive dark:text-[#4ADE80] text-xs sm:text-sm">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span className="font-medium text-text-body/80 dark:text-slate-300">{LABELS.BALANCE.YOU_RECEIVE}</span>
            <span className="font-bold tabular-nums">
              +{formatMoney(summary.toReceive)}
            </span>
          </div>

          <div
            className="hidden sm:block w-[1px] h-5 bg-border-hairline dark:bg-[#24314A]"
            aria-hidden="true"
          />

          {/* Negative Balance (To pay) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-functional-warning-bg dark:bg-[#381E15] border border-functional-warning/30 dark:border-[#FB923C]/30 text-functional-negative dark:text-[#FB923C] text-xs sm:text-sm">
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="font-medium text-text-body/80 dark:text-slate-300">{LABELS.BALANCE.YOU_PAY}</span>
            <span className="font-bold tabular-nums">
              -{formatMoney(summary.toPay)}
            </span>
          </div>
        </div>
      </div>

      {onViewSettlementDetails && (
        <button
          type="button"
          onClick={onViewSettlementDetails}
          className="inline-flex items-center gap-1 text-sm font-semibold text-cerulean dark:text-[#38BDF8] hover:text-baltic-blue dark:hover:text-[#7DD3FC] transition-colors self-end sm:self-center cursor-pointer focus:outline-none focus-visible:underline"
        >
          <span>Xem chi tiết công nợ</span>
        </button>
      )}
    </section>
  );
}
