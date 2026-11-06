"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, Info, Loader2, Lock, Unlock, X } from "lucide-react";

export type ConfirmModalType =
  | "LOCK_SETTLEMENT"
  | "REOPEN_SETTLEMENT"
  | "CONFIRM_RECEIVED"
  | "PROXY_PAY"
  | "PROXY_RECEIVE";

interface TripSettlementConfirmModalProps {
  isOpen: boolean;
  type: ConfirmModalType;
  title?: string;
  description?: string;
  details?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function TripSettlementConfirmModal({
  isOpen,
  type,
  title,
  description,
  details,
  confirmText,
  cancelText = "Hủy bỏ",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}: TripSettlementConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading && !isSubmitting) onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading, isSubmitting]);

  if (!isOpen) return null;

  const defaultMeta: Record<
    ConfirmModalType,
    {
      title: string;
      description: string;
      confirmText: string;
      icon: React.ReactNode;
      badgeColor: string;
    }
  > = {
    LOCK_SETTLEMENT: {
      title: "Chốt sổ công nợ & chuyển sang Quyết toán",
      description:
        "Khi chốt sổ, chuyến đi sẽ chuyển sang trạng thái Quyết toán (SETTLING). Mọi thành viên sẽ không thể thêm hoặc sửa khoản chi mới cho đến khi mở lại sổ. Bảng công nợ sẽ chính thức được kích hoạt để thanh toán.",
      confirmText: "Xác nhận chốt sổ",
      icon: <Lock className="w-6 h-6 text-yale-blue" />,
      badgeColor: "bg-lime-cream text-yale-blue",
    },
    REOPEN_SETTLEMENT: {
      title: "Mở lại sổ công nợ",
      description:
        "Chuyến đi sẽ quay trở lại trạng thái Đang diễn ra (ACTIVE). Các thành viên có thể tiếp tục thêm, sửa khoản chi. Thao tác này chỉ khả dụng khi chưa có bất kỳ giao dịch nào được thanh toán.",
      confirmText: "Xác nhận mở lại sổ",
      icon: <Unlock className="w-6 h-6 text-cerulean" />,
      badgeColor: "bg-surface-container-high text-cerulean",
    },
    CONFIRM_RECEIVED: {
      title: "Xác nhận đã nhận đủ tiền",
      description:
        "Vui lòng kiểm tra kỹ tài khoản ngân hàng hoặc tiền mặt đã nhận trước khi xác nhận. Sau khi xác nhận, giao dịch sẽ được chuyển sang trạng thái Hoàn tất (COMPLETED).",
      confirmText: "Đã nhận đủ tiền",
      icon: <CheckCircle className="w-6 h-6 text-functional-positive" />,
      badgeColor: "bg-ocean-mist/15 text-functional-positive",
    },
    PROXY_PAY: {
      title: "Đánh dấu đã thanh toán (Trả hộ)",
      description:
        "Bạn đang thực hiện thao tác với tư cách Trưởng nhóm: ghi nhận thanh toán thay cho thành viên chưa có tài khoản Smart Trip. Thao tác này sẽ chuyển giao dịch sang trạng thái Đã thanh toán (chờ người nhận đối soát).",
      confirmText: "Xác nhận trả hộ",
      icon: <Info className="w-6 h-6 text-cerulean" />,
      badgeColor: "bg-surface-container-high text-cerulean",
    },
    PROXY_RECEIVE: {
      title: "Xác nhận đã nhận tiền (Nhận hộ)",
      description:
        "Bạn đang thực hiện thao tác với tư cách Trưởng nhóm: xác nhận đã nhận tiền mặt hoặc đối soát thay cho thành viên chưa có tài khoản Smart Trip. Giao dịch sẽ được chuyển thành Hoàn tất (COMPLETED).",
      confirmText: "Xác nhận nhận hộ",
      icon: <CheckCircle className="w-6 h-6 text-functional-positive" />,
      badgeColor: "bg-lime-cream text-yale-blue",
    },
  };

  const currentMeta = defaultMeta[type];
  const finalTitle = title || currentMeta.title;
  const finalDesc = description || currentMeta.description;
  const finalConfirmText = confirmText || currentMeta.confirmText;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative w-full max-w-[520px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.25)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-divider-border/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${currentMeta.badgeColor}`}
            >
              {currentMeta.icon}
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                className="font-headline-h3 text-headline-h3 text-yale-blue leading-snug"
              >
                {finalTitle}
              </h2>
              <span className="text-xs text-text-muted font-label-default">
                Phiên làm việc thử nghiệm (In-Session Demo)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            aria-label="Đóng"
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="font-body-default text-sm text-text-body leading-relaxed">
            {finalDesc}
          </p>

          {details && (
            <div className="p-3.5 rounded-xl bg-bg-canvas border border-divider-border/70 text-xs text-text-body">
              {details}
            </div>
          )}

          <div className="p-3 rounded-xl bg-functional-warning-bg/60 border border-functional-warning/20 flex items-start gap-2.5 text-xs text-yale-blue">
            <AlertTriangle className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Thao tác này chỉ cập nhật dữ liệu giả lập trong
              phiên làm việc hiện tại, không liên kết ngân hàng thật.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-divider-border bg-bg-canvas/40 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting || isLoading}
            onClick={onClose}
            className="px-4 py-2.5 text-text-muted hover:text-yale-blue font-label-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isSubmitting || isLoading}
            onClick={async () => {
              if (isSubmitting || isLoading) return;
              setIsSubmitting(true);
              try {
                await onConfirm();
                onClose();
              } catch {
                // Handled by caller
              } finally {
                setIsSubmitting(false);
              }
            }}
            className={`px-5 py-2.5 rounded-xl font-label-semibold text-sm transition-all shadow-sm flex items-center gap-2 ${isDestructive
              ? "bg-functional-negative hover:bg-red-700 text-white disabled:opacity-60"
              : "bg-cerulean hover:bg-baltic-blue text-white disabled:opacity-60"
              }`}
          >
            {(isSubmitting || isLoading) && (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            )}
            <span>{isSubmitting || isLoading ? "Đang xử lý..." : finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
