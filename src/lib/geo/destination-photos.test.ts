import { describe, it, expect } from 'vitest';
import {
  getDestinationPhoto,
  getDestinationGallery,
  POPULAR_DISCOVERY_DESTINATIONS,
} from './destination-photos';

describe('Destination Photos Service', () => {
  it('returns accurate photo and caption for major Vietnamese tourist cities', () => {
    const daLatPhoto = getDestinationPhoto('Khách sạn Colline Đà Lạt');
    expect(daLatPhoto.url).toContain('https://images.unsplash.com/');
    expect(daLatPhoto.caption.toLowerCase()).toContain('đà lạt');

    const daNangPhoto = getDestinationPhoto('Cầu Rồng Đà Nẵng');
    expect(daNangPhoto.url).toContain('https://images.unsplash.com/');
    expect(daNangPhoto.caption.toLowerCase()).toContain('đà nẵng');

    const haLongPhoto = getDestinationPhoto('Vịnh Hạ Long', 'Quảng Ninh');
    expect(haLongPhoto.caption.toLowerCase()).toContain('hạ long');

    const hoiAnPhoto = getDestinationPhoto('Phố cổ Hội An', 'Quảng Nam');
    expect(hoiAnPhoto.caption.toLowerCase()).toContain('hội an');
  });

  it('matches landmark photos by specific landmark keyword in address or placeName', () => {
    const fansipanPhoto = getDestinationPhoto('Đỉnh Fansipan', 'Sa Pa Lào Cai');
    expect(fansipanPhoto.caption.toLowerCase()).toContain('fansipan');

    const banaPhoto = getDestinationPhoto('Bà Nà Hills Cầu Vàng');
    expect(banaPhoto.caption.toLowerCase()).toContain('bà nà');
  });

  it('falls back to high quality default scenic travel photo when place is unknown', () => {
    const unknownPhoto = getDestinationPhoto('Quán Cà Phê Không Tên Mới Mở');
    expect(unknownPhoto.url).toBeDefined();
    expect(unknownPhoto.caption).toBeDefined();
    expect(unknownPhoto.photographer).toBeDefined();
  });

  it('provides a gallery of multiple scenic photos for a destination', () => {
    const gallery = getDestinationGallery('Đà Lạt');
    expect(gallery.length).toBeGreaterThanOrEqual(2);
    expect(gallery[0].url).toBeDefined();
    expect(gallery[0].caption).toBeDefined();
  });

  it('exports curated popular discovery destinations for the split-view map', () => {
    expect(POPULAR_DISCOVERY_DESTINATIONS.length).toBeGreaterThanOrEqual(6);
    const daNang = POPULAR_DISCOVERY_DESTINATIONS.find((d) => d.id === 'da-nang');
    expect(daNang).toBeDefined();
    expect(daNang?.coordinates).toEqual([16.0544, 108.2022]);
    expect(daNang?.photo.url).toBeDefined();
  });
});
