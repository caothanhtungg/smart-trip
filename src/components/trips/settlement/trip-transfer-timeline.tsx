"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  QrCode,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { SettlementTransfer, PaymentMethod } from "@/types/settlement";
import { TripMember } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";

export interface TripTransferTimelineProps {
  transfer: SettlementTransfer;
  members: TripMember[];
  settlementCreatedAt?: string;
  selectedMethod?: PaymentMethod;
  className?: string;
  compact?: boolean;
}

interface TimelineItemData {
  key: string;
  title: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  timeLabel: string;
  isoTime?: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}

function formatTimelineDateTime(isoString?: string | null): {
  timeStr: string;
  dateStr: string;
  iso: string;
} | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  try {
    const timeStr = d.toLocaleTimeString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const dateStr = d.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return {
      timeStr,
      dateStr,
      iso: d.toISOString(),
    };
  } catch {
    return null;
  }
}

export function TripTransferTimeline({
  transfer,
  members,
  settlementCreatedAt,
  selectedMethod,
  className = "",
  compact = false,
}: TripTransferTimelineProps) {
  const fromMember = members.find((m) => m.id === transfer.fromMemberId);
  const toMember = members.find((m) => m.id === transfer.toMemberId);
  const fromName = fromMember?.name || "Người trả";
  const toName = toMember?.name || "Người nhận";

  const effectiveMethod = selectedMethod || transfer.paymentMethod || "BANK_TRANSFER";
  const isPaid = transfer.status === "PAID" || transfer.status === "COMPLETED";
  const isCompleted = transfer.status === "COMPLETED";

  const createdTime = formatTimelineDateTime(settlementCreatedAt);
  const paidTime = formatTimelineDateTime(transfer.paidAt);
  const completedTime = formatTimelineDateTime(transfer.completedAt);

  // Construct the 3 structured timeline events
  const timelineItems: TimelineItemData[] = React.useMemo(() => {
    // 1. CHỐT SỔ / KHỞI TẠO NỢ
    const item1: TimelineItemData = {
      key: "init",
      title: "Chốt sổ & Khởi tạo nợ",
      status: "COMPLETED",
      timeLabel: createdTime ? `${createdTime.timeStr}` : "Đã chốt",
      isoTime: createdTime?.iso,
      description: (
        <span className="text-text-muted leading-relaxed">
          Khoản nợ{" "}
          <strong className="text-yale-blue tabular-nums font-semibold">
            {formatVnd(transfer.amount)}
          </strong>{" "}
          được xác nhận từ sổ chi tiêu nhóm.
        </span>
      ),
      icon: <Check className="w-3 h-3 text-white stroke-[2.5]" />,
    };

    // 2. THANH TOÁN (VIETQR / TIỀN MẶT)
    const methodText =
      effectiveMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản VietQR";
    const MethodIcon = effectiveMethod === "CASH" ? Banknote : QrCode;

    let item2Status: "COMPLETED" | "IN_PROGRESS" | "PENDING" = "IN_PROGRESS";
    let item2Title = `Thanh toán (${methodText})`;
    let item2Time = "Đang thực hiện";
    let item2Description: React.ReactNode = (
      <span className="text-text-muted leading-relaxed">
        {effectiveMethod === "CASH"
          ? `Giao tiền mặt trực tiếp cho ${toName}.`
          : `Quét mã VietQR chuyển tiền cho ${toName}.`}
      </span>
    );
    let item2Icon = (
      <MethodIcon className="w-3 h-3 text-white stroke-[2.2]" />
    );

    if (isPaid) {
      item2Status = "COMPLETED";
      item2Title = `Đã thanh toán (${methodText})`;
      item2Time = paidTime ? paidTime.timeStr : "Đã chuyển";
      item2Description = (
        <span className="text-text-muted leading-relaxed">
          <strong>{fromName}</strong> đã xác nhận hoàn thành giao dịch.
          {transfer.paymentProofNote && (
            <span className="block mt-0.5 text-xs italic text-yale-blue/80 bg-surface-card px-2 py-0.5 rounded border border-divider-border/60">
              Ghi chú: &ldquo;{transfer.paymentProofNote}&rdquo;
            </span>
          )}
        </span>
      );
      item2Icon = <Check className="w-3 h-3 text-white stroke-[2.5]" />;
    }

    const item2: TimelineItemData = {
      key: "payment",
      title: item2Title,
      status: item2Status,
      timeLabel: item2Time,
      isoTime: paidTime?.iso,
      description: item2Description,
      icon: item2Icon,
    };

    // 3. ĐỐI SOÁT & TẤT TOÁN
    let item3Status: "COMPLETED" | "IN_PROGRESS" | "PENDING" = "PENDING";
    let item3Title = "Đối soát & Tất toán";
    let item3Time = "Chờ thanh toán";
    let item3Description: React.ReactNode = (
      <span className="text-text-muted leading-relaxed">
        {toName} sẽ kiểm tra biến động số dư và xác nhận sau khi nhận được tiền.
      </span>
    );
    let item3Icon = (
      <ShieldCheck className="w-3 h-3 text-slate-400 stroke-[2]" />
    );

    if (isCompleted) {
      item3Status = "COMPLETED";
      item3Title = "Đã xác nhận & Tất toán";
      item3Time = completedTime ? completedTime.timeStr : "Hoàn tất";
      item3Description = (
        <span className="text-functional-positive font-medium leading-relaxed flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            {toName} đã xác nhận nhận đủ tiền. Công nợ đã được tất toán 100%.
          </span>
        </span>
      );
      item3Icon = <Check className="w-3 h-3 text-white stroke-[2.5]" />;
    } else if (transfer.status === "PAID") {
      item3Status = "IN_PROGRESS";
      item3Title = "Chờ người nhận đối soát";
      item3Time = "Đang chờ";
      item3Description = (
        <span className="text-amber-700 font-medium leading-relaxed">
          Đang chờ <strong>{toName}</strong> kiểm tra tài khoản và bấm xác nhận
          nhận đủ tiền.
        </span>
      );
      item3Icon = <Clock className="w-3 h-3 text-white stroke-[2.5]" />;
    }

    const item3: TimelineItemData = {
      key: "settlement",
      title: item3Title,
      status: item3Status,
      timeLabel: item3Time,
      isoTime: completedTime?.iso,
      description: item3Description,
      icon: item3Icon,
    };

    return [item1, item2, item3];
  }, [
    createdTime,
    paidTime,
    completedTime,
    effectiveMethod,
    fromName,
    isCompleted,
    isPaid,
    toName,
    transfer.amount,
    transfer.paymentProofNote,
    transfer.status,
  ]);

  return (
    <ol
      role="list"
      aria-label="Tiến trình xác nhận thanh toán và đối soát công nợ"
      className={`relative list-none m-0 p-0 space-y-3 sm:space-y-4 ${className}`}
    >
      {timelineItems.map((item, index) => {
        const isLast = index === timelineItems.length - 1;

        // Styling based on status
        const isDone = item.status === "COMPLETED";
        const isInProgress = item.status === "IN_PROGRESS";

        let dotBg = "bg-slate-200 text-slate-500 border border-slate-300";
        if (isDone) {
          dotBg =
            index === 2
              ? "bg-[#52B69A] text-white shadow-2xs"
              : "bg-[#184E77] text-white shadow-2xs";
        } else if (isInProgress) {
          dotBg =
            index === 2
              ? "bg-amber-500 text-white ring-4 ring-amber-400/25 animate-pulse shadow-sm"
              : "bg-[#1A759F] text-white ring-4 ring-[#1A759F]/25 animate-pulse shadow-sm";
        }

        return (
          <li
            key={item.key}
            role="listitem"
            className="relative flex items-start group/item list-none"
          >
            {/* TimelineOppositeContent: Cột thời gian bên trái với chiều rộng cố định (tránh xô lệch pixel trục dọc) */}
            <div
              className={`${
                compact ? "w-16 sm:w-20" : "w-20 sm:w-24"
              } shrink-0 text-right pr-3 sm:pr-4 pt-0.5`}
            >
              {item.isoTime ? (
                <time
                  dateTime={item.isoTime}
                  className="font-mono text-[11px] sm:text-xs font-semibold text-text-muted block tabular-nums"
                >
                  {item.timeLabel}
                </time>
              ) : (
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold block uppercase tracking-tight ${
                    isInProgress
                      ? "text-cerulean font-bold"
                      : isDone
                      ? "text-yale-blue"
                      : "text-text-muted/70"
                  }`}
                >
                  {item.timeLabel}
                </span>
              )}
            </div>

            {/* Trục giữa: Dot + Connector line (mỗi item tự sở hữu connector nối xuống dot tiếp theo) */}
            <div className="relative flex flex-col items-center shrink-0">
              {/* TimelineDot: Vòng tròn chỉ thị trạng thái */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center z-10 transition-transform group-hover/item:scale-110 ${dotBg}`}
                aria-label={`Bước ${index + 1}: ${item.title}`}
              >
                {item.icon}
              </div>

              {/* TimelineConnector: Đoạn đường kẻ dọc nối từ bên dưới dot đến dot tiếp theo, tự ngắt ở item cuối */}
              {!isLast && (
                <div
                  className={`w-[2px] absolute top-5 bottom-[-14px] sm:bottom-[-16px] left-1/2 -translate-x-1/2 z-0 transition-colors ${
                    isDone
                      ? "bg-[#52B69A]/60"
                      : "bg-divider-border/90 group-hover/item:bg-cerulean/40"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* TimelineContent: Nội dung bên phải (Tiêu đề + Mô tả chi tiết) */}
            <div className="flex-1 pl-3 sm:pl-4 pt-0.5 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h5
                  className={`text-xs sm:text-sm font-bold tracking-tight ${
                    isDone
                      ? "text-yale-blue"
                      : isInProgress
                      ? "text-cerulean"
                      : "text-text-muted"
                  }`}
                >
                  {item.title}
                </h5>
                {isInProgress && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cerulean/10 text-cerulean border border-cerulean/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-cerulean animate-ping" />
                    Đang xử lý
                  </span>
                )}
                {isDone && index === 2 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-lime-cream text-yale-blue border border-emerald/30">
                    Hoàn tất
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs mt-0.5">
                {item.description}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

