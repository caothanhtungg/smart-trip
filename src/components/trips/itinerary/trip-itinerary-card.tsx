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
  Maximize2,
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
import { getDestinationPhoto } from "@/lib/geo/destination-photos";
import { DestinationGalleryModal } from "@/components/itinerary/DestinationGalleryModal";

export interface ItemTimeStatus {
  isPast: boolean;
  isInProgress: boolean;
  isUpcoming: boolean;
}

/**
 * Tính toán trạng thái thời gian thực tế của một điểm dừng:
 * - Đã qua (isPast)
 * - Đang diễn ra (isInProgress): giờ hiện tại nằm giữa startTime và endTime trong ngày hôm nay
 * - Sắp tới (isUpcoming)
 */
export function calculateItemTimeStatus(
  dayDate: string,
  startTime?: string | null,
  endTime?: string | null,
  referenceDate: Date = new Date()
): ItemTimeStatus {
  try {
    const todayStr = [
      referenceDate.getFullYear(),
      String(referenceDate.getMonth() + 1).padStart(2, "0"),
      String(referenceDate.getDate()).padStart(2, "0"),
    ].join("-");

    if (dayDate < todayStr) {
      return { isPast: true, isInProgress: false, isUpcoming: false };
    }
    if (dayDate > todayStr) {
      return { isPast: false, isInProgress: false, isUpcoming: true };
    }

    if (!startTime) {
      return { isPast: false, isInProgress: false, isUpcoming: true };
    }

    // dayDate === todayStr (Hôm nay)
    const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

    const [startH, startM] = startTime.split(":").map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);

    let endMinutes = startMinutes + 60; // Mặc định 1 tiếng nếu không có endTime
    if (endTime) {
      const [endH, endM] = endTime.split(":").map(Number);
      endMinutes = (endH || 0) * 60 + (endM || 0);
    }

    if (currentMinutes > endMinutes) {
      return { isPast: true, isInProgress: false, isUpcoming: false };
    }
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { isPast: false, isInProgress: true, isUpcoming: false };
    }

    return { isPast: false, isInProgress: false, isUpcoming: true };
  } catch {
    return { isPast: false, isInProgress: false, isUpcoming: true };
  }
}

export interface TripItineraryCardProps {
  item: ItineraryItem;
  index: number;
  totalItems?: number;
  isLast?: boolean;
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
  totalItems,
  isLast = false,
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
  const [galleryOpen, setGalleryOpen] = React.useState(false);
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

  const timeTag = classifyTimeOfDay(item.startTime || "09:00");
  const timeColors = getTimeOfDayColorClasses(timeTag);
  const hasConflict = conflict && conflict.hasConflict;

  // Realtime progress status
  const timeStatus = React.useMemo(() => {
    return calculateItemTimeStatus(item.dayDate, item.startTime, item.endTime);
  }, [item.dayDate, item.startTime, item.endTime]);

  const coords = React.useMemo(() => resolveItemCoordinates(item), [item]);
  const photo = React.useMemo(
    () => getDestinationPhoto(item.placeName, item.address ?? undefined),
    [item.placeName, item.address]
  );

  return (
    <>
      <li
        className="relative pb-6 last:pb-2 group list-none"
        role="listitem"
        aria-label={`Điểm dừng ${index + 1}/${totalItems || index + 1}: ${item.placeName}`}
      >
        {/* Timeline Connector Line - Item sở hữu đoạn connector chạy từ dot xuống dot kế tiếp.
            Điểm dừng cuối cùng (isLast) tự động ngắt, không bị vạch thừa (overshoot) */}
        {!isLast && (
          <div
            className="absolute -left-7 sm:-left-9 top-12 bottom-0 w-[2px] bg-divider-border -translate-x-1/2 transition-colors group-hover:bg-cerulean/40"
            aria-hidden="true"
          />
        )}

        {/* Timeline Dot Indicator - Căn trục tâm x tuyệt đối khớp với Connector (-translate-x-1/2) */}
        <div
          className={`absolute -left-7 sm:-left-9 top-5 w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center -translate-x-1/2 shadow-xs ring-4 ring-bg-canvas z-10 transition-all ${
            hasConflict
              ? "bg-functional-warning text-white ring-functional-warning-bg animate-pulse"
              : timeStatus.isInProgress
              ? "bg-cerulean text-white ring-4 ring-[#D9ED92] ring-offset-2 ring-offset-bg-canvas animate-pulse shadow-md"
              : timeStatus.isPast
              ? "bg-emerald-fill/20 text-[#184E77] ring-white border border-[#52B69A]/30"
              : item.isLocked
              ? "bg-cerulean text-white ring-white"
              : "bg-lime-cream text-yale-blue ring-white border border-[#DDEBD0]"
          }`}
          aria-label={`Điểm dừng số ${index + 1}${
            timeStatus.isInProgress ? " - Đang diễn ra" : timeStatus.isPast ? " - Đã hoàn thành" : ""
          }`}
        >
          {timeStatus.isPast ? (
            <CheckCircle2 className="w-4 h-4 text-[#184E77]" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Card Content: Modern Horizontal Bento Card */}
        <div
          className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-200 ${
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

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: Destination Thumbnail with Quick Gallery Zoom */}
            <div
              onClick={() => setGalleryOpen(true)}
              className="relative w-full sm:w-36 md:w-44 h-32 sm:h-auto rounded-2xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer group/photo shadow-xs"
              title="Nhấn để xem bộ sưu tập ảnh và thông tin chi tiết"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover/photo:scale-106 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-end justify-between p-2 text-white">
                <span className="text-[10px] font-medium truncate max-w-[80%]">
                  {photo.caption}
                </span>
                <div className="w-6 h-6 rounded-md bg-black/40 backdrop-blur-xs flex items-center justify-center">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Right: Item Details & Actions */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Header: Semantic Time, Badges, Weather & Actions Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Machine-readable Semantic <time> element */}
                      {item.startTime ? (
                        <span className="font-semibold text-xs text-text-muted flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                          <Clock className="w-3.5 h-3.5 text-cerulean shrink-0" />
                          <time
                            dateTime={`${item.dayDate}T${item.startTime}`}
                            className="font-mono text-slate-800 font-bold"
                          >
                            {item.startTime}
                          </time>
                          {item.endTime && (
                            <>
                              <span className="text-slate-400">→</span>
                              <time
                                dateTime={`${item.dayDate}T${item.endTime}`}
                                className="font-mono text-slate-800 font-bold"
                              >
                                {item.endTime}
                              </time>
                            </>
                          )}
                        </span>
                      ) : null}

                      {/* In-progress Active Status Pill */}
                      {timeStatus.isInProgress && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-[#D9ED92] text-[#184E77] border border-[#52B69A]/40 shadow-xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#52B69A]" />
                          <span>Đang diễn ra</span>
                        </span>
                      )}

                      {/* Completed Status Pill */}
                      {timeStatus.isPast && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] bg-slate-100 text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-[#52B69A]" />
                          <span>Đã xong</span>
                        </span>
                      )}

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

                    <h3 className="font-bold text-base sm:text-lg text-yale-blue leading-snug truncate">
                      {item.placeName}
                    </h3>
                  </div>

                  {/* Actions Dropdown Menu */}
                  {(canEdit || canDelete) && (
                    <div className="relative shrink-0" ref={menuRef}>
                      <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Tùy chọn địa điểm"
                        className="p-1.5 rounded-lg text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors focus:outline-none focus:ring-2 focus:ring-cerulean/30 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-divider-border py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                onEdit(item);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-hover-row flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-text-muted" />
                              <span>Chỉnh sửa thông tin</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                onDelete(item);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-functional-danger hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-functional-danger" />
                              <span>Xóa điểm dừng này</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Address info */}
                {item.address && (
                  <p className="text-xs text-text-muted flex items-start gap-1.5 mt-2 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-cerulean shrink-0 mt-0.5" />
                    <span className="truncate">{item.address}</span>
                  </p>
                )}

                {/* Notes */}
                {item.note && (
                  <p className="text-xs text-text-muted flex items-start gap-1.5 mt-1.5 line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item.note}</span>
                  </p>
                )}
              </div>

              {/* Bottom Row: Linked Expense or Add Expense CTA */}
              <div className="mt-4 pt-3 border-t border-border-hairline flex items-center justify-between gap-2 flex-wrap">
                {linkedExpense ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-functional-positive bg-emerald-fill/15 px-2.5 py-1 rounded-full border border-functional-positive/20">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{formatVnd(linkedExpense.amount)}</span>
                    </span>
                    <span className="text-text-muted truncate max-w-[200px]">
                      {linkedExpense.title}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-text-muted italic">
                    Chưa có khoản chi nào gắn với điểm dừng này
                  </span>
                )}

                {isTripActive && !linkedExpense && (
                  <button
                    type="button"
                    onClick={() => onAddExpense(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cerulean hover:text-baltic-blue bg-cerulean/10 hover:bg-cerulean/15 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ghi khoản chi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </li>

      {/* Destination Photo Gallery Modal */}
      <DestinationGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        placeName={item.placeName}
        address={item.address ?? undefined}
        latitude={coords?.[0]}
        longitude={coords?.[1]}
      />
    </>
  );
}
