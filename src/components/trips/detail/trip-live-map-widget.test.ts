import { describe, expect, it } from 'vitest';
import { calculateNavigationStatus, findNearbyRoadsidePois } from '@/lib/geo/roadside-service';
import { formatDistance, formatTravelTime } from '@/lib/geo/roadside-format';
import { ItineraryItem } from '@/types/trip';

describe('TripLiveMapWidget Data & HUD Synchronization Logic', () => {
  const dalatGps: [number, number] = [11.9404, 108.4583];

  const mockItineraryItems: ItineraryItem[] = [
    {
      id: 'it-1',
      dayDate: '2026-11-01',
      startTime: '09:00',
      placeName: 'Hồ Xuân Hương',
      latitude: 11.9378,
      longitude: 108.4447,
      sortOrder: 0,
      isLocked: true,
      tripId: 'trip-1',
      createdByMemberId: 'member-1',
      address: 'Đà Lạt',
      createdAt: '2026-10-27T00:00:00Z',
      updatedAt: '2026-10-27T00:00:00Z',
    },
    {
      id: 'it-2',
      dayDate: '2026-11-01',
      startTime: '14:00',
      placeName: 'Đỉnh Langbiang',
      latitude: 12.0463,
      longitude: 108.4358,
      sortOrder: 1,
      isLocked: false,
      tripId: 'trip-1',
      createdByMemberId: 'member-1',
      address: 'Lạc Dương',
      createdAt: '2026-10-27T00:00:00Z',
      updatedAt: '2026-10-27T00:00:00Z',
    },
  ];

  it('computes accurate next stop and remaining distance from GPS', () => {
    const status = calculateNavigationStatus(dalatGps, mockItineraryItems);
    expect(status.nextStop).not.toBeNull();
    expect(status.nextStop?.title).toBe('Hồ Xuân Hương');
    expect(status.distanceToNextStopKm).toBeGreaterThan(0);
    expect(status.estimatedMinutesToNextStop).toBeGreaterThan(0);

    const formattedDist = formatDistance(status.distanceToNextStopKm!);
    expect(formattedDist).toMatch(/(m|km)/);

    const formattedTime = formatTravelTime(status.estimatedMinutesToNextStop!);
    expect(formattedTime).toContain('phút');
  });

  it('retrieves gas stations and repair shops near coordinates', () => {
    const pois = findNearbyRoadsidePois(dalatGps[0], dalatGps[1], undefined, 30, 5);
    expect(pois.length).toBeGreaterThan(0);
    expect(pois.some((p) => p.type === 'gas_station')).toBe(true);
    expect(pois.some((p) => p.type === 'repair_shop')).toBe(true);
  });
});
