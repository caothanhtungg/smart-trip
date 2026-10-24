import { isUuid } from "@/lib/services/trips-api";
import {
  ALLOWED_RECEIPT_MIME_TYPES,
  DEFAULT_MAX_RECEIPT_SIZE_BYTES,
} from "@/lib/storage/receipts";

export class ReceiptsApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    code = "RECEIPTS_API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ReceiptsApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface UploadReceiptResult {
  key: string;
  fileId: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ReceiptsApiClientOptions {
  customFetch?: typeof fetch;
  baseUrl?: string;
}

/**
 * Tải ảnh hóa đơn lên server (UC32).
 * Trả về đường dẫn truy cập bền vững và mã file định danh.
 */
export async function uploadReceiptImage(
  tripId: string,
  file: File,
  options?: ReceiptsApiClientOptions
): Promise<UploadReceiptResult> {
  if (!tripId || !isUuid(tripId)) {
    throw new ReceiptsApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  if (!file) {
    throw new ReceiptsApiError(
      "Vui lòng chọn tập tin ảnh hóa đơn.",
      400,
      "MISSING_FILE"
    );
  }

  // 1. Kiểm tra dung lượng sơ bộ ở phía client
  if (file.size > DEFAULT_MAX_RECEIPT_SIZE_BYTES) {
    const maxMb = Math.round(DEFAULT_MAX_RECEIPT_SIZE_BYTES / (1024 * 1024));
    throw new ReceiptsApiError(
      `Dung lượng ảnh vượt quá giới hạn cho phép (${maxMb}MB).`,
      413,
      "FILE_TOO_LARGE"
    );
  }

  // 2. Kiểm tra định dạng cơ bản
  const normalizedType = file.type.toLowerCase();
  if (
    normalizedType &&
    !ALLOWED_RECEIPT_MIME_TYPES.includes(
      normalizedType as (typeof ALLOWED_RECEIPT_MIME_TYPES)[number]
    )
  ) {
    throw new ReceiptsApiError(
      "Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG hoặc WebP.",
      415,
      "UNSUPPORTED_MEDIA_TYPE"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchFn(`${baseUrl}/api/trips/${tripId}/receipts`, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || body.success !== true) {
    const errorMessage =
      body?.error?.message ||
      `Không thể tải ảnh hóa đơn (Mã phản hồi: ${res.status}).`;
    const errorCode = body?.error?.code || "UPLOAD_FAILED";
    throw new ReceiptsApiError(
      errorMessage,
      res.status,
      errorCode,
      body?.error?.details
    );
  }

  return body.data as UploadReceiptResult;
}
