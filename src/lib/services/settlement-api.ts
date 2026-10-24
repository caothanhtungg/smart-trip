import {
  Settlement,
  SettlementTransfer,
  MemberBalanceBreakdown,
  PaymentMethod,
} from "@/types/settlement";
import { isUuid } from "@/lib/services/trips-api";

export class SettlementApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    code = "SETTLEMENT_API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "SettlementApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiSettlementTransferMemberDto {
  id: string;
  displayName: string;
  status: string;
  isNoAccount: boolean;
}

export interface ApiSettlementTransferDto {
  id: string;
  settlementId: string;
  fromMemberId: string;
  fromMember: ApiSettlementTransferMemberDto;
  toMemberId: string;
  toMember: ApiSettlementTransferMemberDto;
  amount: number;
  status: "UNPAID" | "PAID" | "COMPLETED";
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  paidMarkedByMemberId: string | null;
  paidMarkedBy: {
    id: string;
    displayName: string;
  } | null;
  completedAt: string | null;
  completedByMemberId: string | null;
  completedBy: {
    id: string;
    displayName: string;
  } | null;
}

export interface ApiSettlementDto {
  id: string;
  tripId: string;
  status: "ACTIVE" | "CANCELLED";
  createdByMemberId: string;
  createdByMember: {
    id: string;
    displayName: string;
  };
  createdAt: string;
  cancelledAt: string | null;
  transfers: ApiSettlementTransferDto[];
}

export interface ApiSettlementResponse {
  settlement: ApiSettlementDto | null;
  balances: MemberBalanceBreakdown[];
  totalSpent: number;
  history?: ApiSettlementDto[];
}

export interface SettlementApiClientOptions {
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
 * Phân tích phản hồi từ backend API, ném SettlementApiError nếu request thất bại hoặc body sai định dạng.
 */
async function parseApiResponse<T>(res: Response): Promise<T> {
  let parsedBody: unknown;
  try {
    parsedBody = await res.json();
  } catch {
    throw new SettlementApiError(
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
    const code = errorEnv?.error?.code || `HTTP_${res.status}`;
    const details = errorEnv?.error?.details;
    throw new SettlementApiError(message, res.status, code, details);
  }

  const successEnv = parsedBody as ApiSuccessEnvelope<T>;
  if (successEnv && typeof successEnv === "object" && "data" in successEnv) {
    return successEnv.data;
  }

  throw new SettlementApiError(
    "Dữ liệu phản hồi từ máy chủ không đúng định dạng.",
    res.status,
    "MALFORMED_DATA"
  );
}

/**
 * Chuyển đổi DTO SettlementTransfer của API thành domain entity SettlementTransfer.
 */
export function mapApiTransferToDomain(
  dto: ApiSettlementTransferDto
): SettlementTransfer {
  return {
    id: dto.id,
    settlementId: dto.settlementId,
    fromMemberId: dto.fromMemberId,
    toMemberId: dto.toMemberId,
    amount: dto.amount,
    status: dto.status,
    paymentMethod: dto.paymentMethod || undefined,
    paidAt: dto.paidAt || undefined,
    paidMarkedByMemberId: dto.paidMarkedByMemberId || undefined,
    completedAt: dto.completedAt || undefined,
    completedByMemberId: dto.completedByMemberId || undefined,
  };
}

/**
 * Chuyển đổi DTO Settlement của API thành domain entity Settlement.
 */
export function mapApiSettlementToDomain(dto: ApiSettlementDto): Settlement {
  return {
    id: dto.id,
    tripId: dto.tripId,
    status: dto.status,
    createdByMemberId: dto.createdByMemberId,
    createdAt: dto.createdAt,
    cancelledAt: dto.cancelledAt || undefined,
    transfers: (dto.transfers || []).map(mapApiTransferToDomain),
  };
}

/**
 * Đọc sổ quyết toán hiện hành và bảng số dư của chuyến đi từ backend.
 * GET /api/trips/[id]/settlement
 */
export async function fetchTripSettlement(
  tripId: string,
  options?: { history?: boolean } & SettlementApiClientOptions
): Promise<ApiSettlementResponse> {
  if (!isUuid(tripId)) {
    throw new SettlementApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const query = options?.history ? "?history=true" : "";
  const url = `${baseUrl}/api/trips/${tripId}/settlement${query}`;

  try {
    const res = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    return await parseApiResponse<ApiSettlementResponse>(res);
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi tải quyết toán.",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Chốt sổ công nợ (Tạo Settlement & sinh transfers tối ưu từ expenses).
 * POST /api/trips/[id]/settlement
 */
export async function createTripSettlement(
  tripId: string,
  options?: SettlementApiClientOptions
): Promise<{ settlement: ApiSettlementDto }> {
  if (!isUuid(tripId)) {
    throw new SettlementApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/settlement`;

  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({}),
      credentials: "same-origin",
    });
    return await parseApiResponse<{ settlement: ApiSettlementDto }>(res);
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi chốt sổ công nợ.",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Hủy sổ quyết toán hiện hành và mở lại chuyến đi về trạng thái ACTIVE.
 * POST /api/trips/[id]/settlement/reopen
 */
export async function reopenTripSettlement(
  tripId: string,
  options?: SettlementApiClientOptions
): Promise<{ settlementId: string; reopenedAt: string }> {
  if (!isUuid(tripId)) {
    throw new SettlementApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/settlement/reopen`;

  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({}),
      credentials: "same-origin",
    });
    return await parseApiResponse<{ settlementId: string; reopenedAt: string }>(
      res
    );
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi mở lại sổ công nợ.",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Đọc chi tiết an toàn của một khoản chuyển tiền.
 * GET /api/trips/[id]/transfers/[transferId]
 */
export async function fetchTripTransfer(
  tripId: string,
  transferId: string,
  options?: SettlementApiClientOptions
): Promise<ApiSettlementTransferDto> {
  if (!isUuid(tripId) || !isUuid(transferId)) {
    throw new SettlementApiError(
      "Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/transfers/${transferId}`;

  try {
    const res = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const data = await parseApiResponse<{ transfer: ApiSettlementTransferDto }>(res);
    return data.transfer;
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi tải giao dịch.",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Cập nhật trạng thái chuyển tiền qua PATCH /api/trips/[id]/transfers/[transferId]
 */
export async function updateTripTransfer(
  tripId: string,
  transferId: string,
  input:
    | { action: "MARK_PAID"; paymentMethod?: PaymentMethod }
    | { action: "CONFIRM_COMPLETED" }
    | { status: "PAID"; paymentMethod?: PaymentMethod }
    | { status: "COMPLETED" },
  options?: SettlementApiClientOptions
): Promise<ApiSettlementTransferDto> {
  if (!isUuid(tripId) || !isUuid(transferId)) {
    throw new SettlementApiError(
      "Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/transfers/${transferId}`;

  try {
    const res = await fetchFn(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
      credentials: "same-origin",
    });
    const data = await parseApiResponse<{ transfer: ApiSettlementTransferDto }>(res);
    return data.transfer;
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi cập nhật giao dịch.",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Tiện ích đánh dấu chuyển tiền đã thanh toán (POST /mark-paid).
 */
export async function markTransferPaid(
  tripId: string,
  transferId: string,
  input?: { paymentMethod?: PaymentMethod },
  options?: SettlementApiClientOptions
): Promise<ApiSettlementTransferDto> {
  if (!isUuid(tripId) || !isUuid(transferId)) {
    throw new SettlementApiError(
      "Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/transfers/${transferId}/mark-paid`;

  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input || { paymentMethod: "BANK_TRANSFER" }),
      credentials: "same-origin",
    });
    const data = await parseApiResponse<{ transfer: ApiSettlementTransferDto }>(res);
    return data.transfer;
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi đánh dấu thanh toán.",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Tiện ích xác nhận đã nhận tiền (POST /confirm).
 */
export async function confirmTransferCompleted(
  tripId: string,
  transferId: string,
  options?: SettlementApiClientOptions
): Promise<ApiSettlementTransferDto> {
  if (!isUuid(tripId) || !isUuid(transferId)) {
    throw new SettlementApiError(
      "Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/transfers/${transferId}/confirm`;

  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({}),
      credentials: "same-origin",
    });
    const data = await parseApiResponse<{ transfer: ApiSettlementTransferDto }>(res);
    return data.transfer;
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng khi xác nhận nhận tiền.",
      0,
      "NETWORK_ERROR"
    );
  }
}

export interface ApiTransferPaymentInfoDto {
  transferId: string;
  tripId: string;
  amount: number;
  transferMemo: string;
  bankBin: string;
  bankName: string;
  bankAccountMasked: string;
  recipientName: string;
  qrDataUrl: string;
  qrPayload: string;
}

/**
 * Lấy thông tin thanh toán an toàn và mã VietQR cho một khoản chuyển tiền (UC18).
 * GET /api/trips/[id]/transfers/[transferId]/payment-info
 */
export async function fetchTransferPaymentInfo(
  tripId: string,
  transferId: string,
  options?: SettlementApiClientOptions
): Promise<ApiTransferPaymentInfoDto> {
  if (!isUuid(tripId) || !isUuid(transferId)) {
    throw new SettlementApiError(
      "Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";
  const url = `${baseUrl}/api/trips/${tripId}/transfers/${transferId}/payment-info`;

  try {
    const res = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    return await parseApiResponse<ApiTransferPaymentInfoDto>(res);
  } catch (err) {
    if (err instanceof SettlementApiError) throw err;
    throw new SettlementApiError(
      err instanceof Error
        ? err.message
        : "Lỗi kết nối mạng khi tải thông tin thanh toán.",
      0,
      "NETWORK_ERROR"
    );
  }
}
