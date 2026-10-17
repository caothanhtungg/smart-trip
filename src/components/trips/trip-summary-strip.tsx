"use client";

import * as React from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { OverallBalanceSummary } from "@/types/trip";

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
      className="bg-white rounded-[16px] border border-border-hairline px-5 sm:px-6 py-4 shadow-[0_4px_16px_rgba(24,78,119,0.06)] mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 text-yale-blue font-semibold text-[15px]">
          <div className="w-8 h-8 rounded-lg bg-cerulean/10 flex items-center justify-center text-cerulean shrink-0">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span>Số dư của bạn trong các chuyến đi:</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Positive Balance (To receive) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9ED92]/50 border border-[#76C893]/50 text-functional-positive text-xs sm:text-sm">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span className="font-medium text-text-body/80">Bạn đang được nhận:</span>
            <span className="font-bold tabular-nums">
              +{formatMoney(summary.toReceive)}
            </span>
          </div>

          <div
            className="hidden sm:block w-[1px] h-5 bg-border-hairline"
            aria-hidden="true"
          />

          {/* Negative Balance (To pay) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1E6] border border-[#C2410C]/30 text-functional-negative text-xs sm:text-sm">
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="font-medium text-text-body/80">Bạn cần trả:</span>
            <span className="font-bold tabular-nums">
              -{formatMoney(summary.toPay)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewSettlementDetails}
        className="inline-flex items-center gap-1 text-sm font-semibold text-cerulean hover:text-baltic-blue transition-colors self-end lg:self-center cursor-pointer focus:outline-none focus-visible:underline"
      >
        <span>Xem chi tiết công nợ</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
