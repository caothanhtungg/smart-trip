import { describe, it, expect } from 'vitest';
import {
  getDestinationPhoto,
  getDestinationGallery,
  POPULAR_DISCOVERY_DESTINATIONS,
} from './destination-photos';

describe('Destination Photos Service', () => {
  it('returns accurate photo and caption for curated Vietnamese tourist destinations', () => {
    const trangAnPhoto = getDestinationPhoto('Khu sinh thái Tràng An', 'Ninh Bình');
    expect(trangAnPhoto.url).toContain('https://images.unsplash.com/');
    expect(trangAnPhoto.caption.toLowerCase()).toContain('tràng an');

    const sonDoongPhoto = getDestinationPhoto('Hang Sơn Đoòng', 'Quảng Bình');
    expect(sonDoongPhoto.url).toContain('https://images.unsplash.com/');
    expect(sonDoongPhoto.caption.toLowerCase()).toContain('sơn đoòng');

    const haLongPhoto = getDestinationPhoto('Vịnh Hạ Long', 'Quảng Ninh');
    expect(haLongPhoto.url).toContain('https://images.unsplash.com/');
    expect(haLongPhoto.caption.toLowerCase()).toContain('hạ long');

    const saPaPhoto = getDestinationPhoto('Đỉnh Fansipan', 'Sa Pa');
    expect(saPaPhoto.url).toContain('https://images.unsplash.com/');
    expect(saPaPhoto.caption.toLowerCase()).toContain('fansipan');

    const haGiangPhoto = getDestinationPhoto('Đèo Mã Pí Lèng', 'Hà Giang');
    expect(haGiangPhoto.url).toContain('https://images.unsplash.com/');
    expect(haGiangPhoto.caption.toLowerCase()).toContain('mã pí lèng');

    const mySonPhoto = getDestinationPhoto('Tháp Chăm cổ', 'Thánh địa Mỹ Sơn');
    expect(mySonPhoto.url).toContain('https://images.unsplash.com/');
    expect(mySonPhoto.caption.toLowerCase()).toContain('mỹ sơn');

    const huePhoto = getDestinationPhoto('Ngọ Môn', 'Đại Nội Huế');
    expect(huePhoto.url).toContain('https://images.unsplash.com/');
    expect(huePhoto.caption.toLowerCase()).toContain('hoàng thành huế');

    const thienMuPhoto = getDestinationPhoto('Chùa Thiên Mụ', 'Huế');
    expect(thienMuPhoto.url).toContain('https://images.unsplash.com/');
    expect(thienMuPhoto.caption.toLowerCase()).toContain('phước duyên');

    const hoiAnPhoto = getDestinationPhoto('Chùa Cầu', 'Phố cổ Hội An');
    expect(hoiAnPhoto.url).toContain('https://images.unsplash.com/');
    expect(hoiAnPhoto.caption.toLowerCase()).toContain('chùa cầu');

    const catBaPhoto = getDestinationPhoto('Vịnh Lan Hạ', 'Cát Bà');
    expect(catBaPhoto.url).toContain('https://images.unsplash.com/');
    expect(catBaPhoto.caption.toLowerCase()).toContain('lan hạ');

    const banGiocPhoto = getDestinationPhoto('Thác Bản Giốc', 'Cao Bằng');
    expect(banGiocPhoto.url).toContain('https://images.unsplash.com/');
    expect(banGiocPhoto.caption.toLowerCase()).toContain('bản giốc');

    const phuQuocPhoto = getDestinationPhoto('Cầu Hôn', 'Phú Quốc');
    expect(phuQuocPhoto.url).toContain('https://images.unsplash.com/');
    expect(phuQuocPhoto.caption.toLowerCase()).toContain('cầu hôn');

    const daLatPhoto = getDestinationPhoto('Quảng trường Lâm Viên', 'Đà Lạt');
    expect(daLatPhoto.url).toContain('https://images.unsplash.com/');
    expect(daLatPhoto.caption.toLowerCase()).toContain('lâm viên');

    const conDaoPhoto = getDestinationPhoto('Bãi Đầm Trầu', 'Côn Đảo');
    expect(conDaoPhoto.url).toContain('https://images.unsplash.com/');
    expect(conDaoPhoto.caption.toLowerCase()).toContain('đầm trầu');

    const muiNePhoto = getDestinationPhoto('Bàu Trắng', 'Mũi Né');
    expect(muiNePhoto.url).toContain('https://images.unsplash.com/');
    expect(muiNePhoto.caption.toLowerCase()).toContain('bàu trắng');

    const maiChauPhoto = getDestinationPhoto('Bản Lác', 'Mai Châu');
    expect(maiChauPhoto.url).toContain('https://images.unsplash.com/');
    expect(maiChauPhoto.caption.toLowerCase()).toContain('mai châu');

    const baDenPhoto = getDestinationPhoto('Chùa Bà Đen', 'Tây Ninh');
    expect(baDenPhoto.url).toContain('https://images.unsplash.com/');
    expect(baDenPhoto.caption.toLowerCase()).toContain('bà đen');

    const baNaPhoto = getDestinationPhoto('Cầu Vàng', 'Bà Nà Hills');
    expect(baNaPhoto.url).toContain('https://images.unsplash.com/');
    expect(baNaPhoto.caption.toLowerCase()).toContain('cầu vàng');

    const tamDaoPhoto = getDestinationPhoto('Nhà thờ Đá', 'Tam Đảo');
    expect(tamDaoPhoto.url).toContain('https://images.unsplash.com/');
    expect(tamDaoPhoto.caption.toLowerCase()).toContain('tam đảo');

    const baViPhoto = getDestinationPhoto('Rừng thông Cốt 400', 'Ba Vì');
    expect(baViPhoto.url).toContain('https://images.unsplash.com/');
    expect(baViPhoto.caption.toLowerCase()).toContain('ba vì');

    const hamLonPhoto = getDestinationPhoto('Hồ Núi Bàu', 'Hàm Lợn');
    expect(hamLonPhoto.url).toContain('https://images.unsplash.com/');
    expect(hamLonPhoto.caption.toLowerCase()).toContain('hàm lợn');

    const samSonPhoto = getDestinationPhoto('Bãi biển Sầm Sơn', 'Thanh Hóa');
    expect(samSonPhoto.url).toContain('https://images.unsplash.com/');
    expect(samSonPhoto.caption.toLowerCase()).toContain('sầm sơn');

    const tamChucPhoto = getDestinationPhoto('Điện Tam Thế', 'Tam Chúc');
    expect(tamChucPhoto.url).toContain('https://images.unsplash.com/');
    expect(tamChucPhoto.caption.toLowerCase()).toContain('tam chúc');

    const batTrangPhoto = getDestinationPhoto('Bảo tàng Gốm', 'Bát Tràng');
    expect(batTrangPhoto.url).toContain('https://images.unsplash.com/');
    expect(batTrangPhoto.caption.toLowerCase()).toContain('bát tràng');

    const eoGioPhoto = getDestinationPhoto('Khu Du Lịch Eo Gió', 'Quy Nhơn');
    expect(eoGioPhoto.url).toContain('https://images.unsplash.com/');
    expect(eoGioPhoto.caption.toLowerCase()).toContain('eo gió');

    const nhaTrangPhoto = getDestinationPhoto('Bãi biển Nha Trang', 'Khánh Hòa');
    expect(nhaTrangPhoto.url).toContain('https://images.unsplash.com/');
    expect(nhaTrangPhoto.caption.toLowerCase()).toContain('nha trang');
  });

  it('matches landmark photos by specific landmark keyword in address or placeName', () => {
    const tamCocPhoto = getDestinationPhoto('Bến đò Tam Cốc', 'Ninh Bình');
    expect(tamCocPhoto.caption.toLowerCase()).toContain('tràng an');

    const hangEnPhoto = getDestinationPhoto('Hang Én', 'Quảng Bình');
    expect(hangEnPhoto.caption.toLowerCase()).toContain('sơn đoòng');

    const tiTopPhoto = getDestinationPhoto('Đảo Ti Tốp', 'Vịnh Hạ Long');
    expect(tiTopPhoto.caption.toLowerCase()).toContain('hạ long');
  });

  it('falls back to high quality default scenic travel photo when place is unknown', () => {
    const unknownPhoto = getDestinationPhoto('Quán Cà Phê Không Tên Mới Mở');
    expect(unknownPhoto.url).toBeDefined();
    expect(unknownPhoto.caption).toBeDefined();
    expect(unknownPhoto.photographer).toBeDefined();
  });

  it('provides a gallery of multiple scenic photos for a destination', () => {
    const gallery = getDestinationGallery('Tràng An');
    expect(gallery.length).toBeGreaterThanOrEqual(2);
    expect(gallery[0].url).toBeDefined();
    expect(gallery[0].caption).toBeDefined();

    const sonDoongGallery = getDestinationGallery('Sơn Đoòng');
    expect(sonDoongGallery.length).toBeGreaterThanOrEqual(2);

    const haLongGallery = getDestinationGallery('Vịnh Hạ Long');
    expect(haLongGallery.length).toBeGreaterThanOrEqual(2);
  });

  it('exports curated popular discovery destinations for the split-view map', () => {
    expect(POPULAR_DISCOVERY_DESTINATIONS.length).toBeGreaterThanOrEqual(3);
    const ninhBinh = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'ninh-binh');
    expect(ninhBinh).toBeDefined();
    expect(ninhBinh?.coordinates).toEqual([20.2567, 105.8964]);
    expect(ninhBinh?.photo.url).toBeDefined();

    const sonDoong = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'hang-son-doong');
    expect(sonDoong).toBeDefined();
    expect(sonDoong?.coordinates).toEqual([17.4572, 106.2877]);

    const haLong = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'ha-long');
    expect(haLong).toBeDefined();
    expect(haLong?.coordinates).toEqual([20.9101, 107.1839]);

    const saPa = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'sa-pa');
    expect(saPa).toBeDefined();
    expect(saPa?.coordinates).toEqual([22.3350, 103.8414]);
    expect(saPa?.category).toBe('mountain');

    const haGiang = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'ha-giang');
    expect(haGiang).toBeDefined();
    expect(haGiang?.coordinates).toEqual([23.2764, 105.3639]);
    expect(haGiang?.category).toBe('mountain');

    const mySon = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'my-son');
    expect(mySon).toBeDefined();
    expect(mySon?.coordinates).toEqual([15.7642, 108.1242]);
    expect(mySon?.category).toBe('heritage');

    const hue = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'hue');
    expect(hue).toBeDefined();
    expect(hue?.coordinates).toEqual([16.4698, 107.5784]);
    expect(hue?.category).toBe('heritage');

    const thienMu = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'chua-thien-mu');
    expect(thienMu).toBeDefined();
    expect(thienMu?.coordinates).toEqual([16.4533, 107.5450]);
    expect(thienMu?.category).toBe('heritage');

    const hoiAn = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'hoi-an');
    expect(hoiAn).toBeDefined();
    expect(hoiAn?.coordinates).toEqual([15.8775, 108.3292]);
    expect(hoiAn?.category).toBe('heritage');

    const catBa = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'cat-ba');
    expect(catBa).toBeDefined();
    expect(catBa?.coordinates).toEqual([20.7278, 107.0481]);
    expect(catBa?.category).toBe('beach');

    const banGioc = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'thac-ban-gioc');
    expect(banGioc).toBeDefined();
    expect(banGioc?.coordinates).toEqual([22.8556, 106.7231]);
    expect(banGioc?.category).toBe('mountain');

    const phuQuoc = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'phu-quoc');
    expect(phuQuoc).toBeDefined();
    expect(phuQuoc?.coordinates).toEqual([10.2175, 103.9589]);
    expect(phuQuoc?.category).toBe('beach');

    const daLat = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'da-lat');
    expect(daLat).toBeDefined();
    expect(daLat?.coordinates).toEqual([11.9404, 108.4429]);
    expect(daLat?.category).toBe('mountain');

    const conDao = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'con-dao');
    expect(conDao).toBeDefined();
    expect(conDao?.coordinates).toEqual([8.6836, 106.6094]);
    expect(conDao?.category).toBe('beach');

    const muiNe = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'mui-ne');
    expect(muiNe).toBeDefined();
    expect(muiNe?.coordinates).toEqual([10.9486, 108.2961]);
    expect(muiNe?.category).toBe('beach');

    const maiChau = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'mai-chau');
    expect(maiChau).toBeDefined();
    expect(maiChau?.coordinates).toEqual([20.6582, 105.0833]);
    expect(maiChau?.category).toBe('mountain');

    const baDen = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'nui-ba-den');
    expect(baDen).toBeDefined();
    expect(baDen?.coordinates).toEqual([11.3739, 106.1742]);
    expect(baDen?.category).toBe('mountain');

    const baNa = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'ba-na-hills');
    expect(baNa).toBeDefined();
    expect(baNa?.coordinates).toEqual([15.9951, 107.9961]);
    expect(baNa?.category).toBe('mountain');

    const tamDao = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'tam-dao');
    expect(tamDao).toBeDefined();
    expect(tamDao?.coordinates).toEqual([21.4563, 105.6438]);
    expect(tamDao?.category).toBe('mountain');

    const baVi = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'ba-vi');
    expect(baVi).toBeDefined();
    expect(baVi?.coordinates).toEqual([21.0811, 105.3769]);
    expect(baVi?.category).toBe('mountain');

    const hamLon = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'ham-lon');
    expect(hamLon).toBeDefined();
    expect(hamLon?.coordinates).toEqual([21.2981, 105.7836]);
    expect(hamLon?.category).toBe('mountain');

    const samSon = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'sam-son');
    expect(samSon).toBeDefined();
    expect(samSon?.coordinates).toEqual([19.7408, 105.9056]);
    expect(samSon?.category).toBe('beach');

    const tamChuc = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'tam-chuc');
    expect(tamChuc).toBeDefined();
    expect(tamChuc?.coordinates).toEqual([20.5786, 105.8012]);
    expect(tamChuc?.category).toBe('heritage');

    const batTrang = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'bat-trang');
    expect(batTrang).toBeDefined();
    expect(batTrang?.coordinates).toEqual([20.9765, 105.9168]);
    expect(batTrang?.category).toBe('heritage');

    const eoGio = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'eo-gio');
    expect(eoGio).toBeDefined();
    expect(eoGio?.coordinates).toEqual([13.8861, 109.2931]);
    expect(eoGio?.category).toBe('beach');

    const nhaTrang = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'nha-trang');
    expect(nhaTrang).toBeDefined();
    expect(nhaTrang?.coordinates).toEqual([12.2388, 109.1967]);
    expect(nhaTrang?.category).toBe('beach');
  });
});
