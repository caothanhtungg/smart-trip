"use client";

import * as React from "react";
import { Users, UserPlus, Info } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney, getInitials } from "@/lib/utils";
import { getMemberRoleLabel, SPECIAL_LABELS } from "@/lib/labels";
import { TripInviteShareModal } from "./trip-invite-share-modal";
import { useTripSession } from "./trip-session-context";

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
  const { isHost, sessionInviteCode, handleResetInviteCode } = useTripSession();
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "success">("idle");

  // Sắp xếp danh sách thành viên theo joinOrder tăng dần
  const sortedMembers = React.useMemo(() => {
    return [...trip.members].sort((a, b) => a.joinOrder - b.joinOrder);
  }, [trip.members]);

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(sessionInviteCode || trip.inviteCode);
        setCopyStatus("success");
        setTimeout(() => setCopyStatus("idle"), 2000);
      }
    } catch {
      // fallback
    }
  };

  const previewMembers = sortedMembers.slice(0, 5);
  const remainingCount = Math.max(0, sortedMembers.length - 5);

  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(24,78,119,0.04)] border border-border-hairline transition-all duration-300 hover:shadow-[0_8px_30px_rgba(24,78,119,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border-hairline">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cerulean shrink-0" />
          <h2 className="text-base font-bold text-yale-blue tracking-tight">
            Thành viên ({trip.members.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs font-semibold text-cerulean hover:text-baltic-blue transition-colors cursor-pointer"
        >
          {isExpanded ? "Thu gọn" : "Chi tiết"}
        </button>
      </div>

      {/* Avatar Stack Row (Airy & Modern) */}
      <div className="pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          {/* Overlapping Avatars */}
          <div className="flex items-center -space-x-2.5 overflow-hidden py-1">
            {previewMembers.map((member, idx) => (
              <div
                key={member.id}
                className={`inline-block h-10 w-10 rounded-full ring-2 ring-white text-xs font-bold flex items-center justify-center shadow-xs select-none transition-transform hover:scale-110 hover:z-20 ${
                  member.isNoAccount
                    ? "border border-dashed border-mint-green bg-bg-canvas text-text-muted"
                    : AVATAR_COLORS[idx % AVATAR_COLORS.length]
                }`}
                title={`${member.name}${member.role === "HOST" ? " (Trưởng nhóm)" : ""}`}
              >
                {getInitials(member.name)}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="inline-flex h-10 w-10 rounded-full ring-2 ring-white bg-surface-container text-yale-blue text-xs font-bold items-center justify-center shadow-xs select-none">
                +{remainingCount}
              </div>
            )}
          </div>

          {/* Quick Invite Button */}
          <button
            id="member-add-invite-btn"
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="h-9 px-3 rounded-full bg-cerulean/10 hover:bg-cerulean/20 text-cerulean font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Mời bạn</span>
          </button>
        </div>

        {/* Compact Invite Code Line */}
        <div className="mt-3.5 pt-3 border-t border-border-hairline/60 flex items-center justify-between text-xs">
          <span className="text-text-muted font-medium">Mã mời nhóm:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-yale-blue tracking-wider bg-hover-row px-2 py-0.5 rounded-md border border-border-hairline">
              {sessionInviteCode || trip.inviteCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[11px] font-semibold text-cerulean hover:underline cursor-pointer"
            >
              {copyStatus === "success" ? "Đã chép!" : "Sao chép"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Detailed Member List */}
      {isExpanded && (
        <div className="divide-y divide-border-hairline/60 mt-3 pt-3 border-t border-border-hairline animate-fadeIn">
          {sortedMembers.map((member, idx) => (
            <div key={member.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs shrink-0 select-none ${
                    member.isNoAccount
                      ? "border border-dashed border-mint-green bg-bg-canvas text-text-muted"
                      : AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  }`}
                >
                  {getInitials(member.name)}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-yale-blue">
                      {member.name}
                    </span>
                    {member.role === "HOST" && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cerulean/15 text-cerulean text-[10px] font-bold">
                        {getMemberRoleLabel("HOST")}
                      </span>
                    )}
                    {member.isCurrentUser && (
                      <span className="px-1.5 py-0.2 rounded-full bg-lime-cream text-yale-blue text-[10px] font-bold">
                        Bạn
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted">
                    {member.spentAmount > 0
                      ? `Đã chi ${formatMoney(member.spentAmount)}`
                      : "Chưa chi khoản nào"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip Invite Share Modal */}
      <TripInviteShareModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        tripTitle={trip.name}
        inviteCode={sessionInviteCode}
        isHost={isHost}
        onResetInviteCode={handleResetInviteCode}
      />
    </section>
  );
}
