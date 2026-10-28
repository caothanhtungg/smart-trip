"use client";

import * as React from "react";
import {
  X,
  Camera,
  MapPin,
  Sparkles,
  Lightbulb,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getDestinationPhoto,
  getDestinationGallery,
  DestinationPhoto,
} from "@/lib/geo/destination-photos";

export interface DestinationGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function DestinationGalleryModal({
  isOpen,
  onClose,
  placeName,
  address,
  latitude,
  longitude,
}: DestinationGalleryModalProps) {
  const primaryPhoto = React.useMemo(
    () => getDestinationPhoto(placeName, address),
    [placeName, address]
  );

  const gallery = React.useMemo(() => {
    const list = getDestinationGallery(placeName);
    if (list.length === 0) {
      return [primaryPhoto];
    }
    return list;
  }, [placeName, primaryPhoto]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  // Reset active index when placeName changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [placeName]);

  // Handle ESC key to close
  React.useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPhoto: DestinationPhoto = gallery[activeIndex] || primaryPhoto;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#E9ECEF] flex items-center justify-between bg-white/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-[#E05833]/10 flex items-center justify-center text-[#E05833] shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                id="gallery-modal-title"
                className="text-base sm:text-lg font-bold text-yale-blue truncate"
              >
                {placeName}
              </h3>
              {address && (
                <p className="text-xs text-text-muted truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#1A759F]" />
                  <span>{address}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bộ sưu tập ảnh"
            className="w-9 h-9 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Hero Photo Container */}
          <div className="relative w-full aspect-16/10 sm:aspect-16/9 bg-slate-900 overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              loading="eager"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

            {/* Prev/Next Navigation Controls for multi-photo gallery */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))
                  }
                  aria-label="Ảnh trước"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))
                  }
                  aria-label="Ảnh kế tiếp"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo Caption & Photographer Attribution Overlay */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <p className="text-sm sm:text-base font-semibold drop-shadow-md leading-tight">
                {currentPhoto.caption}
              </p>
              <p className="text-[11px] text-white/80 mt-1 flex items-center gap-1.5">
                <span>Nhiếp ảnh: {currentPhoto.photographer}</span>
                {currentPhoto.tags.length > 0 && (
                  <span className="hidden sm:inline">
                    • {currentPhoto.tags.slice(0, 3).join(", ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Thumbnail Gallery Strip (if > 1) */}
          {gallery.length > 1 && (
            <div className="p-3 bg-[#F8F9FA] border-b border-[#E9ECEF] flex items-center gap-2 overflow-x-auto">
              {gallery.map((photo, idx) => (
                <button
                  key={photo.url}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeIndex
                      ? "border-[#E05833] scale-105 shadow-sm"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Information & Travel Tips Section */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Landmark Description */}
            {primaryPhoto.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Giới thiệu danh lam thắng cảnh
                </h4>
                <p className="text-sm text-text-body leading-relaxed">
                  {primaryPhoto.description}
                </p>
              </div>
            )}

            {/* Travel Tip */}
            {primaryPhoto.recommendedTip && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#D9ED92]/20 to-[#99D98C]/20 border border-[#B5E48C]/40 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#52B69A]/20 flex items-center justify-center text-[#184E77] shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-[#184E77]" />
                </div>
                <div className="text-xs text-yale-blue">
                  <span className="font-bold block mb-0.5">Mẹo tham quan từ chuyên gia:</span>
                  <p className="leading-relaxed text-text-body">{primaryPhoto.recommendedTip}</p>
                </div>
              </div>
            )}

            {/* Tags & Coordinates */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E9ECEF] text-xs text-text-muted">
              <div className="flex flex-wrap gap-1.5">
                {currentPhoto.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-[#F1F3F5] text-text-body text-[11px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {latitude != null && longitude != null && (
                <div className="font-mono text-[11px] text-text-muted">
                  GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E9ECEF] bg-[#F8F9FA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-body bg-white border border-[#E9ECEF] hover:bg-hover-row transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

