'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import InteractiveMap, { MapPoint } from '@/components/map/InteractiveMap';
import { searchPlaces, PlaceSearchResult } from '@/lib/geo/nominatim';

interface DestinationMapPickerProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPlace?: (place: PlaceSearchResult) => void;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function DestinationMapPicker({
  value,
  onChange,
  onSelectPlace,
  error,
  inputRef,
}: DestinationMapPickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with prop value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await searchPlaces(query);
        setResults(places);
        if (places.length > 0) {
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: PlaceSearchResult) => {
    onChange(place.name);
    setQuery(place.name);
    setSelectedCoord({ lat: place.lat, lng: place.lng });
    setIsOpen(false);
    onSelectPlace?.(place);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoord({ lat, lng });
    const coordsStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    onChange(coordsStr);
    setQuery(coordsStr);
  };

  const mapPoints: MapPoint[] = selectedCoord
    ? [
        {
          id: 'selected-dest',
          title: value || 'Điểm đến đã chọn',
          latitude: selectedCoord.lat,
          longitude: selectedCoord.lng,
          sortOrder: 0,
        },
      ]
    : [];

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-5 h-5 text-text-muted pointer-events-none" />
        <input
          ref={inputRef as any}
          id="trip-destination"
          type="text"
          maxLength={150}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Tìm kiếm thành phố, địa danh (vd: Đà Lạt, Lâm Đồng; Quy Nhơn...)"
          className={`w-full h-12 pl-11 pr-10 rounded-xl bg-white text-yale-blue font-medium text-base border shadow-2xs transition-all duration-150 outline-none placeholder:text-text-muted/60 ${
            error
              ? 'border-functional-negative ring-2 ring-functional-negative/20'
              : 'border-border-hairline focus:border-cerulean focus:ring-3 focus:ring-ocean-mist/30'
          }`}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3.5 w-4 h-4 text-cerulean animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              setSelectedCoord(null);
            }}
            className="absolute right-3.5 p-1 rounded-full text-text-muted hover:text-yale-blue hover:bg-hover-row"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        {/* Autocomplete Suggestions Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-border-hairline z-50 overflow-hidden divide-y divide-border-hairline/60">
            {results.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-hover-row transition-colors"
              >
                <MapPin className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-yale-blue">{place.name}</span>
                  <span className="text-xs text-text-muted line-clamp-1">{place.address}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini Interactive Map Preview */}
      {selectedCoord && (
        <div className="relative rounded-2xl overflow-hidden border border-border-hairline shadow-xs">
          <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-semibold text-yale-blue shadow-2xs border border-border-hairline flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cerulean" />
            <span>Xem trước tọa độ điểm đến</span>
          </div>
          <InteractiveMap
            points={mapPoints}
            center={[selectedCoord.lat, selectedCoord.lng]}
            zoom={13}
            showRoute={false}
            className="w-full h-44 rounded-2xl"
            onMapClick={handleMapClick}
          />
        </div>
      )}
    </div>
  );
}
