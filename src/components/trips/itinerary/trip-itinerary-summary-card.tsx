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

      {/* 2. Vector Art Illustration Card (Strictly inline SVG, no external requests) */}
      <div className="bg-surface-card rounded-2xl p-5 border border-divider-border shadow-[0_4px_16px_rgba(24,78,119,0.04)] overflow-hidden">
        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-b from-[#ebf5ff] to-[#f4f9ec] flex items-center justify-center border border-divider-border/60">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 320 144"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Background Sky & Hills */}
            <rect width="320" height="144" fill="#F4F9EC" />
            <path
              d="M0 80 Q 70 40 140 70 T 280 60 L 320 85 L 320 144 L 0 144 Z"
              fill="#D9ED92"
              opacity="0.6"
            />
            <path
              d="M0 100 Q 90 75 190 95 T 320 90 L 320 144 L 0 144 Z"
              fill="#B5E48C"
              opacity="0.5"
            />
            {/* Lake / Water Path */}
            <path
              d="M0 120 C 60 110, 120 135, 180 125 C 240 115, 280 130, 320 122 L 320 144 L 0 144 Z"
              fill="#52B69A"
              opacity="0.3"
            />
            {/* Pine Trees Silhouettes */}
            <polygon points="40,85 32,105 48,105" fill="#184E77" opacity="0.4" />
            <polygon points="52,80 43,103 61,103" fill="#1A759F" opacity="0.4" />
            <polygon points="260,82 252,104 268,104" fill="#184E77" opacity="0.35" />
            <polygon points="275,76 265,102 285,102" fill="#1A759F" opacity="0.4" />
            {/* Road ribbon */}
            <path
              d="M-10 130 Q 110 90 200 115 T 330 110"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M-10 130 Q 110 90 200 115 T 330 110"
              stroke="#1A759F"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Pin Marker */}
            <circle cx="160" cy="80" r="14" fill="#1A759F" fillOpacity="0.18" />
            <circle cx="160" cy="80" r="8" fill="#1A759F" />
            <circle cx="160" cy="80" r="3" fill="#FFFFFF" />
          </svg>

          {/* Overlay Badge */}
          <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm border border-divider-border text-[11px] font-semibold text-yale-blue shadow-sm">
            {trip.destination || "Hành trình"}
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
              <span>Bấm &ldquo;+ Chi tiêu&rdquo; để gắn ngay hóa đơn vào địa điểm.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
