'use client';

import React, { useState, useMemo } from 'react';
import { Fuel, Wrench, Layers } from 'lucide-react';
import { RoadsidePoi, RoadsidePoiType } from '@/lib/types/roadside';
import RoadsidePoiCard from './RoadsidePoiCard';

interface RoadsidePoiListProps {
  pois: RoadsidePoi[];
  onFocusOnMap?: (poi: RoadsidePoi) => void;
  isLoading?: boolean;
}

export default function RoadsidePoiList({
  pois,
  onFocusOnMap,
  isLoading = false,
}: RoadsidePoiListProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | RoadsidePoiType>('all');

  const filteredPois = useMemo(() => {
    if (selectedFilter === 'all') return pois;
    return pois.filter((p) => p.type === selectedFilter);
  }, [pois, selectedFilter]);

  const gasCount = useMemo(() => pois.filter((p) => p.type === 'gas_station').length, [pois]);
  const repairCount = useMemo(() => pois.filter((p) => p.type === 'repair_shop').length, [pois]);

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'all'
              ? 'bg-[#184E77] text-white shadow-sm'
              : 'bg-[#F4F9EC] text-[#184E77] hover:bg-[#D9ED92]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Tất cả ({pois.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('gas_station')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'gas_station'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Fuel className="h-3.5 w-3.5" />
          Cây xăng ({gasCount})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('repair_shop')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'repair_shop'
              ? 'bg-[#1A759F] text-white shadow-sm'
              : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          Sửa xe / Cứu hộ ({repairCount})
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-2 py-4">
          <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : filteredPois.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DDEBD0] bg-[#F4F9EC] p-6 text-center text-xs text-neutral-500">
          Chưa tìm thấy cây xăng hoặc tiệm sửa xe nào trong bán kính gần đây. Bạn có thể bật GPS để tìm kiếm chính xác hơn.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredPois.map((poi) => (
            <RoadsidePoiCard key={poi.id} poi={poi} onFocusOnMap={onFocusOnMap} />
          ))}
        </div>
      )}
    </div>
  );
}
