"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  MapPin,
  Map as MapIcon,
  List,
  Sparkles,
  CloudSun,
  Plus,
  ArrowRight,
  Maximize2,
  Calendar,
  Users,
} from "lucide-react";
import {
  POPULAR_DISCOVERY_DESTINATIONS,
  DiscoveryDestination,
} from "@/lib/geo/destination-photos";
import {
  DISCOVERY_CATEGORY_TABS,
  DiscoveryCategory,
  filterDestinationsByCategory,
} from "./discovery-model";
import { DiscoveryMap } from "./DiscoveryMap";
import { DestinationGalleryModal } from "@/components/itinerary/DestinationGalleryModal";
import { TripCardView } from "@/types/trip";
import { formatVnd } from "@/lib/money/format";

interface DiscoverySplitViewProps {
  trips?: TripCardView[];
  onCreateTrip?: () => void;
  userLocation?: [number, number] | null;
}

export function DiscoverySplitView({
  trips = [],
  onCreateTrip,
  userLocation,
}: DiscoverySplitViewProps) {
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
          <div
            className={`lg:col-span-6 xl:col-span-5 flex flex-col gap-6 ${
              mobileTab === "map" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Realtime Weather & Destination Recommendation Hero Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#184E77] via-[#1A759F] to-[#1E6091] text-white shadow-md relative overflow-hidden">
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
                Các điểm đến Đà Nẵng, Phú Quốc, Ninh Bình đang có nắng nhẹ,
                thuận lợi cho chụp ảnh và hoạt động ngoài trời.
              </p>
            </div>

            {/* Category Filter Pills (Dream Destini Style) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {DISCOVERY_CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#E05833] text-white shadow-xs"
                        : "bg-white text-text-body border border-[#E9ECEF] hover:bg-hover-row hover:border-[#184E77]/20"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Destination Horizontal Cards List */}
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-yale-blue uppercase tracking-wider">
                  Địa danh đề xuất ({filteredDestinations.length})
                </h3>
                <span className="text-xs text-text-muted">
                  Nhấn vào ảnh để xem bộ sưu tập
                </span>
              </div>

              {filteredDestinations.map((destination) => {
                const isSelected = selectedDestination?.id === destination.id;
                return (
                  <div
                    key={destination.id}
                    className={`group bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 flex flex-col sm:flex-row gap-3.5 ${
                      isSelected
                        ? "border-[#E05833] shadow-md ring-2 ring-[#E05833]/15"
                        : "border-[#E9ECEF] hover:border-[#E05833]/40 hover:shadow-sm"
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
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              onClick={() => setSelectedDestination(destination)}
                              className="font-bold text-sm sm:text-base text-yale-blue group-hover:text-[#E05833] transition-colors cursor-pointer truncate"
                            >
                              {destination.name}
                            </h4>
                            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#1A759F]" />
                              <span>{destination.province}</span>
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#184E77] whitespace-nowrap">
                            {destination.estimatedBudget}
                          </span>
                        </div>

                        <p className="text-xs text-text-body line-clamp-2 mt-1.5 leading-relaxed">
                          {destination.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {destination.photo.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#F1F3F5] text-text-muted"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#E9ECEF]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDestination(destination);
                            setMobileTab("map");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A759F] hover:text-[#184E77] transition-colors"
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
                  </div>
                );
              })}
            </div>

            {/* My Existing Trips Section (if any) */}
            {trips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E9ECEF] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-yale-blue uppercase tracking-wider">
                    Chuyến đi của bạn ({trips.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => router.push("/trips")}
                    className="text-xs font-semibold text-[#1A759F] hover:text-[#184E77] flex items-center gap-1"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trips.slice(0, 4).map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      className="p-3 bg-white rounded-xl border border-[#E9ECEF] hover:border-[#184E77]/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-yale-blue truncate">
                          {trip.name}
                        </h5>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {trip.destination}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-[#E9ECEF]/70">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#52B69A]" />
                          <span>{trip.memberCount} người</span>
                        </span>
                        <span className="font-semibold text-yale-blue">
                          {trip.durationText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: Big Interactive Discovery Map */}
          <div
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
          </div>
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
