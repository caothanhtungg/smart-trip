"use client";

import * as React from "react";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock,
  HandCoins,
  QrCode,
  UserCheck,
} from "lucide-react";
import { SettlementTransfer } from "@/types/settlement";
import { TripMember, TripStatus } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";

interface TripSettlementTableProps {
  status: TripStatus;
  transfers: SettlementTransfer[];
  currentMemberId: string;
  isHost: boolean;
  members: TripMember[];
  onPayClick: (transfer: SettlementTransfer) => void;
  onRemindClick: (transfer: SettlementTransfer) => void;
  onConfirmReceivedClick: (transfer: SettlementTransfer) => void;
  onProxyPayClick: (transfer: SettlementTransfer) => void;
  onProxyReceiveClick: (transfer: SettlementTransfer) => void;
}

export function TripSettlementTable({
  status,
  transfers,
  currentMemberId,
  isHost,
  members,
  onPayClick,
  onRemindClick,
  onConfirmReceivedClick,
  onProxyPayClick,
  onProxyReceiveClick,
}: TripSettlementTableProps) {
  const isPreview = status === "ACTIVE";

  const unpaidCount = transfers.filter((t) => t.status !== "COMPLETED").length;

  return (
    <div className="bg-surface-card rounded-[20px] p-5 md:p-6 shadow-sm border border-divider-border/80">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-divider-border/60">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-headline-h3 text-lg md:text-xl font-bold text-yale-blue">
            Ai trả ai bao nhiêu
          </h2>
          <span
            className={`px-2.5 py-0.5 rounded-full font-label-semibold text-xs border ${
              unpaidCount > 0
                ? "bg-functional-warning-bg text-functional-warning border-functional-warning/20"
                : "bg-lime-cream text-yale-blue border-emerald/30"
            }`}
          >
            {unpaidCount > 0
              ? `${unpaidCount} giao dịch cần xử lý`
              : "Tất cả đã hoàn tất"}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {transfers.length === 0 ? (
        <div className="py-12 text-center text-text-muted space-y-2">
          <CheckCircle2 className="w-12 h-12 mx-auto text-ocean-mist/60" />
          <p className="font-semibold text-yale-blue text-sm">
            Không có công nợ nào cần thanh toán!
          </p>
          <p className="text-xs">
            Chi phí của chuyến đi đã được chia đều hoàn hảo hoặc chưa có khoản chi nào.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP / TABLET TABLE (hidden on small mobile) */}
          <div className="hidden sm:block w-full overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-11 bg-surface-container-low text-text-muted font-label-semibold text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-4 rounded-l-lg">Người trả</th>
                  <th className="py-2.5 px-2 text-center w-8" aria-label="Hướng chuyển" />
                  <th className="py-2.5 px-4">Người nhận</th>
                  <th className="py-2.5 px-4 text-right">Số tiền</th>
                  <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  <th className="py-2.5 px-4 text-right rounded-r-lg">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider-border/50 text-sm">
                {transfers.map((t) => {
                  const fromMember = members.find((m) => m.id === t.fromMemberId);
                  const toMember = members.find((m) => m.id === t.toMemberId);
                  const fromName = fromMember?.name || "Thành viên";
                  const toName = toMember?.name || "Thành viên";
                  const isDebtor = t.fromMemberId === currentMemberId;
                  const isCreditor = t.toMemberId === currentMemberId;
                  const debtorIsNoAccount = !!fromMember?.isNoAccount;
                  const creditorIsNoAccount = !!toMember?.isNoAccount;

                  return (
                    <tr
                      key={t.id}
                      className={`h-16 transition-colors ${
                        isDebtor || isCreditor
                          ? "bg-surface-container-low/30 hover:bg-hover-row/70"
                          : "hover:bg-hover-row/60"
                      }`}
                    >
                      {/* Payer (Người trả) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              debtorIsNoAccount
                                ? "bg-surface-container-highest text-yale-blue"
                                : "bg-light-green text-yale-blue"
                            }`}
                          >
                            {fromName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-yale-blue">
                                {fromName}
                              </span>
                              {isDebtor && (
                                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-cerulean text-[10px] font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted block">
                              {debtorIsNoAccount
                                ? "Chưa có tài khoản"
                                : fromMember?.role === "HOST"
                                ? "Trưởng nhóm"
                                : "Thành viên"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Direction Arrow */}
                      <td className="py-3 px-2 text-center">
                        <ArrowRight className="w-4 h-4 text-cerulean mx-auto" />
                      </td>

                      {/* Receiver (Người nhận) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              creditorIsNoAccount
                                ? "bg-surface-container-highest text-yale-blue"
                                : "bg-mint-green text-yale-blue"
                            }`}
                          >
                            {toName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-yale-blue">
                                {toName}
                              </span>
                              {isCreditor && (
                                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-cerulean text-[10px] font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted block">
                              {creditorIsNoAccount
                                ? "Chưa có tài khoản"
                                : toMember?.role === "HOST"
                                ? "Trưởng nhóm"
                                : "Thành viên"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-headline-h3 font-bold tabular-nums text-base ${
                            isDebtor
                              ? "text-functional-negative"
                              : isCreditor
                              ? "text-functional-positive"
                              : "text-yale-blue"
                          }`}
                        >
                          {formatVnd(t.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {t.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-lime-cream text-yale-blue font-semibold text-xs whitespace-nowrap border border-emerald/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-functional-positive" />
                            Đã hoàn tất
                          </span>
                        ) : t.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ocean-mist/15 text-yale-blue font-semibold text-xs whitespace-nowrap border border-ocean-mist/30">
                            <Clock className="w-3.5 h-3.5 text-ocean-mist" />
                            Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-functional-warning-bg text-functional-negative font-semibold text-xs whitespace-nowrap border border-functional-warning/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-functional-negative animate-pulse" />
                            Chưa thanh toán
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {/* Case 1: ACTIVE (Preview) -> All payment actions locked */}
                        {isPreview ? (
                          <span className="text-xs text-text-muted italic px-2 py-1">
                            Chờ chốt sổ
                          </span>
                        ) : t.status === "COMPLETED" ? (
                          <span className="inline-block text-xs font-semibold text-text-muted bg-surface-container-low px-2.5 py-1 rounded-md border border-divider-border/60">
                            Đã đối soát
                          </span>
                        ) : t.status === "PAID" ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Creditor confirms money received */}
                            {isCreditor && (
                              <button
                                type="button"
                                onClick={() => onConfirmReceivedClick(t)}
                                className="h-[36px] px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-yale-blue font-semibold text-xs inline-flex items-center gap-1 transition-colors border border-divider-border shadow-2xs"
                              >
                                <CheckCircle2 className="w-4 h-4 text-functional-positive" />
                                <span>Xác nhận đã nhận</span>
                              </button>
                            )}

                            {/* Host proxy receive for no-account creditor */}
                            {isHost && creditorIsNoAccount && !isCreditor && (
                              <button
                                type="button"
                                onClick={() => onProxyReceiveClick(t)}
                                className="h-[36px] px-3 rounded-lg bg-lime-cream hover:bg-light-green text-yale-blue font-semibold text-xs inline-flex items-center gap-1 transition-colors shadow-2xs"
                                title="Xác nhận nhận hộ cho thành viên chưa có tài khoản"
                              >
                                <UserCheck className="w-4 h-4 text-functional-positive" />
                                <span>Nhận hộ</span>
                              </button>
                            )}

                            {!isCreditor && (!isHost || !creditorIsNoAccount) && (
                              <span className="text-xs text-text-muted italic">
                                Chờ đối soát
                              </span>
                            )}
                          </div>
                        ) : (
                          /* UNPAID status */
                          <div className="flex items-center justify-end gap-2">
                            {/* Debtor pays directly */}
                            {isDebtor && (
                              <button
                                type="button"
                                onClick={() => onPayClick(t)}
                                className="h-[36px] px-3.5 rounded-lg bg-cerulean hover:bg-baltic-blue text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                              >
                                <QrCode className="w-4 h-4" />
                                <span>Thanh toán</span>
                              </button>
                            )}

                            {/* Host proxy pay for no-account debtor */}
                            {isHost && debtorIsNoAccount && !isDebtor && (
                              <button
                                type="button"
                                onClick={() => onProxyPayClick(t)}
                                className="h-[36px] px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-cerulean font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs border border-cerulean/30"
                                title="Đánh dấu đã trả hộ cho thành viên chưa có tài khoản"
                              >
                                <HandCoins className="w-4 h-4 text-cerulean" />
                                <span>Trả hộ</span>
                              </button>
                            )}

                            {/* Creditor reminds debtor */}
                            {isCreditor && (
                              <button
                                type="button"
                                onClick={() => onRemindClick(t)}
                                className="h-[34px] px-2.5 rounded-lg text-text-muted hover:text-functional-warning hover:bg-hover-row font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                              >
                                <BellRing className="w-4 h-4" />
                                <span>Nhắc nợ</span>
                              </button>
                            )}

                            {!isDebtor && !isCreditor && (!isHost || !debtorIsNoAccount) && (
                              <span className="text-xs text-text-muted italic">
                                Chờ thanh toán
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS (shown on sm:hidden) */}
          <div className="sm:hidden space-y-3 mt-4">
            {transfers.map((t) => {
              const fromMember = members.find((m) => m.id === t.fromMemberId);
              const toMember = members.find((m) => m.id === t.toMemberId);
              const fromName = fromMember?.name || "Thành viên";
              const toName = toMember?.name || "Thành viên";
              const isDebtor = t.fromMemberId === currentMemberId;
              const isCreditor = t.toMemberId === currentMemberId;
              const debtorIsNoAccount = !!fromMember?.isNoAccount;
              const creditorIsNoAccount = !!toMember?.isNoAccount;

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isDebtor || isCreditor
                      ? "bg-surface-container-low/40 border-cerulean/30 shadow-xs"
                      : "bg-surface-card border-divider-border"
                  }`}
                >
                  {/* Top route row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
                      <span>{fromName}</span>
                      {isDebtor && (
                        <span className="px-1 py-0.2 rounded bg-surface-container-high text-cerulean text-[10px]">
                          Bạn
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-cerulean" />
                      <span>{toName}</span>
                      {isCreditor && (
                        <span className="px-1 py-0.2 rounded bg-surface-container-high text-cerulean text-[10px]">
                          Bạn
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isDebtor
                          ? "text-functional-negative"
                          : isCreditor
                          ? "text-functional-positive"
                          : "text-yale-blue"
                      }`}
                    >
                      {formatVnd(t.amount)}
                    </span>
                  </div>

                  {/* Status row */}
                  <div className="flex items-center justify-between pt-2 border-t border-divider-border/50 text-xs">
                    <div>
                      {t.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-cream text-yale-blue font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-functional-positive" />
                          Đã hoàn tất
                        </span>
                      ) : t.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ocean-mist/15 text-yale-blue font-semibold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-ocean-mist" />
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-functional-warning-bg text-functional-negative font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-functional-negative" />
                          Chưa thanh toán
                        </span>
                      )}
                    </div>

                    {/* Mobile Action Buttons (min touch target 44px height) */}
                    <div>
                      {isPreview ? (
                        <span className="text-xs text-text-muted italic">Chờ chốt sổ</span>
                      ) : t.status === "COMPLETED" ? (
                        <span className="text-xs text-text-muted font-medium">Đã đối soát</span>
                      ) : t.status === "PAID" ? (
                        isCreditor ? (
                          <button
                            type="button"
                            onClick={() => onConfirmReceivedClick(t)}
                            className="h-[44px] px-3.5 rounded-xl bg-surface-container-low text-yale-blue font-semibold text-xs inline-flex items-center gap-1.5 border border-divider-border"
                          >
                            <CheckCircle2 className="w-4 h-4 text-functional-positive" />
                            <span>Xác nhận đã nhận</span>
                          </button>
                        ) : isHost && creditorIsNoAccount ? (
                          <button
                            type="button"
                            onClick={() => onProxyReceiveClick(t)}
                            className="h-[44px] px-3.5 rounded-xl bg-lime-cream text-yale-blue font-semibold text-xs inline-flex items-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4 text-functional-positive" />
                            <span>Nhận hộ</span>
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted italic">Chờ đối soát</span>
                        )
                      ) : (
                        /* UNPAID */
                        <div className="flex items-center gap-2">
                          {isDebtor && (
                            <button
                              type="button"
                              onClick={() => onPayClick(t)}
                              className="h-[44px] px-4 rounded-xl bg-cerulean text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Thanh toán</span>
                            </button>
                          )}
                          {isHost && debtorIsNoAccount && !isDebtor && (
                            <button
                              type="button"
                              onClick={() => onProxyPayClick(t)}
                              className="h-[44px] px-3.5 rounded-xl bg-surface-container-high text-cerulean font-semibold text-xs inline-flex items-center gap-1.5 border border-cerulean/30"
                            >
                              <HandCoins className="w-4 h-4" />
                              <span>Trả hộ</span>
                            </button>
                          )}
                          {isCreditor && (
                            <button
                              type="button"
                              onClick={() => onRemindClick(t)}
                              className="h-[44px] px-3 rounded-xl text-functional-warning font-semibold text-xs inline-flex items-center gap-1"
                            >
                              <BellRing className="w-4 h-4" />
                              <span>Nhắc nợ</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
