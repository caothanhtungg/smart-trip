import { describe, it, expect } from "vitest";
import {
  POPULAR_DISCOVERY_DESTINATIONS,
  DiscoveryDestination,
} from "@/lib/geo/destination-photos";
import {
  filterDestinationsByCategory,
  DISCOVERY_CATEGORY_TABS,
} from "./discovery-model";

describe("DiscoverySplitView & DiscoveryMap Data Model", () => {
  it("provides comprehensive curated destinations across Vietnam with coordinates", () => {
    expect(POPULAR_DISCOVERY_DESTINATIONS.length).toBeGreaterThanOrEqual(7);

    for (const d of POPULAR_DISCOVERY_DESTINATIONS) {
      expect(d.id).toBeDefined();
      expect(d.name).toBeDefined();
      expect(d.coordinates).toHaveLength(2);
      expect(d.coordinates[0]).toBeGreaterThan(8); // Vietnam lat > 8N
      expect(d.coordinates[0]).toBeLessThan(24); // Vietnam lat < 24N
      expect(d.coordinates[1]).toBeGreaterThan(102); // Vietnam lng > 102E
      expect(d.coordinates[1]).toBeLessThan(110); // Vietnam lng < 110E
      expect(d.photo.url).toBeDefined();
      expect(d.badge).toBeDefined();
    }
  });

  it("filters destinations accurately by category tabs", () => {
    const beachDestinations = filterDestinationsByCategory(
      POPULAR_DISCOVERY_DESTINATIONS,
      "beach"
    );
    expect(beachDestinations.length).toBeGreaterThan(0);
    expect(beachDestinations.every((d) => d.category === "beach")).toBe(true);

    const mountainDestinations = filterDestinationsByCategory(
      POPULAR_DISCOVERY_DESTINATIONS,
      "mountain"
    );
    expect(mountainDestinations.length).toBeGreaterThan(0);
    expect(mountainDestinations.every((d) => d.category === "mountain")).toBe(true);

    const all = filterDestinationsByCategory(POPULAR_DISCOVERY_DESTINATIONS, "all");
    expect(all.length).toBe(POPULAR_DISCOVERY_DESTINATIONS.length);
  });

  it("defines standard Dream Destini category filter tabs", () => {
    const tabKeys = DISCOVERY_CATEGORY_TABS.map((t) => t.key);
    expect(tabKeys).toContain("all");
    expect(tabKeys).toContain("beach");
    expect(tabKeys).toContain("mountain");
    expect(tabKeys).toContain("heritage");
    expect(tabKeys).toContain("city");
  });
});

