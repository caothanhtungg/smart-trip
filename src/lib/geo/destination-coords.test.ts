import { describe, it, expect } from 'vitest';
import {
  getDestinationCoordinates,
  resolveItemCoordinates,
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

    it('returns Con Dao coordinates for Con Dao destination string', () => {
      const coords = getDestinationCoordinates('Quần đảo Côn Đảo, Bà Rịa - Vũng Tàu');
      expect(coords).toEqual([8.6836, 106.6094]);
    });

    it('returns Mui Ne coordinates for Mui Ne destination string', () => {
      const coords = getDestinationCoordinates('Mũi Né – Phan Thiết, Bình Thuận');
      expect(coords).toEqual([10.9486, 108.2961]);
    });

    it('returns Mai Chau coordinates for Mai Chau destination string', () => {
      const coords = getDestinationCoordinates('Thung lũng Mai Châu, Hòa Bình');
      expect(coords).toEqual([20.6582, 105.0833]);
    });

    it('returns Nui Ba Den coordinates for Nui Ba Den destination string', () => {
      const coords = getDestinationCoordinates('Núi Bà Đen, Tây Ninh');
      expect(coords).toEqual([11.3739, 106.1742]);
    });

    it('returns Ba Na Hills coordinates for Ba Na Hills destination string', () => {
      const coords = getDestinationCoordinates('Sun World Ba Na Hills, Đà Nẵng');
      expect(coords).toEqual([15.9951, 107.9961]);
    });

    it('returns Tam Dao coordinates for Tam Dao destination string', () => {
      const coords = getDestinationCoordinates('Thị trấn Tam Đảo, Vĩnh Phúc');
      expect(coords).toEqual([21.4563, 105.6438]);
    });

    it('returns Ba Vi coordinates for Ba Vi destination string', () => {
      const coords = getDestinationCoordinates('Vườn Quốc gia Ba Vì, Hà Nội');
      expect(coords).toEqual([21.0811, 105.3769]);
    });

    it('returns Ham Lon coordinates for Ham Lon destination string', () => {
      const coords = getDestinationCoordinates('Núi Hàm Lợn, Sóc Sơn, Hà Nội');
      expect(coords).toEqual([21.2981, 105.7836]);
    });

    it('returns Sam Son coordinates for Sam Son destination string', () => {
      const coords = getDestinationCoordinates('Bãi biển Sầm Sơn, Thanh Hóa');
      expect(coords).toEqual([19.7408, 105.9056]);
    });

    it('returns Tam Chuc coordinates for Tam Chuc destination string', () => {
      const coords = getDestinationCoordinates('Quần thể Chùa Tam Chúc, Hà Nam');
      expect(coords).toEqual([20.5786, 105.8012]);
    });

    it('returns Bat Trang coordinates for Bat Trang destination string', () => {
      const coords = getDestinationCoordinates('Làng gốm Bát Tràng, Gia Lâm, Hà Nội');
      expect(coords).toEqual([20.9765, 105.9168]);
    });

    it('returns Eo Gio coordinates for Eo Gio destination string', () => {
      const coords = getDestinationCoordinates('Khu du lịch Eo Gió, Quy Nhơn, Bình Định');
      expect(coords).toEqual([13.8861, 109.2931]);
    });

    it('returns Nha Trang coordinates for Nha Trang destination string', () => {
      const coords = getDestinationCoordinates('Vịnh Nha Trang, Khánh Hòa');
      expect(coords).toEqual([12.2388, 109.1967]);
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

    it('resolves Eo Gio landmark without explicit coords', () => {
      const item = {
        placeName: 'Con đường đi bộ ven biển Eo Gió',
        address: 'Nhơn Lý, Quy Nhơn',
      };
      const coords = resolveItemCoordinates(item);
      expect(coords).toEqual([13.8856, 109.2942]);
    });

    it('resolves Hon Mun landmark without explicit coords', () => {
      const item = {
        placeName: 'Đảo Hòn Mun',
        address: 'Vịnh Nha Trang',
      };
      const coords = resolveItemCoordinates(item);
      expect(coords).toEqual([12.1681, 109.3019]);
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
