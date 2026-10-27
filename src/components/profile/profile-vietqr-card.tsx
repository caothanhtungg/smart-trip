"use client";

import * as React from "react";
import { QrCode, ZoomIn, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { UserBankInfo } from "@/types/user";
import { buildVietQrPayload, generateQrDataUrl } from "@/lib/money/vietqr";
import { ProfileQrZoomModal } from "./profile-qr-zoom-modal";

interface ProfileVietQrCardProps {
  bankInfo: UserBankInfo | null | undefined;
}

export function ProfileVietQrCard({ bankInfo }: ProfileVietQrCardProps) {
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const [qrState, setQrState] = React.useState<{ key: string; url: string | null }>({
    key: "",
    url: null,
  });

  const cacheKey = bankInfo ? `${bankInfo.bankBin}:${bankInfo.accountNumber}` : "";
  const bankBin = bankInfo?.bankBin;
  const accountNumber = bankInfo?.accountNumber;

  React.useEffect(() => {
    if (!bankBin || !accountNumber) {
      return;
    }

    const currentKey = `${bankBin}:${accountNumber}`;
    const cleanAcc = accountNumber.trim();
    const isMasked = cleanAcc.includes("*");

    let isMounted = true;

    // Case 1: If user is typing an unmasked account number (e.g. >= 6 digits)
    if (!isMasked && cleanAcc.length >= 6 && /^\d+$/.test(cleanAcc)) {
      try {
        const payload = buildVietQrPayload({
          bankBin,
          accountNumber: cleanAcc,
        });
        generateQrDataUrl(payload, { width: 320, margin: 2, errorCorrectionLevel: "M" })
          .then((url) => {
            if (!isMounted) return;
            setQrState({ key: currentKey, url });
          })
          .catch(() => {
            if (!isMounted) return;
            setQrState({ key: currentKey, url: null });
          });
        return;
      } catch {
        // Fall back to server fetch
      }
    }

    // Case 2: Masked account number from DB -> fetch real QR from /api/me/qr
    fetch("/api/me/qr")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted) return;
        if (json?.success && json.data?.qrDataUrl) {
          setQrState({ key: currentKey, url: json.data.qrDataUrl });
        } else {
          setQrState({ key: currentKey, url: null });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setQrState({ key: currentKey, url: null });
      });

    return () => {
      isMounted = false;
    };
  }, [bankBin, accountNumber]);

  const qrDataUrl = qrState.key === cacheKey ? qrState.url : null;
  const isLoadingQr = qrState.key !== cacheKey && !!bankBin && !!accountNumber;

  if (!bankInfo) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-hover-row/50 rounded-2xl border border-dashed border-divider-border text-center min-h-[340px]">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-text-muted shadow-sm mb-3">
          <QrCode className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h4 className="font-semibold text-yale-blue text-sm mb-1">
          Chưa thiết lập tài khoản nhận tiền
        </h4>
        <p className="text-xs text-text-muted max-w-[240px] leading-relaxed mb-3">
          Hãy chọn ngân hàng và nhập số tài khoản bên cạnh để tự động tạo mã VietQR Napas 247 nhận tiền quyết toán.
        </p>
        <span className="text-[11px] text-functional-warning font-medium px-2.5 py-1 rounded-full bg-functional-warning-bg">
          Tạm thời chỉ nhận tiền mặt trong chuyến đi
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-hover-row/80 rounded-2xl shadow-sm border border-divider-border/80">
        <div className="w-full max-w-[280px] bg-surface-card rounded-2xl p-4 shadow-[0_8px_24px_rgba(24,78,119,0.12)] flex flex-col items-center text-center">
          {/* VietQR Header Brands */}
          <div className="w-full flex items-center justify-between pb-2.5 border-b border-divider-border mb-3">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px] text-yale-blue tracking-tight">VietQR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-functional-negative" />
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-bondi-blue/10 text-bondi-blue font-semibold text-[10px] tracking-wide uppercase">
              <CheckCircle2 className="w-3 h-3 text-functional-positive" />
              <span>NAPAS 247</span>
            </div>
          </div>

          {/* QR Code Container with Zoom button */}
          <div
            onClick={() => setZoomOpen(true)}
            className="relative w-44 h-44 bg-surface-card p-2 rounded-xl shadow-inner flex items-center justify-center mb-3 group cursor-pointer border border-border-hairline overflow-hidden"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setZoomOpen(true);
              }
            }}
            aria-label="Bấm để phóng to mã VietQR"
          >
            {isLoadingQr ? (
              <div className="flex flex-col items-center justify-center gap-2 text-text-muted">
                <Loader2 className="w-7 h-7 text-cerulean animate-spin" />
                <span className="text-[11px] font-medium">Đang tạo mã QR...</span>
              </div>
            ) : qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={`Mã VietQR ${bankInfo.bankName} của ${bankInfo.accountHolder}`}
                className="w-full h-full object-contain rounded-lg select-none"
              />
            ) : (
              <svg
                className="w-full h-full text-yale-blue"
                fill="currentColor"
                viewBox="0 0 160 160"
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
                {/* Data dots */}
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
                {/* Center Badge */}
                <circle cx="80" cy="80" r="14" fill="#FFFFFF" />
                <circle cx="80" cy="80" r="10" fill="#1A759F" />
              </svg>
            )}

            {/* Hover overlay for Zoom */}
            <div className="absolute inset-0 bg-yale-blue/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <span className="px-2.5 py-1 bg-surface-card rounded-full font-semibold text-xs text-yale-blue shadow-md flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-cerulean" />
                <span>Phóng to</span>
              </span>
            </div>
          </div>

          {/* Account Details */}
          <div className="flex flex-col items-center">
            <span className="font-bold text-[13px] text-yale-blue tracking-wider uppercase">
              {bankInfo.accountHolder}
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {bankInfo.bankName} • <span className="font-mono font-semibold">{bankInfo.accountNumber}</span>
            </span>
          </div>

          <div className="w-full mt-3 pt-2 border-t border-divider-border text-center">
            <p className="text-[11px] text-functional-positive font-semibold leading-tight">
              ✓ Mã VietQR chính thức • Quét chuyển nhanh qua app mọi ngân hàng &amp; ví điện tử
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-3 flex items-center gap-1.5 text-center text-xs text-text-muted">
          <Lock className="w-3.5 h-3.5 text-functional-positive" />
          <span>Tự động chèn cú pháp: <strong className="text-yale-blue font-semibold">ST TRIP [Mã_Chuyến]</strong></span>
        </div>
      </div>

      <ProfileQrZoomModal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        bankInfo={bankInfo}
        qrDataUrl={qrDataUrl}
      />
    </>
  );
}
