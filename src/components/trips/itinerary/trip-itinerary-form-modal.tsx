"use client";

import * as React from "react";
import {
  X,
  MapPin,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
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

interface TripItineraryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripDetailData;
  tripDays: TripDayInfo[];
  initialItem?: ItineraryItem | null;
  defaultDate?: string;
  existingItems: ItineraryItem[];
  onSave: (formData: CreateItineraryItemFormData) => {
    success: boolean;
    message?: string;
  };
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
  const [errors, setErrors] = React.useState<ItineraryValidationErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: CreateItineraryItemFormData = {
      dayDate,
      placeName: placeName.trim(),
      address: address.trim() || undefined,
      startTime,
      endTime: endTime.trim() || undefined,
      note: note.trim() || undefined,
    };

    const valResult = validateItineraryItemForm(formData, trip.startDate, trip.endDate);

    if (!valResult.isValid) {
      setErrors(valResult.errors);
      return;
    }

    const res = onSave(formData);
    if (!res.success) {
      setSubmitError(res.message || "Không thể lưu địa điểm.");
      return;
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-modal-title"
    >
      <div className="relative w-full max-w-[680px] bg-white rounded-3xl shadow-[0_20px_40px_rgba(24,78,119,0.18)] border border-divider-border overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 sm:py-5 flex items-start justify-between border-b border-divider-border bg-white shrink-0">
          <div>
            <h2
              id="itinerary-modal-title"
              className="text-lg sm:text-xl font-bold text-yale-blue"
            >
              {isEditing ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Chuyến đi: <span className="font-semibold text-yale-blue">{trip.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors focus:outline-none focus:ring-2 focus:ring-cerulean/30"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-white">
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-functional-negative text-xs sm:text-sm font-medium">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* LEFT COLUMN: Location Name, Suggestions & Address */}
              <div className="space-y-4">
                {/* Location Title */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="itinerary-place-name-input"
                    className="text-xs sm:text-sm font-bold text-yale-blue flex items-center"
                  >
                    Tên địa điểm <span className="text-functional-negative ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-cerulean absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="itinerary-place-name-input"
                      type="text"
                      value={placeName}
                      onChange={(e) => {
                        setPlaceName(e.target.value);
                        if (errors.placeName)
                          setErrors((prev) => ({ ...prev, placeName: undefined }));
                      }}
                      placeholder="Ví dụ: Quảng trường Lâm Viên..."
                      className={`w-full h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm text-on-surface bg-bg-canvas/40 focus:outline-none focus:bg-white focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all ${
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

                {/* Quick Suggestion Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-cerulean" />
                    Gợi ý địa điểm phổ biến tại {trip.destination || "điểm đến"}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSpots.slice(0, 4).map((spot) => (
                      <button
                        key={spot}
                        type="button"
                        onClick={() => {
                          setPlaceName(spot);
                          if (errors.placeName)
                            setErrors((prev) => ({ ...prev, placeName: undefined }));
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-hover-row hover:bg-lime-cream/60 text-yale-blue border border-divider-border transition-colors text-left"
                      >
                        + {spot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="itinerary-address-input"
                    className="text-xs sm:text-sm font-semibold text-yale-blue"
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

                {/* Vector Map Illustration Thumbnail */}
                <div className="rounded-xl border border-divider-border overflow-hidden bg-gradient-to-br from-surface-container-low to-bg-canvas p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-surface-card border border-divider-border flex items-center justify-center shrink-0 text-cerulean shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-yale-blue truncate">
                      {placeName.trim() ? placeName : "Điểm đến trong hành trình"}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {address.trim() ? address : trip.destination || "Điểm đến"}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Day, Time & Note */}
              <div className="space-y-4">
                {/* Day Selection Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-yale-blue flex items-center">
                    Chọn ngày <span className="text-functional-negative ml-0.5">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {tripDays.map((d) => {
                      const isSelected = d.dateString === dayDate;
                      return (
                        <button
                          key={d.dateString}
                          type="button"
                          onClick={() => {
                            setDayDate(d.dateString);
                            if (errors.dayDate)
                              setErrors((prev) => ({ ...prev, dayDate: undefined }));
                          }}
                          className={`h-9 px-2 rounded-full font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all focus:outline-none ${
                            isSelected
                              ? "bg-cerulean text-white shadow-sm"
                              : "bg-surface-card hover:bg-hover-row text-yale-blue border border-divider-border"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-lime-cream shrink-0" />}
                          <span className="truncate">{d.dayLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.dayDate && (
                    <p className="text-[11px] text-functional-negative font-medium">
                      {errors.dayDate}
                    </p>
                  )}
                </div>

                {/* Time Pickers */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Start Time */}
                    <div className="space-y-1">
                      <label
                        htmlFor="itinerary-start-time"
                        className="text-xs font-semibold text-yale-blue flex items-center"
                      >
                        Bắt đầu <span className="text-functional-negative ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-cerulean absolute left-2.5 top-3.5 pointer-events-none" />
                        <input
                          id="itinerary-start-time"
                          type="time"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            if (errors.startTime)
                              setErrors((prev) => ({ ...prev, startTime: undefined }));
                          }}
                          className={`w-full h-10 pl-8 pr-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 ${
                            errors.startTime
                              ? "border-functional-negative bg-red-50"
                              : "border-divider-border"
                          }`}
                        />
                      </div>
                      {errors.startTime && (
                        <p className="text-[10px] text-functional-negative font-medium">
                          {errors.startTime}
                        </p>
                      )}
                    </div>

                    {/* End Time */}
                    <div className="space-y-1">
                      <label
                        htmlFor="itinerary-end-time"
                        className="text-xs font-semibold text-yale-blue"
                      >
                        Kết thúc
                      </label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-3.5 pointer-events-none" />
                        <input
                          id="itinerary-end-time"
                          type="time"
                          value={endTime}
                          onChange={(e) => {
                            setEndTime(e.target.value);
                            if (errors.endTime)
                              setErrors((prev) => ({ ...prev, endTime: undefined }));
                          }}
                          className={`w-full h-10 pl-8 pr-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 ${
                            errors.endTime
                              ? "border-functional-negative bg-red-50"
                              : "border-divider-border"
                          }`}
                        />
                      </div>
                      {errors.endTime && (
                        <p className="text-[10px] text-functional-negative font-medium">
                          {errors.endTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Duration and Live Conflict Alert Badge */}
                  {liveConflict.hasConflict ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-functional-warning-bg text-functional-warning text-[11px] font-semibold border border-functional-warning/30">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {liveConflict.message ||
                          `Trùng ${liveConflict.overlapMinutes} phút với "${liveConflict.conflictingPlaceName}"`}
                      </span>
                    </div>
                  ) : durationMin !== null && durationMin > 0 ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald/15 text-functional-positive text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-functional-positive" />
                      <span>
                        Thời lượng dự kiến: {formatDurationHuman(durationMin)} · Không trùng lịch
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Group Note */}
                <div className="space-y-1">
                  <label
                    htmlFor="itinerary-note-input"
                    className="text-xs font-semibold text-yale-blue flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                    Ghi chú cho nhóm (tùy chọn)
                  </label>
                  <textarea
                    id="itinerary-note-input"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Trang phục, vé cổng, lưu ý đặc biệt..."
                    className="w-full p-2.5 rounded-xl border border-divider-border bg-bg-canvas/30 text-xs sm:text-sm text-on-surface focus:outline-none focus:bg-white focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-divider-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Info className="w-4 h-4 text-cerulean shrink-0" />
              <span>Tất cả thành viên đều có thể xem điểm dừng này</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row text-xs sm:text-sm font-semibold transition-colors focus:outline-none"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-10 sm:h-11 px-6 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-cerulean/40"
              >
                <MapPin className="w-4 h-4" />
                <span>{isEditing ? "Lưu thay đổi" : "Lưu địa điểm"}</span>
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
