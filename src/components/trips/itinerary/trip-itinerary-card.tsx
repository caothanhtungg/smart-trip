"use client";

import * as React from "react";
import {
  Clock,
  MapPin,
  FileText,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  DollarSign,
  Lock,
} from "lucide-react";
import {
  ItineraryItem,
  TripExpense,
  TripMember,
  TripStatus,
  TimeConflictInfo,
} from "@/types/trip";
import { classifyTimeOfDay, getTimeOfDayColorClasses } from "@/lib/itinerary/date";
import { formatVnd } from "@/lib/money/format";
import { canEditItineraryItem, canDeleteItineraryItem } from "@/lib/itinerary/validation";
import { TripItineraryConflictBadge } from "./trip-itinerary-conflict-badge";
import { WeatherBadge } from "@/components/itinerary/WeatherBadge";
import { resolveItemCoordinates } from "@/lib/geo/destination-coords";

interface TripItineraryCardProps {
  item: ItineraryItem;
  index: number;
  conflict?: TimeConflictInfo;
  tripStatus: TripStatus;
  currentMember?: TripMember;
  isHost: boolean;
  expenses: TripExpense[];
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
  onAddExpense: (item: ItineraryItem) => void;
}

export function TripItineraryCard({
  item,
  index,
  conflict,
  tripStatus,
  currentMember,
  isHost,
  expenses,
  onEdit,
  onDelete,
  onAddExpense,
}: TripItineraryCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const canEdit = canEditItineraryItem(item, currentMember?.id || "", isHost, tripStatus);
  const canDelete = canDeleteItineraryItem(item, currentMember?.id || "", isHost, tripStatus);
  const isTripActive = tripStatus === "ACTIVE";

  // Linked expense
  const linkedExpense = item.expenseId
    ? expenses.find((e) => e.id === item.expenseId)
    : undefined;

  const timeTag = classifyTimeOfDay(item.startTime);
  const timeColors = getTimeOfDayColorClasses(timeTag);
  const hasConflict = conflict && conflict.hasConflict;

  const coords = React.useMemo(() => resolveItemCoordinates(item), [item]);

  return (
    <div className="relative mb-6 group">
      {/* Node Pin Indicator */}
      <div
        className={`absolute -left-6 sm:-left-7 top-5 w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center -translate-x-1/2 shadow-xs ring-4 ring-bg-canvas z-10 transition-colors ${
          hasConflict
            ? "bg-functional-warning text-white ring-functional-warning-bg animate-pulse"
            : item.isLocked
            ? "bg-cerulean text-white ring-white"
            : "bg-lime-cream text-yale-blue ring-white"
        }`}
        aria-label={`Điểm dừng số ${index + 1}`}
      >
        {index + 1}
      </div>

      {/* Card Content */}
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-200 ${
          hasConflict
            ? "border border-functional-warning/50 shadow-[0_4px_20px_rgba(194,65,12,0.08)] hover:shadow-[0_8px_30px_rgba(194,65,12,0.12)]"
            : "border border-border-hairline shadow-[0_4px_20px_rgba(24,78,119,0.04)] hover:shadow-[0_8px_30px_rgba(24,78,119,0.08)]"
        }`}
      >
        {/* Overlap Warning Banner */}
        {hasConflict && conflict && (
          <div className="mb-3">
            <TripItineraryConflictBadge conflict={conflict} />
          </div>
        )}

        {/* Card Header: Time & Title & More Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs text-text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cerulean" />
                {item.startTime}
                {item.endTime ? ` - ${item.endTime}` : ""}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${timeColors.bg} ${timeColors.text}`}
              >
                Buổi {timeTag.toLowerCase()}
              </span>
              {item.isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-fill/15 text-functional-positive border border-functional-positive/20">
                  <Lock className="w-3 h-3" />
                  <span>Cố định</span>
                </span>
              )}
              {coords && (
                <WeatherBadge
                  lat={coords[0]}
                  lng={coords[1]}
                  dateStr={item.dayDate}
                />
              )}
            </div>
            <h3 className="font-bold text-base sm:text-lg text-yale-blue leading-snug">
              {item.placeName}
            </h3>
          </div>

          {/* More actions menu (Edit / Delete) */}
          {(canEdit || canDelete) && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full hover:bg-hover-row hover:text-yale-blue flex items-center justify-center text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-cerulean/30 cursor-pointer"
                aria-label={`Tùy chọn cho ${item.placeName}`}
                aria-expanded={menuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-20 w-36 bg-white rounded-2xl shadow-[0_8px_30px_rgba(24,78,119,0.12)] border border-border-hairline py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(item);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-yale-blue hover:bg-hover-row flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-cerulean" />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(item);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-functional-negative hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa điểm dừng</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Address */}
        {item.address && (
          <div className="flex items-start gap-1.5 mt-2.5 text-text-muted text-xs leading-relaxed">
            <MapPin className="w-3.5 h-3.5 text-cerulean shrink-0 mt-0.5" />
            <span>{item.address}</span>
          </div>
        )}

        {/* Note Box */}
        {item.note && (
          <div className="mt-3 p-3 rounded-2xl bg-bg-canvas/80 flex items-start gap-2 border border-border-hairline/60">
            <FileText className="w-3.5 h-3.5 text-cerulean shrink-0 mt-0.5" />
            <p className="text-xs text-yale-blue leading-relaxed">{item.note}</p>
          </div>
        )}

        {/* Footer: Expense status & "+ Chi tiêu" action */}
        <div className="mt-4 pt-3.5 border-t border-border-hairline/60 flex items-center justify-between gap-2 flex-wrap">
          {linkedExpense ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-fill/15 text-functional-positive font-semibold text-xs border border-functional-positive/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-functional-positive" />
              <span>Đã chi: {formatVnd(linkedExpense.amount)}</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-text-muted" />
              Chưa gắn chi tiêu
            </span>
          )}

          {isTripActive && (
            <button
              type="button"
              onClick={() => onAddExpense(item)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-cerulean font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-cerulean/30 cursor-pointer"
              aria-label={`Thêm chi tiêu cho địa điểm ${item.placeName}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Chi tiêu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
