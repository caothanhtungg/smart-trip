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
  Loader2,
  QrCode,
  ShieldCheck,
  X,
} from "lucide-react";
import { SettlementTransfer, PaymentMethod } from "@/types/settlement";
import { TripMember } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";
import {
  fetchTransferPaymentInfo,
  type ApiTransferPaymentInfoDto,
} from "@/lib/services/settlement-api";
import { MOCK_MEMBER_BANK_INFO } from "@/lib/mock/settlement";

interface TripPaymentQrModalProps {
  isOpen: boolean;
  transfer: SettlementTransfer | null;
  tripId?: string;
  members: TripMember[];
  tripName: string;
  isProxy?: boolean;
  onClose: () => void;
  onConfirmPaid: (transferId: string, method: PaymentMethod, note?: string) => void;
}

export function TripPaymentQrModal({
  isOpen,
  transfer,
  tripId,
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

  // State for real payment info result (cached by transferId)
  const [paymentInfoResult, setPaymentInfoResult] = React.useState<{
    transferId: string;
    data: ApiTransferPaymentInfoDto;
  } | null>(null);

  const [paymentInfoErrorState, setPaymentInfoErrorState] = React.useState<{
    transferId: string;
    message: string;
    isBankMissing: boolean;
  } | null>(null);

  const transferId = transfer?.id;

  // Derived state (no synchronous setState inside effect needed)
  const paymentInfo =
    paymentInfoResult && paymentInfoResult.transferId === transferId
      ? paymentInfoResult.data
      : null;
  const paymentInfoError =
    paymentInfoErrorState && paymentInfoErrorState.transferId === transferId
      ? paymentInfoErrorState.message
      : null;
  const hasNoBank =
    paymentInfoErrorState && paymentInfoErrorState.transferId === transferId
      ? paymentInfoErrorState.isBankMissing
      : false;

  const isLoadingPaymentInfo = !!(
    isOpen &&
    transferId &&
    tripId &&
    !paymentInfo &&
    !paymentInfoError
  );

  // Method selection & interaction state
  const [userSelectedMethod, setUserSelectedMethod] = React.useState<PaymentMethod | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);
  const [proofNote, setProofNote] = React.useState("");

  // Determine if bank transfer is available
  const hasBankInfo = !!paymentInfo || (!tripId && !!(transfer && MOCK_MEMBER_BANK_INFO[transfer.toMemberId]));

  const method: PaymentMethod = hasNoBank || !hasBankInfo
    ? "CASH"
    : userSelectedMethod ?? "BANK_TRANSFER";

  // Fetch real payment info when modal opens
  React.useEffect(() => {
    if (!isOpen || !transferId || !tripId) {
      return;
    }

    let isMounted = true;

    fetchTransferPaymentInfo(tripId, transferId)
      .then((data) => {
        if (!isMounted) return;
        setPaymentInfoResult({ transferId, data });
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Không thể tải thông tin thanh toán.";
        setPaymentInfoErrorState({
          transferId,
          message: msg,
          isBankMissing: err?.code === "RECIPIENT_BANK_INFO_MISSING",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, transferId, tripId]);

  // Handle keyboard Escape
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

  const memo = paymentInfo?.transferMemo || `ST ${tripName.replace(/[^a-zA-Z0-9]/g, "")} ${fromName.slice(0, 10)}`;
  const displayAmount = paymentInfo?.amount ?? transfer.amount;
  const displayRecipient = paymentInfo?.recipientName || toName;
  const displayBankName = paymentInfo?.bankName || "Tài khoản ngân hàng";
  const displayAccountMasked = paymentInfo?.bankAccountMasked || "****";

  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (paymentInfo?.qrDataUrl) {
      const a = document.createElement("a");
      a.href = paymentInfo.qrDataUrl;
      a.download = `vietqr_transfer_${transfer.id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-6 pt-4 pb-1">
          <div className="p-1 bg-bg-canvas rounded-full flex items-center border border-divider-border/80 w-full">
            <button
              type="button"
              disabled={hasNoBank || (!isLoadingPaymentInfo && !hasBankInfo)}
              onClick={() => setUserSelectedMethod("BANK_TRANSFER")}
              className={`flex-1 py-2 px-4 rounded-full font-label-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                method === "BANK_TRANSFER"
                  ? "bg-cerulean text-white shadow-sm"
                  : "text-text-muted hover:text-yale-blue disabled:opacity-40 disabled:hover:text-text-muted disabled:cursor-not-allowed"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Chuyển khoản VietQR</span>
            </button>
            <button
              type="button"
              onClick={() => setUserSelectedMethod("CASH")}
              className={`flex-1 py-2 px-4 rounded-full font-label-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
          {/* Loading state */}
          {isLoadingPaymentInfo && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-cerulean animate-spin" />
              <p className="text-xs font-semibold text-yale-blue">
                Đang giải mã thông tin an toàn & tạo mã VietQR...
              </p>
              <p className="text-[11px] text-text-muted max-w-[280px]">
                Số tài khoản được giải mã ở server và bảo vệ tuyệt đối theo chuẩn AES-256.
              </p>
            </div>
          )}

          {/* Error Banner when payment info fails */}
          {!isLoadingPaymentInfo && paymentInfoError && (
            <div className="p-4 rounded-2xl bg-functional-warning-bg/90 border border-functional-warning/30 flex items-start gap-3 text-xs text-yale-blue">
              <AlertTriangle className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-functional-warning">
                  {hasNoBank
                    ? "Người nhận chưa thiết lập tài khoản ngân hàng"
                    : "Không thể lấy thông tin thanh toán VietQR"}
                </p>
                <p className="text-text-muted leading-relaxed">
                  {paymentInfoError}
                </p>
                <p className="text-cerulean font-medium pt-1">
                  Đã tự động chuyển sang phương thức <strong>Tiền mặt</strong> để bạn tiếp tục đối soát.
                </p>
              </div>
            </div>
          )}

          {/* Method: BANK_TRANSFER (VietQR) */}
          {!isLoadingPaymentInfo && method === "BANK_TRANSFER" && paymentInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
              {/* Left Column: QR Code Visual */}
              <div className="sm:col-span-5 bg-bg-canvas border border-divider-border rounded-[20px] p-4 flex flex-col items-center text-center shadow-sm">
                <div className="relative bg-white p-2.5 rounded-xl border border-divider-border/70 shadow-[0_2px_8px_rgba(24,78,119,0.06)]">
                  {/* Real Scannable VietQR Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentInfo.qrDataUrl}
                    alt={`Mã VietQR thanh toán cho ${displayRecipient}`}
                    width={180}
                    height={180}
                    className="mx-auto block rounded-lg select-none"
                  />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-functional-positive" />
                  <span className="font-medium">Napas 247 • VietQR chuẩn</span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-surface-card border border-divider-border hover:bg-hover-row text-xs font-semibold text-cerulean flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-functional-positive" />
                      <span className="text-functional-positive">Đã tải ảnh về máy</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải ảnh mã QR</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Bank Details & Transfer Information */}
              <div className="sm:col-span-7 space-y-3">
                <div className="bg-bg-canvas border border-divider-border rounded-[18px] p-4 space-y-2.5 text-xs">
                  {/* Ngân hàng */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60">
                    <span className="text-text-muted font-medium">Ngân hàng thụ hưởng</span>
                    <span className="font-bold text-yale-blue text-right">
                      {displayBankName}
                    </span>
                  </div>

                  {/* Số tài khoản (Masked) */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60">
                    <div>
                      <span className="text-text-muted font-medium block">Số tài khoản</span>
                      <span className="font-mono font-bold text-yale-blue text-sm tracking-wider">
                        {displayAccountMasked}
                      </span>
                    </div>
                  </div>

                  {/* Tên người nhận */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60">
                    <span className="text-text-muted font-medium">Chủ tài khoản</span>
                    <span className="font-bold text-yale-blue uppercase">
                      {displayRecipient}
                    </span>
                  </div>

                  {/* Số tiền */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider-border/60">
                    <span className="text-text-muted font-medium">Số tiền quyết toán</span>
                    <span className="font-bold text-base text-functional-negative tabular-nums">
                      {formatVnd(displayAmount)}
                    </span>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <span className="text-text-muted font-medium block">Nội dung CK</span>
                      <span className="font-mono font-bold text-yale-blue text-xs">
                        {memo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(memo, "memo")}
                      className="px-2.5 py-1 rounded-lg bg-surface-card border border-divider-border text-cerulean hover:bg-hover-row font-semibold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
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

                <p className="text-[11px] text-text-muted leading-relaxed px-1">
                  Mở ứng dụng ngân hàng và quét mã QR để điền tự động người nhận, số tiền và nội dung chuyển khoản.
                </p>
              </div>
            </div>
          )}

          {/* Method: Cash */}
          {!isLoadingPaymentInfo && method === "CASH" && (
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

              {hasNoBank && (
                <div className="p-3 rounded-xl bg-functional-warning-bg/70 border border-functional-warning/30 flex items-start gap-2 text-xs text-yale-blue">
                  <Info className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
                  <span>
                    <strong>{toName}</strong> chưa thiết lập tài khoản ngân hàng trong chuyến đi. Vui lòng thanh toán trực tiếp bằng tiền mặt.
                  </span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-card border border-divider-border flex items-center justify-between">
                <span className="text-sm text-text-muted font-medium">Số tiền cần giao:</span>
                <span className="text-2xl font-bold text-functional-negative tabular-nums">
                  {formatVnd(displayAmount)}
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

          {/* Secure settlement disclaimer */}
          <div className="bg-functional-positive/10 border border-functional-positive/20 rounded-[12px] p-3 text-xs text-yale-blue flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-functional-positive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yale-blue">
                HỆ THỐNG QUYẾT TOÁN MINH BẠCH
              </p>
              <p className="text-text-muted mt-0.5">
                Sau khi chuyển tiền thành công qua ngân hàng hoặc trao tiền mặt, bạn hãy bấm nút{" "}
                <strong>{isProxy ? "Xác nhận đã trả hộ" : "Tôi đã thanh toán"}</strong> bên dưới để cập nhật trạng thái khoản nợ cho nhóm.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-divider-border bg-surface-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-functional-positive" />
            <span className="hidden sm:inline">Quyết toán an toàn Smart Trip</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-yale-blue font-label-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-cerulean hover:bg-baltic-blue active:scale-[0.98] text-white font-label-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
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
