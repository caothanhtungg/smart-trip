"use client";

import * as React from "react";
import { X, Copy, Check } from "lucide-react";
import { UserBankInfo } from "@/types/user";

interface ProfileQrZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankInfo: UserBankInfo | null | undefined;
  qrDataUrl?: string | null;
}

export function ProfileQrZoomModal({
  isOpen,
  onClose,
  bankInfo,
  qrDataUrl,
}: ProfileQrZoomModalProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !bankInfo) return null;

  const handleCopyAccount = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bankInfo.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-zoom-title"
    >
      <div className="relative w-full max-w-[400px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.25)] flex flex-col items-center p-6 text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VietQR & Napas header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-divider-border mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg text-yale-blue tracking-tight">VietQR</span>
            <span className="w-2 h-2 rounded-full bg-functional-negative" />
          </div>
          <span className="px-2 py-0.5 rounded bg-bondi-blue/10 text-bondi-blue font-semibold text-xs tracking-wide uppercase">
            NAPAS 247
          </span>
        </div>

        {/* Big QR Matrix / Real Image */}
        <div className="p-3 bg-white rounded-2xl border border-divider-border shadow-inner mb-4 flex items-center justify-center w-60 h-60">
          {qrDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrDataUrl}
              alt="Mã VietQR cá nhân"
              className="w-56 h-56 object-contain rounded-xl select-none"
            />
          ) : (
            <svg
              className="w-56 h-56 text-yale-blue"
              fill="currentColor"
              viewBox="0 0 160 160"
              aria-label="Mã VietQR cá nhân"
            >
              {/* Top Left Marker */}
              <rect x="10" y="10" width="40" height="40" rx="6" fill="#184E77" />
              <rect x="18" y="18" width="24" height="24" rx="3" fill="#FFFFFF" />
              <rect x="24" y="24" width="12" height="12" rx="2" fill="#184E77" />
              {/* Top Right Marker */}
              <rect x="110" y="10" width="40" height="40" rx="6" fill="#184E77" />
              <rect x="118" y="18" width="24" height="24" rx="3" fill="#FFFFFF" />
              <rect x="124" y="24" width="12" height="12" rx="2" fill="#184E77" />
              {/* Bottom Left Marker */}
              <rect x="10" y="110" width="40" height="40" rx="6" fill="#184E77" />
              <rect x="18" y="118" width="24" height="24" rx="3" fill="#FFFFFF" />
              <rect x="24" y="124" width="12" height="12" rx="2" fill="#184E77" />
              {/* Data matrix pattern */}
              <rect x="60" y="12" width="8" height="8" rx="1.5" />
              <rect x="76" y="12" width="16" height="8" rx="1.5" />
              <rect x="60" y="28" width="16" height="8" rx="1.5" />
              <rect x="84" y="28" width="8" height="8" rx="1.5" />
              <rect x="12" y="60" width="8" height="16" rx="1.5" />
              <rect x="28" y="60" width="16" height="8" rx="1.5" />
              <rect x="36" y="76" width="8" height="16" rx="1.5" />
              <rect x="12" y="84" width="16" height="8" rx="1.5" />
              <rect x="60" y="60" width="10" height="10" rx="2" fill="#1A759F" />
              <rect x="76" y="60" width="8" height="18" rx="1.5" />
              <rect x="90" y="60" width="14" height="8" rx="1.5" />
              <rect x="60" y="76" width="10" height="10" rx="2" />
              <rect x="88" y="76" width="16" height="10" rx="2" />
              <rect x="72" y="92" width="14" height="8" rx="1.5" />
              <rect x="112" y="60" width="16" height="8" rx="1.5" />
              <rect x="136" y="60" width="14" height="14" rx="2" />
              <rect x="112" y="76" width="8" height="16" rx="1.5" />
              <rect x="128" y="82" width="22" height="8" rx="1.5" />
              <rect x="60" y="112" width="8" height="16" rx="1.5" />
              <rect x="76" y="112" width="14" height="8" rx="1.5" />
              <rect x="98" y="112" width="8" height="8" rx="1.5" />
              <rect x="76" y="128" width="16" height="14" rx="2" />
              <rect x="112" y="112" width="16" height="8" rx="1.5" />
              <rect x="136" y="112" width="14" height="18" rx="2" />
              <rect x="112" y="128" width="16" height="14" rx="2" />
              <rect x="136" y="136" width="14" height="14" rx="2" />
              {/* Center Napas Badge */}
              <circle cx="80" cy="80" r="14" fill="#FFFFFF" />
              <circle cx="80" cy="80" r="10" fill="#1A759F" />
            </svg>
          )}
        </div>

        {/* Bank details */}
        <h3 id="qr-zoom-title" className="text-base font-bold text-yale-blue uppercase tracking-wider">
          {bankInfo.accountHolder}
        </h3>
        <p className="text-sm text-text-muted mt-0.5">
          {bankInfo.bankName} • <span className="font-mono font-semibold text-yale-blue">{bankInfo.accountNumber}</span>
        </p>

        {/* Actions: Copy & Download */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`vietqr-${bankInfo.bankName}-${bankInfo.accountHolder}.png`}
              className="h-10 px-4 rounded-xl bg-hover-row text-cerulean font-semibold text-xs hover:bg-lime-cream transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tải ảnh QR</span>
            </a>
          )}
          <button
            type="button"
            onClick={handleCopyAccount}
            className="h-10 px-4 rounded-xl bg-hover-row text-cerulean font-semibold text-xs hover:bg-lime-cream transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-functional-positive" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Đã sao chép STK" : "Sao chép STK"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-cerulean text-on-primary font-semibold text-xs hover:bg-baltic-blue transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

        <p className="text-[11px] text-text-muted/80 mt-3 pt-3 border-t border-divider-border w-full">
          Mã VietQR Napas 247 chính thức • Quét chuyển nhanh bằng app ngân hàng bất kỳ
        </p>
      </div>
    </div>
  );
}
