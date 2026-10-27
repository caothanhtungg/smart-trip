import { describe, expect, it } from 'vitest';
import { estimateTravelTimeMinutes, formatDistance, formatTravelTime } from './roadside-format';

describe('Roadside Distance & Time Formatters', () => {
  describe('formatDistance', () => {
    it('formats under 1 km as meters', () => {
      expect(formatDistance(0.05)).toBe('50 m');
      expect(formatDistance(0.75)).toBe('750 m');
      expect(formatDistance(0.95)).toBe('950 m');
      expect(formatDistance(0.999)).toBe('999 m');
    });

    it('formats 1 km and above as kilometers', () => {
      expect(formatDistance(1.0)).toBe('1 km');
      expect(formatDistance(3.42)).toBe('3.4 km');
      expect(formatDistance(12.04)).toBe('12 km');
      expect(formatDistance(25.68)).toBe('25.7 km');
    });

    it('handles edge cases safely', () => {
      expect(formatDistance(0)).toBe('0 m');
      expect(formatDistance(-5)).toBe('0 m');
      expect(formatDistance(NaN)).toBe('0 m');
    });
  });

  describe('estimateTravelTimeMinutes', () => {
    it('estimates reasonable travel minutes with default 40 km/h speed', () => {
      // 4 km at 40 km/h with 1.15 margin = 4 * 1.15 / 40 = 0.115 hr = ~7 minutes
      const mins = estimateTravelTimeMinutes(4);
      expect(mins).toBe(7);
    });

    it('returns at least 1 minute for small non-zero distances', () => {
      expect(estimateTravelTimeMinutes(0.1)).toBe(1);
    });

    it('returns 0 for zero or negative distance', () => {
      expect(estimateTravelTimeMinutes(0)).toBe(0);
      expect(estimateTravelTimeMinutes(-2)).toBe(0);
    });
  });

  describe('formatTravelTime', () => {
    it('formats under 60 minutes correctly', () => {
      expect(formatTravelTime(15)).toBe('~15 phút');
      expect(formatTravelTime(45)).toBe('~45 phút');
    });

    it('formats hours and remaining minutes', () => {
      expect(formatTravelTime(60)).toBe('~1 giờ');
      expect(formatTravelTime(90)).toBe('~1 giờ 30 phút');
      expect(formatTravelTime(145)).toBe('~2 giờ 25 phút');
    });
  });
});
