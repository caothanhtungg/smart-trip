"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/money/format";

interface TripExpenseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  expenseTitle: string;
  expenseAmount: number;
}

export function TripExpenseDeleteModal({
  isOpen,
  onClose,
  onConfirmDelete,
  expenseTitle,
  expenseAmount,
}: TripExpenseDeleteModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="relative w-full max-w-[440px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.25)] flex flex-col p-6 animate-in zoom-in-95 duration-200">
        {/* Header Icon + Close */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-functional-negative/10 flex items-center justify-center text-functional-negative">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Info */}
        <div className="space-y-2 mb-6">
          <h3 id="delete-modal-title" className="text-lg font-bold text-yale-blue">
            Xác nhận xóa khoản chi?
          </h3>
          <div className="p-3 bg-hover-row/60 rounded-xl border border-divider-border/60 text-sm">
            <p className="font-semibold text-yale-blue truncate">{expenseTitle}</p>
            <p className="font-mono font-bold text-cerulean mt-0.5">
              {formatMoney(expenseAmount)}
            </p>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Hành động này sẽ gỡ bỏ khoản chi khỏi bảng tính tiền nhóm. Số dư công nợ của tất cả thành viên sẽ tự động được tính toán lại. Nếu khoản chi này đang gắn với địa điểm lịch trình, liên kết sẽ được gỡ bỏ nhưng không xóa địa điểm.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-divider-border">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl text-text-muted font-semibold text-sm hover:bg-hover-row transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="h-11 px-5 rounded-xl bg-functional-negative text-white font-semibold text-sm hover:bg-functional-negative/90 shadow-sm transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-functional-negative/40"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
