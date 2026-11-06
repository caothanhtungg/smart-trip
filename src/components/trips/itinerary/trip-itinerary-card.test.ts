import { describe, it, expect } from "vitest";
import { getDestinationPhoto, getDestinationGallery } from "@/lib/geo/destination-photos";
import { resolveItemCoordinates } from "@/lib/geo/destination-coords";
import { ItineraryItem } from "@/types/trip";
import { calculateItemTimeStatus } from "./trip-itinerary-card";

describe("TripItineraryCard Photo & Layout Data Contracts", () => {
  const sampleItem: ItineraryItem = {
    id: "item-card-1",
    tripId: "trip-1",
    dayDate: "2026-11-10",
    startTime: "08:30",
    endTime: "10:30",
    placeName: "Tràng An",
    address: "Hoa Lư, Ninh Bình",
    latitude: 20.2567,
    longitude: 105.8964,
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
    expect(photo.caption).toContain("Tràng An");
  });

  it("resolves full gallery and visitor tips for modal display", () => {
    const gallery = getDestinationGallery(sampleItem.placeName);
    expect(gallery.length).toBeGreaterThan(0);
    expect(gallery[0].photographer).toBeDefined();
  });

  it("preserves coordinates and locked starting node metadata", () => {
    const coords = resolveItemCoordinates(sampleItem);
    expect(coords).not.toBeNull();
    expect(coords![0]).toBeCloseTo(20.2567, 3);
    expect(coords![1]).toBeCloseTo(105.8964, 3);
    expect(sampleItem.isLocked).toBe(true);
  });

  describe("Timeline Time Status Calculation", () => {
    it("marks stop as in-progress when current time is between start and end time on the current day", () => {
      const mockNow = new Date("2026-11-10T09:15:00");
      const status = calculateItemTimeStatus("2026-11-10", "08:30", "10:30", mockNow);
      expect(status.isInProgress).toBe(true);
      expect(status.isPast).toBe(false);
      expect(status.isUpcoming).toBe(false);
    });

    it("marks stop as past when current time has exceeded end time on the current day", () => {
      const mockNow = new Date("2026-11-10T11:00:00");
      const status = calculateItemTimeStatus("2026-11-10", "08:30", "10:30", mockNow);
      expect(status.isPast).toBe(true);
      expect(status.isInProgress).toBe(false);
      expect(status.isUpcoming).toBe(false);
    });

    it("marks stop as upcoming when start time is in the future on the current day", () => {
      const mockNow = new Date("2026-11-10T07:45:00");
      const status = calculateItemTimeStatus("2026-11-10", "08:30", "10:30", mockNow);
      expect(status.isUpcoming).toBe(true);
      expect(status.isPast).toBe(false);
      expect(status.isInProgress).toBe(false);
    });

    it("marks stops on previous days as completed/past", () => {
      const mockNow = new Date("2026-11-11T07:00:00");
      const status = calculateItemTimeStatus("2026-11-10", "08:30", "10:30", mockNow);
      expect(status.isPast).toBe(true);
    });

    it("marks stops on future days as upcoming", () => {
      const mockNow = new Date("2026-11-09T22:00:00");
      const status = calculateItemTimeStatus("2026-11-10", "08:30", "10:30", mockNow);
      expect(status.isUpcoming).toBe(true);
    });

    it("guarantees mutually exclusive states across all status checks", () => {
      const mockNow = new Date("2026-11-10T09:15:00");
      const status = calculateItemTimeStatus("2026-11-10", "08:30", "10:30", mockNow);
      const activeCount = [status.isPast, status.isInProgress, status.isUpcoming].filter(Boolean).length;
      expect(activeCount).toBe(1);
    });
  });
});
