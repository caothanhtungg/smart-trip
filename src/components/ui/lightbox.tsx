"use client";

import * as React from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Camera, User } from "lucide-react";
import {
  useCursorGallery,
  CursorGalleryIndicator,
} from "@/components/ui/cursor-gallery";

export interface LightboxImage {
  url: string;
  caption?: string;
  photographer?: string;
  tags?: string[];
  alt?: string;
}

export interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImage[];
  initialIndex?: number;
  title?: string;
}

/**
 * Component Lightbox: Bộ hiển thị ảnh toàn màn hình dạng Modal Dialog (aria-modal="true").
 * Tuân thủ tiêu chuẩn:
 * - Dùng thẻ native `<dialog>` với `showModal()` và `::backdrop` scrim tối màu mờ đục.
 * - Phím Escape để đóng, Backdrop click để đóng.
 * - Phím mũi tên Trái / Phải để duyệt ảnh, kèm `e.preventDefault()` chống cuộn trang phía sau.
 * - Preload ảnh kế tiếp & ảnh trước đó để lướt mượt mà, không bị chớp giật từ mờ sang nét.
 * - Khóa cuộn trang (body scroll lock) khi mở và hoàn trả lại khi đóng.
 * - Ghi nhớ phần tử kích hoạt (activeElement) và trả lại focus khi đóng.
 * - Dải thumbnail filmstrip bên dưới để chọn nhanh ảnh.
 */
export function Lightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const triggerElementRef = React.useRef<HTMLElement | null>(null);

  // Sync index when initialIndex changes or modal opens
  const [prevLightboxKey, setPrevLightboxKey] = React.useState(String(isOpen) + ':' + String(initialIndex));
  const currentLightboxKey = String(isOpen) + ':' + String(initialIndex);
  if (currentLightboxKey !== prevLightboxKey) {
    setPrevLightboxKey(currentLightboxKey);
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setIsLoaded(false);
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      if (typeof document !== "undefined") {
        triggerElementRef.current = document.activeElement as HTMLElement;
      }
    } else if (triggerElementRef.current) {
      try {
        triggerElementRef.current.focus();
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  // Handle native HTML5 <dialog> showModal / close
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (typeof dialog.showModal === "function" && !dialog.open) {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute("open", "");
        }
      } else if (!dialog.open) {
        dialog.setAttribute("open", "");
      }
    } else {
      if (typeof dialog.close === "function" && dialog.open) {
        try {
          dialog.close();
        } catch {
          dialog.removeAttribute("open");
        }
      } else if (dialog.open) {
        dialog.removeAttribute("open");
      }
    }
  }, [isOpen]);

  // Lock body scroll when lightbox is open
  React.useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handlePrev = React.useCallback(() => {
    if (images.length <= 1) return;
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = React.useCallback(() => {
    if (images.length <= 1) return;
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleNavigate = React.useCallback(
    (direction: -1 | 1) => {
      if (direction === -1) {
        handlePrev();
      } else {
        handleNext();
      }
    },
    [handlePrev, handleNext]
  );

  const {
    containerRef,
    cursorRef,
    cursorSide,
    handlePointerMove,
    handlePointerLeave,
    handleClick,
  } = useCursorGallery({
    total: images.length,
    currentIndex,
    onNavigate: handleNavigate,
    isCircular: true,
  });

  // Preload adjacent images for instantaneous transition without blurry pop
  React.useEffect(() => {
    if (!isOpen || images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;

    if (typeof window !== "undefined" && typeof window.Image === "function") {
      try {
        const imgNext = new window.Image();
        imgNext.src = images[nextIdx].url;
        const imgPrev = new window.Image();
        imgPrev.src = images[prevIdx].url;
      } catch {
        // ignore
      }
    }
  }, [isOpen, currentIndex, images]);

  // Keyboard navigation: Escape to dismiss, Arrow keys to paginate without scrolling page
  React.useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex] || images[0];

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={title || "Trình xem ảnh toàn màn hình"}
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent border-0 outline-none flex flex-col justify-between select-none animate-in fade-in duration-200 backdrop:bg-transparent overflow-hidden"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {/* Dark Scrim Backdrop */}
      <div
        className="absolute inset-0 bg-black/92 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* TOP HEADER CONTROLS */}
      <div className="relative z-10 w-full px-4 sm:px-6 py-4 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent">
        {/* Destination / Title & Counter */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-5 h-5 text-[#D9ED92] shrink-0" />
            <h3 className="text-sm sm:text-base font-bold truncate max-w-[200px] sm:max-w-md">
              {title || currentImage.caption || "Thư viện ảnh cẩm nang"}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-mono font-semibold tracking-wider text-slate-200 shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng trình xem ảnh"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* MAIN STAGE: Center Enlarged Image & Navigation Controls */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center px-4 sm:px-12 my-auto overflow-hidden">
        {/* Previous Arrow Button: Chỉ hiển thị trên mobile/màn hình cảm ứng */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Ảnh trước đó"
            className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40 shrink-0 z-20 shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Stage Image Container with Interactive Cursor Gallery */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          className="relative w-full max-w-5xl h-[65vh] sm:h-[72vh] mx-auto flex items-center justify-center md:cursor-none select-none"
        >
          {/* Floating Directional Cursor Badge (Desktop) */}
          <CursorGalleryIndicator
            cursorRef={cursorRef}
            cursorSide={cursorSide}
          />

          <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
            <Image
              key={currentImage.url}
              src={currentImage.url}
              alt={currentImage.alt || currentImage.caption || `Ảnh ${currentIndex + 1}`}
              fill
              unoptimized
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              onLoad={() => setIsLoaded(true)}
              className={`object-contain transition-all duration-300 drop-shadow-2xl ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
            />
          </div>
        </div>

        {/* Next Arrow Button: Chỉ hiển thị trên mobile/màn hình cảm ứng */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Ảnh tiếp theo"
            className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40 shrink-0 z-20 shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* BOTTOM CAPTION BAR & FILMSTRIP THUMBNAILS */}
      <div className="relative z-10 w-full px-4 sm:px-6 py-3 flex flex-col items-center bg-gradient-to-t from-black/85 via-black/60 to-transparent gap-2.5">
        {/* Caption & Photographer Credit */}
        <div className="text-center max-w-2xl px-4">
          {currentImage.caption && (
            <p className="text-xs sm:text-sm text-slate-100 font-medium line-clamp-2">
              {currentImage.caption}
            </p>
          )}
          {currentImage.photographer && (
            <p className="text-[11px] text-slate-400 mt-0.5 inline-flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Nhiếp ảnh: {currentImage.photographer}</span>
            </p>
          )}
        </div>

        {/* Filmstrip Thumbnails (if multiple images) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 pt-0.5 no-scrollbar px-2">
            {images.map((img, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setIsLoaded(false);
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Chuyển đến ảnh ${idx + 1}`}
                  className={`relative w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${isSelected
                      ? "ring-2 ring-[#D9ED92] scale-105 opacity-100 shadow-md"
                      : "opacity-45 hover:opacity-85 border border-white/20"
                    }`}
                >
                  <Image
                    src={img.url}
                    alt={img.caption || `Thumbnail ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </dialog>
  );
}
