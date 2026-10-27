import { describe, expect, it } from 'vitest';
import { detectDestination, normalizeVietnameseText, queryLocalTravelEngine } from './local-travel-engine';

describe('Local Travel Engine', () => {
  describe('normalizeVietnameseText', () => {
    it('normalizes diacritics and converts to lowercase', () => {
      expect(normalizeVietnameseText('Đà Lạt')).toBe('da lat');
      expect(normalizeVietnameseText('Sa Pa, Lào Cai')).toBe('sa pa, lao cai');
    });
  });

  describe('detectDestination', () => {
    it('detects destination mentioned in query', () => {
      const result = detectDestination('Gợi ý homestay Sa Pa đẹp');
      expect(result.key).toBe('sapa');
      expect(result.name).toBe('Sa Pa');
    });

    it('detects destination from trip context if query lacks one', () => {
      const result = detectDestination('Gợi ý homestay đẹp view thung lũng', {
        destination: 'Hà Giang, Việt Nam',
      });
      expect(result.key).toBe('hagiang');
      expect(result.name).toBe('Hà Giang');
    });

    it('defaults to Dalat if neither query nor context has known destination', () => {
      const result = detectDestination('Chỗ nào chơi vui');
      expect(result.key).toBe('dalat');
    });
  });

  describe('queryLocalTravelEngine', () => {
    it('returns homestay suggestions when query asks about homestay', () => {
      const res = queryLocalTravelEngine('Tìm homestay Đà Lạt giá rẻ', { destination: 'Đà Lạt' });
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions[0].category).toBe('homestay');
      expect(res.answer).toContain('Đà Lạt');
      expect(res.suggestions[0].latitude).toBeDefined();
      expect(res.suggestions[0].longitude).toBeDefined();
    });

    it('returns transport suggestions when query asks about coaches / nhà xe', () => {
      const res = queryLocalTravelEngine('Có những nhà xe nào đi Sa Pa?', { destination: 'Sa Pa' });
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions[0].category).toBe('transport');
      expect(res.suggestions.some((s) => s.name.includes('Sao Việt') || s.name.includes('Inter Bus'))).toBe(true);
    });

    it('returns budget calculation when asking about cost', () => {
      const res = queryLocalTravelEngine('Dự toán chi phí đi Hà Giang hết bao nhiêu?', {
        destination: 'Hà Giang',
        memberCount: 4,
      });
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.answer).toContain('Dự toán chi phí');
      expect(res.answer).toContain('₫');
    });

    it('returns food suggestions when asking about eating / quán ăn', () => {
      const res = queryLocalTravelEngine('Đà Nẵng có món gì ngon', { destination: 'Đà Nẵng' });
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions[0].category).toBe('food');
    });

    it('returns general overview when query is generic', () => {
      const res = queryLocalTravelEngine('Tư vấn cho mình chuyến đi Phú Quốc', { destination: 'Phú Quốc' });
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.answer).toContain('Phú Quốc');
    });
  });
});
