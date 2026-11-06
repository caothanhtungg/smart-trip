"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { ItineraryItem } from "@/types/trip";

interface TripDeleteItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItineraryItem | null;
  onConfirmDelete: (
    id: string
  ) =>
    | Promise<{ success: boolean; message?: string }>
    | { success: boolean; message?: string };
}

export function TripDeleteItineraryModal({
  isOpen,
  onClose,
  item,
  onConfirmDelete,
}: TripDeleteItineraryModalProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleClose = () => {
    if (isDeleting) return;
    setError(null);
    onClose();
  };

  if (!isOpen || !item) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await onConfirmDelete(item.id);
      if (!res.success) {
        setError(res.message || "Không thể xóa địa điểm này.");
        setIsDeleting(false);
        return;
      }
      setIsDeleting(false);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa địa điểm."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-itinerary-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_40px_rgba(24,78,119,0.18)] border border-divider-border overflow-hidden p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-functional-negative flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="delete-itinerary-title"
              className="text-base sm:text-lg font-bold text-yale-blue leading-snug"
            >
              Xác nhận xóa địa điểm?
            </h3>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Bạn có chắc chắn muốn xóa &ldquo;
              <span className="font-semibold text-yale-blue">{item.placeName}</span>&rdquo; (
              {item.dayDate}, {item.startTime}) khỏi lịch trình không?
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-functional-negative text-xs font-medium">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-functional-negative hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xóa địa điểm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
