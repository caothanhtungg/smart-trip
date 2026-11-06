import { describe, it, expect } from "vitest";
import { TRAVEL_GUIDES, getGuideGallery } from "@/lib/guides/guide-data";
import {
  buildTripCreationUrlFromGuide,
  calculatePackingProgress,
} from "@/lib/guides/guide-utils";

describe("GuideDetailModal Data Contracts", () => {
  const guide = TRAVEL_GUIDES[0];

  it("provides complete modal data structure for all sample guides", () => {
    for (const g of TRAVEL_GUIDES) {
      expect(g.id).toBeDefined();
      expect(g.title).toBeDefined();
      expect(g.destination).toBeDefined();
      expect(g.coverPhoto.url).toBeDefined();
      expect(g.sections.sampleDays.length).toBeGreaterThan(0);
      expect(g.sections.foodHighlights.length).toBeGreaterThan(0);
      expect(g.sections.packingList.length).toBeGreaterThan(0);
      expect(g.sections.budgetTips.length).toBeGreaterThan(0);
    }
  });

  it("calculates packing list completion accurately", () => {
    const list = guide.sections.packingList;
    const initial = calculatePackingProgress(list, new Set());
    expect(initial.checked).toBe(0);
    expect(initial.percentage).toBe(0);

    const checkedOne = new Set([list[0]]);
    const partial = calculatePackingProgress(list, checkedOne);
    expect(partial.checked).toBe(1);
    expect(partial.percentage).toBe(Math.round((1 / list.length) * 100));
  });

  it("constructs pre-filled trip creation redirect URL with destination and title query params", () => {
    const url = buildTripCreationUrlFromGuide(guide);
    const parsed = new URL(url, "http://localhost:3000");
    expect(parsed.pathname).toBe("/trips/new");
    expect(parsed.searchParams.get("destination")).toBe(guide.destination);
    expect(parsed.searchParams.get("title")).toBe(`Chuyến đi ${guide.destination}`);
  });

  describe("Itinerary Sample Days Timeline Architecture", () => {
    it("ensures all sample days have structured places list for vertical timeline rendering", () => {
      for (const g of TRAVEL_GUIDES) {
        for (const day of g.sections.sampleDays) {
          expect(day.day).toBeGreaterThan(0);
          expect(day.title.length).toBeGreaterThan(0);
          expect(day.places.length).toBeGreaterThanOrEqual(2);
          for (const place of day.places) {
            expect(place.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    it("ensures guide gallery has landmarks matching the itinerary places", () => {
      for (const g of TRAVEL_GUIDES) {
        const gallery = getGuideGallery(g);
        expect(gallery.length).toBeGreaterThanOrEqual(4);

        // Confirm at least one place in the itinerary matches a tag or caption in gallery
        const allPlaces = g.sections.sampleDays.flatMap((d) => d.places);
        const hasMatchedLandmark = allPlaces.some((place) => {
          const normPlace = place.toLowerCase();
          return gallery.some((img) =>
            (img.caption || "").toLowerCase().includes(normPlace) ||
            (img.tags || []).some((t) => t.toLowerCase().includes(normPlace) || normPlace.includes(t.toLowerCase()))
          );
        });

        expect(hasMatchedLandmark).toBe(true);
      }
    });
  });
});
