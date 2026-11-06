"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";
import {
  MapPin,
  Map as MapIcon,
  List,
  CloudSun,
  Plus,
  Maximize2,
  Star,
} from "lucide-react";
import {
  POPULAR_DISCOVERY_DESTINATIONS,
  DiscoveryDestination,
} from "@/lib/geo/destination-photos";
import {
  getDestinationRatingSummary,
} from "@/lib/reviews/destination-review-service";
import {
  DISCOVERY_CATEGORY_TABS,
  DiscoveryCategory,
  filterDestinationsByCategory,
} from "./discovery-model";
import { DiscoveryMap } from "./DiscoveryMap";
import { DestinationGalleryModal } from "@/components/itinerary/DestinationGalleryModal";
interface DiscoverySplitViewProps {
  userLocation?: [number, number] | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function DiscoverySplitView({ userLocation }: DiscoverySplitViewProps) {
  const router = useRouter();

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<DiscoveryCategory>("all");

  // Selected destination on map
  const [selectedDestination, setSelectedDestination] =
    useState<DiscoveryDestination | null>(null);

  // Gallery Modal state
  const [galleryDestination, setGalleryDestination] =
    useState<DiscoveryDestination | null>(null);

  // Mobile view tab: "list" or "map"
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");

  // Filtered destination list
  const filteredDestinations = useMemo(() => {
    return filterDestinationsByCategory(
      POPULAR_DISCOVERY_DESTINATIONS,
      activeCategory
    );
  }, [activeCategory]);

  const handleCreateTripTo = (destination: DiscoveryDestination) => {
    router.push(`/trips/new?destination=${encodeURIComponent(destination.name)}`);
  };

  return (
    <>
      <div className="w-full flex flex-col gap-5">
        {/* Mobile View Toggle Bar */}
        <div className="lg:hidden flex items-center justify-between p-1.5 bg-[#F1F3F5] rounded-2xl border border-[#E9ECEF]">
          <button
            type="button"
            onClick={() => setMobileTab("list")}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
              mobileTab === "list"
                ? "bg-white text-yale-blue shadow-xs"
                : "text-text-muted hover:text-yale-blue"
            }`}
          >
            <List className="w-4 h-4" />
            <span>Danh sách điểm đến ({filteredDestinations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("map")}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
              mobileTab === "map"
                ? "bg-white text-yale-blue shadow-xs"
                : "text-text-muted hover:text-yale-blue"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Bản đồ tương tác</span>
          </button>
        </div>

        {/* Main Split-View Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Content, Filters & Horizontal Destination Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`lg:col-span-6 xl:col-span-5 flex flex-col gap-6 ${
              mobileTab === "map" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Realtime Weather & Destination Recommendation Hero Card */}
            <motion.div
              variants={itemVariants}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#184E77] via-[#1A759F] to-[#1E6091] text-white shadow-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-[#D9ED92] backdrop-blur-xs">
                  <CloudSun className="w-3.5 h-3.5" />
                  <span>Dự báo thời tiết du lịch</span>
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Việt Nam hôm nay
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                Thời tiết lý tưởng cho các hành trình trải nghiệm
              </h3>
              <p className="text-xs text-white/85 leading-relaxed mt-1">
                Các điểm đến Tràng An – Tam Cốc, Phong Nha – Kẻ Bàng, Vịnh Hạ Long, Sa Pa, Cao nguyên đá Hà Giang, Thánh địa Mỹ Sơn, Cố đô Huế, Chùa Thiên Mụ, Phố cổ Hội An, Cát Bà – Vịnh Lan Hạ, Thác Bản Giốc, Đảo Ngọc Phú Quốc, Đà Lạt ngàn hoa, Quần đảo Côn Đảo, Mũi Né – Phan Thiết, Mai Châu bản Thái, Núi Bà Đen Tây Ninh, Bà Nà Hills Đà Nẵng, Tam Đảo Vĩnh Phúc, VQG Ba Vì Hà Nội, Núi Hàm Lợn Sóc Sơn, Bãi biển Sầm Sơn Thanh Hóa, Chùa Tam Chúc Hà Nam, Làng gốm Bát Tràng Hà Nội, Eo Gió Quy Nhơn, Vịnh Nha Trang đang có nắng đẹp,
                thuận lợi cho chèo kayak, ngắm vịnh và hoạt động ngoài trời.
              </p>
            </motion.div>

            {/* Category Filter Pills (Dream Destini Style) */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {DISCOVERY_CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.key;
                return (
                  <motion.button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={spring.press}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                      isActive
                        ? "text-white shadow-xs"
                        : "bg-white dark:bg-[#1E293B] text-text-body dark:text-slate-200 border border-[#E9ECEF] dark:border-[#2D3A54] hover:bg-hover-row dark:hover:bg-[#28354E] hover:border-[#E05833]/40 hover:text-[#E05833] dark:hover:text-[#F38A6B]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="discovery-category-pill"
                        className="absolute inset-0 bg-[#E05833] rounded-full shadow-xs"
                        transition={spring.selection}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Destination Horizontal Cards List */}
            <div className="flex flex-col gap-3.5">
              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-yale-blue dark:text-slate-100 uppercase tracking-wider">
                  Địa danh đề xuất ({filteredDestinations.length})
                </h3>
                <span className="text-xs text-text-muted dark:text-slate-400">
                  Nhấn vào ảnh để xem bộ sưu tập
                </span>
              </motion.div>

              {filteredDestinations.map((destination) => {
                const isSelected = selectedDestination?.id === destination.id;
                return (
                  <motion.div
                    key={destination.id}
                    variants={itemVariants}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className={`group bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 flex flex-col sm:flex-row gap-3.5 ${
                      isSelected
                        ? "border-[#E05833] shadow-md ring-2 ring-[#E05833]/15 bg-white dark:bg-[#1E293B]"
                        : "border-[#E9ECEF] dark:border-[#2D3A54] hover:border-[#E05833]/40 hover:shadow-sm bg-white dark:bg-[#1E293B]"
                    }`}
                  >
                    {/* Left: Thumbnail with Quick Zoom */}
                    <div
                      onClick={() => setGalleryDestination(destination)}
                      className="relative w-full sm:w-28 md:w-32 h-28 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer shadow-2xs"
                      title="Nhấn để xem bộ ảnh phóng to"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={destination.photo.url}
                        alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {destination.badge}
                      </span>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 drop-shadow" />
                      </div>
                    </div>

                    {/* Right: Content & Quick Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Title & Rating */}
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            onClick={() => setSelectedDestination(destination)}
                            className="font-bold text-sm sm:text-base text-yale-blue dark:text-white group-hover:text-[#E05833] dark:group-hover:text-[#E05833] transition-colors cursor-pointer truncate"
                          >
                            {destination.name}
                          </h4>
                          {(() => {
                            const rating = getDestinationRatingSummary(destination.id || destination.name);
                            return rating.totalReviews > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                {rating.averageRating}
                                <span className="text-amber-600/80 font-normal">({rating.totalReviews})</span>
                              </span>
                            ) : null;
                          })()}
                        </div>

                        {/* Location & Estimated Budget Meta Row */}
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-1">
                          <p className="text-xs text-text-muted dark:text-slate-400 flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 text-[#1A759F] shrink-0" />
                            <span className="truncate">{destination.province}</span>
                          </p>
                          <span className="inline-flex items-center text-[11px] font-semibold text-[#184E77] dark:text-sky-300 bg-hover-row/80 dark:bg-[#131B2E] px-2 py-0.5 rounded-md max-w-full truncate">
                            {destination.estimatedBudget}
                          </span>
                        </div>

                        <p className="text-xs text-text-body dark:text-slate-300 line-clamp-2 mt-1.5 leading-relaxed">
                          {destination.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {destination.photo.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#F1F3F5] dark:bg-[#131B2E] text-text-muted dark:text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#E9ECEF] dark:border-[#2D3A54]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDestination(destination);
                            setMobileTab("map");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A759F] dark:text-sky-400 hover:text-[#184E77] dark:hover:text-sky-300 transition-colors"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>Xem trên bản đồ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreateTripTo(destination)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E05833] hover:bg-[#D04823] text-white shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo chuyến đi</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Pane: Big Interactive Discovery Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`lg:col-span-6 xl:col-span-7 h-[500px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 ${
              mobileTab === "list" ? "hidden lg:block" : "block"
            }`}
          >
            <DiscoveryMap
              destinations={filteredDestinations}
              selectedDestination={selectedDestination}
              onSelectDestination={(dest) => setSelectedDestination(dest)}
              onCreateTripToDestination={handleCreateTripTo}
              userLocation={userLocation}
              className="w-full h-full rounded-3xl"
            />
          </motion.div>
        </div>
      </div>

      {/* Destination Photo Gallery Modal */}
      {galleryDestination && (
        <DestinationGalleryModal
          isOpen={true}
          onClose={() => setGalleryDestination(null)}
          placeName={galleryDestination.name}
          address={galleryDestination.province}
          latitude={galleryDestination.coordinates[0]}
          longitude={galleryDestination.coordinates[1]}
        />
      )}
    </>
  );
}
