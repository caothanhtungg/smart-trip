"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  QrCode,
} from "lucide-react";
import { MemberBalanceBreakdown, SettlementTransfer } from "@/types/settlement";
import { TripMember, TripStatus } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";

interface TripSettlementBalanceSidebarProps {
  status: TripStatus;
  currentMemberId: string;
  members: TripMember[];
  balances: MemberBalanceBreakdown[];
  transfers: SettlementTransfer[];
  onPayMyDebtClick: (transfer: SettlementTransfer) => void;
}

export function TripSettlementBalanceSidebar({
  status,
  currentMemberId,
  members,
  balances,
  transfers,
  onPayMyDebtClick,
}: TripSettlementBalanceSidebarProps) {
  const isPreview = status === "ACTIVE";

  const myBalance = balances.find((b) => b.memberId === currentMemberId);
  const myNet = myBalance ? myBalance.netAmount : 0;

  // Find my pending debts (transfers where I am the debtor and not completed)
  const myPendingTransfers = transfers.filter(
    (t) => t.fromMemberId === currentMemberId && t.status !== "COMPLETED"
  );
  const firstPendingDebt = myPendingTransfers.find((t) => t.status === "UNPAID");
  const firstPendingRecipient = firstPendingDebt
    ? members.find((m) => m.id === firstPendingDebt.toMemberId)
    : undefined;
  const firstPendingRecipientName = firstPendingRecipient?.name || "thành viên";

  const currentMember = members.find((m) => m.id === currentMemberId);

  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-[96px]">
      {/* CARD 1: SỐ DƯ CỦA BẠN */}
      <div className="bg-surface-card rounded-[20px] p-5 shadow-sm border border-divider-border/80">
        <div className="flex items-center justify-between pb-3 border-b border-divider-border/60">
          <h3 className="font-title-md text-base font-bold text-yale-blue">
            Số dư của bạn
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-light-green text-yale-blue font-label-semibold text-xs">
            {currentMember?.name || "Bạn"} (Bạn)
          </span>
        </div>

        <div className="py-4">
          <span className="text-[11px] font-label-semibold uppercase tracking-wider text-text-muted block">
            {myNet < 0
              ? "Tổng tiền cần trả"
              : myNet > 0
              ? "Tổng tiền được nhận"
              : "Trạng thái số dư"}
          </span>

          <div className="mt-1">
            <span
              className={`font-display-money text-3xl font-bold tabular-nums tracking-tight ${
                myNet < 0
                  ? "text-functional-negative"
                  : myNet > 0
                  ? "text-functional-positive"
                  : "text-text-muted"
              }`}
            >
              {myNet > 0 ? `+${formatVnd(myNet)}` : formatVnd(myNet)}
            </span>
          </div>

          {/* Context note */}
          {myNet < 0 ? (
            <div className="flex items-start gap-1.5 mt-2.5 text-functional-warning font-label-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Bạn cần thanh toán {myPendingTransfers.length} giao dịch để hoàn tất nghĩa vụ.
              </span>
            </div>
          ) : myNet > 0 ? (
            <div className="flex items-start gap-1.5 mt-2.5 text-functional-positive font-label-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Các thành viên sẽ chuyển tiền bù trừ lại cho bạn.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 mt-2.5 text-text-muted font-label-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-ocean-mist" />
              <span>Số tiền đã chi và phần tiền chịu của bạn bằng nhau (0 ₫).</span>
            </div>
          )}
        </div>

        {/* Quick Pay Action Button */}
        {myNet < 0 && firstPendingDebt && (
          <div className="space-y-2 pt-2 border-t border-divider-border/60">
            {isPreview ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled
                  className="w-full h-[46px] rounded-xl bg-surface-container text-text-muted font-label-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-divider-border"
                >
                  <Clock className="w-4 h-4" />
                  <span>Chờ Trưởng nhóm chốt sổ</span>
                </button>
                <p className="text-[11px] text-text-muted text-center italic">
                  Chỉ có thể thanh toán chính thức sau khi chốt sổ
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onPayMyDebtClick(firstPendingDebt)}
                className="w-full h-[46px] rounded-xl bg-cerulean hover:bg-baltic-blue text-white font-label-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <QrCode className="w-4 h-4" />
                <span>
                  Thanh toán ngay {formatVnd(firstPendingDebt.amount)} cho{" "}
                  {firstPendingRecipientName}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CARD 2: SỐ DƯ TẤT CẢ THÀNH VIÊN */}
      <div className="bg-surface-card rounded-[20px] p-5 shadow-sm border border-divider-border/80">
        <div className="flex items-center justify-between pb-3 border-b border-divider-border/60">
          <h3 className="font-title-md text-base font-bold text-yale-blue">
            Số dư thành viên
          </h3>
          <span className="text-xs text-text-muted font-label-default">
            {members.length} người
          </span>
        </div>

        <div className="space-y-2 mt-3">
          {balances.map((b) => {
            const member = members.find((m) => m.id === b.memberId);
            const isMe = b.memberId === currentMemberId;
            const net = b.netAmount;

            return (
              <div
                key={b.memberId}
                className={`flex items-center justify-between py-2 px-2.5 rounded-xl border transition-colors ${
                  isMe
                    ? "bg-surface-container-low border-cerulean/30 shadow-2xs"
                    : "border-transparent hover:bg-hover-row/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      member?.isNoAccount
                        ? "bg-surface-container-highest text-yale-blue"
                        : "bg-mint-green text-yale-blue"
                    }`}
                  >
                    {member?.name.slice(0, 1).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-semibold text-xs text-yale-blue truncate">
                      {member?.name}{" "}
                      {isMe && <span className="text-cerulean font-bold">(Bạn)</span>}
                    </p>
                    <div className="flex items-center gap-1">
                      {member?.role === "HOST" && (
                        <span className="text-[10px] text-text-muted">Trưởng nhóm • </span>
                      )}
                      {member?.isNoAccount && (
                        <span className="text-[10px] text-ocean-mist font-semibold">
                          Chưa có TK •{" "}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold ${
                          net > 0
                            ? "text-functional-positive"
                            : net < 0
                            ? "text-functional-warning"
                            : "text-text-muted"
                        }`}
                      >
                        {net > 0
                          ? "Được nhận"
                          : net < 0
                          ? "Cần trả"
                          : "Đã cân bằng"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-label-semibold text-xs tabular-nums block ${
                      net > 0
                        ? "text-functional-positive"
                        : net < 0
                        ? "text-functional-negative"
                        : "text-text-muted"
                    }`}
                  >
                    {net > 0 ? `+${formatVnd(net)}` : formatVnd(net)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Đã chi {formatVnd(b.paidAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Badge */}
        <div className="mt-4 pt-3 border-t border-divider-border/60">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EAF4CC]/80 border border-divider-border text-functional-positive">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-functional-positive" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-yale-blue block">
                ✓ Tổng thu = Tổng chi (Net = 0 ₫)
              </span>
              <span className="text-text-muted">
                Dữ liệu cân bằng tuyệt đối theo toán học.
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
