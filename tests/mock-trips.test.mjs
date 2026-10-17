import test from "node:test";
import assert from "node:assert/strict";

// We can import or mirror the logic for test validation
import {
  MOCK_TRIPS,
  getOverallBalance,
  filterTrips,
} from "../src/lib/mock-trips.ts";

test("mockTrips: Sa Pa trip dates are adjusted to 10/10/2026 - 13/10/2026 (completed)", () => {
  const sapa = MOCK_TRIPS.find((t) => t.id === "trip-sapa-harvest");
  assert.ok(sapa, "Sa Pa trip should exist");
  assert.equal(sapa.startDate, "2026-10-10");
  assert.equal(sapa.endDate, "2026-10-13");
  assert.equal(sapa.status, "COMPLETED");
  assert.equal(sapa.userBalance.amount, 0);
  assert.equal(sapa.userBalance.label, "Đã xong");
});

test("mockTrips: balance calculation matches Stitch summary strip", () => {
  const balance = getOverallBalance(MOCK_TRIPS);
  assert.equal(balance.toReceive, 350000);
  assert.equal(balance.toPay, 120000);
  assert.equal(balance.net, 230000);
});

test("mockTrips: filterTrips correctly segregates active and completed trips", () => {
  const allTrips = filterTrips(MOCK_TRIPS, "all");
  assert.equal(allTrips.length, 3);

  const activeTrips = filterTrips(MOCK_TRIPS, "active");
  assert.equal(activeTrips.length, 2);
  assert.deepEqual(
    activeTrips.map((t) => t.status),
    ["ACTIVE", "SETTLING"]
  );

  const completedTrips = filterTrips(MOCK_TRIPS, "completed");
  assert.equal(completedTrips.length, 1);
  assert.equal(completedTrips[0].status, "COMPLETED");
  assert.equal(completedTrips[0].id, "trip-sapa-harvest");
});
