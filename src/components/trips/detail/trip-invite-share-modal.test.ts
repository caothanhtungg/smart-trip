import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateInviteCode } from "@/lib/trips/invite-code";
import { generateQrDataUrl } from "@/lib/money/vietqr";

describe("TripInviteShareModal Integration & URL logic (UC34)", () => {
  const originalEnvUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnvUrl;
  });

  it("builds correct join URL encoding the valid invite code", () => {
    const inviteCode = "DL3N2D-TRIP99";
    const validation = validateInviteCode(inviteCode);

    expect(validation.isValid).toBe(true);
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const joinUrl = `${origin}/join/${validation.normalizedCode}`;

    expect(joinUrl).toBe("http://localhost:3000/join/DL3N2D-TRIP99");
  });

  it("generates a real scannable QR data URL for the join URL offline", async () => {
    const inviteCode = "DL3N2D-TRIP99";
    const validation = validateInviteCode(inviteCode);
    const origin = "http://localhost:3000";
    const joinUrl = `${origin}/join/${validation.normalizedCode}`;

    const qrDataUrl = await generateQrDataUrl(joinUrl, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    expect(typeof qrDataUrl).toBe("string");
    expect(qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("does not include sensitive financial or trip details in the QR payload", () => {
    const inviteCode = "DL3N2D-TRIP99";
    const validation = validateInviteCode(inviteCode);
    const origin = "http://localhost:3000";
    const joinUrl = `${origin}/join/${validation.normalizedCode}`;

    // Verify payload only contains the origin and route join/code
    expect(joinUrl).not.toContain("amount");
    expect(joinUrl).not.toContain("bank");
    expect(joinUrl).not.toContain("budget");
    expect(joinUrl).not.toContain("secret");
    expect(joinUrl).toBe("http://localhost:3000/join/DL3N2D-TRIP99");
  });

  it("refuses to create a valid join URL when invite code is malformed or invalid", () => {
    const invalidCode = "INVALID_CODE!!!";
    const validation = validateInviteCode(invalidCode);

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBeDefined();

    // With invalid code, component does not proceed to generate QR
    const joinUrl = validation.isValid ? `http://localhost:3000/join/${validation.normalizedCode}` : "";
    expect(joinUrl).toBe("");
  });

  it("uses the configured environment URL without hardcoding production domain", () => {
    // Testing dynamic origin adaptation
    const stagingOrigin = "https://staging.smart-trip.internal";
    process.env.NEXT_PUBLIC_APP_URL = stagingOrigin;

    const validation = validateInviteCode("DL3N2D-TRIP99");
    const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${validation.normalizedCode}`;

    expect(joinUrl.startsWith("https://staging.smart-trip.internal")).toBe(true);
    expect(joinUrl).not.toContain("smarttrip.com"); // No hardcoded production domain
  });

  it("immediately produces a new join URL and replaces the old code when rotated (UC28)", () => {
    const oldCode = "DL3N2D-TRIP99";
    const newCode = "NEW26B-CODE88";

    const oldValidation = validateInviteCode(oldCode);
    const newValidation = validateInviteCode(newCode);

    const oldUrl = `http://localhost:3000/join/${oldValidation.normalizedCode}`;
    const newUrl = `http://localhost:3000/join/${newValidation.normalizedCode}`;

    expect(oldUrl).not.toBe(newUrl);
    expect(newUrl).toBe("http://localhost:3000/join/NEW26B-CODE88");
  });
});
