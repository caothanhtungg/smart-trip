'use client';

import React from 'react';
import { Home, Bus, Utensils, Compass, MapPin, CalendarPlus, Receipt, Phone } from 'lucide-react';
import { AISuggestionItem, AISuggestionCategory } from '@/lib/types/ai-assistant';
import { formatVnd } from '@/lib/money/format';

interface AISuggestionCardProps {
  suggestion: AISuggestionItem;
  onFocusOnMap?: (suggestion: AISuggestionItem) => void;
  onAddToItinerary?: (suggestion: AISuggestionItem) => void;
  onAddToExpense?: (suggestion: AISuggestionItem) => void;
}

const CATEGORY_CONFIG: Record<
  AISuggestionCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string }
> = {
  homestay: {
    label: 'Homestay / Khách sạn',
    icon: Home,
    bg: 'bg-[#EBF5EE]',
    text: 'text-[#184E77]',
  },
  transport: {
    label: 'Nhà xe / Di chuyển',
    icon: Bus,
    bg: 'bg-[#E3F2FD]',
    text: 'text-[#1E6091]',
  },
  food: {
    label: 'Ăn uống / Đặc sản',
    icon: Utensils,
    bg: 'bg-[#FFF3E0]',
    text: 'text-[#D97706]',
  },
  attraction: {
    label: 'Tham quan / Check-in',
    icon: Compass,
    bg: 'bg-[#F4F9EC]',
    text: 'text-[#52B69A]',
  },
  other: {
    label: 'Địa điểm khác',
    icon: MapPin,
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
  },
};

export default function AISuggestionCard({
  suggestion,
  onFocusOnMap,
  onAddToItinerary,
  onAddToExpense,
}: AISuggestionCardProps) {
  const config = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.other;
  const CategoryIcon = config.icon;

  const hasCoords = typeof suggestion.latitude === 'number' && typeof suggestion.longitude === 'number';

  const handleMapClick = () => {
    if (onFocusOnMap) {
      onFocusOnMap(suggestion);
    } else if (hasCoords) {
      window.dispatchEvent(
        new CustomEvent('smart-trip:focus-map', {
          detail: {
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            name: suggestion.name,
          },
        })
      );
    }
  };

  const formattedPrice = React.useMemo(() => {
    if (suggestion.estimatedCostMin !== undefined && suggestion.estimatedCostMax !== undefined) {
      if (suggestion.estimatedCostMin === suggestion.estimatedCostMax) {
        return formatVnd(suggestion.estimatedCostMin);
      }
      return `${formatVnd(suggestion.estimatedCostMin)} - ${formatVnd(suggestion.estimatedCostMax)}`;
    }
    if (suggestion.estimatedCostMin !== undefined) {
      return `Từ ${formatVnd(suggestion.estimatedCostMin)}`;
    }
    if (suggestion.estimatedCostMax !== undefined) {
      return `Tới ${formatVnd(suggestion.estimatedCostMax)}`;
    }
    return null;
  }, [suggestion.estimatedCostMin, suggestion.estimatedCostMax]);

  return (
    <div className="rounded-xl border border-[#DDEBD0] bg-white p-3.5 shadow-sm transition hover:shadow-md">
      {/* Category & Name */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
            >
              <CategoryIcon className="h-3.5 w-3.5" />
              {config.label}
            </span>
          </div>
          <h4 className="mt-1 text-sm font-semibold text-[#184E77]">{suggestion.name}</h4>
        </div>

        {/* Estimated Price */}
        {formattedPrice && (
          <div className="shrink-0 text-right">
            <span className="text-xs font-semibold text-[#1A759F]">{formattedPrice}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {suggestion.description && (
        <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2">{suggestion.description}</p>
      )}

      {/* Address & Contact info */}
      <div className="mt-2 flex flex-col gap-1 text-[11px] text-neutral-500">
        {suggestion.address && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
            <span className="truncate">{suggestion.address}</span>
          </div>
        )}
        {suggestion.contactInfo && (
          <div className="flex items-center gap-1 font-medium text-[#1E6091]">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{suggestion.contactInfo}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#F0F6EA] pt-2.5">
        {hasCoords && (
          <button
            type="button"
            onClick={handleMapClick}
            className="inline-flex items-center gap-1 rounded-lg border border-[#B5E48C] bg-[#F4F9EC] px-2.5 py-1 text-xs font-medium text-[#184E77] transition hover:bg-[#D9ED92]"
          >
            <MapPin className="h-3.5 w-3.5 text-[#52B69A]" />
            Xem bản đồ
          </button>
        )}

        {onAddToItinerary && (
          <button
            type="button"
            onClick={() => onAddToItinerary(suggestion)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DDEBD0] bg-white px-2.5 py-1 text-xs font-medium text-[#184E77] transition hover:bg-[#F4F9EC]"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-[#1A759F]" />
            Thêm lịch trình
          </button>
        )}

        {onAddToExpense && (
          <button
            type="button"
            onClick={() => onAddToExpense(suggestion)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DDEBD0] bg-white px-2.5 py-1 text-xs font-medium text-[#184E77] transition hover:bg-[#F4F9EC]"
          >
            <Receipt className="h-3.5 w-3.5 text-[#52B69A]" />
            Thêm chi tiêu
          </button>
        )}
      </div>
    </div>
  );
}
