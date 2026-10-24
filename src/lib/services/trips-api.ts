/**
 * Service gọi Trips API dành cho Client/Browser.
 * Tuân thủ quy chuẩn bảo mật:
 * - Dùng fetch với relative URL, tự động gửi HTTP cookie session cùng origin.
 * - Tuyệt đối không lưu trữ token/secrets trong localStorage.
 * - Không gửi userId, memberId, role do client tự khai báo.
 * - Xử lý lỗi HTTP, lỗi mạng và phản hồi sai cấu trúc an toàn.
 * - Cung cấp DTO và mapper tường minh, bảo toàn UUID database.
 */

import type {
  Trip,
  TripDetailData,
  TripMember,
  TripMemberDetail,
  MemberClaim,
} from "@/types/trip";

export class TripsApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string = "API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "TripsApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface FetchMyTripsParams {
  tab?: "all" | "active" | "completed";
  sortBy?: "latest" | "departure" | "name";
  page?: number;
  limit?: number;
}

export interface CreateTripInput {
  name: string;
  destination?: string | null;
  startDate: string;
  endDate: string;
  budgetAmount?: number | null;
}

export interface UpdateTripInput {
  name?: string;
  destination?: string | null;
  startDate?: string;
  endDate?: string;
  budgetAmount?: number | null;
}

export interface ApiTripMemberDto {
  id: string; // UUID của trip_members
  userId: string | null;
  name: string;
  displayName: string;
  role: "HOST" | "MEMBER";
  status?: "ACTIVE" | "LEFT";
  joinOrder: number;
  avatarUrl: string | null;
  isCurrentUser: boolean;
  isHost: boolean;
  isNoAccount?: boolean;
}

export interface ApiTripListItemDto {
  id: string; // UUID của trips
  name: string;
  destination: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budgetAmount: number | null;
  status: "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  myRole: "HOST" | "MEMBER";
  members: ApiTripMemberDto[];
  userBalance: {
    type: "RECEIVE" | "PAY" | "SETTLED";
    amount: number;
  };
}

export interface ApiCreateTripResponseDto {
  id: string; // UUID của trips vừa tạo
  name: string;
  destination: string | null;
  startDate: string;
  endDate: string;
  budgetAmount: number | null;
  status: "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  host: {
    memberId: string; // UUID của trip_members Host
    userId: string;
    displayName: string;
    role: "HOST";
  };
}

export interface ApiTripDetailResponseDto {
  id: string; // UUID của trips
  name: string;
  destination: string | null;
  startDate: string;
  endDate: string;
  budgetAmount: number | null;
  status: "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  myMemberId: string; // UUID của thành viên hiện tại trong chuyến đi này
  myRole: "HOST" | "MEMBER";
  members: ApiTripMemberDto[];
}

export interface ApiUpdateTripResponseDto {
  id: string;
  name: string;
  destination: string | null;
  startDate: string;
  endDate: string;
  budgetAmount: number | null;
  status: "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";
  inviteCode: string;
  updatedAt: string;
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

export interface TripsApiClientOptions {
  customFetch?: typeof fetch;
  baseUrl?: string;
}

/**
 * Trích xuất an toàn dữ liệu từ response của API, bắt lỗi HTTP và lỗi sai cấu trúc JSON.
 */
async function parseApiResponse<T>(res: Response): Promise<T> {
  let parsedBody: unknown;
  try {
    parsedBody = await res.json();
  } catch {
    throw new TripsApiError(
      `Không thể đọc dữ liệu phản hồi từ máy chủ (HTTP ${res.status}).`,
      res.status,
      "INVALID_RESPONSE"
    );
  }

  if (!res.ok) {
    const errorEnv = parsedBody as ApiErrorEnvelope;
    const message =
      errorEnv?.error?.message ||
      `Yêu cầu thất bại với mã lỗi HTTP ${res.status}.`;
    const code =
      errorEnv?.error?.code ||
      (res.status === 401
        ? "UNAUTHORIZED"
        : res.status === 403
        ? "FORBIDDEN"
        : res.status === 404
        ? "NOT_FOUND"
        : "API_ERROR");
    throw new TripsApiError(
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
    throw new TripsApiError(
      "Cấu trúc phản hồi từ máy chủ không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return successEnv.data;
}

/**
 * Ánh xạ DTO chuyến đi từ API sang kiểu Trip domain dùng cho giao diện.
 */
export function mapApiTripToDomain(dto: ApiTripListItemDto): Trip {
  const members: TripMember[] = (dto.members || []).map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.displayName || m.name,
    role: m.role,
    status: m.status || "ACTIVE",
    joinOrder: m.joinOrder,
    avatarUrl: m.avatarUrl,
    isCurrentUser: m.isCurrentUser,
    isHost: m.isHost,
    isNoAccount: m.isNoAccount ?? m.userId === null,
  }));

  return {
    id: dto.id,
    name: dto.name,
    destination: dto.destination,
    startDate: dto.startDate,
    endDate: dto.endDate,
    budgetAmount: dto.budgetAmount,
    status: dto.status,
    inviteCode: dto.inviteCode,
    updatedAt: dto.updatedAt,
    createdAt: dto.createdAt,
    members,
    userBalance: dto.userBalance || { type: "SETTLED", amount: 0 },
  };
}

/**
 * Ánh xạ DTO chi tiết chuyến đi từ API sang TripDetailData dùng cho layout & tabs.
 */
export function mapApiTripDetailToTripDetailData(
  dto: ApiTripDetailResponseDto
): TripDetailData {
  const members: TripMemberDetail[] = (dto.members || []).map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.displayName || m.name,
    role: m.role,
    status: m.status || "ACTIVE",
    joinOrder: m.joinOrder,
    avatarUrl: m.avatarUrl,
    isCurrentUser: m.isCurrentUser ?? (m.id === dto.myMemberId),
    isHost: m.isHost ?? (m.role === "HOST"),
    isNoAccount: m.isNoAccount ?? m.userId === null,
    spentAmount: 0,
  }));

  return {
    id: dto.id,
    name: dto.name,
    destination: dto.destination,
    startDate: dto.startDate,
    endDate: dto.endDate,
    budgetAmount: dto.budgetAmount,
    plannedBudget: dto.budgetAmount ?? 0,
    status: dto.status,
    inviteCode: dto.inviteCode,
    updatedAt: dto.updatedAt,
    createdAt: dto.createdAt,
    members,
    currentMemberId: dto.myMemberId,
    currentRole: dto.myRole,
    totalSpent: 0,
    userSpent: 0,
    userBalance: { type: "SETTLED", amount: 0 },
    expenseCount: 0,
    paidActivitiesCount: 0,
    recentExpenses: [],
    expenses: [],
    categoryAllocations: [],
    itineraryItems: [],
  };
}

/**
 * Ánh xạ kết quả tạo chuyến đi từ API sang đối tượng Trip domain.
 */
export function mapCreateTripResponseToDomain(
  dto: ApiCreateTripResponseDto
): Trip {
  return {
    id: dto.id,
    name: dto.name,
    destination: dto.destination,
    startDate: dto.startDate,
    endDate: dto.endDate,
    budgetAmount: dto.budgetAmount,
    status: dto.status,
    inviteCode: dto.inviteCode,
    updatedAt: dto.updatedAt,
    createdAt: dto.createdAt,
    members: [
      {
        id: dto.host.memberId,
        userId: dto.host.userId,
        name: dto.host.displayName,
        role: "HOST",
        status: "ACTIVE",
        joinOrder: 1,
        isCurrentUser: true,
        isHost: true,
        isNoAccount: false,
      },
    ],
    userBalance: { type: "SETTLED", amount: 0 },
  };
}

/**
 * Lấy danh sách chuyến đi của người dùng hiện tại từ API (GET /api/trips).
 */
export async function fetchMyTrips(
  params?: FetchMyTripsParams,
  options?: TripsApiClientOptions
): Promise<Trip[]> {
  const rawList = await fetchMyTripsRaw(params, options);
  return rawList.map(mapApiTripToDomain);
}

/**
 * Lấy danh sách DTO thô từ GET /api/trips.
 */
export async function fetchMyTripsRaw(
  params?: FetchMyTripsParams,
  options?: TripsApiClientOptions
): Promise<ApiTripListItemDto[]> {
  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";

  const query = new URLSearchParams();
  if (params?.tab) query.set("tab", params.tab);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const url = `${baseUrl}/api/trips${qs ? `?${qs}` : ""}`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi tải danh sách chuyến đi.",
      0,
      "NETWORK_ERROR"
    );
  }

  const data = await parseApiResponse<ApiTripListItemDto[]>(res);
  if (!Array.isArray(data)) {
    throw new TripsApiError(
      "Dữ liệu danh sách chuyến đi không đúng định dạng mảng.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return data;
}

/**
 * Tạo mới chuyến đi qua API (POST /api/trips).
 * BẢO MẬT: Chỉ gửi các trường nội dung chuyến đi hợp lệ; tuyệt đối loại trừ
 * userId, memberId hay role tự khai báo từ client.
 */
export async function createTripApi(
  input: CreateTripInput,
  options?: TripsApiClientOptions
): Promise<{ dto: ApiCreateTripResponseDto; trip: Trip }> {
  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";

  // Lọc chặt chẽ payload gửi lên backend (phòng ngừa tiêm trường phân quyền)
  const sanitizedPayload = {
    name: input.name?.trim(),
    destination: input.destination?.trim() || null,
    startDate: input.startDate?.trim(),
    endDate: input.endDate?.trim(),
    budgetAmount:
      typeof input.budgetAmount === "number" && input.budgetAmount > 0
        ? input.budgetAmount
        : null,
  };

  let res: Response;
  try {
    res = await clientFetch(`${baseUrl}/api/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(sanitizedPayload),
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi tạo chuyến đi.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<ApiCreateTripResponseDto>(res);
  if (!dto || !dto.id) {
    throw new TripsApiError(
      "Không nhận được thông tin chuyến đi sau khi tạo.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  const trip = mapCreateTripResponseToDomain(dto);
  return { dto, trip };
}

/**
 * Lấy thông tin chi tiết một chuyến đi từ API (GET /api/trips/[id]).
 */
export async function fetchTripDetailApi(
  tripId: string,
  options?: TripsApiClientOptions
): Promise<TripDetailData> {
  const dto = await fetchTripDetailRawApi(tripId, options);
  return mapApiTripDetailToTripDetailData(dto);
}

/**
 * Lấy DTO chi tiết thô từ GET /api/trips/[id].
 */
export async function fetchTripDetailRawApi(
  tripId: string,
  options?: TripsApiClientOptions
): Promise<ApiTripDetailResponseDto> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new TripsApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi tải chi tiết chuyến đi.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<ApiTripDetailResponseDto>(res);
  if (!dto || !dto.id) {
    throw new TripsApiError(
      "Dữ liệu chi tiết chuyến đi không đúng định dạng.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dto;
}

/**
 * Chỉnh sửa thông tin chuyến đi qua API (PATCH /api/trips/[id]).
 */
export async function updateTripApi(
  tripId: string,
  input: UpdateTripInput,
  options?: TripsApiClientOptions
): Promise<ApiUpdateTripResponseDto> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new TripsApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}`;

  // Lọc chỉ gửi các trường được phép
  const sanitizedPayload: Record<string, unknown> = {};
  if (input.name !== undefined) sanitizedPayload.name = input.name.trim();
  if (input.destination !== undefined) {
    sanitizedPayload.destination = input.destination ? input.destination.trim() : null;
  }
  if (input.startDate !== undefined) sanitizedPayload.startDate = input.startDate.trim();
  if (input.endDate !== undefined) sanitizedPayload.endDate = input.endDate.trim();
  if (input.budgetAmount !== undefined) {
    sanitizedPayload.budgetAmount =
      typeof input.budgetAmount === "number" && input.budgetAmount > 0
        ? input.budgetAmount
        : null;
  }

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(sanitizedPayload),
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi cập nhật chuyến đi.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<ApiUpdateTripResponseDto>(res);
  if (!dto || !dto.id) {
    throw new TripsApiError(
      "Dữ liệu phản hồi cập nhật không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dto;
}

export interface RotateInviteCodeResponseDto {
  tripId: string;
  inviteCode: string;
}

/**
 * Đổi mã mời mới cho chuyến đi (Use Case UC28).
 * POST /api/trips/[id]/rotate-invite
 */
export async function rotateInviteCodeApi(
  tripId: string,
  options?: TripsApiClientOptions
): Promise<RotateInviteCodeResponseDto> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new TripsApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/rotate-invite`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi đổi mã mời.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<RotateInviteCodeResponseDto>(res);
  if (!dto || !dto.inviteCode) {
    throw new TripsApiError(
      "Dữ liệu phản hồi đổi mã mời không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dto;
}

export interface ArchiveTripResponseDto {
  id: string;
  name: string;
  status: "ARCHIVED";
  updatedAt: string;
}

/**
 * Lưu trữ chuyến đi (Use Case UC24).
 * POST /api/trips/[id]/archive
 */
export async function archiveTripApi(
  tripId: string,
  options?: TripsApiClientOptions
): Promise<ArchiveTripResponseDto> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new TripsApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/archive`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi lưu trữ chuyến đi.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<ArchiveTripResponseDto>(res);
  if (!dto || !dto.id) {
    throw new TripsApiError(
      "Dữ liệu phản hồi lưu trữ chuyến đi không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dto;
}

/**
 * Regex chuẩn nhận diện UUID v1-v7 (8-4-4-4-12 hex).
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Kiểm tra xem một chuỗi ID có phải là UUID database hợp lệ hay không.
 * Phân biệt với các mock slug legacy (vd: trip-dalat-3n2d).
 */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export interface CreateClaimResponseDto {
  id: string;
  tripId: string;
  placeholderMemberId: string;
  status: "PENDING";
  createdAt: string;
}

export interface DecideClaimResponseDto {
  id: string;
  status: "APPROVED" | "REJECTED";
  tripId: string;
  placeholderMemberId: string;
  userId: string;
  message: string;
}

/**
 * Gửi yêu cầu nhận diện thành viên chưa có tài khoản (UC33).
 * POST /api/trips/[id]/claims
 */
export async function createClaimApi(
  tripId: string,
  placeholderMemberId: string,
  options?: TripsApiClientOptions
): Promise<CreateClaimResponseDto> {
  if (!isUuid(tripId)) {
    throw new TripsApiError("ID chuyến đi không hợp lệ.", 400, "VALIDATION_ERROR");
  }
  if (!isUuid(placeholderMemberId)) {
    throw new TripsApiError(
      "ID thành viên chưa có tài khoản không hợp lệ.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/claims`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ placeholderMemberId }),
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi gửi yêu cầu nhận diện.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<CreateClaimResponseDto>(res);
  if (!dto || !dto.id) {
    throw new TripsApiError(
      "Dữ liệu phản hồi yêu cầu nhận diện không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dto;
}

/**
 * Lấy danh sách yêu cầu nhận diện thành viên trong chuyến đi (UC30, chỉ Trưởng nhóm).
 * GET /api/trips/[id]/claims
 */
export async function fetchTripClaimsApi(
  tripId: string,
  options?: TripsApiClientOptions
): Promise<MemberClaim[]> {
  if (!isUuid(tripId)) {
    throw new TripsApiError("ID chuyến đi không hợp lệ.", 400, "VALIDATION_ERROR");
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/claims`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi tải danh sách yêu cầu nhận diện.",
      0,
      "NETWORK_ERROR"
    );
  }

  const claims = await parseApiResponse<MemberClaim[]>(res);
  if (!Array.isArray(claims)) {
    throw new TripsApiError(
      "Dữ liệu danh sách yêu cầu nhận diện không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return claims;
}

/**
 * Duyệt hoặc từ chối yêu cầu nhận diện thành viên (UC30, chỉ Trưởng nhóm).
 * PATCH /api/trips/[id]/claims/[claimId]/decision
 */
export async function decideClaimApi(
  tripId: string,
  claimId: string,
  decision: "APPROVE" | "REJECT",
  options?: TripsApiClientOptions
): Promise<DecideClaimResponseDto> {
  if (!isUuid(tripId)) {
    throw new TripsApiError("ID chuyến đi không hợp lệ.", 400, "VALIDATION_ERROR");
  }
  if (!isUuid(claimId)) {
    throw new TripsApiError("ID yêu cầu nhận diện không hợp lệ.", 400, "VALIDATION_ERROR");
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/claims/${encodeURIComponent(
    claimId.trim()
  )}/decision`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ decision }),
    });
  } catch (networkError) {
    if (networkError instanceof TripsApiError) throw networkError;
    throw new TripsApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi xử lý yêu cầu nhận diện.",
      0,
      "NETWORK_ERROR"
    );
  }

  const dto = await parseApiResponse<DecideClaimResponseDto>(res);
  if (!dto || !dto.id) {
    throw new TripsApiError(
      "Dữ liệu phản hồi xử lý yêu cầu nhận diện không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return dto;
}
