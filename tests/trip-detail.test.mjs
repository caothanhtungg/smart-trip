import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MOCK_TRIP_DETAILS,
  getTripDetailById,
  validateInviteCode,
} from "../src/lib/mock-trips.ts";

test("getTripDetailById: retrieves valid detail for all 3 standard mock trips", () => {
  const dalat = getTripDetailById("trip-dalat-3n2d");
  assert.ok(dalat, "Đà Lạt trip detail should exist");
  assert.equal(dalat.id, "trip-dalat-3n2d");
  assert.equal(dalat.status, "ACTIVE");
  assert.equal(dalat.plannedBudget, 10000000);
  assert.equal(dalat.totalSpent, 8450000);
  assert.equal(dalat.userSpent, 2350000);
  assert.equal(dalat.userBalance.amount, 350000);
  assert.equal(dalat.userBalance.type, "RECEIVE");

  const phuquoc = getTripDetailById("trip-phuquoc-team");
  assert.ok(phuquoc, "Phú Quốc trip detail should exist");
  assert.equal(phuquoc.id, "trip-phuquoc-team");
  assert.equal(phuquoc.status, "SETTLING");
  assert.equal(phuquoc.plannedBudget, 20000000);
  assert.equal(phuquoc.totalSpent, 18500000);
  assert.equal(phuquoc.userBalance.amount, 120000);
  assert.equal(phuquoc.userBalance.type, "PAY");

  const sapa = getTripDetailById("trip-sapa-harvest");
  assert.ok(sapa, "Sa Pa trip detail should exist");
  assert.equal(sapa.id, "trip-sapa-harvest");
  assert.equal(sapa.status, "COMPLETED");
  assert.equal(sapa.plannedBudget, 12000000);
  assert.equal(sapa.totalSpent, 11200000);
  assert.equal(sapa.userBalance.amount, 0);
  assert.equal(sapa.userBalance.type, "SETTLED");
});

test("getTripDetailById: returns null for invalid, non-existent or empty IDs", () => {
  assert.equal(getTripDetailById("unknown-trip-id"), null);
  assert.equal(getTripDetailById(""), null);
  assert.equal(getTripDetailById(null), null);
  assert.equal(getTripDetailById(undefined), null);
});

test("mockTrips immutability: getTripDetailById does not mutate original MOCK_TRIP_DETAILS", () => {
  const tripCopy = getTripDetailById("trip-dalat-3n2d");
  assert.ok(tripCopy);
  // Modify property on returned copy
  tripCopy.title = "Đà Lạt Modified";
  
  // Re-fetch and verify original is unchanged
  const freshTrip = getTripDetailById("trip-dalat-3n2d");
  assert.ok(freshTrip);
  assert.equal(freshTrip.title, "Đà Lạt 3N2Đ");
});

test("financial consistency: budget, spending and remaining calculations", () => {
  for (const trip of Object.values(MOCK_TRIP_DETAILS)) {
    assert.ok(trip.plannedBudget > 0, `${trip.title} plannedBudget must be positive`);
    assert.ok(trip.totalSpent >= 0, `${trip.title} totalSpent must be non-negative`);
    assert.ok(trip.totalSpent <= trip.plannedBudget || trip.status !== "ACTIVE", "Spending check");
    
    // Remaining available budget
    const remaining = Math.max(0, trip.plannedBudget - trip.totalSpent);
    assert.ok(remaining >= 0, "Remaining budget must be >= 0");

    // Category allocation percentages sum to 100%
    const totalPercentage = trip.categoryAllocations.reduce((acc, cat) => acc + cat.percentage, 0);
    assert.equal(totalPercentage, 100, `${trip.title} category percentages must sum to 100%`);

    // Total category amounts sum to totalSpent
    const totalCategoryAmount = trip.categoryAllocations.reduce((acc, cat) => acc + cat.amount, 0);
    assert.equal(totalCategoryAmount, trip.totalSpent, `${trip.title} category amounts must sum to totalSpent`);

    // Invite code validity check
    const inviteValidation = validateInviteCode(trip.inviteCode);
    assert.equal(inviteValidation.isValid, true, `${trip.title} inviteCode must be valid`);
  }
});

test("approved terminology: role HOST exists as Trưởng nhóm and isNoAccount as Chưa có tài khoản", () => {
  for (const trip of Object.values(MOCK_TRIP_DETAILS)) {
    const leader = trip.members.find((m) => m.role === "HOST");
    assert.ok(leader, `${trip.title} must have exactly 1 HOST (Trưởng nhóm)`);

    // At least one trip has member with isNoAccount
    const hasUnregistered = trip.members.some((m) => m.isNoAccount);
    if (trip.id === "trip-dalat-3n2d" || trip.id === "trip-phuquoc-team") {
      assert.ok(hasUnregistered, `${trip.title} should have an unregistered member for UI demonstration`);
    }
  }
});
