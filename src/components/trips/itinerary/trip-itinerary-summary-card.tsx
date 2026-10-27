"use client";

import * as React from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  Compass,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { ItineraryItem, TripExpense, TripDetailData } from "@/types/trip";
import { TripDayInfo } from "@/lib/itinerary/date";
import { formatVnd } from "@/lib/money/format";
import InteractiveMap, { MapPoint } from "@/components/map/InteractiveMap";
import { getDestinationCoordinates, resolveItemCoordinates } from "@/lib/geo/destination-coords";

interface TripItinerarySummaryCardProps {
  trip: TripDetailData;
  tripDays: TripDayInfo[];
  selectedDate: string;
  items: ItineraryItem[];
  expenses: TripExpense[];
}

export function TripItinerarySummaryCard({
  trip,
  tripDays,
  selectedDate,
  items,
  expenses,
}: TripItinerarySummaryCardProps) {
  const currentDayInfo = tripDays.find((d) => d.dateString === selectedDate) || tripDays[0];

  const dayItems = React.useMemo(() => {
    return items.filter((it) => it.dayDate === selectedDate);
  }, [items, selectedDate]);

  // Calculate actual time span for the day from real stop data
  const timeSpanText = React.useMemo(() => {
    if (dayItems.length === 0) return "Chưa có lịch trình";
    const startTimes = dayItems
      .map((it) => it.startTime)
      .filter((t): t is string => Boolean(t))
      .sort();
    const endTimes = dayItems
      .map((it) => it.endTime || it.startTime)
      .filter((t): t is string => Boolean(t))
      .sort();

    if (startTimes.length === 0) return "Chưa có giờ";
    const earliest = startTimes[0];
    const latest = endTimes[endTimes.length - 1];
    return `${earliest} - ${latest}`;
  }, [dayItems]);

  // Calculate real linked expenses for this day
  const { linkedCount, totalLinkedAmount } = React.useMemo(() => {
    let count = 0;
    let sum = 0;
    const seenExpenseIds = new Set<string>();

    for (const item of dayItems) {
      if (item.expenseId && !seenExpenseIds.has(item.expenseId)) {
        seenExpenseIds.add(item.expenseId);
        const exp = expenses.find((e) => e.id === item.expenseId);
        if (exp) {
          count++;
          sum += exp.amount;
        }
      }
    }
    return { linkedCount: count, totalLinkedAmount: sum };
  }, [dayItems, expenses]);

  const mapPoints = React.useMemo<MapPoint[]>(() => {
    const list: MapPoint[] = [];
    for (let idx = 0; idx < dayItems.length; idx++) {
      const it = dayItems[idx];
      const coords = resolveItemCoordinates(it, trip.destination);
      if (coords) {
        list.push({
          id: it.id,
          title: it.placeName,
          address: it.address ?? undefined,
          latitude: coords[0],
          longitude: coords[1],
          sortOrder: it.sortOrder ?? idx,
          isLocked: it.isLocked,
        });
      }
    }
    return list;
  }, [dayItems, trip.destination]);

  const defaultCenter = React.useMemo(() => {
    if (mapPoints.length > 0) {
      return [mapPoints[0].latitude, mapPoints[0].longitude] as [number, number];
    }
    return getDestinationCoordinates(trip.destination);
  }, [mapPoints, trip.destination]);

  return (
    <div className="space-y-6 sticky top-24">
      {/* 1. Day Summary Card */}
      <div className="bg-surface-card rounded-2xl p-5 border border-divider-border shadow-[0_4px_16px_rgba(24,78,119,0.05)]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-divider-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-cerulean">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-yale-blue">
                Tóm tắt {currentDayInfo?.fullFormattedText || "Hành trình"}
              </h3>
              <p className="text-[11px] text-text-muted">Dữ liệu thực từ phiên làm việc</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-lime-cream text-yale-blue font-bold text-xs">
            {currentDayInfo?.dayLabel || "Ngày"}
          </span>
        </div>

        {/* Real Metrics List */}
        <div className="space-y-3.5 text-xs sm:text-sm">
          {/* Stops Count */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cerulean" />
              Số điểm ghé thăm
            </span>
            <span className="font-bold text-yale-blue">
              {dayItems.length > 0 ? `${dayItems.length} địa điểm` : "Chưa có địa điểm"}
            </span>
          </div>

          {/* Time Span */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cerulean" />
              Khung giờ hoạt động
            </span>
            <span className="font-bold text-yale-blue">{timeSpanText}</span>
          </div>

          {/* Linked Expenses */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-cerulean" />
              Chi tiêu liên kết
            </span>
            <div className="text-right">
              <span className="font-bold text-cerulean block">
                {totalLinkedAmount > 0 ? formatVnd(totalLinkedAmount) : "0 ₫"}
              </span>
              <span className="text-[10px] text-text-muted block">
                {linkedCount > 0 ? `Đã gắn ${linkedCount} khoản chi` : "Chưa gắn hóa đơn"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Route Map Card */}
      <div className="bg-surface-card rounded-2xl p-4 border border-divider-border shadow-[0_4px_16px_rgba(24,78,119,0.04)] overflow-hidden">
        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-divider-border/60">
          <InteractiveMap
            points={mapPoints}
            center={defaultCenter}
            showRoute={true}
            zoom={mapPoints.length > 0 ? 13 : 12}
            className="w-full h-full rounded-xl"
          />
          <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs border border-divider-border text-[11px] font-bold text-yale-blue shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cerulean animate-ping" />
            <span>
              {mapPoints.length > 0
                ? `Bản đồ lộ trình (${mapPoints.length} điểm)`
                : `Bản đồ khu vực ${trip.destination || "điểm đến"}`}
            </span>
          </div>
        </div>

        {/* Travel Tips */}
        <div className="mt-4 pt-3 border-t border-divider-border/80">
          <h4 className="font-bold text-xs text-yale-blue flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-cerulean" />
            Lưu ý hành trình
          </h4>
          <ul className="space-y-1.5 text-xs text-text-muted">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-functional-positive shrink-0 mt-0.5" />
              <span>Chủ động kiểm tra thời tiết trước khi di chuyển.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-functional-positive shrink-0 mt-0.5" />
              <span>Bấm &ldquo;Tối ưu ngay&rdquo; để tự động xếp đường đi ngắn nhất.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
