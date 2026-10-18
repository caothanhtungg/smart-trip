import { describe, it, expect } from "vitest";
import { formatMoney, formatSignedMoney, formatVnd } from "@/lib/money/format";

describe("formatMoney", () => {
  it("formats integer VND with dot separators and non-breaking space (U+00A0) before ₫", () => {
    const formatted = formatMoney(1250000);
    // Mã ký tự U+00A0 là khoảng trắng không ngắt
    expect(formatted).toBe("1.250.000\u00A0₫");
    expect(formatted.endsWith("\u00A0₫")).toBe(true);
  });

  it("formats 0 VND correctly with non-breaking space", () => {
    expect(formatMoney(0)).toBe("0\u00A0₫");
  });

  it("formats large safe integer VND amounts correctly", () => {
    expect(formatMoney(2_000_000_000)).toBe("2.000.000.000\u00A0₫");
  });

  it("throws TypeError if amount is a float (non-integer)", () => {
    expect(() => formatMoney(10.5)).toThrowError(/số nguyên an toàn/);
    expect(() => formatMoney(0.1)).toThrowError(/số nguyên an toàn/);
    expect(() => formatMoney(-150000.25)).toThrowError(/số nguyên an toàn/);
  });

  it("throws TypeError if amount is NaN or Infinity", () => {
    expect(() => formatMoney(NaN)).toThrowError(/số nguyên an toàn/);
    expect(() => formatMoney(Infinity)).toThrowError(/số nguyên an toàn/);
    expect(() => formatMoney(-Infinity)).toThrowError(/số nguyên an toàn/);
  });

  it("throws TypeError if amount exceeds Number.MAX_SAFE_INTEGER", () => {
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 1)).toThrowError(/số nguyên an toàn/);
  });

  it("formatVnd behaves identically as formatMoney alias", () => {
    expect(formatVnd(500000)).toBe("500.000\u00A0₫");
  });
});

describe("formatSignedMoney", () => {
  it("formats positive amount with + prefix and non-breaking space", () => {
    const result = formatSignedMoney(350000);
    expect(result.text).toBe("+350.000\u00A0₫");
    expect(result.className).toContain("text-functional-positive");
  });

  it("formats negative amount with - prefix and non-breaking space", () => {
    const result = formatSignedMoney(-120000);
    expect(result.text).toBe("-120.000\u00A0₫");
    expect(result.className).toContain("text-functional-negative");
  });

  it("formats 0 with no sign prefix and muted style", () => {
    const result = formatSignedMoney(0);
    expect(result.text).toBe("0\u00A0₫");
    expect(result.className).toContain("text-text-muted");
  });

  it("throws TypeError on non-integer or NaN amounts", () => {
    expect(() => formatSignedMoney(99.99)).toThrowError(/số nguyên an toàn/);
    expect(() => formatSignedMoney(NaN)).toThrowError(/số nguyên an toàn/);
  });
});
