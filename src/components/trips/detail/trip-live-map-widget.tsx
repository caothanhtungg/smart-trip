'use client';

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Navigation,
  MapPin,
  Loader2,
  Calendar,
  Fuel,
  Wrench,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import InteractiveMap, { MapPoint } from '@/components/map/InteractiveMap';
import { TripDetailData, ItineraryItem } from '@/types/trip';
import { calculateNavigationStatus, findNearbyRoadsidePois } from '@/lib/geo/roadside-service';
import { formatDistance, formatTravelTime } from '@/lib/geo/roadside-format';
import RoadsidePoiList from './RoadsidePoiList';
import Link from 'next/link';

interface TripLiveMapWidgetProps {
  trip: TripDetailData;
  itineraryItems?: ItineraryItem[];
}

export function TripLiveMapWidget({ trip, itineraryItems = [] }: TripLiveMapWidgetProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [showRoadsideList, setShowRoadsideList] = useState(false);

  // Map points from itinerary items that have coordinates
  const mapPoints: MapPoint[] = useMemo(() => {
    return itineraryItems
      .filter((it) => (it.latitude != null && it.longitude != null) || (it.lat != null && it.lng != null))
      .map((it, idx) => ({
        id: it.id,
        title: it.placeName,
        address: it.address,
        latitude: (it.latitude ?? it.lat)!,
        longitude: (it.longitude ?? it.lng)!,
        sortOrder: it.sortOrder ?? idx,
        isLocked: it.isLocked,
      }));
  }, [itineraryItems]);

  // Request browser geolocation
  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Trình duyệt không hỗ trợ GPS');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Đang xác định tọa độ...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
        setLocationStatus('Đã cập nhật vị trí GPS');
      },
      () => {
        setIsLocating(false);
        setLocationStatus('Chưa được cấp quyền truy cập vị trí');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Calculate real-time navigation status & nearby roadside POIs
  const navStatus = useMemo(() => {
    return calculateNavigationStatus(userLocation, itineraryItems);
  }, [userLocation, itineraryItems]);

  const roadsidePois = useMemo(() => {
    const refLat = userLocation ? userLocation[0] : mapPoints[0]?.latitude;
    const refLng = userLocation ? userLocation[1] : mapPoints[0]?.longitude;

    if (refLat == null || refLng == null) {
      return [];
    }

    return findNearbyRoadsidePois(refLat, refLng, undefined, 40, 10);
  }, [userLocation, mapPoints]);

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline flex flex-col gap-4">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border-hairline">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-lime-cream flex items-center justify-center text-yale-blue">
            <Compass className="w-5 h-5 text-cerulean" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-yale-blue">
                Hiện trạng hành trình & Bản đồ
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF6E4] text-[#2E7D5B] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B] animate-ping" />
                Live Map
              </span>
            </div>
            <p className="text-xs text-text-muted">
              {mapPoints.length > 0
                ? `${mapPoints.length} điểm dừng đã định vị trên bản đồ`
                : 'Trực quan hóa tuyến đường di chuyển của cả nhóm'}
            </p>
          </div>
        </div>

        {/* GPS Location Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {locationStatus && (
            <span className="text-[11px] text-text-muted hidden md:inline">
              {locationStatus}
            </span>
          )}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hover-row hover:bg-lime-cream/60 text-yale-blue text-xs font-semibold border border-border-hairline transition-all active:scale-95"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 text-cerulean animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-cerulean" />
            )}
            <span>{userLocation ? 'Cập nhật lại GPS' : 'Bật định vị GPS'}</span>
          </button>
        </div>
      </div>

      {/* On-The-Road Navigation HUD */}
      {navStatus.nextStop && (
        <div className="rounded-xl border border-[#DDEBD0] bg-gradient-to-r from-[#F4F9EC] to-white p-3.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#52B69A]">
                Điểm đến tiếp theo
              </span>
              <h4 className="text-sm font-bold text-[#184E77] flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-4 w-4 text-[#1A759F] shrink-0" />
                <span>{navStatus.nextStop.title}</span>
              </h4>
            </div>

            {navStatus.distanceToNextStopKm !== null ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-[#DDEBD0] shadow-xs">
                  <Navigation className="h-4 w-4 text-[#52B69A]" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block leading-none">Còn lại</span>
                    <span className="text-xs font-bold text-[#184E77]">
                      {formatDistance(navStatus.distanceToNextStopKm)}
                    </span>
                  </div>
                </div>

                {navStatus.estimatedMinutesToNextStop !== null && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-[#DDEBD0] shadow-xs">
                    <Clock className="h-4 w-4 text-[#1A759F]" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block leading-none">Ước tính</span>
                      <span className="text-xs font-bold text-[#184E77]">
                        {formatTravelTime(navStatus.estimatedMinutesToNextStop)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-neutral-500 italic">
                Bật GPS để biết số km và thời gian di chuyển còn lại
              </span>
            )}
          </div>

          {/* Quick nearest emergency cards */}
          {(navStatus.nearestGasStation || navStatus.nearestRepairShop) && (
            <div className="mt-2.5 pt-2.5 border-t border-[#DDEBD0]/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-neutral-500 font-medium">Gần bạn nhất:</span>
              {navStatus.nearestGasStation && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200">
                  <Fuel className="h-3 w-3 text-amber-600" />
                  <span className="truncate max-w-[160px] font-semibold">{navStatus.nearestGasStation.name}</span>
                  {navStatus.nearestGasStation.distanceKm !== undefined && (
                    <span className="font-bold">({formatDistance(navStatus.nearestGasStation.distanceKm)})</span>
                  )}
                </span>
              )}
              {navStatus.nearestRepairShop && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-sky-800 border border-sky-200">
                  <Wrench className="h-3 w-3 text-[#1A759F]" />
                  <span className="truncate max-w-[160px] font-semibold">{navStatus.nearestRepairShop.name}</span>
                  {navStatus.nearestRepairShop.distanceKm !== undefined && (
                    <span className="font-bold">({formatDistance(navStatus.nearestRepairShop.distanceKm)})</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map View or Empty State */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border-hairline shadow-xs">
        {mapPoints.length > 0 || userLocation ? (
          <InteractiveMap
            points={mapPoints}
            userLocation={userLocation}
            roadsidePois={roadsidePois}
            showRoute={true}
            zoom={13}
            className="w-full h-72 sm:h-80 rounded-2xl"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-b from-[#ebf5ff]/60 to-[#f4f9ec] rounded-2xl flex flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-cerulean mb-1">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-yale-blue">Chưa có tọa độ điểm đến trong lịch trình</h4>
            <p className="text-xs text-text-muted max-w-sm">
              Hãy thêm các địa điểm ghé thăm kèm địa chỉ để hệ thống hiển thị đường đi và vị trí hiện trạng của nhóm.
            </p>
            <Link
              href={`/trips/${trip.id}/itinerary`}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Đến trang Lịch trình</span>
            </Link>
          </div>
        )}
      </div>

      {/* Expandable Roadside POI Section */}
      {roadsidePois.length > 0 && (
        <div className="border-t border-border-hairline pt-3">
          <button
            type="button"
            onClick={() => setShowRoadsideList((prev) => !prev)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#184E77] hover:text-[#1A759F] transition"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-600">
                <Fuel className="h-4 w-4" />
                <Wrench className="h-4 w-4 text-[#1A759F]" />
              </div>
              <span>Xem danh sách Cây xăng & Tiệm sửa xe gần đây ({roadsidePois.length} điểm)</span>
            </div>
            {showRoadsideList ? (
              <ChevronUp className="h-4 w-4 text-neutral-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            )}
          </button>

          {showRoadsideList && (
            <div className="mt-3">
              <RoadsidePoiList pois={roadsidePois} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
