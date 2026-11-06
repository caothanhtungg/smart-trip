import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/otp-store", () => ({
  generateOtp: vi.fn(() => "123456"),
  saveOtp: vi.fn(async () => undefined),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  checkPostgresRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 1,
    limit: 5,
    resetAt: new Date(Date.now() + 60_000),
  })),
}));

vi.mock("@/lib/email/resend-service", () => ({
  sendEmailOtp: vi.fn(async ({ to }: { to: string }) => {
    if (to === "sandbox@test.com") {
      return {
        success: false,
        isSandboxRestriction: true,
        error: "Sandbox restriction",
      };
    }
    return {
      success: true,
      messageId: "msg_ok_123",
    };
  }),
}));

describe("POST /api/auth/send-otp", () => {
  it("rejects request with invalid email format", async () => {
    const req = new Request("http://localhost:3000/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-email" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toBe("Địa chỉ email không hợp lệ.");
  });

  it("sends OTP successfully for valid email", async () => {
    const req = new Request("http://localhost:3000/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", name: "Nguyễn A" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.delivered).toBe(true);
  });

  it("does not disclose the OTP when email delivery is unavailable", async () => {
    const req = new Request("http://localhost:3000/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "sandbox@test.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.demoOtp).toBeUndefined();
    expect(json.sandboxNotice).toBeUndefined();
  });
});
