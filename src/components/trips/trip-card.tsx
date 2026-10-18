"use client";

import * as React from "react";
import {
  MapPin,
  Calendar,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import { TripCardView } from "@/types/trip";
import { formatMoney, formatDate, getInitials } from "@/lib/utils";
import {
  getTripStatusLabel,
  getBalanceTypeLabel,
  SPECIAL_LABELS,
} from "@/lib/labels";

interface TripCardProps {
  trip: TripCardView;
  onSelectTrip?: (trip: TripCardView) => void;
  onMoreActions?: (trip: TripCardView, e: React.MouseEvent) => void;
}

export function TripCard({ trip, onSelectTrip, onMoreActions }: TripCardProps) {
  // Determine gradient styling from cover tokens
  const gradientStyle = {
    background: trip.cover.via
      ? `linear-gradient(135deg, ${trip.cover.from} 0%, ${trip.cover.via} 50%, ${trip.cover.to} 100%)`
      : `linear-gradient(135deg, ${trip.cover.from} 0%, ${trip.cover.to} 100%)`,
  };

  // Color mapping for member avatar stacks
  const avatarColors = [
    "bg-lime-cream text-yale-blue",
    "bg-light-green text-yale-blue",
    "bg-mint-green text-yale-blue",
    "bg-ocean-mist text-white",
  ];

  return (
    <article
      onClick={() => onSelectTrip?.(trip)}
      className="group bg-white rounded-[20px] border border-border-hairline overflow-hidden shadow-[0_6px_20px_rgba(24,78,119,0.08)] hover:shadow-[0_12px_28px_rgba(24,78,119,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer focus-within:ring-3 focus-within:ring-ocean-mist"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectTrip?.(trip);
        }
      }}
      aria-label={`Chuyến đi ${trip.name}`}
    >
      <div>
        {/* Gradient Cover Strip */}
        <div
          className="relative h-[110px] w-full overflow-hidden p-3 flex items-start justify-end"
          style={gradientStyle}
        >
          {/* Subtle Concentric Rings overlay for organic tactile depth */}
          <div
            className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full border border-white/20 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute right-8 -bottom-12 w-24 h-24 rounded-full border border-white/15 pointer-events-none"
            aria-hidden="true"
          />

          {/* Quick Action Button */}
          <button
            type="button"
            aria-label="Thao tác khác"
            onClick={(e) => {
              e.stopPropagation();
              onMoreActions?.(trip, e);
            }}
            className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-yale-blue flex items-center justify-center backdrop-blur shadow-sm transition-colors relative z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
          >
            <MoreVertical className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col">
          {/* Status Chip */}
          <div className="flex items-center">
            {trip.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-emerald-fill/15 text-yale-blue border border-ocean-mist/30">
                <span className="w-2 h-2 rounded-full bg-ocean-mist" />
                <span>{getTripStatusLabel("ACTIVE")}</span>
              </span>
            )}
            {trip.status === "SETTLING" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-functional-warning-bg text-functional-warning border border-functional-warning/20">
                <span className="w-2 h-2 rounded-full bg-functional-warning animate-pulse" />
                <span>{getTripStatusLabel("SETTLING")}</span>
              </span>
            )}
            {trip.status === "COMPLETED" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-lime-cream text-yale-blue border border-light-green">
                <CheckCircle2 className="w-4 h-4 text-functional-positive stroke-[2.5]" />
                <span>{getTripStatusLabel("COMPLETED")}</span>
              </span>
            )}
          </div>

          {/* Trip Name */}
          <h2 className="text-xl font-bold text-yale-blue mt-3 group-hover:text-cerulean transition-colors truncate">
            {trip.name}
          </h2>

          {/* Destination & Dates */}
          <div className="flex flex-col gap-1.5 mt-2.5">
            <div className="flex items-center gap-2 text-[14px] text-text-muted">
              <MapPin className="w-4 h-4 text-cerulean shrink-0" />
              <span className="font-medium text-text-body truncate">
                {trip.destination}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-text-muted">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <span className="truncate">
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({trip.durationText})
              </span>
            </div>
          </div>

          {/* Member Avatars Stack */}
          <div className="flex items-center justify-between mt-4 pt-1">
            <div className="flex items-center -space-x-2" aria-label="Danh sách thành viên">
              {trip.members.slice(0, 4).map((member, idx) => (
                <div
                  key={member.id}
                  title={member.isNoAccount ? `${member.name} (${SPECIAL_LABELS.NO_ACCOUNT})` : member.name}
                  className={`w-8 h-8 rounded-full ${
                    avatarColors[idx % avatarColors.length]
                  } flex items-center justify-center text-[12px] font-bold ring-2 ring-white overflow-hidden shrink-0 select-none ${
                    member.isNoAccount ? "ring-dashed ring-ocean-mist" : ""
                  }`}
                >
                  {getInitials(member.name)}
                </div>
              ))}
              {trip.memberCount > 4 && (
                <div
                  title={`Và thêm ${trip.memberCount - 4} thành viên khác`}
                  className="w-8 h-8 rounded-full bg-ocean-mist text-white flex items-center justify-center text-[11px] font-bold ring-2 ring-white overflow-hidden shrink-0 select-none"
                >
                  +{trip.memberCount - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-text-muted font-medium">
              {trip.memberCount} thành viên
            </span>
          </div>
        </div>
      </div>

      {/* Footer: User Balance Details */}
      <div className="px-5 pb-5">
        <div className="w-full h-[1px] bg-border-hairline mb-3" />
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-text-muted font-medium">
            Số dư của bạn:
          </span>
          <div className="flex flex-col items-end">
            {trip.userBalance.type === "RECEIVE" && (
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-fill/20 text-functional-positive uppercase tracking-wide">
                  {getBalanceTypeLabel("RECEIVE")}
                </span>
                <span className="text-lg font-bold tabular-nums text-functional-positive">
                  +{formatMoney(trip.userBalance.amount)}
                </span>
              </div>
            )}
            {trip.userBalance.type === "PAY" && (
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-functional-warning-bg text-functional-negative uppercase tracking-wide">
                  {getBalanceTypeLabel("PAY")}
                </span>
                <span className="text-lg font-bold tabular-nums text-functional-negative">
                  -{formatMoney(trip.userBalance.amount)}
                </span>
              </div>
            )}
            {trip.userBalance.type === "SETTLED" && (
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-hover-row text-text-muted uppercase tracking-wide">
                  {getBalanceTypeLabel("SETTLED")}
                </span>
                <span className="text-lg font-bold tabular-nums text-text-muted">
                  0 ₫
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
