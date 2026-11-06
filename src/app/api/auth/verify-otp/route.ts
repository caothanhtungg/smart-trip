import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { verifyOtp } from "@/lib/auth/otp-store";
import { checkPostgresRateLimit, getClientIp } from "@/lib/api/rate-limit";

export const OTP_VERIFY_IP_LIMIT = 10;
export const OTP_VERIFY_EMAIL_LIMIT = 10;
export const OTP_VERIFY_WINDOW_SECONDS = 10 * 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const otp = typeof input.otp === "string" ? input.otp.trim() : "";

    if (!email || !otp) {
      return apiError("Vui lòng cung cấp email và mã OTP.", { status: 400, code: "VALIDATION_ERROR" });
    }
    if (!/^\d{6}$/.test(otp)) {
      return apiError("Mã OTP phải gồm đúng 6 chữ số.", { status: 400, code: "VALIDATION_ERROR" });
    }

    const [ipRateLimit, emailRateLimit] = await Promise.all([
      checkPostgresRateLimit({ key: `otp:verify:ip:${getClientIp(req)}`, limit: OTP_VERIFY_IP_LIMIT, windowSeconds: OTP_VERIFY_WINDOW_SECONDS }),
      checkPostgresRateLimit({ key: `otp:verify:email:${email}`, limit: OTP_VERIFY_EMAIL_LIMIT, windowSeconds: OTP_VERIFY_WINDOW_SECONDS }),
    ]);
    const rateLimit = !ipRateLimit.allowed ? ipRateLimit : !emailRateLimit.allowed ? emailRateLimit : null;
    if (rateLimit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000));
      return apiError("Bạn đã xác thực OTP quá nhiều lần. Vui lòng thử lại sau.", {
        status: 429,
        code: "TOO_MANY_REQUESTS",
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt.getTime() / 1000)),
        },
      });
    }

    const result = await verifyOtp(email, otp);
    if (!result.valid) {
      const message = result.reason === "EXPIRED"
        ? "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."
        : result.reason === "MAX_ATTEMPTS"
          ? "Bạn đã nhập sai quá số lần quy định. Vui lòng yêu cầu mã mới."
          : "Mã OTP không chính xác. Vui lòng kiểm tra lại.";
      return apiError(message, { status: 400, code: "OTP_INVALID" });
    }

    return apiSuccess({ verified: true }, { message: "Xác thực OTP thành công." });
  } catch (error) {
    return handleApiError(error);
  }
}
