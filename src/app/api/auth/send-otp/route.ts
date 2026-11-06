import { apiError, apiSuccess, handleApiError, ServiceUnavailableError } from "@/lib/api";
import { generateOtp, saveOtp } from "@/lib/auth/otp-store";
import { sendEmailOtp } from "@/lib/email/resend-service";
import { checkPostgresRateLimit, getClientIp } from "@/lib/api/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const OTP_SEND_IP_LIMIT = 5;
export const OTP_SEND_EMAIL_LIMIT = 3;
export const OTP_SEND_IP_WINDOW_SECONDS = 60;
export const OTP_SEND_EMAIL_WINDOW_SECONDS = 10 * 60;

type RateLimitResult = Awaited<ReturnType<typeof checkPostgresRateLimit>>;

function createRateLimitHeaders(rateLimit: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt.getTime() / 1000)),
  };
}

function createTooManyRequestsResponse(rateLimit: RateLimitResult) {
  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000));
  return apiError("Bạn đã yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau.", {
    status: 429,
    code: "TOO_MANY_REQUESTS",
    headers: { ...createRateLimitHeaders(rateLimit), "Retry-After": String(retryAfterSeconds) },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json().catch(() => null);
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const name = typeof input.name === "string" ? input.name.trim().slice(0, 100) : undefined;

    if (!EMAIL_PATTERN.test(email)) {
      return apiError("Địa chỉ email không hợp lệ.", { status: 400, code: "VALIDATION_ERROR" });
    }

    const clientIp = getClientIp(req);
    const [ipRateLimit, emailRateLimit] = await Promise.all([
      checkPostgresRateLimit({ key: `otp:send:ip:${clientIp}`, limit: OTP_SEND_IP_LIMIT, windowSeconds: OTP_SEND_IP_WINDOW_SECONDS }),
      checkPostgresRateLimit({ key: `otp:send:email:${email}`, limit: OTP_SEND_EMAIL_LIMIT, windowSeconds: OTP_SEND_EMAIL_WINDOW_SECONDS }),
    ]);
    if (!ipRateLimit.allowed) return createTooManyRequestsResponse(ipRateLimit);
    if (!emailRateLimit.allowed) return createTooManyRequestsResponse(emailRateLimit);

    const otp = generateOtp();
    const delivery = await sendEmailOtp({ to: email, otp, userName: name });
    if (!delivery.success) {
      throw new ServiceUnavailableError("Không thể gửi mã xác thực. Vui lòng thử lại sau.", "OTP_DELIVERY_UNAVAILABLE");
    }

    await saveOtp(email, otp);
    return apiSuccess({ delivered: true }, { message: "Mã OTP đã được gửi đến email của bạn." });
  } catch (error) {
    return handleApiError(error);
  }
}
