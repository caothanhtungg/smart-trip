"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { DiscoveryDestination } from "@/lib/geo/destination-photos";
import type { MapPoint } from "@/components/map/TripLeafletMap";

interface DiscoveryMapProps {
  destinations: DiscoveryDestination[];
  selectedDestination?: DiscoveryDestination | null;
  onSelectDestination?: (destination: DiscoveryDestination) => void;
  onCreateTripToDestination?: (destination: DiscoveryDestination) => void;
  userLocation?: [number, number] | null;
  className?: string;
}

// Dynamically import InteractiveMap without SSR
const InteractiveMap = dynamic(
  () => import("@/components/map/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] rounded-3xl bg-[#F8F9FA] border border-[#E9ECEF] flex flex-col items-center justify-center gap-3 animate-pulse text-yale-blue/60 p-6">
        <div className="w-10 h-10 rounded-full border-3 border-[#E05833] border-t-transparent animate-spin" />
        <span className="text-sm font-semibold text-yale-blue">
          Đang tải bản đồ khám phá danh lam thắng cảnh...
        </span>
        <span className="text-xs text-text-muted">
          Đang nạp danh lam thắng cảnh Việt Nam
        </span>
      </div>
    ),
  }
);

export function DiscoveryMap({
  destinations,
  selectedDestination,
  onSelectDestination,
  onCreateTripToDestination,
  userLocation,
  className = "w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-sm border border-[#E9ECEF]",
}: DiscoveryMapProps) {
  // Convert DiscoveryDestination items to MapPoints for Leaflet
  const mapPoints: MapPoint[] = useMemo(() => {
    return destinations.map((d, index) => ({
      id: d.id,
      title: `${d.name} (${d.province})`,
      address: `${d.badge} • ${d.estimatedBudget}`,
      latitude: d.coordinates[0],
      longitude: d.coordinates[1],
      sortOrder: index,
      isLocked: d.id === selectedDestination?.id,
      photoUrl: d.photo.url,
    }));
  }, [destinations, selectedDestination]);

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedDestination) {
      return selectedDestination.coordinates;
    }
    if (userLocation) {
      return userLocation;
    }
    // Default: Center on Da Nang / Central Vietnam
    return [16.0544, 108.2022];
  }, [selectedDestination, userLocation]);

  const handleSelectPoint = (point: MapPoint) => {
    const matched = destinations.find((d) => d.id === point.id);
    if (matched && onSelectDestination) {
      onSelectDestination(matched);
    }
  };

  return (
    <div className={`relative isolate z-0 ${className}`}>
      <InteractiveMap
        points={mapPoints}
        center={mapCenter}
        zoom={selectedDestination ? 12 : 6}
        showRoute={false}
        onSelectPoint={handleSelectPoint}
        userLocation={userLocation}
        className="w-full h-full"
      />

      {/* Floating Selected Destination Quick Card on Map */}
      {selectedDestination && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-[#E9ECEF] z-10 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex gap-3.5 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedDestination.photo.url}
              alt={selectedDestination.name}
              className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E05833]/15 text-[#E05833]">
                  {selectedDestination.badge}
                </span>
                <span className="text-[11px] text-text-muted">
                  {selectedDestination.province}
                </span>
              </div>
              <h4 className="text-sm font-bold text-yale-blue truncate">
                {selectedDestination.name}
              </h4>
              <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                {selectedDestination.description}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#184E77] truncate min-w-0">
                  {selectedDestination.estimatedBudget}
                </span>
                {onCreateTripToDestination && (
                  <button
                    type="button"
                    onClick={() => onCreateTripToDestination(selectedDestination)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#E05833] hover:bg-[#D04823] text-white transition-colors shadow-2xs"
                  >
                    Tạo chuyến đi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

