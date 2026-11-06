"use client";

import * as React from "react";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { TripCardView } from "@/types/trip";
import { formatMoney, formatDate } from "@/lib/utils";
import { getTripStatusLabel } from "@/lib/labels";
import { AvatarGroup } from "@/components/ui/avatar";
import { getDestinationPhoto } from "@/lib/geo/destination-photos";

interface TripCardProps {
  trip: TripCardView;
  onSelectTrip?: (trip: TripCardView) => void;
  onMoreActions?: (trip: TripCardView, e: React.MouseEvent) => void;
}

export function TripCard({ trip, onSelectTrip }: TripCardProps) {
  // Tìm ảnh thắng cảnh đại diện theo điểm đến hoặc tên chuyến đi
  const destinationPhoto = React.useMemo(() => {
    return getDestinationPhoto(trip.destination || trip.name);
  }, [trip.destination, trip.name]);

  // Fallback gradient nếu không có ảnh hoặc nền mặc định
  const gradientStyle = {
    background: trip.cover.via
      ? `linear-gradient(135deg, ${trip.cover.from} 0%, ${trip.cover.via} 50%, ${trip.cover.to} 100%)`
      : `linear-gradient(135deg, ${trip.cover.from} 0%, ${trip.cover.to} 100%)`,
  };

  return (
    <article
      onClick={() => onSelectTrip?.(trip)}
      className="group bg-white dark:bg-[#141C2E] rounded-[26px] border border-border-hairline dark:border-[#24314A] p-3.5 sm:p-4 overflow-hidden shadow-[0_4px_16px_rgba(24,78,119,0.06)] dark:shadow-none hover:shadow-[0_12px_28px_rgba(24,78,119,0.12)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer focus-within:ring-3 focus-within:ring-ocean-mist select-none"
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
        {/* Inset Media Container: Khung ảnh lọt lòng bo góc mềm mại */}
        <div className="relative h-[130px] sm:h-[140px] w-full rounded-[18px] sm:rounded-[20px] overflow-hidden bg-slate-100 dark:bg-[#1A2337]">
          {destinationPhoto ? (
            <>
              <Image
                src={destinationPhoto.url}
                alt={destinationPhoto.caption || trip.name}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full relative" style={gradientStyle}>
              {/* Vòng tròn đồng tâm nghệ thuật organic */}
              <div
                className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full border border-white/20 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute right-8 -bottom-12 w-24 h-24 rounded-full border border-white/15 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Floating Status Badge trên góc ảnh */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {trip.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                <span>{getTripStatusLabel("ACTIVE")}</span>
              </span>
            )}
            {trip.status === "SETTLING" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-[#FB923C] backdrop-blur-md border border-[#FB923C]/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FB923C] animate-pulse" />
                <span>{getTripStatusLabel("SETTLING")}</span>
              </span>
            )}
            {trip.status === "COMPLETED" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-[#4ADE80] backdrop-blur-md border border-[#4ADE80]/30 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] stroke-[2.5]" />
                <span>{getTripStatusLabel("COMPLETED")}</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Body: Tiêu đề & Thông tin hành trình */}
        <div className="px-1 pt-3.5 pb-1 flex flex-col">
          {/* Tên chuyến đi */}
          <h3 className="text-base sm:text-lg font-bold text-yale-blue dark:text-white group-hover:text-cerulean dark:group-hover:text-[#38BDF8] transition-colors truncate">
            {trip.name}
          </h3>

          {/* Điểm đến & Thời gian */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-text-muted dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cerulean dark:text-[#38BDF8] shrink-0" />
              <span className="font-medium text-text-body dark:text-slate-200 truncate">
                {trip.destination || "Chưa xác định"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-text-muted dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-text-muted dark:text-slate-400 shrink-0" />
              <span className="truncate">
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)} ({trip.durationText})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Row: Tinh gọn theo phong cách Ảnh 1 (Stats bên trái, Viên pill bên phải) */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-[#24314A]/80 flex items-center justify-between gap-2 px-1">
        {/* Bên trái: Avatars thành viên & số lượng */}
        <div className="flex items-center gap-1.5 min-w-0">
          <AvatarGroup
            items={trip.members}
            max={2}
            size="xs"
            ringColor="ring-white dark:ring-[#141C2E]"
          />
          <span className="text-xs text-text-muted dark:text-slate-400 font-medium whitespace-nowrap">
            {trip.memberCount} thành viên
          </span>
        </div>

        {/* Bên phải: Viên pill số dư bo tròn như nút Follow */}
        <div className="shrink-0">
          {trip.userBalance.type === "RECEIVE" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-[#163323] text-functional-positive dark:text-[#4ADE80] border border-emerald-200/80 dark:border-[#4ADE80]/30 tabular-nums shadow-2xs">
              +{formatMoney(trip.userBalance.amount)}
            </span>
          )}
          {trip.userBalance.type === "PAY" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-[#381E15] text-functional-negative dark:text-[#FB923C] border border-orange-200/80 dark:border-[#FB923C]/30 tabular-nums shadow-2xs">
              -{formatMoney(trip.userBalance.amount)}
            </span>
          )}
          {trip.userBalance.type === "SETTLED" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#1B253B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#2D3E60] tabular-nums shadow-2xs">
              Đã xong 0 ₫
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
