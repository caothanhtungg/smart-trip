import { describe, it, expect } from "vitest";
import { getDestinationPhoto, getDestinationGallery } from "@/lib/geo/destination-photos";
import { resolveItemCoordinates } from "@/lib/geo/destination-coords";
import { ItineraryItem } from "@/types/trip";

describe("TripItineraryCard Photo & Layout Data Contracts", () => {
  const sampleItem: ItineraryItem = {
    id: "item-card-1",
    tripId: "trip-1",
    dayDate: "2026-11-10",
    startTime: "08:30",
    placeName: "Bà Nà Hills",
    address: "Hòa Vang, Đà Nẵng",
    latitude: 15.9988,
    longitude: 107.9961,
    isLocked: true,
    sortOrder: 0,
    createdByMemberId: "mem-1",
    createdAt: "2026-10-20T00:00:00Z",
    updatedAt: "2026-10-20T00:00:00Z",
  };

  it("resolves destination photo thumbnail for horizontal card view", () => {
    const photo = getDestinationPhoto(sampleItem.placeName, sampleItem.address ?? undefined);
    expect(photo.url).toBeDefined();
    expect(photo.url).toContain("unsplash.com");
    expect(photo.caption).toContain("Bà Nà");
  });

  it("resolves full gallery and visitor tips for modal display", () => {
    const gallery = getDestinationGallery(sampleItem.placeName);
    expect(gallery.length).toBeGreaterThan(0);
    expect(gallery[0].photographer).toBeDefined();
  });

  it("preserves coordinates and locked starting node metadata", () => {
    const coords = resolveItemCoordinates(sampleItem);
    expect(coords).not.toBeNull();
    expect(coords![0]).toBeCloseTo(15.9988, 3);
    expect(coords![1]).toBeCloseTo(107.9961, 3);
    expect(sampleItem.isLocked).toBe(true);
  });
});

