"use client";

import * as React from "react";
import { Users, UserPlus, Info } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney, getInitials } from "@/lib/utils";
import { getMemberRoleLabel, SPECIAL_LABELS } from "@/lib/labels";
import { TripInviteShareModal } from "./trip-invite-share-modal";

interface TripMembersCardProps {
  trip: TripDetailData;
}

const AVATAR_COLORS = [
  "bg-lime-cream text-yale-blue",
  "bg-light-green text-yale-blue",
  "bg-mint-green text-yale-blue",
  "bg-ocean-mist text-white",
  "bg-tropical-teal text-white",
];

export function TripMembersCard({ trip }: TripMembersCardProps) {
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);

  // Sắp xếp danh sách thành viên theo joinOrder tăng dần
  const sortedMembers = React.useMemo(() => {
    return [...trip.members].sort((a, b) => a.joinOrder - b.joinOrder);
  }, [trip.members]);

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cerulean shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-yale-blue">
            Thành viên ({trip.members.length})
          </h2>
        </div>
        <button
          type="button"
          disabled
          title={SPECIAL_LABELS.UPCOMING}
          className="text-xs sm:text-sm font-semibold text-text-muted/50 cursor-not-allowed"
        >
          Quản lý
        </button>
      </div>

      {/* Member Items */}
      <div className="divide-y divide-border-hairline/60 my-2">
        {sortedMembers.map((member, idx) => (
          <div key={member.id} className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-xs shrink-0 select-none ${
                  member.isNoAccount
                    ? "border-2 border-dashed border-mint-green bg-bg-canvas text-text-muted"
                    : AVATAR_COLORS[idx % AVATAR_COLORS.length]
                }`}
                title={member.isNoAccount ? `${member.name} (${SPECIAL_LABELS.NO_ACCOUNT})` : member.name}
              >
                {getInitials(member.name)}
              </div>

              {/* Name & Badges */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-yale-blue">
                    {member.name}
                  </span>

                  {/* Trưởng nhóm badge */}
                  {member.role === "HOST" && (
                    <span className="px-2 py-0.5 rounded-full bg-cerulean/15 text-cerulean text-[11px] font-bold">
                      {getMemberRoleLabel("HOST")}
                    </span>
                  )}

                  {/* Bạn badge */}
                  {member.isCurrentUser && (
                    <span className="px-2 py-0.5 rounded-full bg-lime-cream text-yale-blue text-[11px] font-bold border border-light-green/60">
                      {SPECIAL_LABELS.CURRENT_USER}
                    </span>
                  )}

                  {/* Chưa có tài khoản badge */}
                  {member.isNoAccount && (
                    <span className="px-2 py-0.5 rounded-full bg-functional-warning-bg text-functional-warning text-[10px] font-semibold flex items-center gap-1 border border-functional-warning/20">
                      <Info className="w-3 h-3" />
                      <span>{SPECIAL_LABELS.NO_ACCOUNT}</span>
                    </span>
                  )}
                </div>

                {/* Spent Amount */}
                <span className="text-xs text-text-muted mt-0.5">
                  {member.spentAmount > 0
                    ? `Đã chi ${formatMoney(member.spentAmount)}`
                    : "Chưa chi khoản nào"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action: + Mời thêm bạn */}
      <button
        id="member-add-invite-btn"
        type="button"
        onClick={() => setInviteModalOpen(true)}
        className="w-full h-11 mt-2 rounded-xl bg-white hover:bg-hover-row text-cerulean border border-border-hairline font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(24,78,119,0.08)] transition-all cursor-pointer"
      >
        <UserPlus className="w-4 h-4 text-cerulean" />
        <span>+ Mời thêm bạn</span>
      </button>

      {/* Trip Invite Share Modal */}
      <TripInviteShareModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        tripTitle={trip.name}
        inviteCode={trip.inviteCode}
      />
    </section>
  );
}
