import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatMoney,
  formatSignedMoney,
  formatTime,
  getInitials,
  getAvatarBgColor,
} from "@/lib/utils";

describe("formatDate", () => {
  it("handles ISO Date-only format without timezone shift", () => {
    expect(formatDate("2026-11-20")).toBe("20/11/2026");
    expect(formatDate("2025-01-05")).toBe("05/01/2025");
  });

  it("handles Vietnamese format DD/MM/YYYY and DD-MM-YYYY", () => {
    expect(formatDate("20/11/2026")).toBe("20/11/2026");
    expect(formatDate("5/4/2027")).toBe("05/04/2027");
    expect(formatDate("15-08-2026")).toBe("15/08/2026");
  });

  it("handles Date objects dynamically", () => {
    const d1 = new Date(2026, 10, 20); // 20/11/2026
    const d2 = new Date(2030, 0, 1);   // 01/01/2030
    expect(formatDate(d1)).toBe("20/11/2026");
    expect(formatDate(d2)).toBe("01/01/2030");
  });

  it("handles leap years and rejects impossible calendar dates", () => {
    expect(formatDate("2024-02-29")).toBe("29/02/2024"); // 2024 is leap
    expect(formatDate("2023-02-29")).toBe("");           // 2023 is non-leap -> invalid
    expect(formatDate("31/02/2026")).toBe("");           // Feb 31 does not exist
    expect(formatDate("31/04/2026")).toBe("");           // April has only 30 days
  });

  it("handles null, undefined, empty, and invalid strings gracefully", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("")).toBe("");
    expect(formatDate("not-a-date")).toBe("");
  });

  it("formats full ISO timestamp with Asia/Ho_Chi_Minh timezone: '2026-11-20T20:30:00Z' -> '21/11/2026'", () => {
    // 20:30:00Z is 03:30:00 next day in UTC+7 (Vietnam)
    expect(formatDate("2026-11-20T20:30:00Z")).toBe("21/11/2026");
  });
});

describe("formatMoney & formatSignedMoney", () => {
  it("formats Vietnamese currency with non-breaking space (U+00A0) before '₫'", () => {
    expect(formatMoney(1250000)).toBe("1.250.000\u00A0₫");
    expect(formatMoney(0)).toBe("0\u00A0₫");
    expect(formatMoney(1250000).charCodeAt(9)).toBe(0x00a0);
  });

  it("throws error if amount is not a safe integer (no silent rounding)", () => {
    expect(() => formatMoney(150000.5)).toThrowError(/Safe Integer/);
    expect(() => formatMoney(NaN)).toThrowError(/Safe Integer/);
  });

  it("formats signed money with appropriate sign, non-breaking space, and Tailwind color classes", () => {
    const pos = formatSignedMoney(350000);
    expect(pos.text).toBe("+350.000\u00A0₫");
    expect(pos.className).toContain("text-functional-positive");

    const neg = formatSignedMoney(-120000);
    expect(neg.text).toBe("-120.000\u00A0₫");
    expect(neg.className).toContain("text-functional-negative");

    const zero = formatSignedMoney(0);
    expect(zero.text).toBe("0\u00A0₫");
    expect(zero.className).toContain("text-text-muted");
  });
});

describe("formatTime, getInitials, getAvatarBgColor", () => {
  it("formats time correctly", () => {
    expect(formatTime("14:30:00")).toBe("14:30");
    expect(formatTime("8:15:00")).toBe("08:15");
    expect(formatTime("")).toBe("");
  });

  it("generates initials from Vietnamese names", () => {
    expect(getInitials("Nguyễn Văn Nam")).toBe("NN");
    expect(getInitials("Lan")).toBe("L");
    expect(getInitials("")).toBe("?");
  });

  it("picks deterministic avatar background color", () => {
    const c1 = getAvatarBgColor("Minh");
    const c2 = getAvatarBgColor("Minh");
    expect(c1).toBe(c2);
    expect(c1.startsWith("bg-")).toBe(true);
  });
});
