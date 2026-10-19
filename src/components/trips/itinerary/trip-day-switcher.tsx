"use client";

import * as React from "react";
import { TripDayInfo } from "@/lib/itinerary/date";
import { ItineraryItem } from "@/types/trip";

interface TripDaySwitcherProps {
  tripDays: TripDayInfo[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  items: ItineraryItem[];
}

export function TripDaySwitcher({
  tripDays,
  selectedDate,
  onSelectDate,
  items,
}: TripDaySwitcherProps) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
      role="tablist"
      aria-label="Chọn ngày trong lịch trình"
    >
      {tripDays.map((day) => {
        const isActive = day.dateString === selectedDate;
        const dayStopCount = items.filter((it) => it.dayDate === day.dateString).length;

        return (
          <button
            key={day.dateString}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`day-panel-${day.dayIndex}`}
            id={`day-tab-${day.dayIndex}`}
            onClick={() => onSelectDate(day.dateString)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-xs sm:text-sm shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-cerulean/30 ${
              isActive
                ? "bg-cerulean text-on-primary shadow-[0_2px_8px_rgba(26,117,159,0.25)]"
                : "bg-surface-card hover:bg-hover-row text-yale-blue border border-divider-border shadow-[0_1px_4px_rgba(24,78,119,0.04)]"
            }`}
          >
            {isActive && <span className="w-2 h-2 rounded-full bg-lime-cream shrink-0" />}
            <span>{day.fullFormattedText}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-surface-container text-cerulean"
              }`}
            >
              {dayStopCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
