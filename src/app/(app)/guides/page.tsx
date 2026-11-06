"use client";

import * as React from "react";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";
import {
  BookOpen,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Camera,
} from "lucide-react";
import { AppTopBar } from "@/components/layout/AppTopBar";
import {
  TRAVEL_GUIDES,
  GUIDE_REGION_TABS,
  TravelGuide,
  GuideRegion,
} from "@/lib/guides/guide-data";
import {
  filterGuidesByRegionAndQuery,
  getFeaturedGuideForRegion,
} from "@/lib/guides/guide-utils";
import { GuideCard } from "@/components/guides/GuideCard";
import { GuideDetailModal } from "@/components/guides/GuideDetailModal";

const guideContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const guideItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function GuidesPage() {
  const [selectedRegion, setSelectedRegion] = React.useState<GuideRegion>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGuide, setSelectedGuide] = React.useState<TravelGuide | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Filter guides
  const filteredGuides = React.useMemo(() => {
    return filterGuidesByRegionAndQuery(
      [...TRAVEL_GUIDES],
      selectedRegion,
      searchQuery
    );
  }, [selectedRegion, searchQuery]);

  // Featured hero guide: dynamically adapts to selected region or falls back to first guide in region
  const featuredGuide = React.useMemo(() => {
    return getFeaturedGuideForRegion(TRAVEL_GUIDES, selectedRegion);
  }, [selectedRegion]);

  function handleOpenDetail(guide: TravelGuide) {
    setSelectedGuide(guide);
    setIsDetailOpen(true);
  }

  function handleCloseDetail() {
    setIsDetailOpen(false);
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-canvas min-h-screen">
      {/* Top Bar */}
      <AppTopBar
        title="Cẩm nang du lịch"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <motion.div
        variants={guideContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6"
      >
        {/* Featured Hero Banner */}
        {!searchQuery && featuredGuide && (
          <motion.div
            key={featuredGuide.id}
            variants={guideItemVariants}
            className="relative w-full rounded-2xl overflow-hidden border border-[#DDEBD0] shadow-md group cursor-pointer"
            onClick={() => handleOpenDetail(featuredGuide)}
          >
            <div className="relative w-full h-64 sm:h-80 md:h-96">
              <Image
                src={featuredGuide.coverPhoto.url}
                alt={featuredGuide.coverPhoto.caption}
                fill
                priority
                unoptimized
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#184E77]/95 via-[#184E77]/40 to-transparent" />

              {/* Featured Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D9ED92] dark:bg-[#163323] text-[#184E77] dark:text-[#4ADE80] border border-transparent dark:border-[#4ADE80]/30 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#184E77]" />
                  {selectedRegion === "all"
                    ? "Cẩm nang nổi bật tuần này"
                    : `Cẩm nang nổi bật • ${
                        GUIDE_REGION_TABS.find((t) => t.key === selectedRegion)?.label || "Vùng miền"
                      }`}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 text-white backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-[#D9ED92]" />
                  {featuredGuide.durationText}
                </span>
              </div>

              {/* Photos Gallery Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/50 text-white backdrop-blur-xs border border-white/20">
                <Camera className="w-3.5 h-3.5 text-[#D9ED92]" />
                <span>{(featuredGuide.gallery?.length || 0) + 1} ảnh thắng cảnh</span>
              </div>

              {/* Banner Text Content */}
              <div className="absolute bottom-6 left-6 right-6 text-white max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-[#D9ED92] font-semibold mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {featuredGuide.destination} • {featuredGuide.province}
                  </span>
                  <span>•</span>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{featuredGuide.bestSeason}</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                  {featuredGuide.title}
                </h2>

                <p className="mt-2 text-xs sm:text-sm text-white/90 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {featuredGuide.summary}
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={spring.press}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(featuredGuide);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#184E77] hover:bg-[#F4F9EC] transition-all shadow-sm cursor-pointer"
                  >
                    <span>Khám phá cẩm nang</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <span className="text-xs text-white/80 hidden sm:inline">
                    Ước tính: {featuredGuide.estimatedBudget}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Region Filter Category Tabs */}
        <motion.div
          variants={guideItemVariants}
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {GUIDE_REGION_TABS.map((tab) => {
            const isActive = selectedRegion === tab.key;
            return (
              <motion.button
                key={tab.key}
                type="button"
                onClick={() => setSelectedRegion(tab.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={spring.press}
                className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shadow-xs cursor-pointer select-none ${
                  isActive
                    ? "text-white shadow-md"
                    : "bg-white dark:bg-[#141C2E] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#24314A] hover:border-[#99D98C] dark:hover:border-[#38BDF8]/40 hover:bg-[#F4F9EC] dark:hover:bg-[#1B253B]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="guide-region-active-pill"
                    className="absolute inset-0 bg-[#184E77] dark:bg-[#1A759F] rounded-full shadow-md dark:border dark:border-[#38BDF8]/40"
                    transition={spring.selection}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Search Results Summary Header */}
        <motion.div variants={guideItemVariants} className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <BookOpen className="w-4 h-4 text-[#1A759F]" />
            <span>
              Tìm thấy{" "}
              <strong className="text-[#184E77]">{filteredGuides.length}</strong>{" "}
              cẩm nang du lịch
              {searchQuery && (
                <span>
                  {" "}
                  phù hợp với từ khóa &ldquo;<strong>{searchQuery}</strong>&rdquo;
                </span>
              )}
            </span>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-[#1A759F] hover:underline cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          )}
        </motion.div>

        {/* Guides Grid */}
        {filteredGuides.length > 0 ? (
          <motion.div
            variants={guideItemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {filteredGuides.map((guide) => (
              <motion.div
                key={guide.id}
                variants={guideItemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <GuideCard
                  guide={guide}
                  onOpenDetail={handleOpenDetail}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy cẩm nang phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang khu vực &ldquo;Tất cả
              vùng miền&rdquo; để xem đầy đủ các điểm đến.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#184E77] text-white hover:bg-[#1A759F] transition-colors"
            >
              Xem tất cả cẩm nang
            </button>
          </div>
        )}
      </motion.div>

      {/* Guide Detail Modal */}
      <GuideDetailModal
        guide={selectedGuide}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
