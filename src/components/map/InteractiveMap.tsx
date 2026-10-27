'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { TripLeafletMapProps } from './TripLeafletMap';

// Dynamic import Leaflet component with SSR disabled
const TripLeafletMap = dynamic(() => import('./TripLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-2xl bg-[#F4F9EC] border border-[#DDEBD0] flex flex-col items-center justify-center gap-3 animate-pulse text-[#184E77]/60">
      <div className="w-10 h-10 rounded-full border-3 border-[#52B69A] border-t-transparent animate-spin" />
      <span className="text-sm font-medium">Đang tải bản đồ tương tác...</span>
    </div>
  ),
});

export type { MapPoint, TripLeafletMapProps } from './TripLeafletMap';

export default function InteractiveMap(props: TripLeafletMapProps) {
  return <TripLeafletMap {...props} />;
}
