import { describe, it, expect } from 'vitest';
import { validateCoordinates } from './itinerary-coordinates';

describe('validateCoordinates', () => {
  it('chấp nhận tọa độ hợp lệ tại Việt Nam', () => {
    expect(validateCoordinates(11.9404, 108.4583)).toBe(true); // Đà Lạt
  });

  it('từ chối vĩ độ ngoài phạm vi [-90, 90]', () => {
    expect(validateCoordinates(95, 108)).toBe(false);
    expect(validateCoordinates(-95, 108)).toBe(false);
  });

  it('từ chối kinh độ ngoài phạm vi [-180, 180]', () => {
    expect(validateCoordinates(11, 190)).toBe(false);
    expect(validateCoordinates(11, -190)).toBe(false);
  });

  it('cho phép cả hai tọa độ là null hoặc undefined', () => {
    expect(validateCoordinates(null, null)).toBe(true);
    expect(validateCoordinates(undefined, undefined)).toBe(true);
  });

  it('từ chối khi chỉ có một trong hai tọa độ được cung cấp', () => {
    expect(validateCoordinates(11.9404, null)).toBe(false);
    expect(validateCoordinates(null, 108.4583)).toBe(false);
  });
});
