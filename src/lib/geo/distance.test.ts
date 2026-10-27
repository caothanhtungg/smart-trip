import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, optimizeDayRoute } from './distance';

describe('calculateHaversineDistance', () => {
  it('tính chính xác khoảng cách giữa Chợ Đà Lạt và Hồ Xuân Hương (~700m - 1200m)', () => {
    const choDaLat = { lat: 11.9427, lng: 108.4373 };
    const hoXuanHuong = { lat: 11.9404, lng: 108.4450 };
    const dist = calculateHaversineDistance(choDaLat.lat, choDaLat.lng, hoXuanHuong.lat, hoXuanHuong.lng);
    expect(dist).toBeGreaterThan(600);
    expect(dist).toBeLessThan(1200);
  });

  it('khoảng cách giữa cùng một điểm là 0 mét', () => {
    expect(calculateHaversineDistance(11.9427, 108.4373, 11.9427, 108.4373)).toBe(0);
  });
});

describe('optimizeDayRoute', () => {
  it('tối ưu lại thứ tự 4 điểm tránh đi vòng zig-zag', () => {
    // Điểm 1 ở tọa độ x=0, y=0 (bị khóa làm điểm xuất phát)
    const p1 = { id: 'hotel', latitude: 11.940, longitude: 108.440, isLocked: true };
    // p2 ở xa nhất về phía đông
    const p2 = { id: 'far_east', latitude: 11.940, longitude: 108.480, isLocked: false };
    // p3 ở gần khách sạn hơn
    const p3 = { id: 'mid_east', latitude: 11.940, longitude: 108.450, isLocked: false };
    // p4 ở xa nhất
    const p4 = { id: 'farther_east', latitude: 11.940, longitude: 108.500, isLocked: false };

    // Đưa vào thứ tự lộn xộn: p1 -> p4 -> p3 -> p2
    const result = optimizeDayRoute([p1, p4, p3, p2]);
    expect(result[0].id).toBe('hotel'); // Giữ nguyên điểm khóa đầu tiên
    expect(result.map(p => p.id)).toEqual(['hotel', 'mid_east', 'far_east', 'farther_east']);
  });

  it('xử lý an toàn khi mảng có 0 hoặc 1 điểm', () => {
    expect(optimizeDayRoute([])).toEqual([]);
    const single = { id: 'single', latitude: 11.940, longitude: 108.440 };
    expect(optimizeDayRoute([single])).toEqual([single]);
  });

  it('giữ các điểm không có tọa độ ở cuối danh sách mà không làm vỡ thuật toán', () => {
    const p1 = { id: 'hotel', latitude: 11.940, longitude: 108.440, isLocked: true };
    const p2 = { id: 'sight_a', latitude: 11.940, longitude: 108.450 };
    const noCoord = { id: 'no_coord', latitude: null, longitude: null };

    const result = optimizeDayRoute([noCoord, p2, p1]);
    expect(result[0].id).toBe('hotel');
    expect(result[1].id).toBe('sight_a');
    expect(result[2].id).toBe('no_coord');
  });
});
