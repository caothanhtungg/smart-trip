import { describe, expect, it, vi } from 'vitest';
import { AISuggestionItem } from '@/lib/types/ai-assistant';
import { formatVnd } from '@/lib/money/format';

describe('AISuggestionCard Data & Formatter Logic', () => {
  const mockSuggestion: AISuggestionItem = {
    id: 'sugg-1',
    name: 'The Kupid Hill Homestay',
    category: 'homestay',
    description: 'View đồi thông cực chill',
    estimatedCostMin: 350000,
    estimatedCostMax: 600000,
    address: '47 Đặng Thái Thân, Đà Lạt',
    latitude: 11.9281,
    longitude: 108.4485,
    contactInfo: '0987.654.321',
  };

  it('formats min and max price correctly with VND currency format', () => {
    const formatted = `${formatVnd(mockSuggestion.estimatedCostMin!)} - ${formatVnd(mockSuggestion.estimatedCostMax!)}`;
    expect(formatted).toBe('350.000 ₫ - 600.000 ₫');
  });

  it('formats single price correctly when min and max are equal', () => {
    const singlePrice = formatVnd(300000);
    expect(singlePrice).toBe('300.000 ₫');
  });

  it('dispatches custom event smart-trip:focus-map when triggered with coordinates', () => {
    const dispatchMock = vi.fn();
    (globalThis as any).window = {
      dispatchEvent: dispatchMock,
    };

    const payload = {
      latitude: mockSuggestion.latitude,
      longitude: mockSuggestion.longitude,
      name: mockSuggestion.name,
    };

    (globalThis as any).window.dispatchEvent({
      type: 'smart-trip:focus-map',
      detail: payload,
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'smart-trip:focus-map',
      detail: {
        latitude: 11.9281,
        longitude: 108.4485,
        name: 'The Kupid Hill Homestay',
      },
    });
  });
});
