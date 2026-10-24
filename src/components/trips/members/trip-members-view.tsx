"use client";

import * as React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { TripMember } from "@/types/trip";
import { TripMembersHeader } from "./trip-members-header";
import { TripPendingClaimsBanner } from "./trip-pending-claims-banner";
import { TripMembersTable } from "./trip-members-table";
import { TripMemberHelpCard } from "./trip-member-help-card";
import { TripAddGuestModal } from "./trip-add-guest-modal";
import { TripEditGuestModal } from "./trip-edit-guest-modal";
import { TripRemoveMemberModal } from "./trip-remove-member-modal";
import { TripLeaveTripModal } from "./trip-leave-trip-modal";
import { TripInviteShareModal } from "@/components/trips/detail/trip-invite-share-modal";

export function TripMembersView() {
  const {
    sessionTrip,
    sessionMembers,
    isMembersLoading,
    membersError,
    refetchMembers,
    sessionClaims,
    sessionExpenses,
    sessionStatus,
    currentMemberId,
    isHost,
    handleAddGuestMember,
    handleEditGuestMember,
    handleRemoveMember,
    handleLeaveTrip,
    handleApproveClaim,
    handleRejectClaim,
  } = useTripSession();

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = React.useState(false);
  const [editingGuestMember, setEditingGuestMember] = React.useState<TripMember | null>(null);
  const [removingMember, setRemovingMember] = React.useState<TripMember | null>(null);
  const [leavingMember, setLeavingMember] = React.useState<TripMember | null>(null);

  const isTripActive = sessionStatus === "ACTIVE";

  // Số dư của thành viên đang được chọn để xóa / rời
  const getMemberNet = (memberId: string): number => {
    // Tính toán nhanh balance
    let spent = 0;
    let share = 0;
    for (const exp of sessionExpenses) {
      if (exp.paidByMemberId === memberId) {
        spent += exp.amount;
      }
      for (const s of exp.shares) {
        if (s.memberId === memberId) {
          share += s.amount;
        }
      }
    }
    return spent - share;
  };

  // Kiểm tra lịch sử tài chính của thành viên
  const checkHasFinancialHistory = (memberId: string): boolean => {
    const target = sessionMembers.find((m) => m.id === memberId);
    if ((target?.spentAmount ?? 0) > 0) return true;
    return sessionExpenses.some(
      (e) => e.paidByMemberId === memberId || e.shares.some((s) => s.memberId === memberId)
    );
  };

  if (isMembersLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải danh sách thành viên..."
        className="flex flex-col gap-6 max-w-[1200px] w-full mx-auto pb-12 animate-pulse"
      >
        <div className="h-20 bg-hover-row rounded-2xl w-full" />
        <div className="h-96 bg-hover-row rounded-3xl w-full" />
      </div>
    );
  }

  if (membersError) {
    return (
      <div
        role="alert"
        className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-functional-negative/20 shadow-sm text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-functional-negative/10 text-functional-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-yale-blue">
            Không thể tải danh sách thành viên
          </h3>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
            {membersError}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => refetchMembers()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cerulean/40 active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] w-full mx-auto pb-12">
      {/* 1. Header Bar */}
      <TripMembersHeader
        tripId={sessionTrip.id}
        tripName={sessionTrip.name}
        memberCount={sessionMembers.filter((m) => m.status === "ACTIVE").length}
        isHost={isHost}
        isTripActive={isTripActive}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenAddGuestModal={() => setIsAddGuestModalOpen(true)}
      />

      {/* 2. Highlighted Pending Claim Request Banner (Chỉ Trưởng nhóm) */}
      {isHost && (
        <TripPendingClaimsBanner
          claims={sessionClaims}
          members={sessionMembers}
          onApproveClaim={handleApproveClaim}
          onRejectClaim={handleRejectClaim}
        />
      )}

      {/* 3. Member Ledger Table */}
      <TripMembersTable
        members={sessionMembers}
        claims={sessionClaims}
        expenses={sessionExpenses}
        isHost={isHost}
        currentMemberId={currentMemberId}
        isTripActive={isTripActive}
        onOpenEditGuest={(member) => setEditingGuestMember(member)}
        onOpenRemoveMember={(member) => setRemovingMember(member)}
        onOpenLeaveTrip={(member) => setLeavingMember(member)}
      />

      {/* 4. Bottom Helper Guidance Card */}
      <TripMemberHelpCard
        isHost={isHost}
        isTripActive={isTripActive}
        onOpenAddGuestModal={() => setIsAddGuestModalOpen(true)}
      />

      {/* --- Modals --- */}

      {/* Modal Mời bạn bè */}
      <TripInviteShareModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tripTitle={sessionTrip.name}
        inviteCode={sessionTrip.inviteCode}
      />

      {/* Modal Thêm thành viên chưa có tài khoản */}
      <TripAddGuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => setIsAddGuestModalOpen(false)}
        existingMembers={sessionMembers}
        onAddGuest={handleAddGuestMember}
      />

      {/* Modal Chỉnh sửa tên thành viên chưa có tài khoản */}
      <TripEditGuestModal
        isOpen={!!editingGuestMember}
        onClose={() => setEditingGuestMember(null)}
        member={editingGuestMember}
        existingMembers={sessionMembers}
        onEditGuest={handleEditGuestMember}
      />

      {/* Modal Xóa thành viên */}
      <TripRemoveMemberModal
        isOpen={!!removingMember}
        onClose={() => setRemovingMember(null)}
        member={removingMember}
        netBalance={removingMember ? getMemberNet(removingMember.id) : 0}
        tripStatus={sessionStatus}
        isHost={isHost}
        hasFinancialHistory={removingMember ? checkHasFinancialHistory(removingMember.id) : false}
        onConfirmRemove={handleRemoveMember}
      />

      {/* Modal Rời chuyến đi */}
      <TripLeaveTripModal
        isOpen={!!leavingMember}
        onClose={() => setLeavingMember(null)}
        member={leavingMember}
        netBalance={leavingMember ? getMemberNet(leavingMember.id) : 0}
        tripStatus={sessionStatus}
        onConfirmLeave={handleLeaveTrip}
      />
    </div>
  );
}
