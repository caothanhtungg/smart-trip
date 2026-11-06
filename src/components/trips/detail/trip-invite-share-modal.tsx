"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  QrCode,
  AlertCircle,
  RotateCcw,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { validateInviteCode } from "@/lib/trips/invite-code";
import { generateQrDataUrl } from "@/lib/money/vietqr";

interface TripInviteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripTitle: string;
  inviteCode: string;
  isHost?: boolean;
  onResetInviteCode?: () =>
    | Promise<{ success: boolean; code?: string; message?: string }>
    | { success: boolean; code?: string; message?: string };
}

export function TripInviteShareModal({
  isOpen,
  onClose,
  tripTitle,
  inviteCode,
  isHost = false,
  onResetInviteCode,
}: TripInviteShareModalProps) {
  const [copyCodeStatus, setCopyCodeStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [copyLinkStatus, setCopyLinkStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [confirmRotateOpen, setConfirmRotateOpen] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);

  // QR state (UC34)
  const [qrResult, setQrResult] = React.useState<{ code: string; dataUrl: string } | null>(null);
  const [asyncQrError, setAsyncQrError] = React.useState<{ code: string; message: string } | null>(null);

  // Validate invite code & compute join URL
  const validation = React.useMemo(() => validateInviteCode(inviteCode), [inviteCode]);
  const canonicalCode = validation.normalizedCode || inviteCode;

  // Resolve origin safely (browser origin or environment variable)
  const origin = React.useMemo(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || "";
  }, []);

  const joinUrl = React.useMemo(() => {
    if (!validation.isValid || !canonicalCode) return "";
    return origin ? `${origin}/join/${canonicalCode}` : `/join/${canonicalCode}`;
  }, [validation.isValid, canonicalCode, origin]);

  // Derived QR state without calling setState synchronously in effect
  const isGeneratingQr =
    isOpen &&
    validation.isValid &&
    !!joinUrl &&
    qrResult?.code !== canonicalCode &&
    asyncQrError?.code !== canonicalCode;

  const qrDataUrl = qrResult?.code === canonicalCode ? qrResult.dataUrl : null;

  const qrError = !validation.isValid
    ? validation.error || "Mã mời không đúng định dạng hợp lệ."
    : asyncQrError?.code === canonicalCode
    ? asyncQrError.message
    : null;

  // Generate real QR code for the join link
  React.useEffect(() => {
    if (!isOpen || !validation.isValid || !joinUrl) {
      return;
    }

    let isMounted = true;

    generateQrDataUrl(joinUrl, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!isMounted) return;
        setQrResult({ code: canonicalCode, dataUrl: url });
      })
      .catch((err) => {
        if (!isMounted) return;
        setAsyncQrError({
          code: canonicalCode,
          message: err instanceof Error ? err.message : "Không thể tạo mã QR cho đường dẫn mời.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, joinUrl, canonicalCode, validation.isValid]);

  const handleClose = () => {
    setCopyCodeStatus("idle");
    setCopyLinkStatus("idle");
    setConfirmRotateOpen(false);
    onClose();
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    let success = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        const copyPromise = navigator.clipboard.writeText(text);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 400)
        );
        await Promise.race([copyPromise, timeoutPromise]);
        success = true;
      }
    } catch {
      // Fall through to textarea fallback
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const execSuccess = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (execSuccess) success = true;
      } catch {
        // execCommand fallback failed
      }
    }

    return success;
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(canonicalCode);
    if (success) {
      setCopyCodeStatus("success");
      setTimeout(() => setCopyCodeStatus("idle"), 2500);
    } else {
      setCopyCodeStatus("error");
      setTimeout(() => setCopyCodeStatus("idle"), 3500);
    }
  };

  const handleCopyLink = async () => {
    if (!joinUrl) return;
    const success = await copyToClipboard(joinUrl);
    if (success) {
      setCopyLinkStatus("success");
      setTimeout(() => setCopyLinkStatus("idle"), 2500);
    } else {
      setCopyLinkStatus("error");
      setTimeout(() => setCopyLinkStatus("idle"), 3500);
    }
  };

  const handleConfirmRotate = async () => {
    if (!onResetInviteCode || isRotating) return;
    setIsRotating(true);
    try {
      await onResetInviteCode();
      setConfirmRotateOpen(false);
      // Immediately reset copy statuses
      setCopyCodeStatus("idle");
      setCopyLinkStatus("idle");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mời bạn bè tham gia chuyến đi"
      description={`Chia sẻ mã mời hoặc mã QR cho các thành viên tham gia chuyến đi "${tripTitle}"`}
    >
      <div className="space-y-4 py-2">
        {/* Main Invite Container: QR Code (UC34) + Invite Code Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-lime-cream/25 border border-light-green/70 flex flex-col items-center text-center gap-4">
          {/* 1. Real QR Code Section (UC34) */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <QrCode className="w-4 h-4 text-cerulean" />
              <span>Quét mã QR để vào trang tham gia:</span>
            </div>

            {/* QR Card Container */}
            <div className="relative w-48 h-48 bg-white p-2.5 rounded-2xl border border-border-hairline shadow-sm flex items-center justify-center">
              {isGeneratingQr && (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-3">
                  <Loader2 className="w-6 h-6 text-cerulean animate-spin" />
                  <span className="text-[11px] text-text-muted font-medium">Đang tạo mã QR...</span>
                </div>
              )}

              {!isGeneratingQr && qrDataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt={`Mã QR mời tham gia chuyến đi ${tripTitle}`}
                  width={176}
                  height={176}
                  className="rounded-xl block select-none"
                />
              )}

              {!isGeneratingQr && qrError && (
                <div className="flex flex-col items-center justify-center gap-1 text-center p-3 text-functional-negative">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <span className="text-[11px] font-semibold">{qrError}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-text-muted">
              Dùng camera điện thoại hoặc Zalo để quét và mở link tham gia ngay
            </p>
          </div>

          {/* 2. Direct Join URL Display & Copy */}
          {joinUrl && (
            <div className="w-full bg-surface-card rounded-xl border border-divider-border p-2.5 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 overflow-hidden text-left pl-1">
                <LinkIcon className="w-3.5 h-3.5 text-cerulean shrink-0" />
                <span className="font-mono text-xs text-yale-blue truncate select-all">
                  {joinUrl}
                </span>
              </div>
              <Button
                id="copy-join-link-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 text-xs px-3 py-1 h-8 flex items-center gap-1.5"
              >
                {copyLinkStatus === "success" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-functional-positive stroke-[2.5]" />
                    <span className="text-functional-positive">Đã chép link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép link</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Copy Link Feedback */}
          {copyLinkStatus === "success" && (
            <p className="text-xs text-functional-positive font-semibold flex items-center gap-1 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5" />
              <span>Đã sao chép liên kết tham gia vào bộ nhớ tạm!</span>
            </p>
          )}

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-divider-border/80" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Hoặc nhập mã trực tiếp
            </span>
            <div className="flex-1 h-px bg-divider-border/80" />
          </div>

          {/* 3. Text Invite Code Display Box */}
          <div
            id="trip-invite-code-box"
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-border-hairline shadow-inner select-all font-mono font-extrabold text-xl sm:text-2xl tracking-widest text-yale-blue"
            title="Nhấp đúp hoặc bôi đen để sao chép"
          >
            {canonicalCode}
          </div>

          <Button
            id="copy-invite-code-btn"
            type="button"
            variant="primary"
            size="md"
            onClick={handleCopyCode}
            className="w-full sm:w-auto px-6 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(26,117,159,0.25)]"
          >
            {copyCodeStatus === "success" ? (
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

          {/* Copy code feedback message */}
          {copyCodeStatus === "success" && (
            <p className="text-xs text-functional-positive font-semibold flex items-center gap-1 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu mã mời vào bộ nhớ tạm. Bạn có thể dán để gửi qua Zalo, Messenger hoặc SMS.</span>
            </p>
          )}

          {copyCodeStatus === "error" && (
            <p className="text-xs text-functional-negative font-medium flex items-center gap-1 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Không thể tự động sao chép. Vui lòng chọn thủ công chuỗi mã ở trên và nhấn phím Ctrl+C.</span>
            </p>
          )}
        </div>

        {/* Rotate Invite Code (UC28) - dành riêng cho Trưởng nhóm */}
        {isHost && onResetInviteCode && (
          <div className="p-3.5 rounded-xl bg-hover-row/60 border border-divider-border/80 flex flex-col gap-2">
            {!confirmRotateOpen ? (
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-text-muted">
                  <span className="font-semibold text-yale-blue">Đổi mã mời mới (UC28):</span> Mã cũ và mã QR trước đó sẽ bị vô hiệu hóa ngay lập tức.
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRotateOpen(true)}
                  className="h-8 px-3 rounded-lg bg-surface-card border border-divider-border text-cerulean hover:bg-lime-cream font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đổi mã</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-functional-warning-bg border border-functional-warning/40 flex flex-col gap-2">
                <p className="text-xs text-yale-blue font-medium">
                  Xác nhận đổi mã mời mới? Người dùng đang giữ mã cũ sẽ không thể tham gia chuyến đi nữa.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isRotating}
                    onClick={() => setConfirmRotateOpen(false)}
                    className="h-7 px-2.5 text-xs rounded-md text-text-muted hover:bg-surface-card cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isRotating}
                    onClick={handleConfirmRotate}
                    className="h-7 px-3 text-xs font-semibold rounded-md bg-cerulean text-white hover:bg-baltic-blue flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isRotating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang đổi...</span>
                      </>
                    ) : (
                      <span>Xác nhận đổi</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
