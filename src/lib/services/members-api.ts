import { CreateGuestMemberFormData, EditGuestMemberFormData, TripMember } from "@/types/trip";
import { isUuid } from "@/lib/services/trips-api";

export class MembersApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    code = "MEMBERS_API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "MembersApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiMemberDto {
  id: string; // UUID của TripMember
  tripId: string;
  userId: string | null;
  displayName: string;
  role: "HOST" | "MEMBER";
  status: "ACTIVE" | "LEFT";
  joinOrder: number;
  joinedAt: string;
  leftAt: string | null;
  avatarUrl?: string | null;
  isPlaceholder?: boolean;
  isCurrentUser?: boolean;
  isHost?: boolean;
}

export type ApiDeleteMemberResultDto =
  | {
      type: "HARD_DELETE";
      memberId: string;
    }
  | {
      type: "SOFT_DELETE";
      member: {
        id: string;
        displayName: string;
        status: "LEFT";
        leftAt: string | Date;
      };
    };

export interface CreateGuestMemberInput {
  displayName: string;
  note?: string;
}

export interface UpdateGuestMemberInput {
  displayName: string;
  note?: string;
}

export interface MembersApiClientOptions {
  customFetch?: typeof fetch;
  baseUrl?: string;
}

interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorEnvelope {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

/**
 * Phân tích phản hồi từ backend Members API, ném MembersApiError nếu request thất bại hoặc body sai định dạng.
 */
async function parseApiResponse<T>(res: Response): Promise<T> {
  let parsedBody: unknown;
  try {
    parsedBody = await res.json();
  } catch {
    throw new MembersApiError(
      `Không thể đọc dữ liệu phản hồi từ máy chủ (HTTP ${res.status}).`,
      res.status,
      "INVALID_RESPONSE"
    );
  }

  if (!res.ok) {
    const errorEnv = parsedBody as ApiErrorEnvelope;
    const message =
      errorEnv?.error?.message ||
      `Yêu cầu thành viên thất bại với mã lỗi HTTP ${res.status}.`;
    const code =
      errorEnv?.error?.code ||
      (res.status === 401
        ? "UNAUTHORIZED"
        : res.status === 403
        ? "FORBIDDEN"
        : res.status === 404
        ? "NOT_FOUND"
        : res.status === 409
        ? "CONFLICT"
        : "API_ERROR");

    throw new MembersApiError(
      message,
      res.status,
      code,
      errorEnv?.error?.details
    );
  }

  const successEnv = parsedBody as ApiSuccessEnvelope<T>;
  if (
    !successEnv ||
    typeof successEnv !== "object" ||
    successEnv.success !== true ||
    successEnv.data === undefined
  ) {
    throw new MembersApiError(
      "Cấu trúc phản hồi từ máy chủ không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return successEnv.data;
}

/**
 * Ánh xạ DTO phản hồi từ API sang domain model TripMember dùng cho giao diện.
 */
export function mapApiMemberToDomain(dto: ApiMemberDto): TripMember {
  return {
    id: dto.id,
    tripId: dto.tripId,
    userId: dto.userId ?? null,
    name: dto.displayName,
    role: dto.role,
    status: dto.status,
    joinOrder: dto.joinOrder,
    avatarUrl: dto.avatarUrl ?? null,
    isCurrentUser: Boolean(dto.isCurrentUser),
    isHost: Boolean(dto.isHost ?? (dto.role === "HOST")),
    isNoAccount: Boolean(dto.isPlaceholder ?? (dto.userId === null)),
    spentAmount: 0,
  };
}

/**
 * Lấy danh sách thành viên của một chuyến đi từ API (GET /api/trips/[id]/members).
 */
export async function fetchTripMembers(
  tripId: string,
  options?: MembersApiClientOptions
): Promise<TripMember[]> {
  if (!tripId || !isUuid(tripId)) {
    throw new MembersApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId)}/members`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });
  } catch (networkError) {
    if (networkError instanceof MembersApiError) throw networkError;
    throw new MembersApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi tải danh sách thành viên.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dtos = await parseApiResponse<ApiMemberDto[]>(res);
  if (!Array.isArray(dtos)) {
    throw new MembersApiError(
      "Dữ liệu danh sách thành viên không đúng định dạng mảng.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dtos.map(mapApiMemberToDomain);
}

/**
 * Thêm thành viên chưa có tài khoản (guest) vào chuyến đi (POST /api/trips/[id]/members).
 * BẢO MẬT: Chỉ gửi duy nhất trường `displayName` theo đúng CreateGuestMemberSchema.strict().
 */
export async function createGuestMember(
  tripId: string,
  input: CreateGuestMemberFormData,
  options?: MembersApiClientOptions
): Promise<TripMember> {
  if (!tripId || !isUuid(tripId)) {
    throw new MembersApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const trimmedName = input.displayName ? input.displayName.trim() : "";
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new MembersApiError(
      "Tên hiển thị phải có từ 2 đến 100 ký tự.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId)}/members`;

  // Backend dùng .strict(), tuyệt đối không gửi các trường khác
  const payload = {
    displayName: trimmedName,
  };

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    if (networkError instanceof MembersApiError) throw networkError;
    throw new MembersApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi thêm thành viên.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<ApiMemberDto>(res);
  return mapApiMemberToDomain(dto);
}

/**
 * Cập nhật tên thành viên chưa có tài khoản (PATCH /api/trips/[id]/members/[memberId]).
 * BẢO MẬT: Chỉ gửi duy nhất trường `displayName` theo đúng UpdateGuestMemberSchema.strict().
 */
export async function updateGuestMember(
  tripId: string,
  memberId: string,
  input: EditGuestMemberFormData,
  options?: MembersApiClientOptions
): Promise<TripMember> {
  if (!tripId || !isUuid(tripId)) {
    throw new MembersApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  if (!memberId || !isUuid(memberId)) {
    throw new MembersApiError(
      "Mã thành viên không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_MEMBER_ID"
    );
  }

  const trimmedName = input.displayName ? input.displayName.trim() : "";
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new MembersApiError(
      "Tên hiển thị phải có từ 2 đến 100 ký tự.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(
    tripId
  )}/members/${encodeURIComponent(memberId)}`;

  const payload = {
    displayName: trimmedName,
  };

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    if (networkError instanceof MembersApiError) throw networkError;
    throw new MembersApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi cập nhật thành viên.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<ApiMemberDto>(res);
  return mapApiMemberToDomain(dto);
}

/**
 * Xóa thành viên khỏi chuyến đi hoặc Thành viên tự rời chuyến đi (DELETE /api/trips/[id]/members/[memberId]).
 * - HARD_DELETE: Thành viên chưa có lịch sử, bị xóa hoàn toàn.
 * - SOFT_DELETE: Thành viên có lịch sử tài chính, chuyển sang status = 'LEFT'.
 */
export async function deleteTripMember(
  tripId: string,
  memberId: string,
  options?: MembersApiClientOptions
): Promise<ApiDeleteMemberResultDto> {
  if (!tripId || !isUuid(tripId)) {
    throw new MembersApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  if (!memberId || !isUuid(memberId)) {
    throw new MembersApiError(
      "Mã thành viên không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_MEMBER_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(
    tripId
  )}/members/${encodeURIComponent(memberId)}`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });
  } catch (networkError) {
    if (networkError instanceof MembersApiError) throw networkError;
    throw new MembersApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi xóa thành viên.",
      0,
      "NETWORK_ERROR"
    );
  }

  return await parseApiResponse<ApiDeleteMemberResultDto>(res);
}
