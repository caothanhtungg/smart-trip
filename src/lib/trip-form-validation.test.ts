import { describe, it, expect } from "vitest";
import {
  parseCalendarDate,
  calculateDurationText,
  parseMoneyInput,
  formatMoneyInputValue,
  validateCreateTripForm,
} from "@/lib/trip-form-validation";
import { MAX_TRIP_BUDGET } from "@/lib/money/constants";

describe("parseCalendarDate", () => {
  it("parses ISO YYYY-MM-DD correctly", () => {
    const date = parseCalendarDate("2026-11-20");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10); // 0-indexed: 10 is November
    expect(date?.getDate()).toBe(20);
  });

  it("parses Vietnamese DD/MM/YYYY correctly", () => {
    const date = parseCalendarDate("22/11/2026");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(22);
  });

  it("rejects impossible dates (e.g. 31/02/2026)", () => {
    expect(parseCalendarDate("2026-02-31")).toBeNull();
    expect(parseCalendarDate("31/02/2026")).toBeNull();
    expect(parseCalendarDate("2026-04-31")).toBeNull(); // April has 30 days
  });

  it("handles leap years correctly (29/02/2024 vs 29/02/2025)", () => {
    expect(parseCalendarDate("2024-02-29")).not.toBeNull(); // 2024 is leap year
    expect(parseCalendarDate("2025-02-29")).toBeNull(); // 2025 is not leap year
  });

  it("rejects empty, null or malformed strings", () => {
    expect(parseCalendarDate("")).toBeNull();
    expect(parseCalendarDate("   ")).toBeNull();
    expect(parseCalendarDate(null)).toBeNull();
    expect(parseCalendarDate(undefined)).toBeNull();
    expect(parseCalendarDate("invalid-date")).toBeNull();
  });
});

describe("calculateDurationText", () => {
  it("returns '1 ngày' for same-day trip", () => {
    expect(calculateDurationText("2026-11-20", "2026-11-20")).toBe("1 ngày");
    expect(calculateDurationText("20/11/2026", "20/11/2026")).toBe("1 ngày");
  });

  it("returns '2 ngày 1 đêm' for 2-day trip", () => {
    expect(calculateDurationText("2026-11-20", "2026-11-21")).toBe("2 ngày 1 đêm");
  });

  it("returns '3 ngày 2 đêm' for 3-day trip", () => {
    expect(calculateDurationText("2026-11-20", "2026-11-22")).toBe("3 ngày 2 đêm");
  });

  it("returns '4 ngày 3 đêm' across month boundary", () => {
    expect(calculateDurationText("2026-11-29", "2026-12-02")).toBe("4 ngày 3 đêm");
  });

  it("returns null when endDate is earlier than startDate", () => {
    expect(calculateDurationText("2026-11-22", "2026-11-20")).toBeNull();
  });

  it("returns null when dates are missing or invalid", () => {
    expect(calculateDurationText(null, "2026-11-20")).toBeNull();
    expect(calculateDurationText("2026-11-20", null)).toBeNull();
    expect(calculateDurationText("invalid", "2026-11-20")).toBeNull();
  });
});

describe("parseMoneyInput and formatMoneyInputValue re-exports", () => {
  it("parses formatted inputs correctly", () => {
    expect(parseMoneyInput("10.000.000")).toBe(10000000);
    expect(parseMoneyInput("5.000.000 ₫")).toBe(5000000);
  });

  it("formats integer correctly", () => {
    expect(formatMoneyInputValue(10000000)).toBe("10.000.000");
  });
});

describe("validateCreateTripForm", () => {
  it("passes for valid full form", () => {
    const result = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ cùng hội bạn thân",
      destination: "Thành phố Đà Lạt, Lâm Đồng",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      budgetAmount: 10000000,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("allows empty destination (ERD compatible)", () => {
    const resultWithoutDestination = validateCreateTripForm({
      name: "Chuyến đi mùa hè",
      destination: "",
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      budgetAmount: null,
    });

    expect(resultWithoutDestination.isValid).toBe(true);
    expect(resultWithoutDestination.errors.destination).toBeUndefined();
  });

  it("validates trip name constraints", () => {
    // Empty
    const rEmpty = validateCreateTripForm({ name: "" });
    expect(rEmpty.isValid).toBe(false);
    expect(rEmpty.errors.name).toMatch(/Vui lòng nhập tên chuyến đi/);

    // Whitespace only
    const rWhitespace = validateCreateTripForm({ name: "   " });
    expect(rWhitespace.isValid).toBe(false);
    expect(rWhitespace.errors.name).toMatch(/Vui lòng nhập tên chuyến đi/);

    // Less than 2 chars
    const rTooShort = validateCreateTripForm({ name: "A" });
    expect(rTooShort.isValid).toBe(false);
    expect(rTooShort.errors.name).toMatch(/ít nhất 2 ký tự/);

    // Over 150 chars
    const rTooLong = validateCreateTripForm({ name: "A".repeat(151) });
    expect(rTooLong.isValid).toBe(false);
    expect(rTooLong.errors.name).toMatch(/không được vượt quá 150 ký tự/);

    // Exactly 150 chars is valid
    const rMax = validateCreateTripForm({
      name: "A".repeat(150),
      startDate: "2026-11-20",
      endDate: "2026-11-21",
    });
    expect(rMax.errors.name).toBeUndefined();
  });

  it("validates destination constraints", () => {
    const result = validateCreateTripForm({
      name: "Đi chơi xa",
      destination: "D".repeat(151),
      startDate: "2026-11-20",
      endDate: "2026-11-21",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.destination).toMatch(/không được vượt quá 150 ký tự/);
  });

  it("validates start and end dates", () => {
    // Missing startDate
    const rNoStart = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ",
      endDate: "2026-11-22",
    });
    expect(rNoStart.isValid).toBe(false);
    expect(rNoStart.errors.startDate).toMatch(/chọn ngày khởi hành/);

    // Missing endDate
    const rNoEnd = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ",
      startDate: "2026-11-20",
    });
    expect(rNoEnd.isValid).toBe(false);
    expect(rNoEnd.errors.endDate).toMatch(/chọn ngày kết thúc/);

    // endDate earlier than startDate
    const rInverted = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ",
      startDate: "2026-11-25",
      endDate: "2026-11-20",
    });
    expect(rInverted.isValid).toBe(false);
    expect(rInverted.errors.endDate).toMatch(/sau hoặc cùng ngày/);
  });

  it("validates budget amount constraints (PostgreSQL safe integer max 2 billion VND)", () => {
    // Negative amount
    const rNegative = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      budgetAmount: -1000,
    });
    expect(rNegative.isValid).toBe(false);
    expect(rNegative.errors.budgetAmount).toMatch(/hợp lệ/);

    // Exceeds 2 billion VND
    const rExcessive = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      budgetAmount: MAX_TRIP_BUDGET + 1,
    });
    expect(rExcessive.isValid).toBe(false);
    expect(rExcessive.errors.budgetAmount).toMatch(/không được vượt quá 2.000.000.000 ₫/);

    // Exactly 2 billion VND is valid
    const rValidMax = validateCreateTripForm({
      name: "Đà Lạt 3N2Đ",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      budgetAmount: MAX_TRIP_BUDGET,
    });
    expect(rValidMax.isValid).toBe(true);
    expect(rValidMax.errors.budgetAmount).toBeUndefined();
  });
});
