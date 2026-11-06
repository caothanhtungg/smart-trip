import { describe, it, expect } from "vitest";
import {
  getDestinationPhoto,
  getDestinationGallery,
} from "@/lib/geo/destination-photos";
import {
  getDestinationReviews,
  getDestinationRatingSummary,
} from "@/lib/reviews/destination-review-service";

describe("DestinationGalleryModal Data Model & Resolution", () => {
  it("resolves primary photo and high-res gallery for iconic landmarks", () => {
    const photo = getDestinationPhoto("Tràng An", "Ninh Bình");
    expect(photo.url).toBeDefined();
    expect(photo.caption).toContain("Tràng An");

    const gallery = getDestinationGallery("Tràng An");
    expect(gallery.length).toBeGreaterThan(0);
    expect(gallery[0].url).toBeDefined();
    expect(gallery[0].caption).toBeDefined();
  });

  it("provides helpful destination description and visitor tips", () => {
    const photo = getDestinationPhoto("Tràng An", "Ninh Bình");
    expect(photo.description).toBeDefined();
    expect(photo.recommendedTip).toBeDefined();
    expect(photo.photographer).toBeDefined();
  });

  it("gracefully falls back to high-quality travel image for custom or unknown locations", () => {
    const unknownPhoto = getDestinationPhoto("Quán Cà Phê Góc Phố Không Tên", "Hẻm 123");
    expect(unknownPhoto.url).toBeDefined();
    expect(unknownPhoto.caption).toContain("khám phá");
  });

  it("provides community reviews and ratings for destination modal", () => {
    const reviews = getDestinationReviews("ninh-binh");
    expect(reviews.length).toBeGreaterThan(0);

    const summary = getDestinationRatingSummary("ninh-binh");
    expect(summary.totalReviews).toBeGreaterThan(0);
    expect(summary.averageRating).toBeGreaterThanOrEqual(4.0);
  });
});
