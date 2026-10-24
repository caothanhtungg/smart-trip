/**
 * Service gọi User Profile API dành cho Client/Browser.
 * Tuân thủ quy chuẩn an toàn:
 * - Dùng fetch với relative URL, tự động gửi HTTP cookie session cùng origin.
 * - Không gửi userId, role do client tự khai báo.
 * - Xử lý lỗi HTTP, lỗi mạng và phản hồi an toàn.
 * - Trả DTO an toàn, bảo vệ dữ liệu nhạy cảm.
 */

export interface CurrentUserProfileDto {
  id: string;
  name: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  bankBin?: string | null;
  bankAccountName?: string | null;
  bankAccountMasked?: string | null;
  hasBankAccount: boolean;
  createdAt: string;
}

export interface UpdateUserProfileInput {
  name?: string;
  displayName?: string;
  bankBin?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
}

export class UserApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "UserApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Lấy thông tin hồ sơ của người dùng hiện tại đang đăng nhập.
 * GET /api/me
 */
export async function fetchMyProfileApi(): Promise<CurrentUserProfileDto> {
  const response = await fetch("/api/me", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorInfo = body?.error;
    throw new UserApiError(
      errorInfo?.message || "Không thể tải thông tin hồ sơ người dùng.",
      response.status,
      errorInfo?.code || "FETCH_PROFILE_FAILED",
      errorInfo?.details
    );
  }

  if (!body.success || !body.data) {
    throw new UserApiError(
      "Dữ liệu hồ sơ trả về từ server không đúng cấu trúc.",
      response.status,
      "INVALID_RESPONSE"
    );
  }

  return body.data as CurrentUserProfileDto;
}

/**
 * Cập nhật thông tin hồ sơ hoặc tài khoản ngân hàng của người dùng hiện tại.
 * PATCH /api/me
 */
export async function updateMyProfileApi(
  input: UpdateUserProfileInput
): Promise<CurrentUserProfileDto> {
  const response = await fetch("/api/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorInfo = body?.error;
    throw new UserApiError(
      errorInfo?.message || "Không thể cập nhật hồ sơ cá nhân.",
      response.status,
      errorInfo?.code || "UPDATE_PROFILE_FAILED",
      errorInfo?.details
    );
  }

  if (!body.success || !body.data) {
    throw new UserApiError(
      "Dữ liệu cập nhật hồ sơ trả về từ server không đúng cấu trúc.",
      response.status,
      "INVALID_RESPONSE"
    );
  }

  return body.data as CurrentUserProfileDto;
}
