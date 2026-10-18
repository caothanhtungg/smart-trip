import { describe, it, expect } from "vitest";
import { parseMoneyInput, formatMoneyInputValue } from "@/lib/money/parse";

describe("parseMoneyInput", () => {
  it("parses dot-separated Vietnamese input strings", () => {
    expect(parseMoneyInput("1.250.000")).toBe(1250000);
    expect(parseMoneyInput("50.000")).toBe(50000);
  });

  it("strips currency symbols and spaces", () => {
    expect(parseMoneyInput("1 000 000 ₫")).toBe(1000000);
    expect(parseMoneyInput(" 2.000.000 đ ")).toBe(2000000);
  });

  it("handles valid numbers directly", () => {
    expect(parseMoneyInput(500000)).toBe(500000);
    expect(parseMoneyInput(0)).toBe(0);
  });

  it("returns null for empty, whitespace, null, or undefined", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("   ")).toBeNull();
    expect(parseMoneyInput(null)).toBeNull();
    expect(parseMoneyInput(undefined)).toBeNull();
  });

  it("returns null for non-numeric alphabetic strings", () => {
    expect(parseMoneyInput("abc")).toBeNull();
    expect(parseMoneyInput("!@#$%")).toBeNull();
  });

  it("returns null for negative numbers and negative string inputs", () => {
    expect(parseMoneyInput(-50000)).toBeNull();
    expect(parseMoneyInput("-50000")).toBeNull();
    expect(parseMoneyInput("-50.000")).toBeNull();
    expect(parseMoneyInput("- 50000 ₫")).toBeNull();
    expect(parseMoneyInput("-0")).toBeNull();
    expect(parseMoneyInput(" -100.000 ")).toBeNull();
    expect(parseMoneyInput("−50000")).toBeNull();
  });
});

describe("formatMoneyInputValue", () => {
  it("formats positive safe integer with dot thousand separators", () => {
    expect(formatMoneyInputValue(1250000)).toBe("1.250.000");
    expect(formatMoneyInputValue(50000)).toBe("50.000");
    expect(formatMoneyInputValue(2_000_000_000)).toBe("2.000.000.000");
  });

  it("returns empty string for 0, null, undefined, or NaN", () => {
    expect(formatMoneyInputValue(0)).toBe("");
    expect(formatMoneyInputValue(null)).toBe("");
    expect(formatMoneyInputValue(undefined)).toBe("");
    expect(formatMoneyInputValue(NaN)).toBe("");
  });

  it("returns empty string for negative numbers", () => {
    expect(formatMoneyInputValue(-100000)).toBe("");
  });
});
