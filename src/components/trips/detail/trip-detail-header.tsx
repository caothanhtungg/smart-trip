"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  QrCode,
  CheckCircle2,
  Pencil,
  Archive,
} from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatDate } from "@/lib/utils";
import { calculateDurationText } from "@/lib/trip-form-validation";
import { getTripCoverGradient } from "@/lib/view/trip-card";
import { getTripStatusLabel } from "@/lib/labels";
import { TripInviteShareModal } from "./trip-invite-share-modal";
import { TripEditInfoModal } from "./trip-edit-info-modal";
import { useTripSession } from "./trip-session-context";

interface TripDetailHeaderProps {
  trip: TripDetailData;
}

export function TripDetailHeader({ trip }: TripDetailHeaderProps) {
  const { isHost, sessionInviteCode, handleUpdateTripInfo, handleArchiveTrip, handleResetInviteCode } = useTripSession();
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [editInfoModalOpen, setEditInfoModalOpen] = React.useState(false);

  const cover = getTripCoverGradient(trip.id);
  const gradientStyle = {
    background: cover.via
      ? `linear-gradient(135deg, ${cover.from} 0%, ${cover.via} 50%, ${cover.to} 100%)`
      : `linear-gradient(135deg, ${cover.from} 0%, ${cover.to} 100%)`,
  };

  const durationText =
    calculateDurationText(trip.startDate, trip.endDate) || "1 ngày";

  return (
    <div className="w-full bg-white shadow-[0_4px_16px_rgba(24,78,119,0.06)] border-b border-border-hairline">
      {/* Decorative gradient cover banner */}
      <div className="w-full h-24 sm:h-28 relative overflow-hidden" style={gradientStyle}>
        {/* Subtle geometric circles */}
        <div
          className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full border border-white/20 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-24 -bottom-16 w-36 h-36 rounded-full border border-white/15 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Header Info Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-text-muted text-sm mb-3">
          <Link
            href="/trips"
            className="hover:text-cerulean font-medium transition-colors"
          >
            Chuyến đi của tôi
          </Link>
          <span className="text-border-hairline" aria-hidden="true">/</span>
          <span className="text-yale-blue font-semibold truncate max-w-[280px] sm:max-w-none">
            {trip.name}
          </span>
        </nav>

        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border-hairline/80">
          <div className="flex flex-col gap-2">
            {/* Title & Status Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-yale-blue tracking-tight">
                {trip.name}
              </h1>

              {/* Status Badge */}
              {trip.status === "ACTIVE" && (
                <span className="h-7 px-3 rounded-full bg-functional-warning-bg text-functional-warning font-semibold text-xs inline-flex items-center gap-1.5 border border-functional-warning/15">
                  <span className="w-2 h-2 rounded-full bg-functional-warning" />
                  <span>{getTripStatusLabel("ACTIVE")}</span>
                </span>
              )}
              {trip.status === "SETTLING" && (
                <span className="h-7 px-3 rounded-full bg-functional-warning-bg text-functional-warning font-semibold text-xs inline-flex items-center gap-1.5 border border-functional-warning/20">
                  <span className="w-2 h-2 rounded-full bg-functional-warning animate-pulse" />
                  <span>{getTripStatusLabel("SETTLING")}</span>
                </span>
              )}
              {trip.status === "COMPLETED" && (
                <span className="h-7 px-3 rounded-full bg-lime-cream text-yale-blue font-semibold text-xs inline-flex items-center gap-1.5 border border-light-green">
                  <CheckCircle2 className="w-3.5 h-3.5 text-functional-positive stroke-[2.5]" />
                  <span>{getTripStatusLabel("COMPLETED")}</span>
                </span>
              )}
              {trip.status === "ARCHIVED" && (
                <span className="h-7 px-3 rounded-full bg-surface-container text-text-muted font-semibold text-xs inline-flex items-center gap-1.5 border border-border-hairline">
                  <Archive className="w-3.5 h-3.5" />
                  <span>{getTripStatusLabel("ARCHIVED")}</span>
                </span>
              )}
            </div>

            {/* Destination & Date details */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-text-muted text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-text-body">
                <MapPin className="w-4 h-4 text-cerulean shrink-0" />
                <span>{trip.destination}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-cerulean shrink-0" />
                <span>
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)} ({durationText})
                </span>
              </span>
            </div>
          </div>

          {/* Action Buttons: Chỉnh sửa chuyến đi + Mời bạn bè */}
          <div className="flex items-center gap-3 shrink-0">
            {isHost && trip.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => setEditInfoModalOpen(true)}
                className="h-10 sm:h-10 px-4 rounded-full bg-white hover:bg-hover-row text-yale-blue border border-border-hairline font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                title="Chỉnh sửa thông tin chuyến đi"
              >
                <Pencil className="w-3.5 h-3.5 text-text-muted" />
                <span className="hidden sm:inline">Chỉnh sửa</span>
              </button>
            )}

            <button
              id="header-invite-btn"
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="h-10 sm:h-10 px-4 sm:px-5 rounded-full bg-white hover:bg-hover-row text-cerulean border border-border-hairline font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <QrCode className="w-4 h-4 text-cerulean stroke-[2.2]" />
              <span>Mời bạn bè</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trip Invite Share Modal */}
      <TripInviteShareModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        tripTitle={trip.name}
        inviteCode={sessionInviteCode}
        isHost={isHost}
        onResetInviteCode={handleResetInviteCode}
      />

      {/* Trip Edit Info Modal */}
      {isHost && (
        <TripEditInfoModal
          isOpen={editInfoModalOpen}
          onClose={() => setEditInfoModalOpen(false)}
          trip={trip}
          onSave={handleUpdateTripInfo}
          onArchive={handleArchiveTrip}
        />
      )}
    </div>
  );
}
