"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Copy, Check, Info, QrCode, AlertCircle } from "lucide-react";

interface TripInviteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripTitle: string;
  inviteCode: string;
}

export function TripInviteShareModal({
  isOpen,
  onClose,
  tripTitle,
  inviteCode,
}: TripInviteShareModalProps) {
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "success" | "error">("idle");

  const handleClose = () => {
    setCopyStatus("idle");
    onClose();
  };

  const handleCopy = async () => {
    let success = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        const copyPromise = navigator.clipboard.writeText(inviteCode);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 400)
        );
        await Promise.race([copyPromise, timeoutPromise]);
        success = true;
      }
    } catch {
      // Clipboard write failed or timed out, fall through to textarea fallback
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = inviteCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const execSuccess = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (execSuccess) {
          success = true;
        }
      } catch {
        // execCommand failed
      }
    }

    if (success) {
      setCopyStatus("success");
      setTimeout(() => {
        setCopyStatus("idle");
      }, 2500);
    } else {
      setCopyStatus("error");
      setTimeout(() => {
        setCopyStatus("idle");
      }, 3500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mời bạn bè tham gia chuyến đi"
      description={`Chia sẻ mã mời chuyến đi "${tripTitle}" cho các thành viên (UC05)`}
    >
      <div className="space-y-4 py-2">
        {/* Invite Code Display Box */}
        <div className="p-5 rounded-2xl bg-lime-cream/30 border border-light-green/80 flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <QrCode className="w-4 h-4 text-cerulean" />
            <span>Mã mời chính thức của chuyến đi:</span>
          </div>

          <div
            className="w-full py-3 px-4 rounded-xl bg-white border border-border-hairline shadow-inner select-all font-mono font-extrabold text-xl sm:text-2xl tracking-widest text-yale-blue"
            title="Nhấp đúp hoặc bôi đen để sao chép"
          >
            {inviteCode}
          </div>

          <Button
            id="copy-invite-code-btn"
            type="button"
            variant="primary"
            size="md"
            onClick={handleCopy}
            className="w-full sm:w-auto px-6 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(26,117,159,0.25)]"
          >
            {copyStatus === "success" ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Đã sao chép mã mời!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[2]" />
                <span>Sao chép mã mời</span>
              </>
            )}
          </Button>

          {/* Copy feedback message */}
          {copyStatus === "success" && (
            <p className="text-xs text-functional-positive font-semibold flex items-center gap-1 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu mã mời vào bộ nhớ tạm. Bạn có thể dán để gửi qua Zalo, Messenger hoặc SMS.</span>
            </p>
          )}

          {copyStatus === "error" && (
            <p className="text-xs text-functional-negative font-medium flex items-center gap-1 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Không thể tự động sao chép. Vui lòng chọn thủ công chuỗi mã ở trên và nhấn phím Ctrl+C.</span>
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline space-y-1.5 text-xs text-text-muted">
          <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
            <Info className="w-4 h-4 text-cerulean shrink-0" />
            <span>Hướng dẫn dành cho bạn bè:</span>
          </div>
          <p className="leading-relaxed">
            Bạn bè sau khi đăng nhập Smart Trip chỉ cần vào mục <strong>Chuyến đi của tôi</strong>, nhấn <strong>“Tham gia bằng mã mời”</strong> và nhập mã trên để được thêm vào danh sách chuyến đi.
          </p>
        </div>

        {/* Boundary Notice */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-border-hairline/80 text-[11px] text-text-muted leading-relaxed">
          <strong>Ranh giới kỹ thuật Giai đoạn 2C.3 (Frontend-only):</strong> Tính năng chia sẻ liên kết trực tiếp, tạo mã QR động tự động và gửi thông báo qua email sẽ được kết nối chính thức khi triển khai API backend. Hệ thống không tự động gửi dữ liệu ra bên ngoài.
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2 border-t border-border-hairline">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
