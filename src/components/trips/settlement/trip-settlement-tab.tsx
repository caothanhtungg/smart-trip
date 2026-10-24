"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, UserCheck, Users } from "lucide-react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { calculateMemberBalances, canReopenSettlement } from "@/lib/money/settlement";
import { SettlementTransfer } from "@/types/settlement";
import { MOCK_MEMBER_BANK_INFO } from "@/lib/mock/settlement";
import { SPECIAL_LABELS } from "@/lib/labels";
import { TripSettlementBanner } from "./trip-settlement-banner";
import { TripSettlementTable } from "./trip-settlement-table";
import { TripSettlementBalanceSidebar } from "./trip-settlement-balance-sidebar";
import {
  TripSettlementConfirmModal,
  ConfirmModalType,
} from "./trip-settlement-confirm-modal";
import { TripPaymentQrModal } from "./trip-payment-qr-modal";
import { TripDebtReminderModal } from "./trip-debt-reminder-modal";
import { TripSettlementGraphModal } from "./trip-settlement-graph-modal";

export function TripSettlementTab() {
  const {
    sessionTrip,
    sessionExpenses,
    sessionStatus,
    sessionTransfers,
    currentMemberId,
    setCurrentMemberId,
    isHost,
    handleLockSettlement,
    handleReopenSettlement,
    handleMarkTransferPaid,
    handleConfirmTransferCompleted,
    sessionToast,
    isSettlementLoading,
    settlementError,
    isSettlementMutating,
    refetchSettlement,
  } = useTripSession();

  // Modals state
  const [isGraphModalOpen, setIsGraphModalOpen] = React.useState(false);

  // Confirm Modal
  const [confirmModalState, setConfirmModalState] = React.useState<{
    isOpen: boolean;
    type: ConfirmModalType;
    onConfirm: () => void;
    title?: string;
    description?: string;
  }>({
    isOpen: false,
    type: "LOCK_SETTLEMENT",
    onConfirm: () => {},
  });

  // Payment QR Modal
  const [paymentQrState, setPaymentQrState] = React.useState<{
    isOpen: boolean;
    transfer: SettlementTransfer | null;
    isProxy: boolean;
  }>({
    isOpen: false,
    transfer: null,
    isProxy: false,
  });

  // Reminder Modal
  const [reminderState, setReminderState] = React.useState<{
    isOpen: boolean;
    transfer: SettlementTransfer | null;
  }>({
    isOpen: false,
    transfer: null,
  });

  // Calculate balances from current session expenses
  const balancesResult = React.useMemo(() => {
    return calculateMemberBalances(sessionTrip.members, sessionExpenses, MOCK_MEMBER_BANK_INFO);
  }, [sessionExpenses, sessionTrip.members]);

  const balances = balancesResult.balances;

  const canReopen = canReopenSettlement(sessionTransfers);
  const reopenDisabledReason = !canReopen
    ? "Không thể mở lại sổ vì đã có giao dịch được thanh toán hoặc xác nhận hoàn tất."
    : undefined;

  // Handlers for Banner Actions
  const handleOpenLockModal = () => {
    setConfirmModalState({
      isOpen: true,
      type: "LOCK_SETTLEMENT",
      onConfirm: async () => {
        await handleLockSettlement();
      },
    });
  };

  const handleOpenReopenModal = () => {
    setConfirmModalState({
      isOpen: true,
      type: "REOPEN_SETTLEMENT",
      onConfirm: async () => {
        const res = await handleReopenSettlement();
        if (res && !res.success && res.message) {
          // Toast or message handled
        }
      },
    });
  };

  // Handlers for Table Actions
  const handleOpenPayment = (transfer: SettlementTransfer) => {
    setPaymentQrState({
      isOpen: true,
      transfer,
      isProxy: false,
    });
  };

  const handleOpenProxyPay = (transfer: SettlementTransfer) => {
    const fromMember = sessionTrip.members.find((m) => m.id === transfer.fromMemberId);
    const toMember = sessionTrip.members.find((m) => m.id === transfer.toMemberId);
    const fromName = fromMember?.name || "thành viên";
    const toName = toMember?.name || "thành viên";

    setConfirmModalState({
      isOpen: true,
      type: "PROXY_PAY",
      title: `Xác nhận Trả hộ cho ${fromName}`,
      description: `Bạn đang ghi nhận ${fromName} (thành viên chưa có tài khoản) đã thanh toán khoản nợ ${transfer.amount.toLocaleString("vi-VN")} ₫ cho ${toName}.`,
      onConfirm: async () => {
        await handleMarkTransferPaid(transfer.id, "CASH", "Trưởng nhóm trả hộ");
      },
    });
  };

  const handleOpenConfirmReceived = (transfer: SettlementTransfer) => {
    const fromMember = sessionTrip.members.find((m) => m.id === transfer.fromMemberId);
    const fromName = fromMember?.name || "thành viên";

    setConfirmModalState({
      isOpen: true,
      type: "CONFIRM_RECEIVED",
      title: `Xác nhận đã nhận tiền từ ${fromName}`,
      description: `Vui lòng xác nhận bạn đã nhận đủ số tiền ${transfer.amount.toLocaleString("vi-VN")} ₫ từ ${fromName}.`,
      onConfirm: async () => {
        await handleConfirmTransferCompleted(transfer.id);
      },
    });
  };

  const handleOpenProxyReceive = (transfer: SettlementTransfer) => {
    const fromMember = sessionTrip.members.find((m) => m.id === transfer.fromMemberId);
    const toMember = sessionTrip.members.find((m) => m.id === transfer.toMemberId);
    const fromName = fromMember?.name || "thành viên";
    const toName = toMember?.name || "thành viên";

    setConfirmModalState({
      isOpen: true,
      type: "PROXY_RECEIVE",
      title: `Xác nhận Nhận hộ cho ${toName}`,
      description: `Bạn đang xác nhận ${toName} (thành viên chưa có tài khoản) đã nhận đủ số tiền ${transfer.amount.toLocaleString("vi-VN")} ₫ từ ${fromName}.`,
      onConfirm: async () => {
        await handleConfirmTransferCompleted(transfer.id);
      },
    });
  };

  const handleOpenReminder = (transfer: SettlementTransfer) => {
    setReminderState({
      isOpen: true,
      transfer,
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* DEMO ROLE SWITCHER BAR */}
      <div className="w-full p-3 bg-surface-card rounded-2xl border border-divider-border/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-4 h-4 text-cerulean shrink-0" />
          <span className="font-semibold text-yale-blue">
            Góc nhìn thành viên (Demo Switcher):
          </span>
          <span className="text-text-muted hidden md:inline">
            Chọn thành viên để kiểm tra giao diện và phân quyền
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {sessionTrip.members.map((m) => {
            const isSelected = m.id === currentMemberId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setCurrentMemberId(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-cerulean text-white shadow-xs"
                    : "bg-surface-container-low text-text-muted hover:text-yale-blue hover:bg-hover-row"
                }`}
              >
                <span>{m.name}</span>
                {m.role === "HOST" && (
                  <span className="text-[10px] bg-lime-cream text-yale-blue px-1.5 py-0.2 rounded-full font-bold">
                    Host
                  </span>
                )}
                {m.isNoAccount && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-normal">
                    {SPECIAL_LABELS.NO_ACCOUNT}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {isSettlementLoading ? (
        <div
          className="w-full flex flex-col gap-6 animate-pulse"
          data-testid="settlement-loading-skeleton"
        >
          {/* Banner Skeleton */}
          <div className="w-full bg-surface-container-low border border-divider-border/60 rounded-[20px] p-6 h-28" />
          {/* Main Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-surface-card rounded-[20px] border border-divider-border/60 p-6 h-96" />
            <div className="lg:col-span-4 bg-surface-card rounded-[20px] border border-divider-border/60 p-6 h-96" />
          </div>
        </div>
      ) : settlementError ? (
        /* ERROR STATE */
        <div
          className="w-full p-6 bg-functional-warning-bg/40 border border-functional-warning/30 rounded-[20px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          role="alert"
          data-testid="settlement-error-card"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-functional-warning-bg flex items-center justify-center shrink-0 border border-functional-warning/40">
              <AlertTriangle className="w-5 h-5 text-functional-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-yale-blue">
                Không thể tải dữ liệu quyết toán
              </h3>
              <p className="text-xs text-text-muted mt-0.5">{settlementError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetchSettlement()}
            className="px-4 py-2 bg-cerulean hover:bg-baltic-blue text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <>
          {/* TOP BANNER */}
          <TripSettlementBanner
            status={sessionStatus}
            transfersCount={sessionTransfers.length}
            isHost={isHost}
            canReopen={canReopen}
            reopenDisabledReason={reopenDisabledReason}
            onLockClick={handleOpenLockModal}
            onReopenClick={handleOpenReopenModal}
            onViewGraphClick={() => setIsGraphModalOpen(true)}
          />

          {/* 12-COLUMN GRID (8 cols main table vs 4 cols balances sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Left Workspace: Settlement Table */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <TripSettlementTable
                status={sessionStatus}
                transfers={sessionTransfers}
                currentMemberId={currentMemberId}
                isHost={isHost}
                members={sessionTrip.members}
                onPayClick={handleOpenPayment}
                onRemindClick={handleOpenReminder}
                onConfirmReceivedClick={handleOpenConfirmReceived}
                onProxyPayClick={handleOpenProxyPay}
                onProxyReceiveClick={handleOpenProxyReceive}
              />
            </div>

            {/* Right Sidebar: Personal & Group Balances */}
            <div className="lg:col-span-4">
              <TripSettlementBalanceSidebar
                status={sessionStatus}
                currentMemberId={currentMemberId}
                members={sessionTrip.members}
                balances={balances}
                transfers={sessionTransfers}
                onPayMyDebtClick={handleOpenPayment}
              />
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      {/* 1. Confirm Modal */}
      <TripSettlementConfirmModal
        isOpen={confirmModalState.isOpen}
        type={confirmModalState.type}
        title={confirmModalState.title}
        description={confirmModalState.description}
        isLoading={isSettlementMutating}
        onConfirm={confirmModalState.onConfirm}
        onClose={() =>
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* 2. VietQR / Cash Payment Modal */}
      <TripPaymentQrModal
        isOpen={paymentQrState.isOpen}
        transfer={paymentQrState.transfer}
        tripId={sessionTrip.id}
        members={sessionTrip.members}
        tripName={sessionTrip.name}
        isProxy={paymentQrState.isProxy}
        onClose={() => setPaymentQrState({ isOpen: false, transfer: null, isProxy: false })}
        onConfirmPaid={(transferId, method, note) => {
          handleMarkTransferPaid(transferId, method, note);
        }}
      />

      {/* 3. Debt Reminder Modal */}
      <TripDebtReminderModal
        isOpen={reminderState.isOpen}
        transfer={reminderState.transfer}
        members={sessionTrip.members}
        tripName={sessionTrip.name}
        onClose={() => setReminderState({ isOpen: false, transfer: null })}
      />

      {/* 4. Graph Modal */}
      <TripSettlementGraphModal
        isOpen={isGraphModalOpen}
        transfers={sessionTransfers}
        members={sessionTrip.members}
        totalDirectExpensesCount={sessionExpenses.length}
        onClose={() => setIsGraphModalOpen(false)}
      />

      {/* Toast Notification */}
      {sessionToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-yale-blue text-white rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md text-xs">
          <UserCheck className="w-5 h-5 text-lime-cream shrink-0" />
          <span className="font-medium leading-relaxed">{sessionToast}</span>
        </div>
      )}
    </div>
  );
}
