"use client";

import * as React from "react";
import {
  X,
  MapPin,
  Clock,
  FileText,
  AlertTriangle,
  Sparkles,
  Info,
  Loader2,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  ItineraryItem,
  CreateItineraryItemFormData,
  TripDetailData,
  ItineraryValidationErrors,
} from "@/types/trip";
import {
  TripDayInfo,
  calculateDurationMinutes,
  formatDurationHuman,
} from "@/lib/itinerary/date";
import {
  validateItineraryItemForm,
  detectTimeConflict,
} from "@/lib/itinerary/validation";
import { searchPlaces } from "@/lib/geo/nominatim";
import { AdaptiveTimePicker } from "@/components/ui/adaptive-time-picker";

interface TripItineraryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripDetailData;
  tripDays: TripDayInfo[];
  initialItem?: ItineraryItem | null;
  defaultDate?: string;
  existingItems: ItineraryItem[];
  onSave: (
    formData: CreateItineraryItemFormData
  ) =>
    | Promise<{ success: boolean; message?: string }>
    | { success: boolean; message?: string };
}

// Popular spots by destination to enhance user experience without external APIs
const POPULAR_SPOTS: Record<string, string[]> = {
  "Đà Lạt": [
    "Quảng trường Lâm Viên",
    "Chợ Đêm Đà Lạt",
    "Hồ Xuân Hương",
    "Ga Đà Lạt",
    "Thác Datanla",
    "Đồi chè Cầu Đất",
  ],
  "Phú Quốc": [
    "Bãi Sao",
    "Sunset Town Hoàng Hôn",
    "Chợ đêm Phú Quốc",
    "Hòn Thơm",
    "Dinh Cậu",
  ],
  "Sa Pa": [
    "Đỉnh Fansipan",
    "Bản Cát Cát",
    "Đèo Ô Quy Hồ",
    "Nhà thờ Đá Sa Pa",
    "Thung lũng Mường Hoa",
  ],
};

function TripItineraryFormDialog({
  onClose,
  trip,
  tripDays,
  initialItem,
  defaultDate,
  existingItems,
  onSave,
}: Omit<TripItineraryFormModalProps, "isOpen">) {
  const isEditing = !!initialItem;

  // Form State initialized directly from props
  const [dayDate, setDayDate] = React.useState<string>(
    initialItem ? initialItem.dayDate : defaultDate || trip.startDate
  );
  const [placeName, setPlaceName] = React.useState<string>(
    initialItem ? initialItem.placeName : ""
  );
  const [address, setAddress] = React.useState<string>(
    initialItem ? initialItem.address || "" : ""
  );
  const [startTime, setStartTime] = React.useState<string>(
    initialItem ? initialItem.startTime || "09:00" : "09:00"
  );
  const [endTime, setEndTime] = React.useState<string>(
    initialItem ? initialItem.endTime || "" : "11:00"
  );
  const [note, setNote] = React.useState<string>(initialItem ? initialItem.note || "" : "");
  const latitude = initialItem ? initialItem.latitude ?? initialItem.lat ?? null : null;
  const longitude = initialItem ? initialItem.longitude ?? initialItem.lng ?? null : null;
  const isLocked = initialItem ? !!initialItem.isLocked : false;
  const [errors, setErrors] = React.useState<ItineraryValidationErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Destination quick spots
  const quickSpots = React.useMemo(() => {
    const dest = trip.destination || "";
    for (const [key, spots] of Object.entries(POPULAR_SPOTS)) {
      if (dest.toLowerCase().includes(key.toLowerCase())) {
        return spots;
      }
    }
    return [
      "Quảng trường trung tâm",
      "Khu phố ẩm thực",
      "Điểm ngắm hoàng hôn",
      "Quán cà phê view đẹp",
    ];
  }, [trip.destination]);

  // Live conflict & duration calculation
  const durationMin = calculateDurationMinutes(startTime, endTime);

  const liveConflict = React.useMemo(() => {
    if (!startTime || !dayDate) return { hasConflict: false };
    return detectTimeConflict(
      {
        id: initialItem?.id,
        dayDate,
        startTime,
        endTime: endTime || null,
      },
      existingItems
    );
  }, [dayDate, startTime, endTime, existingItems, initialItem?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    let finalLat = latitude;
    let finalLng = longitude;

    if (finalLat === null || finalLng === null) {
      try {
        const query = [placeName.trim(), address.trim(), trip.destination].filter(Boolean).join(", ");
        const results = await searchPlaces(query);
        if (results && results.length > 0) {
          finalLat = results[0].lat;
          finalLng = results[0].lng;
        }
      } catch {
        // Fallback silently if geocoding fails
      }
    }

    const formData: CreateItineraryItemFormData = {
      dayDate,
      placeName: placeName.trim(),
      address: address.trim() || undefined,
      latitude: finalLat,
      longitude: finalLng,
      isLocked,
      startTime,
      endTime: endTime.trim() || undefined,
      note: note.trim() || undefined,
    };

    const valResult = validateItineraryItemForm(formData, trip.startDate, trip.endDate);

    if (!valResult.isValid) {
      setErrors(valResult.errors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await onSave(formData);
      if (!res.success) {
        setSubmitError(res.message || "Không thể lưu địa điểm.");
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Đã có lỗi xảy ra khi lưu địa điểm."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-yale-blue/45 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-modal-title"
    >
      <div className="relative w-full max-w-[660px] bg-white rounded-3xl shadow-[0_24px_50px_rgba(24,78,119,0.18)] border border-divider-border overflow-visible flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 sm:py-5 flex items-start justify-between border-b border-divider-border bg-white rounded-t-3xl shrink-0">
          <div>
            <h2
              id="itinerary-modal-title"
              className="text-lg sm:text-xl font-bold text-yale-blue"
            >
              {isEditing ? "Chỉnh sửa địa điểm" : "Thêm địa điểm vào lịch trình"}
            </h2>
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Chuyến đi:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-yale-blue">
                {trip.name}
              </span>
              {trip.destination && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-cerulean font-medium">{trip.destination}</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors focus:outline-none focus:ring-2 focus:ring-cerulean/30 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-4 bg-white">
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-functional-negative text-xs sm:text-sm font-medium">
                {submitError}
              </div>
            )}

            {/* SYMMETRICAL 2-COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
              {/* ROW 1 - LEFT: Tên địa điểm */}
              <div className="space-y-1.5">
                <label
                  htmlFor="itinerary-place-name-input"
                  className="h-5 flex items-center text-xs sm:text-sm font-bold text-yale-blue"
                >
                  Tên địa điểm <span className="text-functional-negative ml-0.5">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-cerulean absolute left-3 top-3 pointer-events-none" />
                  <input
                    id="itinerary-place-name-input"
                    type="text"
                    value={placeName}
                    onChange={(e) => {
                      setPlaceName(e.target.value);
                      if (errors.placeName)
                        setErrors((prev) => ({ ...prev, placeName: undefined }));
                    }}
                    placeholder="Ví dụ: Bãi Sao, Cầu Rồng, Fansipan..."
                    className={`w-full h-10 pl-9 pr-3 rounded-xl border text-xs sm:text-sm text-on-surface bg-bg-canvas/30 focus:outline-none focus:bg-white focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all ${
                      errors.placeName
                        ? "border-functional-negative bg-red-50/50"
                        : "border-divider-border"
                    }`}
                  />
                </div>
                {errors.placeName && (
                  <p className="text-[11px] text-functional-negative font-medium">
                    {errors.placeName}
                  </p>
                )}
              </div>

              {/* ROW 1 - RIGHT: Chọn ngày */}
              <div className="space-y-1.5">
                <label
                  htmlFor="itinerary-day-select"
                  className="h-5 flex items-center text-xs sm:text-sm font-bold text-yale-blue"
                >
                  Chọn ngày <span className="text-functional-negative ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-cerulean absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="itinerary-day-select"
                    value={dayDate}
                    onChange={(e) => {
                      setDayDate(e.target.value);
                      if (errors.dayDate)
                        setErrors((prev) => ({ ...prev, dayDate: undefined }));
                    }}
                    className="w-full h-10 pl-9 pr-8 rounded-xl border border-divider-border text-xs sm:text-sm font-semibold text-yale-blue bg-bg-canvas/30 focus:outline-none focus:bg-white focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all cursor-pointer appearance-none"
                  >
                    {tripDays.map((d) => (
                      <option key={d.dateString} value={d.dateString}>
                        {d.dayLabel} • {d.dayOfWeekFull || d.dayOfWeekShort}, {d.dateString}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-3 pointer-events-none" />
                </div>
                {errors.dayDate && (
                  <p className="text-[11px] text-functional-negative font-medium">
                    {errors.dayDate}
                  </p>
                )}
              </div>

              {/* ROW 2 - LEFT: Gợi ý nhanh */}
              <div className="h-7 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-cerulean" />
                  Gợi ý:
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {quickSpots.slice(0, 3).map((spot) => (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => {
                        setPlaceName(spot);
                        if (errors.placeName)
                          setErrors((prev) => ({ ...prev, placeName: undefined }));
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-lime-cream/60 text-yale-blue border border-slate-200/70 transition-colors whitespace-nowrap"
                    >
                      + {spot}
                    </button>
                  ))}
                </div>
              </div>

              {/* ROW 2 - RIGHT: Thời lượng / Trạng thái trùng lịch */}
              <div className="h-7 flex items-center justify-between text-[11px]">
                <span className="text-text-muted font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cerulean" />
                  Thời lượng dự kiến:
                </span>
                {liveConflict.hasConflict ? (
                  <span className="font-bold text-functional-warning flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-functional-warning" />
                    Trùng {liveConflict.overlapMinutes}p
                  </span>
                ) : durationMin !== null && durationMin > 0 ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    {formatDurationHuman(durationMin)}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Chưa xác định</span>
                )}
              </div>

              {/* ROW 3 - LEFT: Địa chỉ */}
              <div className="space-y-1.5">
                <label
                  htmlFor="itinerary-address-input"
                  className="h-5 flex items-center text-xs sm:text-sm font-semibold text-yale-blue"
                >
                  Địa chỉ (tùy chọn)
                </label>
                <input
                  id="itinerary-address-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số đường, phường, quận/huyện..."
                  className="w-full h-10 px-3 rounded-xl border border-divider-border text-xs sm:text-sm text-on-surface bg-bg-canvas/30 focus:outline-none focus:bg-white focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all"
                />
              </div>

              {/* ROW 3 - RIGHT: Thời gian (Bắt đầu & Kết thúc) */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Bắt đầu */}
                  <div>
                    <label
                      htmlFor="itinerary-start-time"
                      className="h-5 flex items-center text-xs font-semibold text-yale-blue"
                    >
                      Bắt đầu <span className="text-functional-negative ml-0.5">*</span>
                    </label>
                    <AdaptiveTimePicker
                      id="itinerary-start-time"
                      value={startTime}
                      onChange={(newTime) => {
                        setStartTime(newTime);
                        if (errors.startTime)
                          setErrors((prev) => ({ ...prev, startTime: undefined }));
                      }}
                      hasError={!!errors.startTime}
                      align="left"
                    />
                    {errors.startTime && (
                      <p className="text-[10px] text-functional-negative font-medium mt-0.5">
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  {/* Kết thúc */}
                  <div>
                    <label
                      htmlFor="itinerary-end-time"
                      className="h-5 flex items-center text-xs font-semibold text-yale-blue"
                    >
                      Kết thúc
                    </label>
                    <AdaptiveTimePicker
                      id="itinerary-end-time"
                      value={endTime || "11:00"}
                      onChange={(newTime) => {
                        setEndTime(newTime);
                        if (errors.endTime)
                          setErrors((prev) => ({ ...prev, endTime: undefined }));
                      }}
                      hasError={!!errors.endTime}
                      align="right"
                    />
                    {errors.endTime && (
                      <p className="text-[10px] text-functional-negative font-medium mt-0.5">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW 4 - FULL WIDTH: Ghi chú cho nhóm */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 pt-1">
                <label
                  htmlFor="itinerary-note-input"
                  className="h-5 flex items-center text-xs sm:text-sm font-semibold text-yale-blue gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-cerulean" />
                  <span>Ghi chú cho nhóm (tùy chọn)</span>
                </label>
                <textarea
                  id="itinerary-note-input"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Trang phục, vé vào cổng, điểm hẹn, lưu ý gửi xe, đặt bàn..."
                  className="w-full h-18 p-2.5 rounded-xl border border-divider-border bg-bg-canvas/30 text-xs sm:text-sm text-on-surface focus:outline-none focus:bg-white focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 resize-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-divider-border rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Info className="w-4 h-4 text-cerulean shrink-0" />
              <span>Tất cả thành viên đều có thể xem điểm dừng này</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row text-xs sm:text-sm font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-cerulean/40 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>{isEditing ? "Lưu thay đổi" : "Lưu địa điểm"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TripItineraryFormModal(props: TripItineraryFormModalProps) {
  if (!props.isOpen) return null;
  return (
    <TripItineraryFormDialog
      key={`${props.initialItem?.id || "new"}-${props.defaultDate || props.trip.startDate}`}
      {...props}
    />
  );
}
