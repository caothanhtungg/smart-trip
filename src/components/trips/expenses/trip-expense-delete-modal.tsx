"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/money/format";

interface TripExpenseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () =>
    | Promise<{ success: boolean; message?: string } | void>
    | { success: boolean; message?: string }
    | void;
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
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClose = React.useCallback(() => {
    if (isDeleting) return;
    setError(null);
    setIsDeleting(false);
    onClose();
  }, [isDeleting, onClose]);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isDeleting) handleClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, handleClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await onConfirmDelete();
      if (res && typeof res === "object" && "success" in res && !res.success) {
        setError(res.message || "Không thể xóa khoản chi.");
        setIsDeleting(false);
        return;
      }
      setIsDeleting(false);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa khoản chi."
      );
      setIsDeleting(false);
    }
  };

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
            onClick={handleClose}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Info */}
        <div className="space-y-2 mb-4">
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

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-functional-negative/10 border border-functional-negative/20 text-functional-negative text-xs font-semibold animate-fadeIn"
          >
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-divider-border">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleClose}
            className="h-11 px-5 rounded-xl text-text-muted font-semibold text-sm hover:bg-hover-row transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="h-11 px-5 rounded-xl bg-functional-negative text-white font-semibold text-sm hover:bg-functional-negative/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-functional-negative/40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
