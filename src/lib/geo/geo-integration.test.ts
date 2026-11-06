import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, optimizeDayRoute } from './distance';
import {  evaluateOutdoorSafety } from './weather';
import { validateCoordinates } from '../types/itinerary-coordinates';

describe('Geo & Weather Integration Workflow', () => {
  it('thực thi quy trình lập lịch trình đầy đủ: validation -> routing -> weather warnings', () => {
    // 1. Kiểm tra validation tọa độ
    const dalatHotel = { lat: 11.9404, lng: 108.4583 };
    expect(validateCoordinates(dalatHotel.lat, dalatHotel.lng)).toBe(true);

    // 2. Danh sách 5 điểm tham quan trong ngày (thứ tự nhập vào bị xáo trộn)
    const items = [
      { id: 'spot_far_east', placeName: 'Đồi chè Cầu Đất', latitude: 11.905, longitude: 108.560, isLocked: false },
      { id: 'hotel', placeName: 'Khách sạn trung tâm', latitude: 11.940, longitude: 108.440, isLocked: true },
      { id: 'spot_south', placeName: 'Thác Datanla', latitude: 11.900, longitude: 108.450, isLocked: false },
      { id: 'spot_mid', placeName: 'Hồ Xuân Hương', latitude: 11.941, longitude: 108.445, isLocked: false },
      { id: 'note_only', placeName: 'Ăn tối tự do', latitude: null, longitude: null, isLocked: false },
    ];

    // 3. Tối ưu hóa lộ trình
    const optimized = optimizeDayRoute(items);

    // Điểm khóa xuất phát luôn ở vị trí số 1
    expect(optimized[0].id).toBe('hotel');
    // Điểm gần khách sạn nhất (Hồ Xuân Hương) phải được đi trước đồi chè xa
    expect(optimized[1].id).toBe('spot_mid');
    // Điểm không có tọa độ được đẩy về cuối an toàn
    expect(optimized[4].id).toBe('note_only');

    // 4. Kiểm tra cảnh báo thời tiết cho điểm ngoài trời
    const sunnyCheck = evaluateOutdoorSafety(0, 10);
    expect(sunnyCheck.isOutdoorWarning).toBe(false);

    const rainyCheck = evaluateOutdoorSafety(65, 85);
    expect(rainyCheck.isOutdoorWarning).toBe(true);
    expect(rainyCheck.warningMessage).toContain('mưa');
  });

  it('tính toán chính xác khoảng cách giữa các thành phố lớn tại Việt Nam', () => {
    const hanoi = { lat: 21.0285, lng: 105.8542 };
    const hcmc = { lat: 10.8231, lng: 106.6297 };
    const distKm = calculateHaversineDistance(hanoi.lat, hanoi.lng, hcmc.lat, hcmc.lng) / 1000;

    // Khoảng cách đường chim bay Hà Nội - TP.HCM xấp xỉ 1140km - 1180km
    expect(distKm).toBeGreaterThan(1130);
    expect(distKm).toBeLessThan(1180);
  });
});
