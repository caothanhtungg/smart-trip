import { describe, it, expect } from "vitest";
import { getTripDetailById, getTrips, getTripExpenses, getCurrentUser } from "@/lib/data/trips";
import { MOCK_TRIP_DETAILS } from "@/lib/mock/trips";
import { validateInviteCode } from "@/lib/trips/invite-code";

describe("Trip Data Service (src/lib/data/trips)", () => {
  it("getTripDetailById: retrieves valid detail for all 3 standard mock trips", async () => {
    const dalat = await getTripDetailById("trip-dalat-3n2d");
    expect(dalat).not.toBeNull();
    expect(dalat?.id).toBe("trip-dalat-3n2d");
    expect(dalat?.status).toBe("ACTIVE");
    expect(dalat?.plannedBudget).toBe(10000000);
    expect(dalat?.totalSpent).toBe(8450000);
    expect(dalat?.userSpent).toBe(2350000);
    expect(dalat?.userBalance?.amount).toBe(350000);
    expect(dalat?.userBalance?.type).toBe("RECEIVE");

    const phuquoc = await getTripDetailById("trip-phuquoc-team");
    expect(phuquoc).not.toBeNull();
    expect(phuquoc?.id).toBe("trip-phuquoc-team");
    expect(phuquoc?.status).toBe("SETTLING");
    expect(phuquoc?.plannedBudget).toBe(20000000);
    expect(phuquoc?.totalSpent).toBe(18500000);
    expect(phuquoc?.userBalance?.amount).toBe(120000);
    expect(phuquoc?.userBalance?.type).toBe("PAY");

    const sapa = await getTripDetailById("trip-sapa-harvest");
    expect(sapa).not.toBeNull();
    expect(sapa?.id).toBe("trip-sapa-harvest");
    expect(sapa?.status).toBe("COMPLETED");
    expect(sapa?.plannedBudget).toBe(12000000);
    expect(sapa?.totalSpent).toBe(11200000);
    expect(sapa?.userBalance?.amount).toBe(0);
    expect(sapa?.userBalance?.type).toBe("SETTLED");
  });

  it("getTripDetailById: returns null for invalid, non-existent or empty IDs", async () => {
    expect(await getTripDetailById("unknown-trip-id")).toBeNull();
    expect(await getTripDetailById("")).toBeNull();
    expect(await getTripDetailById(null)).toBeNull();
    expect(await getTripDetailById(undefined)).toBeNull();
  });

  it("immutability: getTripDetailById does not mutate original MOCK_TRIP_DETAILS", async () => {
    const tripCopy = await getTripDetailById("trip-dalat-3n2d");
    expect(tripCopy).not.toBeNull();
    if (tripCopy) {
      tripCopy.name = "Đà Lạt Modified";
    }

    const freshTrip = await getTripDetailById("trip-dalat-3n2d");
    expect(freshTrip).not.toBeNull();
    expect(freshTrip?.name).toBe("Đà Lạt 3N2Đ");
  });

  it("financial consistency: budget, spending and remaining calculations", () => {
    for (const trip of Object.values(MOCK_TRIP_DETAILS)) {
      expect(trip.plannedBudget).toBeGreaterThan(0);
      expect(trip.totalSpent).toBeGreaterThanOrEqual(0);
      if (trip.status === "ACTIVE") {
        expect(trip.totalSpent).toBeLessThanOrEqual(trip.plannedBudget);
      }

      // Category allocation percentages sum to 100%
      const totalPercentage = trip.categoryAllocations.reduce((acc, cat) => acc + cat.percentage, 0);
      expect(totalPercentage).toBe(100);

      // Total category amounts sum to totalSpent
      const totalCategoryAmount = trip.categoryAllocations.reduce((acc, cat) => acc + cat.amount, 0);
      expect(totalCategoryAmount).toBe(trip.totalSpent);

      // Invite code validity check
      const inviteValidation = validateInviteCode(trip.inviteCode);
      expect(inviteValidation.isValid).toBe(true);
    }
  });

  it("approved terminology: role HOST exists and isNoAccount exists for unregistered member", () => {
    for (const trip of Object.values(MOCK_TRIP_DETAILS)) {
      const leader = trip.members.find((m) => m.role === "HOST");
      expect(leader).toBeDefined();

      const hasUnregistered = trip.members.some((m) => m.isNoAccount);
      if (trip.id === "trip-dalat-3n2d" || trip.id === "trip-phuquoc-team") {
        expect(hasUnregistered).toBe(true);
      }
    }
  });

  it("getTrips and getCurrentUser return valid mock data", async () => {
    const trips = await getTrips();
    expect(trips).toHaveLength(3);

    const user = await getCurrentUser();
    expect(user.id).toBe("usr-current");
    expect(user.name).toBe("Lan");

    const expenses = await getTripExpenses("trip-dalat-3n2d");
    expect(expenses.length).toBeGreaterThan(0);
  });
});
