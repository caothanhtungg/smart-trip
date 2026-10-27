import { describe, expect, it } from 'vitest';
import { calculateNavigationStatus, findNearbyRoadsidePois } from './roadside-service';

describe('Roadside Service', () => {
  // Center of Dalat (Lam Vien Square)
  const dalatCenter: [number, number] = [11.9378, 108.4447];

  describe('findNearbyRoadsidePois', () => {
    it('finds gas stations in Dalat within 10 km', () => {
      const results = findNearbyRoadsidePois(dalatCenter[0], dalatCenter[1], 'gas_station', 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('gas_station');
      expect(results[0].distanceKm).toBeDefined();
      expect(results[0].distanceKm).toBeLessThanOrEqual(10);
      // Distance sorted ascending
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distanceKm!).toBeGreaterThanOrEqual(results[i - 1].distanceKm!);
      }
    });

    it('finds repair shops in Dalat', () => {
      const results = findNearbyRoadsidePois(dalatCenter[0], dalatCenter[1], 'repair_shop', 15);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('repair_shop');
      expect(results[0].phone).toBeDefined();
    });

    it('returns empty list for invalid coordinates', () => {
      expect(findNearbyRoadsidePois(NaN, NaN)).toEqual([]);
    });
  });

  describe('calculateNavigationStatus', () => {
    const mockStops = [
      {
        id: 'stop-1',
        placeName: 'Đỉnh Langbiang',
        latitude: 12.0463,
        longitude: 108.4358,
        sortOrder: 0,
      },
      {
        id: 'stop-2',
        placeName: 'Chợ Đêm Đà Lạt',
        latitude: 11.9421,
        longitude: 108.4375,
        sortOrder: 1,
      },
    ];

    it('computes distance and travel time to next stop when GPS is available', () => {
      const status = calculateNavigationStatus(dalatCenter, mockStops);
      expect(status.userLocation).toEqual(dalatCenter);
      expect(status.nextStop).not.toBeNull();
      expect(status.nextStop?.title).toBe('Đỉnh Langbiang');
      expect(status.distanceToNextStopKm).toBeGreaterThan(0);
      expect(status.estimatedMinutesToNextStop).toBeGreaterThan(0);
      expect(status.nearestGasStation).not.toBeNull();
      expect(status.nearestRepairShop).not.toBeNull();
    });

    it('handles null GPS gracefully', () => {
      const status = calculateNavigationStatus(null, mockStops);
      expect(status.userLocation).toBeNull();
      expect(status.distanceToNextStopKm).toBeNull();
      expect(status.estimatedMinutesToNextStop).toBeNull();
      expect(status.nextStop?.title).toBe('Đỉnh Langbiang');
    });

    it('handles empty stops safely', () => {
      const status = calculateNavigationStatus(dalatCenter, []);
      expect(status.nextStop).toBeNull();
      expect(status.distanceToNextStopKm).toBeNull();
      expect(status.nearestGasStation).not.toBeNull();
    });
  });
});
