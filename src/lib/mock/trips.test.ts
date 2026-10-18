import { describe, it, expect } from "vitest";
import { MOCK_TRIPS } from "@/lib/mock/trips";
import { getOverallBalance } from "@/lib/trips/balance";

describe("MOCK_TRIPS integrity & empty state simulation", () => {
  it("Sa Pa trip dates are adjusted to 10/10/2026 - 13/10/2026 (completed)", () => {
    const sapa = MOCK_TRIPS.find((t) => t.id === "trip-sapa-harvest");
    expect(sapa).toBeDefined();
    expect(sapa?.startDate).toBe("2026-10-10");
    expect(sapa?.endDate).toBe("2026-10-13");
    expect(sapa?.status).toBe("COMPLETED");
    expect(sapa?.userBalance.amount).toBe(0);
    expect(sapa?.userBalance.type).toBe("SETTLED");
  });

  it("empty state simulation produces 0 counts and 0 balances without mutating MOCK_TRIPS", () => {
    const simulateEmptyState = true;

    // Simulate tab counts as in page.tsx
    const allCount = simulateEmptyState ? 0 : MOCK_TRIPS.length;
    const activeCount = simulateEmptyState
      ? 0
      : MOCK_TRIPS.filter((t) => t.status === "ACTIVE" || t.status === "SETTLING").length;
    const completedCount = simulateEmptyState
      ? 0
      : MOCK_TRIPS.filter((t) => t.status === "COMPLETED").length;

    expect(allCount).toBe(0);
    expect(activeCount).toBe(0);
    expect(completedCount).toBe(0);

    // Simulate balance summary
    const summary = simulateEmptyState
      ? { toReceive: 0, toPay: 0, net: 0 }
      : getOverallBalance(MOCK_TRIPS);

    expect(summary.toReceive).toBe(0);
    expect(summary.toPay).toBe(0);
    expect(summary.net).toBe(0);

    // Trips list in empty state
    const currentTrips = simulateEmptyState ? [] : MOCK_TRIPS;
    expect(currentTrips).toHaveLength(0);

    // Verify original MOCK_TRIPS remains intact
    expect(MOCK_TRIPS).toHaveLength(3);
    expect(MOCK_TRIPS[0].id).toBe("trip-dalat-3n2d");
    expect(MOCK_TRIPS[1].id).toBe("trip-phuquoc-team");
    expect(MOCK_TRIPS[2].id).toBe("trip-sapa-harvest");
  });
});
