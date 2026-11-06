"use client";

import * as React from "react";
import { Check, Copy, MessageSquare, Sparkles, X } from "lucide-react";
import { SettlementTransfer } from "@/types/settlement";
import { TripMember } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";
import { MOCK_MEMBER_BANK_INFO } from "@/lib/mock/settlement";

interface TripDebtReminderModalProps {
  isOpen: boolean;
  transfer: SettlementTransfer | null;
  members: TripMember[];
  tripName: string;
  onClose: () => void;
  onCopied?: () => void;
}

type ToneType = "POLITE" | "CASUAL" | "SHORT_QR";

export function TripDebtReminderModal({
  isOpen,
  transfer,
  members,
  tripName,
  onClose,
  onCopied,
}: TripDebtReminderModalProps) {
  const [tone, setTone] = React.useState<ToneType>("POLITE");
  const [copied, setCopied] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState<string | null>(null);

  const fromMember = members.find((m) => m.id === transfer?.fromMemberId);
  const toMember = members.find((m) => m.id === transfer?.toMemberId);
  const fromName = fromMember?.name || "Thành viên";
  const toName = toMember?.name || "Thành viên";

  const bankInfo = transfer ? MOCK_MEMBER_BANK_INFO[transfer.toMemberId] : undefined;

  const defaultMessages: Record<ToneType, string> = React.useMemo(() => {
    if (!transfer) return { POLITE: "", CASUAL: "", SHORT_QR: "" };
    const amountStr = formatVnd(transfer.amount);
    const debtor = fromName;
    const creditor = toName;
    const bankDetails = bankInfo
      ? ` • ${bankInfo.bankName} - STK: ${bankInfo.accountNumber}`
      : "";

    return {
      POLITE: `Chào ${debtor}, chuyến đi ${tripName} đã chốt sổ chi tiêu. Khoản cần chuyển của bạn cho ${creditor} là ${amountStr}${bankDetails}. Nhờ bạn sắp xếp thanh toán sớm giúp nhóm nhé! Cảm ơn bạn 🌿💳`,
      CASUAL: `Alo ${debtor} ơi! Chuyến ${tripName} đã chốt sổ rồi nè. Phần bạn gửi lại ${creditor} là ${amountStr}${bankDetails} nha. Rảnh tay chuyển sớm giùm mình để tất toán nha! Cảm ơn bạn nhiều 🥳✨`,
      SHORT_QR: `[Smart Trip] ${tripName} - Tất toán công nợ: ${debtor} chuyển cho ${creditor} số tiền ${amountStr}${bankDetails}. Nội dung CK: ${debtor} chuyen tien ${tripName}. Cảm ơn bạn! ⚡`,
    };
  }, [transfer, tripName, bankInfo, fromName, toName]);

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

  const activeMessage = customMessage ?? defaultMessages[tone];

  const handleCopyMessage = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      if (onCopied) onCopied();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="relative w-full max-w-[560px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.22)] flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Brand Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-lime-cream via-ocean-mist to-cerulean" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-divider-border/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-cerulean shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5 text-cerulean" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="reminder-modal-title"
                  className="font-headline-h3 text-lg font-bold text-yale-blue leading-snug"
                >
                  Nhắc nợ thân thiện
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-lime-cream/60 text-yale-blue">
                  Zalo & Tin nhắn
                </span>
              </div>
              <p className="font-label-default text-xs text-text-muted mt-0.5">
                Gửi tới{" "}
                <strong className="text-yale-blue">{fromName}</strong> •
                Số tiền:{" "}
                <span className="font-semibold text-functional-negative tabular-nums">
                  {formatVnd(transfer.amount)}
                </span>
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

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Tone Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[11px] tracking-wider text-text-muted uppercase">
                CHỌN TONE GIỌNG NHẮC NỢ
              </span>
              <span className="text-[11px] text-cerulean flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" />
                Mẫu soạn sẵn
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Card 1: Lịch sự */}
              <button
                type="button"
                onClick={() => {
                  setTone("POLITE");
                  setCustomMessage(null);
                }}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${tone === "POLITE"
                  ? "border-cerulean bg-surface-container-low shadow-xs ring-1 ring-cerulean"
                  : "border-divider-border bg-surface-card hover:bg-hover-row"
                  }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl">🤝</span>
                  {tone === "POLITE" && (
                    <div className="w-4 h-4 rounded-full bg-cerulean text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-yale-blue">Lịch sự</div>
                  <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                    Nhã nhặn, rõ ràng
                  </div>
                </div>
              </button>

              {/* Card 2: Thân mật */}
              <button
                type="button"
                onClick={() => {
                  setTone("CASUAL");
                  setCustomMessage(null);
                }}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${tone === "CASUAL"
                  ? "border-cerulean bg-surface-container-low shadow-xs ring-1 ring-cerulean"
                  : "border-divider-border bg-surface-card hover:bg-hover-row"
                  }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl">🥳</span>
                  {tone === "CASUAL" && (
                    <div className="w-4 h-4 rounded-full bg-cerulean text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-yale-blue">Vui vẻ</div>
                  <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                    Thân mật, gần gũi
                  </div>
                </div>
              </button>

              {/* Card 3: Súc tích */}
              <button
                type="button"
                onClick={() => {
                  setTone("SHORT_QR");
                  setCustomMessage(null);
                }}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${tone === "SHORT_QR"
                  ? "border-cerulean bg-surface-container-low shadow-xs ring-1 ring-cerulean"
                  : "border-divider-border bg-surface-card hover:bg-hover-row"
                  }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl">⚡</span>
                  {tone === "SHORT_QR" && (
                    <div className="w-4 h-4 rounded-full bg-cerulean text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-yale-blue">Súc tích + STK</div>
                  <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                    Đầy đủ thông tin CK
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Preview Bubble */}
          <div className="bg-surface-card rounded-xl border border-divider-border p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-yale-blue flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#0068FF] text-white text-[9px] font-bold">
                  Z
                </span>
                Nội dung tin nhắn
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-hover-row text-cerulean">
                {tone === "POLITE"
                  ? "Phong cách: Lịch sự"
                  : tone === "CASUAL"
                    ? "Phong cách: Vui vẻ"
                    : "Phong cách: Súc tích"}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={activeMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-bg-canvas border border-divider-border text-text-body text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-cerulean resize-none"
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-text-muted">
              <span>{activeMessage.length} ký tự</span>
              <span>Có thể chỉnh sửa trực tiếp nội dung</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-divider-border bg-surface-card flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:text-yale-blue font-label-semibold text-xs rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-5 py-2.5 bg-cerulean hover:bg-baltic-blue active:scale-[0.98] text-white font-label-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-lime-cream" />
                <span>Đã sao chép tin nhắn</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép tin nhắn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
