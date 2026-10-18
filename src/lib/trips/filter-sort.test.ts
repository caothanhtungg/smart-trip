import { describe, it, expect } from "vitest";
import { filterTrips, sortTrips } from "@/lib/trips/filter-sort";
import { MOCK_TRIPS } from "@/lib/mock/trips";

describe("filterTrips", () => {
  it("correctly filters by 3 official statuses (ACTIVE, SETTLING, COMPLETED)", () => {
    const allTrips = filterTrips(MOCK_TRIPS, "all");
    expect(allTrips).toHaveLength(3);

    const activeTrips = filterTrips(MOCK_TRIPS, "active");
    expect(activeTrips).toHaveLength(2);
    expect(activeTrips.map((t) => t.status)).toEqual(["ACTIVE", "SETTLING"]);

    const completedTrips = filterTrips(MOCK_TRIPS, "completed");
    expect(completedTrips).toHaveLength(1);
    expect(completedTrips[0].status).toBe("COMPLETED");
    expect(completedTrips[0].id).toBe("trip-sapa-harvest");

    const uniqueStatuses = new Set(MOCK_TRIPS.map((t) => t.status));
    expect(Array.from(uniqueStatuses).sort()).toEqual(["ACTIVE", "COMPLETED", "SETTLING"]);
  });

  it("preserves immutability of the original trips array", () => {
    const originalIds = MOCK_TRIPS.map((t) => t.id);
    filterTrips(MOCK_TRIPS, "active");
    filterTrips(MOCK_TRIPS, "completed");
    const afterIds = MOCK_TRIPS.map((t) => t.id);
    expect(afterIds).toEqual(originalIds);
  });
});

describe("sortTrips", () => {
  it("'latest' sorts by updatedAt descending (cập nhật gần nhất)", () => {
    const sorted = sortTrips(MOCK_TRIPS, "latest");
    expect(sorted).toHaveLength(3);
    expect(sorted[0].id).toBe("trip-phuquoc-team"); // 2026-10-17T09:30:00Z
    expect(sorted[1].id).toBe("trip-dalat-3n2d");    // 2026-10-16T10:00:00Z
    expect(sorted[2].id).toBe("trip-sapa-harvest");  // 2026-10-13T16:00:00Z
  });

  it("'departure' sorts by startDate ascending (ngày khởi hành sớm nhất)", () => {
    const sorted = sortTrips(MOCK_TRIPS, "departure");
    expect(sorted).toHaveLength(3);
    expect(sorted[0].id).toBe("trip-sapa-harvest");  // 2026-10-10
    expect(sorted[1].id).toBe("trip-dalat-3n2d");    // 2026-11-20
    expect(sorted[2].id).toBe("trip-phuquoc-team"); // 2026-12-12
  });

  it("'name' sorts alphabetically A-Z by Vietnamese name", () => {
    const sorted = sortTrips(MOCK_TRIPS, "name");
    expect(sorted).toHaveLength(3);
    expect(sorted[0].name).toBe("Đà Lạt 3N2Đ");
    expect(sorted[1].name).toBe("Phú Quốc cùng team");
    expect(sorted[2].name).toBe("Sa Pa mùa lúa chín");
  });

  it("preserves immutability of the original trips array", () => {
    const originalIds = MOCK_TRIPS.map((t) => t.id);
    sortTrips(MOCK_TRIPS, "latest");
    sortTrips(MOCK_TRIPS, "departure");
    sortTrips(MOCK_TRIPS, "name");
    const afterIds = MOCK_TRIPS.map((t) => t.id);
    expect(afterIds).toEqual(originalIds);
  });
});
