import { describe, it, expect } from "vitest";
import {
  getDestinationPhoto,
  getDestinationGallery,
} from "@/lib/geo/destination-photos";

describe("DestinationGalleryModal Data Model & Resolution", () => {
  it("resolves primary photo and high-res gallery for iconic landmarks", () => {
    const photo = getDestinationPhoto("Bà Nà Hills", "Đà Nẵng");
    expect(photo.url).toBeDefined();
    expect(photo.caption).toContain("Bà Nà");

    const gallery = getDestinationGallery("Bà Nà Hills");
    expect(gallery.length).toBeGreaterThan(0);
    expect(gallery[0].url).toBeDefined();
    expect(gallery[0].caption).toBeDefined();
  });

  it("provides helpful destination description and visitor tips", () => {
    const photo = getDestinationPhoto("Hồ Gươm", "Hà Nội");
    expect(photo.description).toBeDefined();
    expect(photo.recommendedTip).toBeDefined();
    expect(photo.photographer).toBeDefined();
  });

  it("gracefully falls back to high-quality travel image for custom or unknown locations", () => {
    const unknownPhoto = getDestinationPhoto("Quán Cà Phê Góc Phố Không Tên", "Hẻm 123");
    expect(unknownPhoto.url).toBeDefined();
    expect(unknownPhoto.caption).toContain("khám phá");
  });
});
