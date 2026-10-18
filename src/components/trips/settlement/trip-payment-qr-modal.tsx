"use client";

import * as React from "react";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle,
  Copy,
  Download,
  Info,
  QrCode,
  ShieldCheck,
  X,
} from "lucide-react";
import { SettlementTransfer, PaymentMethod } from "@/types/settlement";
import { TripMember } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";
import { MOCK_MEMBER_BANK_INFO } from "@/lib/mock/settlement";

interface TripPaymentQrModalProps {
  isOpen: boolean;
  transfer: SettlementTransfer | null;
  members: TripMember[];
  tripName: string;
  isProxy?: boolean;
  onClose: () => void;
  onConfirmPaid: (transferId: string, method: PaymentMethod, note?: string) => void;
}

export function TripPaymentQrModal({
  isOpen,
  transfer,
  members,
  tripName,
  isProxy = false,
  onClose,
  onConfirmPaid,
}: TripPaymentQrModalProps) {
  const fromMember = members.find((m) => m.id === transfer?.fromMemberId);
  const toMember = members.find((m) => m.id === transfer?.toMemberId);
  const fromName = fromMember?.name || "Thành viên";
  const toName = toMember?.name || "Thành viên";

  const bankInfo = transfer ? MOCK_MEMBER_BANK_INFO[transfer.toMemberId] : undefined;
  const hasBankInfo = !!bankInfo;

  const [userSelectedMethod, setUserSelectedMethod] = React.useState<PaymentMethod | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);
  const [proofNote, setProofNote] = React.useState("");

  const method: PaymentMethod = !hasBankInfo
    ? "CASH"
    : userSelectedMethod ?? "BANK_TRANSFER";

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transfer) return null;

  const defaultTransferMemo = `ST ${tripName.replace(/[^a-zA-Z0-9]/g, "")} ${fromName.slice(0, 10)}`;

  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleDownloadQr = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleSubmit = () => {
    onConfirmPaid(transfer.id, method, proofNote || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="relative w-full max-w-[640px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.25)] flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-divider-border/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-lime-cream text-yale-blue">
                <QrCode className="w-5 h-5 text-yale-blue" />
              </span>
              <h2
                id="payment-modal-title"
                className="font-headline-h2 text-headline-h2 text-yale-blue tracking-tight text-xl font-bold"
              >
                {isProxy
                  ? `Trả hộ cho ${fromName}`
                  : `Thanh toán cho ${toName}`}
              </h2>
            </div>
            <p className="font-label-default text-xs text-text-muted mt-1 ml-10">
              Chuyến đi: {tripName} • Bù trừ công nợ nhóm
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-6 pt-4 pb-1">
          <div className="p-1 bg-bg-canvas rounded-full flex items-center border border-divider-border/80 w-full">
            <button
              type="button"
              disabled={!hasBankInfo}
              onClick={() => setUserSelectedMethod("BANK_TRANSFER")}
              className={`flex-1 py-2 px-4 rounded-full font-label-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                method === "BANK_TRANSFER"
                  ? "bg-cerulean text-white shadow-sm"
                  : "text-text-muted hover:text-yale-blue disabled:opacity-40 disabled:hover:text-text-muted"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Chuyển khoản (VietQR Demo)</span>
            </button>
            <button
              type="button"
              onClick={() => setUserSelectedMethod("CASH")}
              className={`flex-1 py-2 px-4 rounded-full font-label-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                method === "CASH"
                  ? "bg-cerulean text-white shadow-sm"
                  : "text-text-muted hover:text-yale-blue"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tiền mặt</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          {/* Method: BANK_TRANSFER (VietQR) */}
          {method === "BANK_TRANSFER" && hasBankInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
              {/* Left Column: QR Code Visual */}
              <div className="sm:col-span-5 bg-bg-canvas border border-divider-border rounded-[20px] p-4 flex flex-col items-center text-center shadow-sm">
                <div className="relative bg-white p-2.5 rounded-xl border border-divider-border/70 shadow-[0_2px_8px_rgba(24,78,119,0.06)]">
                  {/* Inline SVG VietQR Representation */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 280 280"
                    width="180"
                    height="180"
                    fill="none"
                    className="mx-auto block rounded-lg"
                    aria-label="Minh họa VietQR Demo"
                  >
                    <rect width="280" height="280" rx="16" fill="#FFFFFF" />
                    <rect
                      x="12"
                      y="12"
                      width="256"
                      height="256"
                      rx="12"
                      fill="#F4F9EC"
                      stroke="#DDEBD0"
                      strokeWidth="1.5"
                    />
                    {/* Top-Left Corner */}
                    <rect x="32" y="32" width="56" height="56" rx="8" fill="#184E77" />
                    <rect x="40" y="40" width="40" height="40" rx="4" fill="#FFFFFF" />
                    <rect x="48" y="48" width="24" height="24" rx="3" fill="#1A759F" />
                    {/* Top-Right Corner */}
                    <rect x="192" y="32" width="56" height="56" rx="8" fill="#184E77" />
                    <rect x="200" y="40" width="40" height="40" rx="4" fill="#FFFFFF" />
                    <rect x="208" y="48" width="24" height="24" rx="3" fill="#1A759F" />
                    {/* Bottom-Left Corner */}
                    <rect x="32" y="192" width="56" height="56" rx="8" fill="#184E77" />
                    <rect x="40" y="200" width="40" height="40" rx="4" fill="#FFFFFF" />
                    <rect x="48" y="208" width="24" height="24" rx="3" fill="#1A759F" />
                    {/* Pattern Dots */}
                    <g fill="#184E77">
                      <rect x="100" y="32" width="12" height="12" rx="2" />
                      <rect x="116" y="32" width="12" height="12" rx="2" />
                      <rect x="144" y="32" width="12" height="12" rx="2" />
                      <rect x="168" y="32" width="12" height="12" rx="2" />
                      <rect x="100" y="48" width="24" height="12" rx="2" />
                      <rect x="136" y="48" width="12" height="24" rx="2" />
                      <rect x="160" y="48" width="20" height="12" rx="2" />
                      <rect x="100" y="72" width="12" height="12" rx="2" />
                      <rect x="124" y="68" width="12" height="12" rx="2" />
                      <rect x="152" y="72" width="24" height="12" rx="2" />
                      <rect x="32" y="100" width="12" height="24" rx="2" />
                      <rect x="52" y="100" width="20" height="12" rx="2" />
                      <rect x="80" y="100" width="12" height="12" rx="2" />
                      <rect x="104" y="96" width="16" height="16" rx="2" />
                      <rect x="128" y="100" width="24" height="12" rx="2" />
                      <rect x="164" y="96" width="16" height="16" rx="2" />
                      <rect x="192" y="100" width="24" height="12" rx="2" />
                      <rect x="228" y="100" width="20" height="24" rx="2" />
                      <rect x="32" y="132" width="24" height="12" rx="2" />
                      <rect x="68" y="124" width="12" height="20" rx="2" />
                      <rect x="88" y="132" width="12" height="12" rx="2" />
                      <rect x="180" y="124" width="24" height="12" rx="2" />
                      <rect x="216" y="132" width="12" height="24" rx="2" />
                      <rect x="32" y="156" width="12" height="24" rx="2" />
                      <rect x="56" y="152" width="24" height="12" rx="2" />
                      <rect x="92" y="156" width="12" height="24" rx="2" />
                      <rect x="176" y="148" width="16" height="24" rx="2" />
                      <rect x="204" y="164" width="20" height="12" rx="2" />
                      <rect x="236" y="156" width="12" height="24" rx="2" />
                      <rect x="100" y="184" width="16" height="16" rx="2" />
                      <rect x="124" y="180" width="24" height="12" rx="2" />
                      <rect x="156" y="184" width="20" height="20" rx="2" />
                      <rect x="188" y="188" width="12" height="12" rx="2" />
                      <rect x="212" y="188" width="36" height="12" rx="2" />
                      <rect x="100" y="208" width="24" height="12" rx="2" />
                      <rect x="132" y="204" width="16" height="24" rx="2" />
                      <rect x="160" y="216" width="24" height="12" rx="2" />
                      <rect x="196" y="208" width="12" height="24" rx="2" />
                      <rect x="220" y="212" width="28" height="16" rx="2" />
                      <rect x="100" y="232" width="12" height="16" rx="2" />
                      <rect x="120" y="236" width="28" height="12" rx="2" />
                      <rect x="156" y="236" width="12" height="12" rx="2" />
                      <rect x="176" y="232" width="20" height="16" rx="2" />
                      <rect x="208" y="236" width="40" height="12" rx="2" />
                    </g>
                    {/* Center Pin Badge */}
                    <rect
                      x="110"
                      y="110"
                      width="60"
                      height="60"
                      rx="12"
                      fill="#FFFFFF"
                      stroke="#DDEBD0"
                      strokeWidth="2"
                    />
                    <rect x="115" y="115" width="50" height="50" rx="8" fill="#1A759F" />
                    <path
                      d="M140 126C134.477 126 130 130.477 130 136C130 143.5 140 154 140 154C140 154 150 143.5 150 136C150 130.477 145.523 126 140 126ZM140 139C138.343 139 137 137.657 137 136C137 134.343 138.343 133 140 133C141.657 133 143 134.343 143 136C143 137.657 141.657 139 140 139Z"
                      fill="#D9ED92"
                    />
                  </svg>
                  <span className="absolute top-1 right-1 text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded border border-amber-300">
                    DEMO
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-yale-blue">
                  VietQR Napas 24/7 (Minh họa)
                </p>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full mt-2.5 h-[36px] rounded-lg bg-surface-card border border-cerulean text-cerulean font-label-semibold text-xs hover:bg-hover-row transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-functional-positive" />
                      <span className="text-functional-positive">Đã lưu ảnh demo</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Tải ảnh QR</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Account Details */}
              <div className="sm:col-span-7 flex flex-col gap-3">
                {/* Amount Box */}
                <div className="bg-gradient-to-br from-bg-canvas to-surface-card border border-divider-border rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-text-muted font-label-default text-xs mb-0.5">
                    <span>Số tiền cần chuyển</span>
                    <span className="px-2 py-0.5 rounded-md bg-functional-warning-bg text-functional-warning text-[10px] font-semibold">
                      Chính xác
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yale-blue tabular-nums">
                    {formatVnd(transfer.amount)}
                  </div>
                </div>

                {/* Bank Card */}
                <div className="bg-[#F9FBF6] border border-divider-border rounded-[16px] p-3.5 space-y-2.5">
                  {/* Bank */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60 text-xs">
                    <span className="text-text-muted font-medium">Ngân hàng</span>
                    <span className="font-semibold text-yale-blue">
                      {bankInfo.bankName}
                    </span>
                  </div>

                  {/* STK */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60 text-xs">
                    <div>
                      <span className="text-text-muted font-medium block">Số tài khoản</span>
                      <span className="font-bold text-sm text-yale-blue tracking-wide tabular-nums">
                        {bankInfo.accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.accountNumber, "stk")}
                      className="px-2.5 py-1 rounded-lg bg-surface-card border border-divider-border text-cerulean hover:bg-hover-row font-semibold text-xs flex items-center gap-1 transition-all shadow-xs"
                    >
                      {copiedField === "stk" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-functional-positive" />
                          <span className="text-functional-positive">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Name */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60 text-xs">
                    <span className="text-text-muted font-medium">Chủ tài khoản</span>
                    <span className="font-bold text-yale-blue uppercase tracking-wide">
                      {bankInfo.accountHolder}
                    </span>
                  </div>

                  {/* Transfer Note */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-text-muted font-medium block">Nội dung CK</span>
                      <span className="font-semibold text-yale-blue text-xs">
                        {defaultTransferMemo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(defaultTransferMemo, "memo")}
                      className="px-2.5 py-1 rounded-lg bg-surface-card border border-divider-border text-cerulean hover:bg-hover-row font-semibold text-xs flex items-center gap-1 transition-all shadow-xs"
                    >
                      {copiedField === "memo" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-functional-positive" />
                          <span className="text-functional-positive">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Method: Cash */}
          {method === "CASH" && (
            <div className="bg-bg-canvas border border-divider-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-lime-cream text-yale-blue flex items-center justify-center shrink-0">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline-h3 text-base font-bold text-yale-blue">
                    Thanh toán trực tiếp bằng Tiền mặt
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Giao dịch đưa tiền mặt trực tiếp cho{" "}
                    <strong>{toName}</strong>.
                  </p>
                </div>
              </div>

              {!hasBankInfo && (
                <div className="p-3 rounded-xl bg-functional-warning-bg/70 border border-functional-warning/30 flex items-start gap-2 text-xs text-yale-blue">
                  <Info className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
                  <span>
                    <strong>{toName}</strong> là thành viên chưa liên kết tài
                    khoản ngân hàng trong hệ thống demo. Phương thức tiền mặt được đề xuất mặc
                    định.
                  </span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-card border border-divider-border flex items-center justify-between">
                <span className="text-sm text-text-muted font-medium">Số tiền cần giao:</span>
                <span className="text-2xl font-bold text-functional-negative tabular-nums">
                  {formatVnd(transfer.amount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-yale-blue mb-1">
                  Ghi chú đối soát (tùy chọn)
                </label>
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Ví dụ: Đã gửi tiền mặt tại quán cà phê"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-divider-border bg-surface-card focus:outline-none focus:ring-2 focus:ring-cerulean"
                />
              </div>
            </div>
          )}

          {/* Warning disclaimer banner */}
          <div className="bg-functional-warning-bg border border-functional-warning/20 rounded-[12px] p-3 text-xs text-yale-blue flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-functional-warning">
                DỮ LIỆU DEMO GIẢ LẬP — KHÔNG PHẢI GIAO DỊCH THẬT
              </p>
              <p className="text-text-muted mt-0.5">
                Mã VietQR và thông tin ngân hàng hiển thị ở trên là dữ liệu giả lập cho mục
                đích thử nghiệm giao diện. Hệ thống không kết nối ngân hàng thật và không trừ
                tiền trong tài khoản của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-divider-border bg-surface-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-functional-positive" />
            <span className="hidden sm:inline">Quyết toán minh bạch Smart Trip</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-yale-blue font-label-semibold text-xs rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-cerulean hover:bg-baltic-blue active:scale-[0.98] text-white font-label-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {isProxy ? "Xác nhận đã trả hộ" : "Tôi đã thanh toán"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
