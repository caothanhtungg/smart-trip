'use client';

import React from 'react';
import { Fuel, Wrench, MapPin, Navigation, Phone, ExternalLink } from 'lucide-react';
import { RoadsidePoi } from '@/lib/types/roadside';
import { formatDistance } from '@/lib/geo/roadside-format';

interface RoadsidePoiCardProps {
  poi: RoadsidePoi;
  onFocusOnMap?: (poi: RoadsidePoi) => void;
}

export default function RoadsidePoiCard({ poi, onFocusOnMap }: RoadsidePoiCardProps) {
  const isGas = poi.type === 'gas_station';
  const Icon = isGas ? Fuel : Wrench;

  const handleMapFocus = () => {
    if (onFocusOnMap) {
      onFocusOnMap(poi);
    } else {
      window.dispatchEvent(
        new CustomEvent('smart-trip:focus-map', {
          detail: {
            latitude: poi.latitude,
            longitude: poi.longitude,
            name: poi.name,
          },
        })
      );
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;

  return (
    <div className="rounded-xl border border-[#DDEBD0] bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isGas ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-[#1A759F]'
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  isGas ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                {isGas ? 'Cây xăng' : 'Sửa xe & Cứu hộ'}
              </span>
              {poi.brand && (
                <span className="text-[11px] font-medium text-neutral-500">
                  • {poi.brand}
                </span>
              )}
            </div>

            <h4 className="mt-1 text-xs sm:text-sm font-semibold text-[#184E77] leading-snug">
              {poi.name}
            </h4>
          </div>
        </div>

        {poi.distanceKm !== undefined && (
          <div className="flex items-center gap-1 shrink-0 rounded-full bg-[#F4F9EC] px-2 py-0.5 text-xs font-bold text-[#184E77] border border-[#B5E48C]">
            <Navigation className="h-3 w-3 text-[#52B69A]" />
            <span>{formatDistance(poi.distanceKm)}</span>
          </div>
        )}
      </div>

      {/* Address & Hotline */}
      <div className="mt-2 space-y-1 text-xs text-neutral-600 pl-10">
        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
          <span className="truncate">{poi.address}</span>
        </div>

        {poi.phone && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <a
              href={`tel:${poi.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#184E77] hover:underline"
            >
              <Phone className="h-3 w-3 text-[#52B69A]" />
              <span>{poi.phone}</span>
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-[#F0F6EA] pt-2">
        <button
          type="button"
          onClick={handleMapFocus}
          className="inline-flex items-center gap-1 rounded-lg border border-[#DDEBD0] bg-white px-2.5 py-1 text-xs font-medium text-[#184E77] transition hover:bg-[#F4F9EC]"
        >
          <MapPin className="h-3 w-3 text-[#52B69A]" />
          Xem bản đồ
        </button>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-[#B5E48C] bg-[#D9ED92]/30 px-2.5 py-1 text-xs font-medium text-[#184E77] transition hover:bg-[#D9ED92]"
        >
          <ExternalLink className="h-3 w-3 text-[#184E77]" />
          Chỉ đường
        </a>
      </div>
    </div>
  );
}
