import test from "node:test";
import assert from "node:assert/strict";

import {
  parseCalendarDate,
  calculateDurationText,
  parseMoneyInput,
  formatMoneyInputValue,
  validateCreateTripForm,
} from "../src/lib/trip-form-validation.ts";

/* =========================================================================
   1. PARSE CALENDAR DATE TESTS
   ========================================================================= */

test("parseCalendarDate: parses ISO YYYY-MM-DD correctly", () => {
  const date = parseCalendarDate("2026-11-20");
  assert.ok(date);
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 10); // 0-indexed: 10 is November
  assert.equal(date.getDate(), 20);
});

test("parseCalendarDate: parses Vietnamese DD/MM/YYYY correctly", () => {
  const date = parseCalendarDate("22/11/2026");
  assert.ok(date);
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 10);
  assert.equal(date.getDate(), 22);
});

test("parseCalendarDate: rejects impossible dates (e.g. 31/02/2026)", () => {
  assert.equal(parseCalendarDate("2026-02-31"), null);
  assert.equal(parseCalendarDate("31/02/2026"), null);
  assert.equal(parseCalendarDate("2026-04-31"), null); // April has 30 days
});

test("parseCalendarDate: handles leap years correctly (29/02/2024 vs 29/02/2025)", () => {
  assert.ok(parseCalendarDate("2024-02-29")); // 2024 is leap year
  assert.equal(parseCalendarDate("2025-02-29"), null); // 2025 is not leap year
});

test("parseCalendarDate: rejects empty, null or malformed strings", () => {
  assert.equal(parseCalendarDate(""), null);
  assert.equal(parseCalendarDate("   "), null);
  assert.equal(parseCalendarDate(null), null);
  assert.equal(parseCalendarDate(undefined), null);
  assert.equal(parseCalendarDate("invalid-date"), null);
});

/* =========================================================================
   2. DURATION TEXT CALCULATION TESTS
   ========================================================================= */

test("calculateDurationText: same-day trip returns '1 ngày'", () => {
  assert.equal(calculateDurationText("2026-11-20", "2026-11-20"), "1 ngày");
  assert.equal(calculateDurationText("20/11/2026", "20/11/2026"), "1 ngày");
});

test("calculateDurationText: 2 days 1 night", () => {
  assert.equal(calculateDurationText("2026-11-20", "2026-11-21"), "2 ngày 1 đêm");
});

test("calculateDurationText: 3 days 2 nights (Stitch example)", () => {
  assert.equal(calculateDurationText("2026-11-20", "2026-11-22"), "3 ngày 2 đêm");
});

test("calculateDurationText: 4 days 3 nights across month boundary", () => {
  assert.equal(calculateDurationText("2026-11-29", "2026-12-02"), "4 ngày 3 đêm");
});

test("calculateDurationText: returns null when endDate is earlier than startDate", () => {
  assert.equal(calculateDurationText("2026-11-22", "2026-11-20"), null);
});

test("calculateDurationText: returns null when dates are missing or invalid", () => {
  assert.equal(calculateDurationText(null, "2026-11-20"), null);
  assert.equal(calculateDurationText("2026-11-20", null), null);
  assert.equal(calculateDurationText("invalid", "2026-11-20"), null);
});

/* =========================================================================
   3. MONEY INPUT PARSING & FORMATTING TESTS
   ========================================================================= */

test("parseMoneyInput: parses dot-separated string into integer VND", () => {
  assert.equal(parseMoneyInput("10.000.000"), 10000000);
  assert.equal(parseMoneyInput("5.000.000 ₫"), 5000000);
  assert.equal(parseMoneyInput("20000000"), 20000000);
  assert.equal(parseMoneyInput(15000000), 15000000);
});

test("parseMoneyInput: returns null for empty or invalid inputs", () => {
  assert.equal(parseMoneyInput(""), null);
  assert.equal(parseMoneyInput("   "), null);
  assert.equal(parseMoneyInput(null), null);
  assert.equal(parseMoneyInput(undefined), null);
  assert.equal(parseMoneyInput(-500), null);
});

test("formatMoneyInputValue: formats integer with Vietnamese dot separator", () => {
  assert.equal(formatMoneyInputValue(10000000), "10.000.000");
  assert.equal(formatMoneyInputValue(500000), "500.000");
  assert.equal(formatMoneyInputValue(0), "0");
  assert.equal(formatMoneyInputValue(null), "");
});

/* =========================================================================
   4. FORM VALIDATION TESTS
   ========================================================================= */

test("validateCreateTripForm: valid full form passes", () => {
  const result = validateCreateTripForm({
    name: "Đà Lạt 3N2Đ cùng hội bạn thân",
    destination: "Thành phố Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    budgetAmount: 10000000,
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
});

test("validateCreateTripForm: destination is optional (ERD compatible)", () => {
  const resultWithoutDestination = validateCreateTripForm({
    name: "Chuyến đi mùa hè",
    destination: "", // Empty destination
    startDate: "2026-12-01",
    endDate: "2026-12-05",
    budgetAmount: null,
  });

  assert.equal(resultWithoutDestination.isValid, true);
  assert.equal(resultWithoutDestination.errors.destination, undefined);
});

test("validateCreateTripForm: name validation errors", () => {
  // Empty
  const rEmpty = validateCreateTripForm({ name: "" });
  assert.equal(rEmpty.isValid, false);
  assert.match(rEmpty.errors.name, /Vui lòng nhập tên chuyến đi/);

  // Whitespace only
  const rWhitespace = validateCreateTripForm({ name: "   " });
  assert.equal(rWhitespace.isValid, false);
  assert.match(rWhitespace.errors.name, /Vui lòng nhập tên chuyến đi/);

  // Less than 2 chars
  const rTooShort = validateCreateTripForm({ name: "A" });
  assert.equal(rTooShort.isValid, false);
  assert.match(rTooShort.errors.name, /ít nhất 2 ký tự/);

  // Over 150 chars
  const rTooLong = validateCreateTripForm({ name: "A".repeat(151) });
  assert.equal(rTooLong.isValid, false);
  assert.match(rTooLong.errors.name, /không được vượt quá 150 ký tự/);

  // Exactly 150 chars is valid
  const rMax = validateCreateTripForm({
    name: "A".repeat(150),
    startDate: "2026-11-20",
    endDate: "2026-11-21",
  });
  assert.equal(rMax.errors.name, undefined);
});

test("validateCreateTripForm: destination over 150 chars produces error", () => {
  const result = validateCreateTripForm({
    name: "Đi chơi xa",
    destination: "D".repeat(151),
    startDate: "2026-11-20",
    endDate: "2026-11-21",
  });

  assert.equal(result.isValid, false);
  assert.match(result.errors.destination, /không được vượt quá 150 ký tự/);
});

test("validateCreateTripForm: date validation errors", () => {
  // Missing startDate
  const rNoStart = validateCreateTripForm({
    name: "Đà Lạt 3N2Đ",
    endDate: "2026-11-22",
  });
  assert.equal(rNoStart.isValid, false);
  assert.match(rNoStart.errors.startDate, /chọn ngày khởi hành/);

  // Missing endDate
  const rNoEnd = validateCreateTripForm({
    name: "Đà Lạt 3N2Đ",
    startDate: "2026-11-20",
  });
  assert.equal(rNoEnd.isValid, false);
  assert.match(rNoEnd.errors.endDate, /chọn ngày kết thúc/);

  // endDate earlier than startDate
  const rInverted = validateCreateTripForm({
    name: "Đà Lạt 3N2Đ",
    startDate: "2026-11-25",
    endDate: "2026-11-20",
  });
  assert.equal(rInverted.isValid, false);
  assert.match(rInverted.errors.endDate, /sau hoặc cùng ngày/);
});

test("validateCreateTripForm: budget validation errors", () => {
  // Negative amount
  const rNegative = validateCreateTripForm({
    name: "Đà Lạt 3N2Đ",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    budgetAmount: -1000,
  });
  assert.equal(rNegative.isValid, false);
  assert.match(rNegative.errors.budgetAmount, /hợp lệ/);

  // Over 10 billion VND
  const rExcessive = validateCreateTripForm({
    name: "Đà Lạt 3N2Đ",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    budgetAmount: 10_000_000_001,
  });
  assert.equal(rExcessive.isValid, false);
  assert.match(rExcessive.errors.budgetAmount, /không được vượt quá 10 tỷ/);
});
