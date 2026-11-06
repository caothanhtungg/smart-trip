import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth/otp-store", () => ({
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  checkPostgresRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 1,
    limit: 10,
    resetAt: new Date(Date.now() + 60_000),
  })),
}));

import { verifyOtp } from "@/lib/auth/otp-store";
import { POST } from "./route";

describe("POST /api/auth/verify-otp", () => {
  const email = "verified-user@smarttrip.vn";

  it("rejects request missing email or otp", async () => {
    const req = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toBe("Vui lòng cung cấp email và mã OTP.");
  });

  it("verifies matching OTP successfully", async () => {
    vi.mocked(verifyOtp).mockResolvedValue({ valid: true });

    const req = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp: "777888" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("rejects incorrect OTP", async () => {
    vi.mocked(verifyOtp).mockResolvedValue({ valid: false, reason: "INCORRECT" });

    const req = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp: "999999" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain("Mã OTP không chính xác");
  });
});
