import { describe, it, expect, vi } from 'vitest';
import { searchPlaces } from './nominatim';

describe('searchPlaces', () => {
  it('tìm kiếm và chuẩn hóa kết quả từ Nominatim OpenStreetMap', async () => {
    const mockNominatimResults = [
      {
        place_id: 12345,
        display_name: 'Đà Lạt, Lâm Đồng, Việt Nam',
        lat: '11.940419',
        lon: '108.458313',
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNominatimResults,
    });

    const results = await searchPlaces('Đà Lạt');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Đà Lạt');
    expect(results[0].lat).toBeCloseTo(11.9404, 3);
    expect(results[0].lng).toBeCloseTo(108.4583, 3);
  });

  it('trả về mảng rỗng nếu chuỗi tìm kiếm quá ngắn hoặc rỗng', async () => {
    const results = await searchPlaces('');
    expect(results).toEqual([]);
  });

  it('xử lý an toàn khi API gặp sự cố', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
    const results = await searchPlaces('Nha Trang');
    expect(results).toEqual([]);
  });
});
