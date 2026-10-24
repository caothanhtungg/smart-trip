import { CreateItineraryItemFormData, ItineraryItem } from "@/types/trip";
import { dbTimeToTimeString } from "@/lib/itinerary/date";

export class ItineraryApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    code = "ITINERARY_API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ItineraryApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiItineraryItemDto {
  id: string;
  tripId: string;
  dayDate: string; // "YYYY-MM-DD"
  sortOrder: number;
  placeName: string;
  address?: string | null;
  note?: string | null;
  startTime?: string | null; // "HH:mm"
  endTime?: string | null; // "HH:mm"
  createdByMemberId: string;
  createdByMember?: {
    id: string;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
  expenses?: Array<{
    id: string;
    title: string;
    amount: number;
  }>;
}

export interface CreateItineraryItemInput {
  dayDate: string; // YYYY-MM-DD
  placeName: string;
  startTime: string; // HH:mm
  endTime?: string | null; // HH:mm
  address?: string | null;
  note?: string | null;
  sortOrder?: number;
}

export interface UpdateItineraryItemInput {
  dayDate?: string;
  placeName?: string;
  startTime?: string;
  endTime?: string | null;
  address?: string | null;
  note?: string | null;
  sortOrder?: number;
}

export interface ItineraryApiClientOptions {
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
 * Phân tích phản hồi từ backend API, ném ItineraryApiError nếu request thất bại hoặc body sai định dạng.
 */
async function parseApiResponse<T>(res: Response): Promise<T> {
  let parsedBody: unknown;
  try {
    parsedBody = await res.json();
  } catch {
    throw new ItineraryApiError(
      `Không thể đọc dữ liệu phản hồi từ máy chủ (HTTP ${res.status}).`,
      res.status,
      "INVALID_RESPONSE"
    );
  }

  if (!res.ok) {
    const errorEnv = parsedBody as ApiErrorEnvelope;
    const message =
      errorEnv?.error?.message ||
      `Yêu cầu lịch trình thất bại với mã lỗi HTTP ${res.status}.`;
    const code =
      errorEnv?.error?.code ||
      (res.status === 401
        ? "UNAUTHORIZED"
        : res.status === 403
        ? "FORBIDDEN"
        : res.status === 404
        ? "NOT_FOUND"
        : "API_ERROR");

    throw new ItineraryApiError(
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
    throw new ItineraryApiError(
      "Cấu trúc phản hồi từ máy chủ không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return successEnv.data;
}

/**
 * Ánh xạ DTO phản hồi từ API sang domain model ItineraryItem dùng cho giao diện.
 */
export function mapApiItineraryItemToDomain(
  dto: ApiItineraryItemDto
): ItineraryItem {
  const startTime = dbTimeToTimeString(dto.startTime);
  const endTime = dbTimeToTimeString(dto.endTime);
  const expenseId =
    dto.expenses && dto.expenses.length > 0 ? dto.expenses[0].id : null;

  return {
    id: dto.id,
    tripId: dto.tripId,
    dayDate: dto.dayDate,
    sortOrder: dto.sortOrder,
    placeName: dto.placeName,
    address: dto.address ?? null,
    startTime,
    endTime,
    note: dto.note ?? null,
    createdByMemberId: dto.createdByMemberId,
    expenseId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

/**
 * Lấy danh sách điểm dừng lịch trình của một chuyến đi từ GET /api/trips/[id]/itinerary
 */
export async function fetchTripItinerary(
  tripId: string,
  dayDate?: string,
  options?: ItineraryApiClientOptions
): Promise<ItineraryItem[]> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new ItineraryApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";

  const query = new URLSearchParams();
  if (dayDate) query.set("dayDate", dayDate);
  const qs = query.toString();

  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/itinerary${
    qs ? `?${qs}` : ""
  }`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });
  } catch (networkError) {
    if (networkError instanceof ItineraryApiError) throw networkError;
    throw new ItineraryApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi tải lịch trình.",
      0,
      "NETWORK_ERROR"
    );
  }

  const rawList = await parseApiResponse<ApiItineraryItemDto[]>(res);
  if (!Array.isArray(rawList)) {
    throw new ItineraryApiError(
      "Dữ liệu lịch trình không đúng định dạng danh sách.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return rawList.map(mapApiItineraryItemToDomain);
}

/**
 * Thêm một điểm dừng mới vào lịch trình qua POST /api/trips/[id]/itinerary
 */
export async function createItineraryItem(
  tripId: string,
  input: CreateItineraryItemInput | CreateItineraryItemFormData,
  options?: ItineraryApiClientOptions
): Promise<ItineraryItem> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new ItineraryApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(tripId.trim())}/itinerary`;

  // Sanitize payload: Chỉ gửi các trường được phép, KHÔNG gửi tripId hay createdByMemberId
  const payload: Record<string, unknown> = {
    dayDate: input.dayDate.trim(),
    placeName: input.placeName.trim(),
    startTime: input.startTime.trim(),
  };

  if (input.endTime !== undefined) {
    payload.endTime = input.endTime ? input.endTime.trim() : null;
  }
  if (input.address !== undefined) {
    payload.address = input.address ? input.address.trim() : null;
  }
  if (input.note !== undefined) {
    payload.note = input.note ? input.note.trim() : null;
  }
  if ("sortOrder" in input && input.sortOrder !== undefined) {
    payload.sortOrder = input.sortOrder;
  }

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    if (networkError instanceof ItineraryApiError) throw networkError;
    throw new ItineraryApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi thêm điểm dừng lịch trình.",
      0,
      "NETWORK_ERROR"
    );
  }

  const rawItem = await parseApiResponse<ApiItineraryItemDto>(res);
  if (!rawItem || !rawItem.id) {
    throw new ItineraryApiError(
      "Dữ liệu phản hồi điểm dừng mới không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return mapApiItineraryItemToDomain(rawItem);
}

/**
 * Cập nhật điểm dừng lịch trình qua PATCH /api/trips/[id]/itinerary/[itemId]
 */
export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  input: UpdateItineraryItemInput | Partial<CreateItineraryItemFormData>,
  options?: ItineraryApiClientOptions
): Promise<ItineraryItem> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new ItineraryApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }
  if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
    throw new ItineraryApiError(
      "Mã điểm dừng không hợp lệ.",
      400,
      "INVALID_ITEM_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(
    tripId.trim()
  )}/itinerary/${encodeURIComponent(itemId.trim())}`;

  // Sanitize payload: Chỉ gửi các trường được cập nhật
  const payload: Record<string, unknown> = {};
  if (input.dayDate !== undefined) payload.dayDate = input.dayDate.trim();
  if (input.placeName !== undefined) payload.placeName = input.placeName.trim();
  if (input.startTime !== undefined) payload.startTime = input.startTime.trim();
  if (input.endTime !== undefined) {
    payload.endTime = input.endTime ? input.endTime.trim() : null;
  }
  if (input.address !== undefined) {
    payload.address = input.address ? input.address.trim() : null;
  }
  if (input.note !== undefined) {
    payload.note = input.note ? input.note.trim() : null;
  }
  if ("sortOrder" in input && input.sortOrder !== undefined) {
    payload.sortOrder = input.sortOrder;
  }

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    if (networkError instanceof ItineraryApiError) throw networkError;
    throw new ItineraryApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi cập nhật điểm dừng lịch trình.",
      0,
      "NETWORK_ERROR"
    );
  }

  const rawItem = await parseApiResponse<ApiItineraryItemDto>(res);
  if (!rawItem || !rawItem.id) {
    throw new ItineraryApiError(
      "Dữ liệu phản hồi cập nhật không hợp lệ.",
      res.status,
      "MALFORMED_RESPONSE"
    );
  }

  return mapApiItineraryItemToDomain(rawItem);
}

/**
 * Xóa điểm dừng lịch trình qua DELETE /api/trips/[id]/itinerary/[itemId]
 */
export async function deleteItineraryItem(
  tripId: string,
  itemId: string,
  options?: ItineraryApiClientOptions
): Promise<{ id: string }> {
  if (!tripId || typeof tripId !== "string" || !tripId.trim()) {
    throw new ItineraryApiError(
      "Mã chuyến đi không hợp lệ.",
      400,
      "INVALID_TRIP_ID"
    );
  }
  if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
    throw new ItineraryApiError(
      "Mã điểm dừng không hợp lệ.",
      400,
      "INVALID_ITEM_ID"
    );
  }

  const clientFetch = options?.customFetch || globalThis.fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${encodeURIComponent(
    tripId.trim()
  )}/itinerary/${encodeURIComponent(itemId.trim())}`;

  let res: Response;
  try {
    res = await clientFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });
  } catch (networkError) {
    if (networkError instanceof ItineraryApiError) throw networkError;
    throw new ItineraryApiError(
      networkError instanceof Error
        ? networkError.message
        : "Lỗi kết nối mạng khi xóa điểm dừng lịch trình.",
      0,
      "NETWORK_ERROR"
    );
  }

  const data = await parseApiResponse<{ id: string }>(res);
  return data;
}
