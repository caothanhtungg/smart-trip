"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Wallet,
  CheckCircle2,
  Circle,
  Utensils,
  Lightbulb,
  Compass,
  Plus,
  Share2,
  Check,
  Camera,
  Maximize2,
} from "lucide-react";
import { TravelGuide, getGuideGallery } from "@/lib/guides/guide-data";
import {
  buildTripCreationUrlFromGuide,
  calculatePackingProgress,
} from "@/lib/guides/guide-utils";
import { Lightbox } from "@/components/ui/lightbox";
import { motion } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";

export interface GuideDetailModalProps {
  guide: TravelGuide | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "itinerary" | "food" | "packing" | "tips" | "photos";

function getSessionLabel(index: number, total: number): string {
  if (total <= 2) {
    return index === 0 ? "Buổi sáng" : "Buổi chiều / tối";
  }
  if (total === 3) {
    if (index === 0) return "Buổi sáng";
    if (index === 1) return "Buổi trưa";
    return "Buổi tối";
  }
  if (index === 0) return "Sáng sớm";
  if (index === 1) return "Trưa";
  if (index === 2) return "Chiều tà";
  return "Buổi tối";
}

function findPhotoIndexForPlace(
  placeName: string,
  photos: Array<{ caption?: string; tags?: string[] }>
): number {
  const normPlace = placeName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

  return photos.findIndex((p) => {
    const normCaption = (p.caption || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    const tags = (p.tags || []).map((t) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
    );

    return (
      normCaption.includes(normPlace) ||
      tags.some((t) => t.includes(normPlace) || normPlace.includes(t))
    );
  });
}

export function GuideDetailModal({
  guide,
  isOpen,
  onClose,
}: GuideDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("itinerary");
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(
    new Set()
  );
  const [copied, setCopied] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const [prevGuideId, setPrevGuideId] = React.useState<string | undefined>(guide?.id);
  if (guide?.id !== prevGuideId) {
    setPrevGuideId(guide?.id);
    setActiveTab("itinerary");
    setCheckedItems(new Set());
    setCopied(false);
    setIsLightboxOpen(false);
    setLightboxIndex(0);
  }

  // Handle ESC key (only if Lightbox is not handling it)
  React.useEffect(() => {
    if (!isOpen || isLightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLightboxOpen, onClose]);

  const galleryPhotos = React.useMemo(() => {
    if (!guide) return [];
    return getGuideGallery(guide);
  }, [guide]);

  if (!isOpen || !guide) {
    return null;
  }

  const tripCreationUrl = buildTripCreationUrlFromGuide(guide);
  const packingList = guide.sections.packingList || [];
  const packingStats = calculatePackingProgress(packingList, checkedItems);

  function toggleCheckItem(item: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function openLightboxAt(index: number) {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
      >
        {/* Scrim Overlay */}
        <div
          className="fixed inset-0 bg-[#184E77]/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={spring.dialog}
          className="relative w-full max-w-3xl bg-white dark:bg-[#141C2E] rounded-2xl shadow-2xl border border-[#DDEBD0] dark:border-[#24314A] overflow-hidden flex flex-col h-[90vh] sm:h-[88vh] max-h-[90vh] sm:max-h-[88vh] z-10"
        >
          {/* Hero Image Section */}
          <div
            className="relative w-full h-52 sm:h-64 bg-slate-100 dark:bg-slate-800 shrink-0 group cursor-pointer"
            onClick={() => openLightboxAt(0)}
            title="Nhấn để xem ảnh phóng to trong Lightbox"
          >
            <Image
              src={guide.coverPhoto.url}
              alt={guide.coverPhoto.caption}
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />

            {/* Close & Share Buttons */}
            <div
              className="absolute top-4 right-4 flex items-center gap-2 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Sao chép liên kết cẩm nang"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-[#D9ED92]" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Đóng modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Destination & Meta Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/80 text-[#184E77] dark:text-white border border-transparent dark:border-white/20 shadow-sm backdrop-blur-xs">
                <MapPin className="w-3.5 h-3.5 text-[#1A759F]" />
                {guide.destination} • {guide.province}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-xs">
                <Clock className="w-3.5 h-3.5 text-[#D9ED92]" />
                {guide.durationText}
              </span>
            </div>

            {/* Quick Lightbox Trigger Badge */}
            <div
              className="absolute bottom-4 right-4 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => openLightboxAt(0)}
                aria-label={`Xem trọn bộ ảnh ${galleryPhotos.length} ảnh trong trình xem Lightbox`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white text-xs font-semibold backdrop-blur-md border border-white/25 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#D9ED92]" />
                <span>Xem bộ ảnh ({galleryPhotos.length})</span>
              </button>
            </div>

            {/* Header Title inside Hero Image */}
            <div className="absolute bottom-4 left-4 right-28 sm:right-36 text-white pointer-events-none">
              <h2
                id="guide-modal-title"
                className="text-lg sm:text-2xl font-bold leading-tight drop-shadow-md text-balance"
              >
                {guide.title}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-white/90">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D9ED92]" />
                  {guide.bestSeason}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#D9ED92]">
                  <Wallet className="w-3.5 h-3.5" />
                  {guide.estimatedBudget}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation with Animated Gliding Underline */}
          <div className="flex items-center border-b border-[#E9ECEF] dark:border-[#24314A] bg-slate-50/60 dark:bg-[#0E1527] px-4 sm:px-6 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              { key: "itinerary", label: `Lịch trình mẫu (${guide.sections.sampleDays.length} ngày)`, icon: Compass, color: "text-[#1A759F]" },
              { key: "photos", label: `Bộ ảnh du lịch (${galleryPhotos.length})`, icon: Camera, color: "text-[#52B69A]" },
              { key: "food", label: `Ẩm thực (${guide.sections.foodHighlights.length})`, icon: Utensils, color: "text-[#52B69A]" },
              { key: "packing", label: `Hành trang (${packingStats.checked}/${packingStats.total})`, icon: CheckCircle2, color: "text-[#76C893]" },
              { key: "tips", label: "Mẹo & Chi phí", icon: Lightbulb, color: "text-amber-500" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={spring.press}
                  className={`relative py-3.5 px-3.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer select-none ${
                    isActive
                      ? "text-[#184E77] dark:text-[#38BDF8]"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.color}`} />
                  <span className="relative z-10">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="guide-modal-active-tab-indicator"
                      className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#184E77] dark:bg-[#38BDF8] rounded-full shadow-[0_1px_6px_rgba(24,78,119,0.4)]"
                      transition={spring.selection}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Tab Body Content (Scrollable with smooth tab transition) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Summary Banner */}
              <div className="p-3.5 rounded-xl bg-[#F4F9EC] dark:bg-[#1B253B] border border-[#DDEBD0] dark:border-[#24314A] text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="font-bold text-[#184E77] dark:text-[#38BDF8]">Tóm tắt cẩm nang: </span>
                {guide.summary}
              </div>

            {/* TAB 1: ITINERARY */}
            {activeTab === "itinerary" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#184E77] uppercase tracking-wider">
                  Gợi ý lộ trình chi tiết theo ngày
                </h4>
                <div className="space-y-3">
                  {guide.sections.sampleDays.map((dayPlan) => (
                    <div
                      key={dayPlan.day}
                      className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-[#99D98C] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#184E77] dark:bg-[#1A759F] text-white text-xs font-bold shrink-0">
                          {dayPlan.day}
                        </span>
                        <h5 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                          {dayPlan.title}
                        </h5>
                      </div>

                      {/* Vertical Timeline Mini: Trục thời gian nối các chặng trong ngày */}
                      <ol
                        className="relative pl-6 sm:pl-7 my-3 space-y-2.5 list-none m-0"
                        role="list"
                        aria-label={`Các chặng trong ngày ${dayPlan.day}`}
                      >
                        {dayPlan.places.map((place, pIdx) => {
                          const isLastPlace = pIdx === dayPlan.places.length - 1;
                          const sessionLabel = getSessionLabel(pIdx, dayPlan.places.length);
                          const photoIdx = findPhotoIndexForPlace(place, galleryPhotos);

                          return (
                            <li
                              key={place}
                              className="relative group/stop list-none"
                              role="listitem"
                            >
                              {/* Connector segment - mỗi chặng sở hữu đoạn line nối xuống chặng tiếp theo */}
                              {!isLastPlace && (
                                <div
                                  className="absolute -left-6 sm:-left-7 top-5 bottom-[-10px] w-[2px] bg-[#DDEBD0] -translate-x-1/2 group-hover/stop:bg-[#52B69A] transition-colors"
                                  aria-hidden="true"
                                />
                              )}

                              {/* Timeline Dot Indicator */}
                              <div
                                className={`absolute -left-6 sm:-left-7 top-2 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2 ring-4 ring-white shadow-2xs font-bold text-[10px] transition-transform group-hover/stop:scale-110 ${
                                  pIdx === 0
                                    ? "bg-[#184E77] text-white"
                                    : isLastPlace
                                    ? "bg-[#52B69A] text-white"
                                    : "bg-[#D9ED92] text-[#184E77] border border-[#B5E48C]"
                                }`}
                                aria-label={`Chặng ${pIdx + 1}: ${place}`}
                              >
                                {pIdx + 1}
                              </div>

                              {/* Stop Content Box */}
                              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/90 dark:bg-[#1A2337] hover:bg-[#F4F9EC] dark:hover:bg-[#202C45] border border-slate-100 dark:border-[#283858] transition-all">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-semibold text-[#184E77] dark:text-[#38BDF8] bg-white dark:bg-[#0E1527] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#2D3E60] shrink-0">
                                    {sessionLabel}
                                  </span>
                                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {place}
                                  </span>
                                </div>

                                {/* Quick Lightbox Button if photo exists in guide gallery */}
                                {photoIdx !== -1 && (
                                  <button
                                    type="button"
                                    onClick={() => openLightboxAt(photoIdx)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-[#1A759F] dark:text-[#38BDF8] bg-white dark:bg-[#0E1527] hover:bg-[#1A759F] hover:text-white dark:hover:bg-[#1A759F] border border-[#1A759F]/20 dark:border-[#38BDF8]/30 shadow-2xs transition-colors shrink-0 cursor-pointer"
                                    title={`Xem ảnh ${place} trong Lightbox`}
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span className="hidden sm:inline">Xem ảnh</span>
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ol>

                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5 border-t border-slate-100 dark:border-[#24314A] pt-2">
                        💡 {dayPlan.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: PHOTOS (LIGHTBOX GALLERY) */}
            {activeTab === "photos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#184E77] uppercase tracking-wider">
                      Bộ sưu tập thắng cảnh {guide.destination}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nhấn vào bất kỳ ảnh nào để mở trình xem ảnh toàn màn hình Lightbox
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4F9EC] text-[#184E77] border border-[#DDEBD0]">
                    {galleryPhotos.length} ảnh chụp sắc nét
                  </span>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {galleryPhotos.map((photo, idx) => (
                    <div
                      key={`${photo.url}-${idx}`}
                      onClick={() => openLightboxAt(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openLightboxAt(idx);
                        }
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-[#1A759F] shadow-xs hover:shadow-md transition-all cursor-pointer bg-slate-900"
                    >
                      <div className="relative w-full aspect-4/3 overflow-hidden">
                        <Image
                          src={photo.url}
                          alt={photo.caption}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                        {/* Expand Button Overlay on Hover */}
                        <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                          <Maximize2 className="w-3.5 h-3.5 text-[#D9ED92]" />
                        </div>

                        {/* Photo Number Tag */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 text-[11px] font-mono text-white/90 backdrop-blur-xs">
                          #{idx + 1}
                        </div>

                        {/* Caption and Photographer at Bottom */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                          <p className="text-xs font-semibold line-clamp-2 leading-tight">
                            {photo.caption}
                          </p>
                          {photo.photographer && (
                            <p className="text-[10px] text-slate-300 mt-1 truncate">
                              📷 {photo.photographer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: FOOD */}
            {activeTab === "food" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#184E77] uppercase tracking-wider">
                  Món ngon không thể bỏ lỡ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guide.sections.foodHighlights.map((food) => (
                    <div
                      key={food.name}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#52B69A] transition-colors"
                    >
                      <h5 className="font-bold text-sm text-[#184E77] flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-[#52B69A]" />
                        {food.name}
                      </h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {food.desc}
                      </p>
                      <div className="mt-2 text-xs font-semibold text-[#1E6091] bg-slate-50 px-2 py-1 rounded inline-block">
                        💰 {food.priceRange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PACKING */}
            {activeTab === "packing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#184E77] uppercase tracking-wider">
                    Danh sách hành trang chuẩn bị
                  </h4>
                  <span className="text-xs font-bold text-[#184E77]">
                    {packingStats.percentage}% hoàn tất
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#52B69A] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${packingStats.percentage}%` }}
                  />
                </div>

                {/* Checklist */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {packingList.map((item) => {
                    const isChecked = checkedItems.has(item);
                    return (
                      <div
                        key={item}
                        onClick={() => toggleCheckItem(item)}
                        className={`p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                          isChecked ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-[#52B69A] shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                        )}
                        <span
                          className={`text-xs sm:text-sm ${
                            isChecked
                              ? "text-slate-400 line-through"
                              : "text-slate-800 font-medium"
                          }`}
                        >
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: TIPS & BUDGET */}
            {activeTab === "tips" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#184E77] uppercase tracking-wider">
                  Mẹo du lịch & Kinh nghiệm tiết kiệm chi phí
                </h4>
                <div className="space-y-2.5">
                  {guide.sections.budgetTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#D9ED92] text-[#184E77] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </motion.div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-[#E9ECEF] bg-slate-50/80 dark:bg-[#0E1527] border-t border-[#E9ECEF] dark:border-[#24314A] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1B253B] hover:bg-slate-100 dark:hover:bg-[#24314A] border border-slate-200 dark:border-[#2D3E60] transition-colors cursor-pointer shadow-xs"
            >
              Đóng
            </button>

            <Link
              href={tripCreationUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#184E77] hover:bg-[#1A759F] text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo chuyến đi từ cẩm nang này</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Standalone Fullscreen Lightbox Modal */}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={galleryPhotos}
        initialIndex={lightboxIndex}
        title={`${guide.destination} — ${guide.title}`}
      />
    </>
  );
}
