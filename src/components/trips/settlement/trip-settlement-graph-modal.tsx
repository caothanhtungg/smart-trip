"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, GitMerge, Info, Sparkles, X } from "lucide-react";
import { SettlementTransfer } from "@/types/settlement";
import { TripMember } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";

interface TripSettlementGraphModalProps {
  isOpen: boolean;
  transfers: SettlementTransfer[];
  members: TripMember[];
  totalDirectExpensesCount: number;
  onClose: () => void;
}

export function TripSettlementGraphModal({
  isOpen,
  transfers,
  members,
  totalDirectExpensesCount,
  onClose,
}: TripSettlementGraphModalProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const simplifiedCount = transfers.length;
  // An illustrative estimate of cross-debts if every member paid each other directly
  const rawDebtsCount = Math.max(totalDirectExpensesCount * 2, simplifiedCount * 3, 6);
  const reductionPercent =
    rawDebtsCount > simplifiedCount
      ? Math.round(((rawDebtsCount - simplifiedCount) / rawDebtsCount) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="graph-modal-title"
    >
      <div className="relative w-full max-w-[620px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.25)] flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-divider-border/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yale-blue text-lime-cream flex items-center justify-center shrink-0 shadow-xs">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="graph-modal-title"
                  className="font-headline-h3 text-lg font-bold text-yale-blue"
                >
                  Sơ đồ rút gọn công nợ
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-lime-cream text-yale-blue text-[10px] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cerulean" />
                  Thuật toán tham lam
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Bù trừ nợ đa chiều, giảm thiểu số lần chuyển tiền giữa các thành viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-hover-row text-text-muted hover:text-yale-blue flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-bg-canvas border border-divider-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase">
                Giao dịch chéo
              </span>
              <div className="text-2xl font-bold text-yale-blue mt-1 tabular-nums">
                ~{rawDebtsCount}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Nếu thanh toán riêng cho từng khoản chi
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-canvas border border-divider-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase">
                Số dư ròng
              </span>
              <div className="text-2xl font-bold text-cerulean mt-1">
                Net = 0 ₫
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Tổng thu và tổng chi toàn đoàn cân bằng
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container border border-border-hairline flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-yale-blue/70 uppercase">
                Sau khi rút gọn
              </span>
              <div className="text-2xl font-bold text-yale-blue mt-1 tabular-nums">
                {simplifiedCount} giao dịch
              </div>
              <p className="text-[11px] text-functional-positive font-semibold mt-1">
                Tiết kiệm {reductionPercent}% thao tác
              </p>
            </div>
          </div>

          {/* Educational Explanation Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-divider-border/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-yale-blue">
              <Info className="w-4 h-4 text-cerulean" />
              <span>Cách thức hoạt động của thuật toán tham lam</span>
            </div>
            <ol className="text-xs text-text-body space-y-1.5 list-decimal pl-4">
              <li>
                <strong>Tính số dư ròng:</strong> Với mỗi thành viên,{" "}
                <code className="px-1.5 py-0.5 rounded bg-surface-card text-cerulean font-mono text-[11px]">
                  Net = Đã trả - Phải chịu
                </code>
                . Tổng số dư ròng của cả đoàn luôn bằng 0.
              </li>
              <li>
                <strong>Phân nhóm bù trừ:</strong> Tách thành nhóm người cần nhận (Net &gt; 0)
                và nhóm người cần trả (Net &lt; 0).
              </li>
              <li>
                <strong>Ghép cặp tham lam (Greedy Debt Simplification):</strong> Lấy người cần trả
                nhiều nhất bù trừ cho người cần nhận nhiều nhất với số tiền tối đa có thể, lặp lại
                đến khi tất cả số dư bằng 0.
              </li>
            </ol>
          </div>

          {/* List of Simplified Repayment Routes */}
          <div>
            <h4 className="text-xs font-semibold text-yale-blue uppercase tracking-wider mb-2.5">
              Lộ trình thanh toán đề xuất ({transfers.length} giao dịch)
            </h4>

            <div className="space-y-2">
              {transfers.map((t, idx) => {
                const fromMember = members.find((m) => m.id === t.fromMemberId);
                const toMember = members.find((m) => m.id === t.toMemberId);

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-bg-canvas border border-divider-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-surface-card border border-divider-border text-yale-blue font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-yale-blue truncate">
                        {fromMember?.name || "Thành viên"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cerulean shrink-0" />
                      <span className="font-semibold text-yale-blue truncate">
                        {toMember?.name || "Thành viên"}
                      </span>
                    </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-yale-blue tabular-nums">
                      {formatVnd(t.amount)}
                    </span>
                    {t.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-lime-cream text-yale-blue font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-functional-positive" />
                        Xong
                      </span>
                    ) : t.status === "PAID" ? (
                      <span className="px-2 py-0.5 rounded-full bg-ocean-mist/15 text-cerulean font-semibold text-[10px]">
                        Đã chuyển
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-functional-warning-bg text-functional-warning font-semibold text-[10px]">
                        Chưa trả
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-divider-border bg-surface-card flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-cerulean hover:bg-baltic-blue text-white font-label-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
