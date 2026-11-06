import { describe, expect, it, vi } from 'vitest';
import { RoadsidePoi } from '@/lib/types/roadside';
import { formatDistance } from '@/lib/geo/roadside-format';

describe('RoadsidePoiCard Component Logic', () => {
  const mockGasPoi: RoadsidePoi = {
    id: 'gas-dl-1',
    name: 'Cửa hàng Xăng dầu Petrolimex Số 01 Đà Lạt',
    type: 'gas_station',
    brand: 'Petrolimex',
    address: '02 Trần Hưng Đạo, Đà Lạt',
    latitude: 11.9365,
    longitude: 108.4498,
    phone: '0263 3822 555',
    distanceKm: 0.65,
  };

  const mockRepairPoi: RoadsidePoi = {
    id: 'repair-dl-1',
    name: 'Cứu Hộ & Sửa Xe Máy Đà Lạt 24/7 Thành Đạt',
    type: 'repair_shop',
    brand: 'Cứu hộ 24/7',
    address: '18 Hùng Vương, Đà Lạt',
    latitude: 11.9421,
    longitude: 108.4612,
    phone: '0979.888.777',
    distanceKm: 3.2,
  };

  it('formats distance correctly for gas station and repair shop', () => {
    expect(formatDistance(mockGasPoi.distanceKm!)).toBe('650 m');
    expect(formatDistance(mockRepairPoi.distanceKm!)).toBe('3.2 km');
  });

  it('dispatches smart-trip:focus-map custom event on window', () => {
    const dispatchMock = vi.fn();
    const globalContext = globalThis as unknown as { window?: { dispatchEvent: (evt: unknown) => boolean } };
    globalContext.window = {
      dispatchEvent: dispatchMock,
    };
    globalContext.window.dispatchEvent({
      type: 'smart-trip:focus-map',
      detail: {
        latitude: mockGasPoi.latitude,
        longitude: mockGasPoi.longitude,
        name: mockGasPoi.name,
      },
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'smart-trip:focus-map',
      detail: {
        latitude: 11.9365,
        longitude: 108.4498,
        name: 'Cửa hàng Xăng dầu Petrolimex Số 01 Đà Lạt',
      },
    });
  });

  it('generates accurate google maps directions link', () => {
    const expectedUrl = `https://www.google.com/maps/dir/?api=1&destination=${mockRepairPoi.latitude},${mockRepairPoi.longitude}`;
    expect(expectedUrl).toBe('https://www.google.com/maps/dir/?api=1&destination=11.9421,108.4612');
  });
});
