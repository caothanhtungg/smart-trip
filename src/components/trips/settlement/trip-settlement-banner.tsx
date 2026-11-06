"use client";

import * as React from "react";
import {
  GitMerge,
  Lock,
  Sparkles,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { TripStatus } from "@/types/trip";

interface TripSettlementBannerProps {
  status: TripStatus;
  transfersCount: number;
  isHost: boolean;
  canReopen: boolean;
  reopenDisabledReason?: string;
  onLockClick: () => void;
  onReopenClick: () => void;
  onViewGraphClick: () => void;
}

export function TripSettlementBanner({
  status,
  transfersCount,
  isHost,
  canReopen,
  reopenDisabledReason,
  onLockClick,
  onReopenClick,
  onViewGraphClick,
}: TripSettlementBannerProps) {
  const isPreview = status === "ACTIVE";
  const isSettling = status === "SETTLING";
  const isCompleted = status === "COMPLETED";

  return (
    <section className="w-full bg-surface-card border border-border-hairline rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Icon & Titles */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0 ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : isPreview
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                : "bg-cerulean/10 text-cerulean dark:text-sky-400 border border-cerulean/20"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isPreview ? (
              <Clock className="w-5 h-5" />
            ) : (
              <GitMerge className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-yale-blue">
                {isCompleted
                  ? "Toàn bộ công nợ đã hoàn tất"
                  : isPreview
                  ? "Bảng công nợ tạm tính (Chưa chốt sổ)"
                  : `Đã rút gọn công nợ (${transfersCount} giao dịch)`}
              </h2>

              {isPreview ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-[11px] border border-amber-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Tạm tính • Tự động cập nhật
                </span>
              ) : isSettling ? (
                <span className="px-2.5 py-0.5 rounded-full bg-cerulean/10 text-cerulean dark:text-sky-300 font-semibold text-[11px] border border-cerulean/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cerulean dark:text-sky-400" />
                  Đang quyết toán
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Đã tất toán 100%
                </span>
              )}
            </div>

            <p className="text-text-muted text-xs sm:text-sm leading-relaxed max-w-2xl">
              {isCompleted
                ? "Tất cả các thành viên đã hoàn thành nghĩa vụ thanh toán và người nhận đã đối soát thành công."
                : isPreview
                ? "Số liệu phản ánh các khoản chi hiện có trong chuyến đi. Chỉ Trưởng nhóm mới có quyền chốt sổ để các thành viên bắt đầu thanh toán."
                : "Hệ thống tự động bù trừ nợ đa chiều, giúp giảm thiểu tối đa các giao dịch chuyển tiền rời rạc giữa các thành viên."}
            </p>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
          {/* View Simplified Debt Graph button */}
          <button
            type="button"
            onClick={onViewGraphClick}
            className="h-9 px-3.5 rounded-xl bg-surface-container hover:bg-hover-row text-yale-blue font-semibold text-xs flex items-center gap-1.5 transition-colors border border-border-hairline shadow-2xs cursor-pointer"
          >
            <GitMerge className="w-3.5 h-3.5 text-cerulean" />
            <span>Xem sơ đồ bù trừ</span>
          </button>

          {/* Host Lock Settlement Button (ACTIVE) */}
          {isPreview && isHost && (
            <button
              type="button"
              onClick={onLockClick}
              className="h-9 px-4 rounded-xl bg-yale-blue hover:bg-baltic-blue dark:bg-cerulean dark:hover:bg-baltic-blue text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-lime-cream" />
              <span>Chốt sổ công nợ</span>
            </button>
          )}

          {/* Host Reopen Settlement Button (SETTLING) */}
          {isSettling && isHost && (
            <div className="relative group">
              <button
                type="button"
                disabled={!canReopen}
                onClick={onReopenClick}
                className={`h-9 px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors border shadow-2xs ${
                  canReopen
                    ? "bg-surface-card hover:bg-hover-row text-cerulean border-cerulean/40 cursor-pointer"
                    : "bg-surface-container/60 text-text-muted border-border-hairline cursor-not-allowed opacity-70"
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở lại sổ</span>
              </button>

              {/* Tooltip explaining why reopen is disabled */}
              {!canReopen && reopenDisabledReason && (
                <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center gap-1.5 p-2 bg-yale-blue text-white text-[11px] rounded-lg shadow-lg z-20 w-64">
                  <AlertCircle className="w-4 h-4 text-functional-warning shrink-0" />
                  <span>{reopenDisabledReason}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
