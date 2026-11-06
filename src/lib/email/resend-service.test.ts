import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateSmartTripOtpHtml, sendEmailOtp } from "./resend-service";

describe("Resend Service (resend-service.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("generates branded HTML with given OTP and username", () => {
    const html = generateSmartTripOtpHtml("481923", "Nguyễn Tuấn");
    expect(html).toContain("481923");
    expect(html).toContain("Nguyễn Tuấn");
    expect(html).toContain("Smart Trip");
    expect(html).toContain("Xác thực tài khoản mới");
  });

  it("escapes a user-controlled name in generated HTML", () => {
    const html = generateSmartTripOtpHtml("481923", `<img src=x onerror="alert(1)">`);
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain(`<img src=x onerror="alert(1)">`);
  });

  it("falls back gracefully when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await sendEmailOtp({
      to: "test@example.com",
      otp: "123456",
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe("MISSING_API_KEY");
  });

  it("detects Resend sandbox 403 restriction accurately", async () => {
    process.env.RESEND_API_KEY = "mock_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        statusCode: 403,
        message: "You can only send testing emails to your own email address.",
        name: "validation_error",
      }),
    } as unknown as Response);

    const res = await sendEmailOtp({
      to: "other_user@gmail.com",
      otp: "654321",
    });

    expect(res.success).toBe(false);
    expect(res.isSandboxRestriction).toBe(true);
  });

  it("sends email successfully when Resend returns 200 OK", async () => {
    process.env.RESEND_API_KEY = "mock_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "email_msg_12345" }),
    } as unknown as Response);

    const res = await sendEmailOtp({
      to: "owner@domain.com",
      otp: "987654",
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBe("email_msg_12345");
  });
});

