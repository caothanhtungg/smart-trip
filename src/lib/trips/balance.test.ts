import { describe, it, expect } from "vitest";
import { getOverallBalance } from "@/lib/trips/balance";
import { MOCK_TRIPS } from "@/lib/mock/trips";

describe("getOverallBalance", () => {
  it("calculates balance totals matching summary strip for MOCK_TRIPS", () => {
    const balance = getOverallBalance(MOCK_TRIPS);
    expect(balance.toReceive).toBe(350000);
    expect(balance.toPay).toBe(120000);
    expect(balance.net).toBe(230000);
  });

  it("handles empty trips array", () => {
    const balance = getOverallBalance([]);
    expect(balance.toReceive).toBe(0);
    expect(balance.toPay).toBe(0);
    expect(balance.net).toBe(0);
  });

  it("handles trips without userBalance or with SETTLED balance", () => {
    const trips = [
      { userBalance: { amount: 0, type: "SETTLED" as const } },
      { userBalance: { amount: 500000, type: "RECEIVE" as const } },
      { userBalance: { amount: 200000, type: "PAY" as const } },
    ];
    const balance = getOverallBalance(trips);
    expect(balance.toReceive).toBe(500000);
    expect(balance.toPay).toBe(200000);
    expect(balance.net).toBe(300000);
  });
});
