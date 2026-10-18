"use client";

import * as React from "react";
import {
  GitMerge,
  Lock,
  Sparkles,
  Unlock,
  CheckCircle,
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
    <section className="w-full bg-[#EAF4CC] border border-divider-border rounded-[20px] p-[20px_24px] shadow-sm transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Icon & Titles */}
        <div className="flex items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yale-blue text-surface-card flex items-center justify-center shrink-0 shadow-sm mt-0.5 md:mt-0">
            {isCompleted ? (
              <CheckCircle className="w-6 h-6 text-lime-cream" />
            ) : isPreview ? (
              <Clock className="w-6 h-6 text-lime-cream" />
            ) : (
              <GitMerge className="w-6 h-6 text-lime-cream" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline-h2 text-xl md:text-2xl font-bold text-yale-blue">
                {isCompleted
                  ? "Toàn bộ công nợ đã được thanh toán hoàn tất!"
                  : isPreview
                  ? "Bảng công nợ tạm tính (Chưa chốt sổ)"
                  : `Đã rút gọn công nợ bằng thuật toán tham lam (${transfersCount} giao dịch)`}
              </h2>

              {isPreview ? (
                <span className="px-2.5 py-0.5 rounded-full bg-surface-card text-yale-blue font-label-semibold text-xs border border-divider-border flex items-center gap-1 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-functional-warning" />
                  Tạm tính • Tự động cập nhật
                </span>
              ) : isSettling ? (
                <span className="px-2.5 py-0.5 rounded-full bg-surface-card text-yale-blue font-label-semibold text-xs border border-divider-border flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-cerulean" />
                  Đang quyết toán • Đã khóa chi tiêu
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-lime-cream text-yale-blue font-label-semibold text-xs border border-emerald/30 flex items-center gap-1 shadow-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-functional-positive" />
                  Đã tất toán 100%
                </span>
              )}
            </div>

            <p className="font-body-default text-text-muted text-xs md:text-sm max-w-2xl leading-relaxed">
              {isCompleted
                ? "Tất cả các thành viên đã hoàn thành nghĩa vụ thanh toán và người nhận đã đối soát thành công."
                : isPreview
                ? "Số liệu phản ánh các khoản chi hiện có trong chuyến đi. Chỉ Trưởng nhóm mới có quyền chốt sổ để các thành viên bắt đầu thanh toán."
                : "Hệ thống tự động bù trừ nợ đa chiều bằng thuật toán tham lam, giúp giảm thiểu tối đa các giao dịch chuyển tiền rời rạc giữa các thành viên."}
            </p>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
          {/* View Simplified Debt Graph button */}
          <button
            type="button"
            onClick={onViewGraphClick}
            className="h-[40px] px-3.5 rounded-xl bg-surface-card hover:bg-hover-row text-yale-blue font-label-semibold text-xs flex items-center gap-1.5 transition-colors border border-divider-border shadow-xs"
          >
            <GitMerge className="w-4 h-4 text-cerulean" />
            <span>Xem sơ đồ bù trừ</span>
          </button>

          {/* Host Lock Settlement Button (ACTIVE) */}
          {isPreview && isHost && (
            <button
              type="button"
              onClick={onLockClick}
              className="h-[40px] px-4 rounded-xl bg-yale-blue hover:bg-baltic-blue text-white font-label-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Lock className="w-4 h-4 text-lime-cream" />
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
                className={`h-[40px] px-4 rounded-xl font-label-semibold text-xs flex items-center gap-1.5 transition-colors border shadow-xs ${
                  canReopen
                    ? "bg-surface-card hover:bg-hover-row text-cerulean border-cerulean"
                    : "bg-surface-card/60 text-text-muted border-divider-border cursor-not-allowed opacity-75"
                }`}
              >
                <Unlock className="w-4 h-4" />
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
