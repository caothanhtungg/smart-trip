import { describe, it, expect } from 'vitest';
import {
  getDestinationCoordinates,
  resolveItemCoordinates,
  KNOWN_DESTINATIONS,
  KNOWN_LANDMARKS,
} from './destination-coords';

describe('destination-coords', () => {
  describe('getDestinationCoordinates', () => {
    it('returns Da Lat coordinates for Da Lat destination string', () => {
      const coords = getDestinationCoordinates('Thành phố Đà Lạt, Lâm Đồng');
      expect(coords).toEqual([11.9404, 108.4583]);
    });

    it('returns Hanoi coordinates for Hanoi destination string', () => {
      const coords = getDestinationCoordinates('Thủ đô Hà Nội');
      expect(coords).toEqual([21.0285, 105.8542]);
    });

    it('returns Da Nang coordinates for Da Nang destination string', () => {
      const coords = getDestinationCoordinates('Đà Nẵng');
      expect(coords).toEqual([16.0544, 108.2022]);
    });

    it('returns Da Lat coordinates as fallback when destination is empty', () => {
      const coords = getDestinationCoordinates(null);
      expect(coords).toEqual([11.9404, 108.4583]);
    });
  });

  describe('resolveItemCoordinates', () => {
    it('uses explicit coordinates when present', () => {
      const item = {
        placeName: 'Random Spot',
        latitude: 10.5,
        longitude: 106.8,
      };
      const coords = resolveItemCoordinates(item);
      expect(coords).toEqual([10.5, 106.8]);
    });

    it('resolves Ho Xuan Huong landmark without explicit coords', () => {
      const item = {
        placeName: 'Hồ Xuân Hương',
        address: 'Da Lat',
      };
      const coords = resolveItemCoordinates(item);
      expect(coords).toEqual([11.9366, 108.4452]);
    });

    it('resolves Thung Lung Tinh Yeu landmark without explicit coords and without diacritics', () => {
      const item = {
        placeName: 'Thung Lung Tinh Yeu',
        address: 'Da Lat',
      };
      const coords = resolveItemCoordinates(item);
      expect(coords).toEqual([11.9806, 108.4503]);
    });

    it('returns null for unknown spot without coords', () => {
      const item = {
        placeName: 'Cửa hàng tạp hóa cô 7',
      };
      const coords = resolveItemCoordinates(item);
      expect(coords).toBeNull();
    });
  });
});
