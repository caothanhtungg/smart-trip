import { beforeEach, describe, expect, it, vi } from "vitest";

const { verification } = vi.hoisted(() => ({
  verification: {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    verification,
    $transaction: vi.fn(async (callback: (tx: { verification: typeof verification }) => unknown) =>
      callback({ verification })
    ),
  },
}));

import { generateOtp, saveOtp, verifyOtp } from "./otp-store";

describe("OTP Store (otp-store.ts)", () => {
  const testEmail = "traveler@smarttrip.vn";
  const record = {
    id: "otp-record",
    identifier: `email-otp:${testEmail}`,
    value: "",
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a six-digit OTP, including leading zeroes", () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it("stores only a hash and verifies a matching OTP once", async () => {
    await saveOtp(testEmail, "123456");
    const savedValue = vi.mocked(verification.create).mock.calls[0][0].data.value;
    expect(savedValue).not.toContain("123456");

    verification.findFirst.mockResolvedValue({ ...record, value: savedValue });
    await expect(verifyOtp(testEmail, "123456")).resolves.toEqual({ valid: true });
    expect(verification.delete).toHaveBeenCalledWith({ where: { id: record.id } });
  });

  it("increments attempts for an incorrect OTP", async () => {
    await saveOtp(testEmail, "654321");
    const savedValue = vi.mocked(verification.create).mock.calls[0][0].data.value;
    verification.findFirst.mockResolvedValue({ ...record, value: savedValue });

    await expect(verifyOtp(testEmail, "111111")).resolves.toEqual({ valid: false, reason: "INCORRECT" });
    expect(verification.update).toHaveBeenCalledOnce();
  });

  it("rejects non-existent OTP requests", async () => {
    verification.findFirst.mockResolvedValue(null);
    await expect(verifyOtp("unknown@nowhere.com", "123456")).resolves.toEqual({
      valid: false,
      reason: "NOT_FOUND",
    });
  });
});
