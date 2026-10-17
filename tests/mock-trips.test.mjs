import test from "node:test";
import assert from "node:assert/strict";

import {
  MOCK_TRIPS,
  getOverallBalance,
  filterTrips,
  sortTrips,
  validateInviteCode,
} from "../src/lib/mock-trips.ts";

/* =========================================================================
   VẤN ĐỀ 1: UNIT TESTS MÃ MỜI (10–12 KÝ TỰ, CHUẨN HÓA, KHÔNG CHẤP NHẬN 6 KÝ TỰ)
   ========================================================================= */

test("validateInviteCode: accepts valid 10-12 alphanumeric codes with hyphens", () => {
  const result = validateInviteCode("DL3N2D-TRIP99");
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedCode, "DL3N2D-TRIP99");
});

test("validateInviteCode: accepts valid code without hyphens", () => {
  const result11 = validateInviteCode("DL3N2DTRIP9");
  assert.equal(result11.isValid, true);
  assert.equal(result11.normalizedCode, "DL3N2DTRIP9");

  const result10 = validateInviteCode("TRIP2026VN");
  assert.equal(result10.isValid, true);
  assert.equal(result10.normalizedCode, "TRIP2026VN");
});

test("validateInviteCode: normalizes lowercase and trims leading/trailing whitespace", () => {
  const result = validateInviteCode("   dl3n2d-trip99   ");
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedCode, "DL3N2D-TRIP99");
});

test("validateInviteCode: rejects 6-character codes explicitly", () => {
  const result6 = validateInviteCode("DL2026");
  assert.equal(result6.isValid, false);
  assert.match(result6.error, /quá ngắn/);

  const resultHyphen6 = validateInviteCode("DL-2026");
  assert.equal(resultHyphen6.isValid, false);
  assert.match(resultHyphen6.error, /quá ngắn/);
});

test("validateInviteCode: rejects codes that are too short (< 10 alphanumeric characters)", () => {
  const result = validateInviteCode("DL3N2D-9");
  assert.equal(result.isValid, false);
  assert.match(result.error, /quá ngắn/);
});

test("validateInviteCode: rejects codes that are too long (> 12 alphanumeric characters)", () => {
  const result = validateInviteCode("DL3N2D-TRIP9999"); // 14 alphanumeric chars
  assert.equal(result.isValid, false);
  assert.match(result.error, /quá dài/);
});

test("validateInviteCode: rejects invalid characters (spaces, special symbols)", () => {
  const resultSpecial = validateInviteCode("DL3N2D@TRIP9");
  assert.equal(resultSpecial.isValid, false);
  assert.match(resultSpecial.error, /chỉ được chứa chữ cái/);

  const resultSpace = validateInviteCode("DL3N2D TRIP9");
  assert.equal(resultSpace.isValid, false);
  assert.match(resultSpace.error, /chỉ được chứa chữ cái/);
});

test("validateInviteCode: rejects malformed hyphen placement", () => {
  // Hyphen at start
  const resultStart = validateInviteCode("-DL3N2DTRIP99");
  assert.equal(resultStart.isValid, false);
  assert.match(resultStart.error, /Dấu gạch nối không đúng định dạng/);

  // Hyphen at end
  const resultEnd = validateInviteCode("DL3N2DTRIP99-");
  assert.equal(resultEnd.isValid, false);
  assert.match(resultEnd.error, /Dấu gạch nối không đúng định dạng/);
});

test("validateInviteCode: limits to at most 1 hyphen (max 13 characters raw string)", () => {
  // Multiple hyphens
  const resultMultiple = validateInviteCode("DL-3N2D-TRIP99");
  assert.equal(resultMultiple.isValid, false);
  assert.match(resultMultiple.error, /tối đa 1 dấu gạch nối/);

  // Consecutive hyphens (also > 1 hyphen)
  const resultConsecutive = validateInviteCode("DL3N2D--TRIP99");
  assert.equal(resultConsecutive.isValid, false);
  assert.match(resultConsecutive.error, /tối đa 1 dấu gạch nối/);

  // Max 13 characters valid code
  const resultExact13 = validateInviteCode("DL3N2D-TRIP99"); // 12 alnum + 1 hyphen = 13 chars
  assert.equal(resultExact13.isValid, true);
  assert.equal(resultExact13.normalizedCode?.length, 13);
});

test("validateInviteCode: rejects empty, null or undefined input", () => {
  assert.equal(validateInviteCode("").isValid, false);
  assert.equal(validateInviteCode("    ").isValid, false);
  assert.equal(validateInviteCode(null).isValid, false);
  assert.equal(validateInviteCode(undefined).isValid, false);
});

/* =========================================================================
   VẤN ĐỀ 3: UNIT TESTS BỘ LỌC, SẮP XẾP VÀ TÍNH BẤT BIẾN DỮ LIỆU
   ========================================================================= */

test("filterTrips: correctly filters by 3 official statuses (ACTIVE, SETTLING, COMPLETED)", () => {
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

  // Verify only the 3 official statuses exist in MOCK_TRIPS
  const uniqueStatuses = new Set(MOCK_TRIPS.map((t) => t.status));
  assert.deepEqual(Array.from(uniqueStatuses).sort(), ["ACTIVE", "COMPLETED", "SETTLING"]);
});

test("filterTrips: preserves immutability of the original MOCK_TRIPS array", () => {
  const originalIds = MOCK_TRIPS.map((t) => t.id);
  filterTrips(MOCK_TRIPS, "active");
  filterTrips(MOCK_TRIPS, "completed");
  const afterIds = MOCK_TRIPS.map((t) => t.id);
  assert.deepEqual(originalIds, afterIds, "MOCK_TRIPS must not be mutated by filtering");
});

test("sortTrips: 'latest' sorts by updatedAt descending (cập nhật gần nhất)", () => {
  const sorted = sortTrips(MOCK_TRIPS, "latest");
  assert.equal(sorted.length, 3);
  assert.equal(sorted[0].id, "trip-phuquoc-team"); // 2026-10-17T09:30:00Z
  assert.equal(sorted[1].id, "trip-dalat-3n2d");    // 2026-10-16T10:00:00Z
  assert.equal(sorted[2].id, "trip-sapa-harvest");  // 2026-10-13T16:00:00Z
});

test("sortTrips: 'departure' sorts by startDate ascending (ngày khởi hành sớm nhất)", () => {
  const sorted = sortTrips(MOCK_TRIPS, "departure");
  assert.equal(sorted.length, 3);
  assert.equal(sorted[0].id, "trip-sapa-harvest");  // 2026-10-10
  assert.equal(sorted[1].id, "trip-dalat-3n2d");    // 2026-11-20
  assert.equal(sorted[2].id, "trip-phuquoc-team"); // 2026-12-12
});

test("sortTrips: 'name' sorts alphabetically A-Z by Vietnamese title", () => {
  const sorted = sortTrips(MOCK_TRIPS, "name");
  assert.equal(sorted.length, 3);
  assert.equal(sorted[0].title, "Đà Lạt 3N2Đ");
  assert.equal(sorted[1].title, "Phú Quốc cùng team");
  assert.equal(sorted[2].title, "Sa Pa mùa lúa chín");
});

test("sortTrips: preserves immutability of the original MOCK_TRIPS array", () => {
  const originalIds = MOCK_TRIPS.map((t) => t.id);
  sortTrips(MOCK_TRIPS, "latest");
  sortTrips(MOCK_TRIPS, "departure");
  sortTrips(MOCK_TRIPS, "name");
  const afterIds = MOCK_TRIPS.map((t) => t.id);
  assert.deepEqual(originalIds, afterIds, "MOCK_TRIPS must not be mutated by sorting");
});

/* =========================================================================
   DỮ LIỆU CHUYẾN ĐI & TÍNH TOÁN SỐ DƯ TỔNG HỢP
   ========================================================================= */

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
