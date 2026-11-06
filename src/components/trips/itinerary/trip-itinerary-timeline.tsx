"use client";

import * as React from "react";
import { Plus, Calendar, Lock } from "lucide-react";
import {
  ItineraryItem,
  TripDetailData,
  TripExpense,
  TripMember,
  TimeConflictInfo,
} from "@/types/trip";
import { TripDayInfo } from "@/lib/itinerary/date";
import { detectTimeConflict, canAddItineraryItem } from "@/lib/itinerary/validation";
import { TripDaySwitcher } from "./trip-day-switcher";
import { TripItineraryCard } from "./trip-itinerary-card";

interface TripItineraryTimelineProps {
  trip: TripDetailData;
  tripDays: TripDayInfo[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  items: ItineraryItem[];
  expenses: TripExpense[];
  currentMember?: TripMember;
  isHost: boolean;
  onOpenAddModal: (dayDate: string) => void;
  onEditItem: (item: ItineraryItem) => void;
  onDeleteItem: (item: ItineraryItem) => void;
  onAddExpenseForItem: (item: ItineraryItem) => void;
}

export function TripItineraryTimeline({
  trip,
  tripDays,
  selectedDate,
  onSelectDate,
  items,
  expenses,
  currentMember,
  isHost,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
  onAddExpenseForItem,
}: TripItineraryTimelineProps) {
  const isTripActive = trip.status === "ACTIVE";
  const canAdd = canAddItineraryItem(trip.status, currentMember?.status || "ACTIVE");

  // Selected day object
  const currentDayInfo = tripDays.find((d) => d.dateString === selectedDate) || tripDays[0];

  // Items for selected date
  const dayItems = React.useMemo(() => {
    return items.filter((item) => item.dayDate === selectedDate);
  }, [items, selectedDate]);

  // Compute time conflicts for items in this day
  const conflictMap = React.useMemo(() => {
    const map = new Map<string, TimeConflictInfo>();
    for (const item of dayItems) {
      const conf = detectTimeConflict(item, dayItems);
      if (conf.hasConflict) {
        map.set(item.id, conf);
      }
    }
    return map;
  }, [dayItems]);

  const dayHeading = currentDayInfo ? currentDayInfo.fullFormattedText : "Lịch trình";

  return (
    <div className="flex flex-col space-y-6">
      {/* View-only banner when trip is settling or completed */}
      {!isTripActive && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-medium">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {trip.status === "SETTLING"
              ? "Chuyến đi đang trong giai đoạn Quyết toán công nợ. Lịch trình chỉ ở chế độ xem."
              : "Chuyến đi đã hoàn thành. Lịch trình chỉ ở chế độ xem."}
          </span>
        </div>
      )}

      {/* Header Action Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-bold text-xl sm:text-2xl text-yale-blue tracking-tight">
            Lịch trình {dayHeading}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5 flex items-center gap-1.5">
            <span>{dayItems.length} địa điểm</span>
            <span>•</span>
            <span>{tripDays.length} ngày hành trình</span>
          </p>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => onOpenAddModal(selectedDate)}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 h-10 sm:h-11 bg-cerulean hover:bg-baltic-blue text-on-primary font-semibold text-xs sm:text-sm rounded-xl shadow-[0_4px_14px_rgba(26,117,159,0.25)] transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-cerulean/40"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm địa điểm</span>
          </button>
        )}
      </div>

      {/* Day Selector Tabs */}
      <TripDaySwitcher
        tripDays={tripDays}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        items={items}
      />

      {/* Timeline Section */}
      {dayItems.length > 0 ? (
        <div className="space-y-3">
          {/* Ordered Semantic List of Timeline Stops */}
          <ol
            className="relative pl-7 sm:pl-9 pt-2 list-none m-0 p-0"
            role="list"
            aria-label={`Danh sách ${dayItems.length} địa điểm trong ngày`}
          >
            {dayItems.map((item, idx) => (
              <TripItineraryCard
                key={item.id}
                item={item}
                index={idx}
                totalItems={dayItems.length}
                isLast={idx === dayItems.length - 1}
                conflict={conflictMap.get(item.id)}
                tripStatus={trip.status}
                currentMember={currentMember}
                isHost={isHost}
                expenses={expenses}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                onAddExpense={onAddExpenseForItem}
              />
            ))}
          </ol>

          {/* Add next stop button at bottom */}
          {canAdd && (
            <div className="relative pl-7 sm:pl-9 pt-1">
              <button
                type="button"
                onClick={() => onOpenAddModal(selectedDate)}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-divider-border hover:border-cerulean hover:bg-hover-row text-cerulean font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-cerulean/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm điểm dừng tiếp theo vào {currentDayInfo?.dayLabel || "ngày này"}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Day State */
        <div className="bg-surface-card rounded-2xl p-8 sm:p-12 border border-dashed border-divider-border text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-cerulean mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-yale-blue mb-1">
            Chưa có địa điểm nào trong {currentDayInfo?.dayLabel || "ngày này"}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted max-w-sm mb-6">
            Lên kế hoạch các địa điểm tham quan, ăn uống và nghỉ ngơi để chuyến đi diễn ra suôn sẻ!
          </p>

          {canAdd && (
            <button
              type="button"
              onClick={() => onOpenAddModal(selectedDate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cerulean hover:bg-baltic-blue text-on-primary font-semibold text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cerulean/40 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm địa điểm đầu tiên cho {currentDayInfo?.dayLabel || "ngày này"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
