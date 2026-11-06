/**
 * Dịch vụ gửi email giao dịch (Transactional Email) qua Resend REST API.
 * Thiết kế bảo mật, độc lập không phụ thuộc thư viện ngoài, tối ưu cho Next.js & Edge/Serverless.
 */

export interface SendEmailOtpOptions {
  to: string;
  otp: string;
  userName?: string;
}

export interface SendEmailOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSandboxRestriction?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'\"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

export function generateSmartTripOtpHtml(otp: string, userName?: string): string {
  const displayName = escapeHtml(userName?.trim() || "bạn");
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác thực OTP — Smart Trip</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F9EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B3A46; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F9EC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 32px rgba(24,78,119,0.08); border: 1px solid #DDEBD0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #184E77 0%, #1E6091 50%, #1A759F 100%); padding: 32px 36px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Smart Trip</h1>
              <p style="margin: 6px 0 0; color: #D9ED92; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Du lịch & Chia sẻ tài chính nhóm</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; color: #184E77; font-size: 20px; font-weight: 700;">Xác thực tài khoản mới</h2>
              <p style="margin: 0 0 20px; font-size: 15px; color: #5B6B78; line-height: 1.6;">
                Xin chào <strong>${displayName}</strong>,<br>
                Bạn vừa yêu cầu đăng ký tài khoản trên nền tảng Smart Trip. Dưới đây là mã xác thực 6 chữ số (OTP) của bạn:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #F4F9EC; border: 2px dashed #52B69A; border-radius: 16px; padding: 22px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #184E77; display: inline-block; padding-left: 10px;">
                  ${otp}
                </span>
                <p style="margin: 8px 0 0; font-size: 12px; color: #52B69A; font-weight: 600;">Mã có hiệu lực trong vòng 5 phút</p>
              </div>

              <p style="margin: 0 0 12px; font-size: 13px; color: #5B6B78; line-height: 1.5;">
                • Vui lòng nhập mã này vào trang đăng ký để hoàn tất tạo tài khoản.<br>
                • Tuyệt đối không chia sẻ mã này cho bất kỳ ai để bảo vệ an toàn tài khoản.
              </p>

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #EEF6E4; font-size: 12px; color: #8C9BA5;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ đội ngũ hỗ trợ Smart Trip.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFCF7; padding: 20px 36px; text-align: center; border-top: 1px solid #EEF6E4;">
              <p style="margin: 0; font-size: 12px; color: #8C9BA5;">
                © 2026 Smart Trip Vietnam. Bản quyền thuộc về Smart Trip.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Gửi email chứa mã OTP qua Resend API.
 */
export async function sendEmailOtp({
  to,
  otp,
  userName,
}: SendEmailOtpOptions): Promise<SendEmailOtpResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "Smart Trip <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      success: false,
      error: "MISSING_API_KEY",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `[Smart Trip] Mã xác thực OTP của bạn: ${otp}`,
        html: generateSmartTripOtpHtml(otp, userName),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;

      // Nhận diện lỗi tài khoản test chưa verify domain
      const isSandboxRestriction =
        response.status === 403 &&
        typeof errorMsg === "string" &&
        (errorMsg.includes("testing emails to your own email address") ||
          errorMsg.includes("verify a domain"));

      return {
        success: false,
        error: errorMsg,
        isSandboxRestriction,
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch {
    return {
      success: false,
      error: "EMAIL_DELIVERY_FAILED",
    };
  }
}

