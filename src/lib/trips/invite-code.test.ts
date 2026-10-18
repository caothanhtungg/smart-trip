import { describe, it, expect } from "vitest";
import { validateInviteCode } from "@/lib/trips/invite-code";

describe("validateInviteCode", () => {
  it("accepts valid 10-12 alphanumeric codes with hyphens", () => {
    const result = validateInviteCode("DL3N2D-TRIP99");
    expect(result.isValid).toBe(true);
    expect(result.normalizedCode).toBe("DL3N2D-TRIP99");
  });

  it("accepts valid code without hyphens", () => {
    const result11 = validateInviteCode("DL3N2DTRIP9");
    expect(result11.isValid).toBe(true);
    expect(result11.normalizedCode).toBe("DL3N2DTRIP9");

    const result10 = validateInviteCode("TRIP2026VN");
    expect(result10.isValid).toBe(true);
    expect(result10.normalizedCode).toBe("TRIP2026VN");
  });

  it("normalizes lowercase and trims leading/trailing whitespace", () => {
    const result = validateInviteCode("   dl3n2d-trip99   ");
    expect(result.isValid).toBe(true);
    expect(result.normalizedCode).toBe("DL3N2D-TRIP99");
  });

  it("rejects 6-character codes explicitly", () => {
    const result6 = validateInviteCode("DL2026");
    expect(result6.isValid).toBe(false);
    expect(result6.error).toMatch(/quá ngắn/);

    const resultHyphen6 = validateInviteCode("DL-2026");
    expect(resultHyphen6.isValid).toBe(false);
    expect(resultHyphen6.error).toMatch(/quá ngắn/);
  });

  it("rejects codes that are too short (< 10 alphanumeric characters)", () => {
    const result = validateInviteCode("DL3N2D-9");
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/quá ngắn/);
  });

  it("rejects codes that are too long (> 12 alphanumeric characters)", () => {
    const result = validateInviteCode("DL3N2D-TRIP9999"); // 14 alphanumeric chars
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/quá dài/);
  });

  it("rejects invalid characters (spaces, special symbols)", () => {
    const resultSpecial = validateInviteCode("DL3N2D@TRIP9");
    expect(resultSpecial.isValid).toBe(false);
    expect(resultSpecial.error).toMatch(/chỉ được chứa chữ cái/);

    const resultSpace = validateInviteCode("DL3N2D TRIP9");
    expect(resultSpace.isValid).toBe(false);
    expect(resultSpace.error).toMatch(/chỉ được chứa chữ cái/);
  });

  it("rejects malformed hyphen placement", () => {
    // Hyphen at start
    const resultStart = validateInviteCode("-DL3N2DTRIP99");
    expect(resultStart.isValid).toBe(false);
    expect(resultStart.error).toMatch(/Dấu gạch nối không đúng định dạng/);

    // Hyphen at end
    const resultEnd = validateInviteCode("DL3N2DTRIP99-");
    expect(resultEnd.isValid).toBe(false);
    expect(resultEnd.error).toMatch(/Dấu gạch nối không đúng định dạng/);
  });

  it("limits to at most 1 hyphen (max 13 characters raw string)", () => {
    // Multiple hyphens
    const resultMultiple = validateInviteCode("DL-3N2D-TRIP99");
    expect(resultMultiple.isValid).toBe(false);
    expect(resultMultiple.error).toMatch(/tối đa 1 dấu gạch nối/);

    // Consecutive hyphens
    const resultConsecutive = validateInviteCode("DL3N2D--TRIP99");
    expect(resultConsecutive.isValid).toBe(false);
    expect(resultConsecutive.error).toMatch(/tối đa 1 dấu gạch nối/);

    // Max 13 characters valid code
    const resultExact13 = validateInviteCode("DL3N2D-TRIP99"); // 12 alnum + 1 hyphen = 13 chars
    expect(resultExact13.isValid).toBe(true);
    expect(resultExact13.normalizedCode?.length).toBe(13);
  });

  it("rejects empty, null or undefined input", () => {
    expect(validateInviteCode("").isValid).toBe(false);
    expect(validateInviteCode("    ").isValid).toBe(false);
    expect(validateInviteCode(null).isValid).toBe(false);
    expect(validateInviteCode(undefined).isValid).toBe(false);
  });
});
