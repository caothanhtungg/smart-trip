"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripMembersHeaderProps {
  tripId: string;
  tripName: string;
  memberCount: number;
  isHost: boolean;
  isTripActive: boolean;
  onOpenInviteModal: () => void;
  onOpenAddGuestModal: () => void;
}

export function TripMembersHeader({
  tripId,
  tripName,
  memberCount,
  isHost,
  isTripActive,
  onOpenInviteModal,
  onOpenAddGuestModal,
}: TripMembersHeaderProps) {
  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-text-muted text-xs sm:text-sm">
          <Link
            href={`/trips/${tripId}`}
            className="hover:text-cerulean transition-colors truncate max-w-[200px] sm:max-w-none"
          >
            {tripName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-outline-variant shrink-0" />
          <span className="text-yale-blue font-semibold">Quản lý thành viên</span>
        </div>

        {/* Title and Member Count Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-yale-blue tracking-tight">
            Thành viên chuyến đi
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold text-xs bg-lime-cream text-yale-blue shadow-xs">
            {memberCount} người tham gia
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Secondary: Mời thêm bạn bè */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenInviteModal}
          className="h-11 px-4 border-cerulean text-cerulean hover:bg-hover-row font-semibold rounded-xl shadow-xs flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4 text-cerulean" />
          <span>Mời thêm bạn bè</span>
        </Button>

        {/* Primary: Thêm thành viên chưa có tài khoản (Chỉ Trưởng nhóm khi ACTIVE) */}
        {isHost && (
          <Button
            type="button"
            variant="primary"
            onClick={onOpenAddGuestModal}
            disabled={!isTripActive}
            title={
              !isTripActive
                ? "Chỉ có thể thêm thành viên khi chuyến đi đang lên kế hoạch"
                : undefined
            }
            className="h-11 px-4 bg-cerulean hover:bg-baltic-blue text-white font-semibold rounded-xl shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm thành viên chưa có tài khoản</span>
          </Button>
        )}
      </div>
    </section>
  );
}
