import { describe, it, expect } from "vitest";
import {
  buildTripCreationUrlFromGuide,
  calculatePackingProgress,
  filterGuidesByRegionAndQuery,
  getFeaturedGuideForRegion,
} from "./guide-utils";
import { TRAVEL_GUIDES } from "./guide-data";

describe("Guide Utils & Helpers", () => {
  describe("buildTripCreationUrlFromGuide", () => {
    it("generates a valid URL with destination and title search parameters", () => {
      const guide = TRAVEL_GUIDES[0];
      const url = buildTripCreationUrlFromGuide(guide);

      expect(url).toContain("/trips/new?");
      expect(url).toContain("destination=");
      expect(url).toContain(encodeURIComponent(guide.destination));
      expect(url).toContain("title=");
    });
  });

  describe("calculatePackingProgress", () => {
    const items = [
      "Áo khoác ấm",
      "Giày trekking",
      "Bình nước",
      "Kem chống nắng",
    ];

    it("returns 0% when no items are checked", () => {
      const result = calculatePackingProgress(items, new Set());
      expect(result.checked).toBe(0);
      expect(result.total).toBe(4);
      expect(result.percentage).toBe(0);
    });

    it("returns 50% when half the items are checked", () => {
      const checked = new Set(["Áo khoác ấm", "Giày trekking"]);
      const result = calculatePackingProgress(items, checked);
      expect(result.checked).toBe(2);
      expect(result.total).toBe(4);
      expect(result.percentage).toBe(50);
    });

    it("returns 100% when all items are checked", () => {
      const checked = new Set(items);
      const result = calculatePackingProgress(items, checked);
      expect(result.checked).toBe(4);
      expect(result.total).toBe(4);
      expect(result.percentage).toBe(100);
    });

    it("handles empty items list safely", () => {
      const result = calculatePackingProgress([], new Set(["anything"]));
      expect(result.checked).toBe(0);
      expect(result.total).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe("filterGuidesByRegionAndQuery", () => {
    it("returns all guides when region is 'all' and query is empty", () => {
      const filtered = filterGuidesByRegionAndQuery(TRAVEL_GUIDES, "all", "");
      expect(filtered.length).toBe(TRAVEL_GUIDES.length);
    });

    it("filters correctly by region", () => {
      const northGuides = filterGuidesByRegionAndQuery(TRAVEL_GUIDES, "north", "");
      expect(northGuides.every((g) => g.region === "north")).toBe(true);
      expect(northGuides.length).toBeGreaterThan(0);

      const centralGuides = filterGuidesByRegionAndQuery(TRAVEL_GUIDES, "central", "");
      expect(centralGuides.every((g) => g.region === "central")).toBe(true);
      expect(centralGuides.length).toBeGreaterThan(0);
    });

    it("filters case-insensitively by search keyword in title, destination, or tags", () => {
      const queryResults = filterGuidesByRegionAndQuery(TRAVEL_GUIDES, "all", "ninh bình");
      expect(queryResults.length).toBeGreaterThan(0);
      expect(queryResults.some((g) => g.destination.includes("Ninh Bình"))).toBe(true);

      const tagResults = filterGuidesByRegionAndQuery(TRAVEL_GUIDES, "all", "hang múa");
      expect(tagResults.length).toBeGreaterThan(0);
      expect(tagResults.some((g) => g.tags.some((t) => t.toLowerCase().includes("hang múa")))).toBe(true);
    });

    it("returns empty array when no guide matches query", () => {
      const results = filterGuidesByRegionAndQuery(TRAVEL_GUIDES, "all", "nonexistent-place-xyz");
      expect(results.length).toBe(0);
    });
  });

  describe("getFeaturedGuideForRegion", () => {
    it("returns Trang An - Tam Coc for 'all' and 'north'", () => {
      const allFeatured = getFeaturedGuideForRegion(TRAVEL_GUIDES, "all");
      expect(allFeatured).toBeDefined();
      expect(allFeatured?.id).toBe("guide-trangan-tamcoc");

      const northFeatured = getFeaturedGuideForRegion(TRAVEL_GUIDES, "north");
      expect(northFeatured).toBeDefined();
      expect(northFeatured?.id).toBe("guide-trangan-tamcoc");
      expect(northFeatured?.region).toBe("north");
    });

    it("returns designated featured guide for 'central', 'highlands', 'south', and 'islands'", () => {
      const centralFeatured = getFeaturedGuideForRegion(TRAVEL_GUIDES, "central");
      expect(centralFeatured).toBeDefined();
      expect(centralFeatured?.region).toBe("central");

      const highlandsFeatured = getFeaturedGuideForRegion(TRAVEL_GUIDES, "highlands");
      expect(highlandsFeatured).toBeDefined();
      expect(highlandsFeatured?.region).toBe("highlands");

      const southFeatured = getFeaturedGuideForRegion(TRAVEL_GUIDES, "south");
      expect(southFeatured).toBeDefined();
      expect(southFeatured?.region).toBe("south");

      const islandsFeatured = getFeaturedGuideForRegion(TRAVEL_GUIDES, "islands");
      expect(islandsFeatured).toBeDefined();
      expect(islandsFeatured?.region).toBe("islands");
    });

    it("handles empty guides list safely", () => {
      const result = getFeaturedGuideForRegion([], "north");
      expect(result).toBeUndefined();
    });
  });
});
