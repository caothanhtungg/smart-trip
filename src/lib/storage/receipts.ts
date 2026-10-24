import crypto from "crypto";
import {
  BadRequestError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ServiceUnavailableError,
} from "@/lib/api/errors";

/**
 * Giới hạn kích thước file ảnh hóa đơn mặc định: 5MB (5 * 1024 * 1024 bytes).
 * Có thể điều chỉnh qua biến môi trường RECEIPT_MAX_SIZE_BYTES.
 */
export const DEFAULT_MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function getMaxReceiptSizeBytes(): number {
  const envVal = process.env.RECEIPT_MAX_SIZE_BYTES;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_RECEIPT_SIZE_BYTES;
}

export const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedReceiptMimeType = (typeof ALLOWED_RECEIPT_MIME_TYPES)[number];

export const RECEIPT_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "trip-receipts";

/**
 * Nhận diện định dạng ảnh thực tế dựa trên Magic Bytes ở đầu tập tin.
 * Tuyệt đối không chỉ tin tưởng phần mở rộng (.jpg, .png) hoặc MIME do client khai báo.
 */
export function detectImageFormat(
  buffer: Buffer | Uint8Array
): { mimeType: AllowedReceiptMimeType; extension: string } | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: Bắt đầu bằng 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: ".jpg" };
  }

  // PNG: Bắt đầu bằng 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: ".png" };
  }

  // WebP: 4 byte đầu là 'RIFF' (0x52, 0x49, 0x46, 0x46), byte 8..11 là 'WEBP' (0x57, 0x45, 0x42, 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: "image/webp", extension: ".webp" };
  }

  return null;
}

export interface ValidatedReceiptFile {
  buffer: Buffer;
  mimeType: AllowedReceiptMimeType;
  extension: string;
  size: number;
}

/**
 * Kiểm tra tính hợp lệ toàn diện của file hóa đơn:
 * 1. Kiểm tra dung lượng file so với giới hạn.
 * 2. Kiểm tra MIME type khai báo từ client.
 * 3. Kiểm tra Magic Bytes thực tế trong Buffer.
 */
export function validateReceiptFile(params: {
  buffer: Buffer;
  size?: number;
  declaredMimeType?: string;
}): ValidatedReceiptFile {
  const { buffer, declaredMimeType } = params;
  const size = params.size ?? buffer.length;
  const maxSize = getMaxReceiptSizeBytes();

  if (size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    throw new PayloadTooLargeError(
      `Dung lượng ảnh hóa đơn vượt quá giới hạn cho phép (${maxMb}MB).`
    );
  }

  if (size === 0) {
    throw new BadRequestError("Tập tin tải lên không chứa dữ liệu.");
  }

  if (declaredMimeType) {
    const normalizedDeclared = declaredMimeType.toLowerCase().trim();
    if (
      !ALLOWED_RECEIPT_MIME_TYPES.includes(
        normalizedDeclared as AllowedReceiptMimeType
      )
    ) {
      throw new UnsupportedMediaTypeError(
        "Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG hoặc WebP."
      );
    }
  }

  const detected = detectImageFormat(buffer);
  if (!detected) {
    throw new UnsupportedMediaTypeError(
      "Nội dung tập tin không phải là ảnh hợp lệ (chỉ hỗ trợ JPEG, PNG, WebP)."
    );
  }

  return {
    buffer,
    mimeType: detected.mimeType,
    extension: detected.extension,
    size,
  };
}

/**
 * Sinh khóa lưu trữ an toàn (Storage Object Key).
 * Định dạng: receipts/${tripId}/${randomUUID()}${extension}
 * Tuyệt đối không dùng tên file gốc do người dùng gửi lên.
 */
export function generateReceiptObjectKey(
  tripId: string,
  extension: string
): { key: string; fileId: string } {
  const fileId = crypto.randomUUID();
  const safeExt = extension.startsWith(".") ? extension : `.${extension}`;
  return {
    key: `receipts/${tripId}/${fileId}${safeExt}`,
    fileId,
  };
}

/**
 * Interface cho Storage Provider hỗ trợ lưu trữ hóa đơn.
 */
export interface ReceiptStorageProvider {
  isConfigured(): boolean;
  upload(params: {
    bucket: string;
    key: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ key: string }>;
  createSignedUrl(params: {
    bucket: string;
    key: string;
    expiresInSeconds: number;
  }): Promise<string>;
  download(params: {
    bucket: string;
    key: string;
  }): Promise<{ buffer: Buffer; contentType: string } | null>;
}

/**
 * Provider kết nối trực tiếp Supabase Storage thông qua REST API tiêu chuẩn.
 * Không yêu cầu cài thêm SDK ngoài.
 */
export class SupabaseRestStorageProvider implements ReceiptStorageProvider {
  private url: string | null;
  private serviceKey: string | null;

  constructor() {
    this.url =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      null;
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.serviceKey);
  }

  private getBaseUrl(): string {
    if (!this.url) {
      throw new ServiceUnavailableError(
        "Thiếu cấu hình SUPABASE_URL cho dịch vụ lưu trữ.",
        "STORAGE_CONFIG_MISSING"
      );
    }
    return this.url.replace(/\/$/, "");
  }

  private getHeaders(extra?: Record<string, string>): Record<string, string> {
    if (!this.serviceKey) {
      throw new ServiceUnavailableError(
        "Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY cho dịch vụ lưu trữ.",
        "STORAGE_CONFIG_MISSING"
      );
    }
    return {
      Authorization: `Bearer ${this.serviceKey}`,
      apikey: this.serviceKey,
      ...extra,
    };
  }

  async upload(params: {
    bucket: string;
    key: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ key: string }> {
    const baseUrl = this.getBaseUrl();
    const targetUrl = `${baseUrl}/storage/v1/object/${params.bucket}/${params.key}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: this.getHeaders({
        "Content-Type": params.contentType,
        "x-upsert": "false", // Không cho phép ghi đè
      }),
      body: new Uint8Array(params.buffer),
    });

    if (!res.ok) {
      throw new ServiceUnavailableError(
        `Không thể lưu trữ tập tin trên Supabase Storage (Mã lỗi: ${res.status}).`,
        "STORAGE_UPLOAD_FAILED"
      );
    }

    return { key: params.key };
  }

  async createSignedUrl(params: {
    bucket: string;
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const targetUrl = `${baseUrl}/storage/v1/object/sign/${params.bucket}/${params.key}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: this.getHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ expiresIn: params.expiresInSeconds }),
    });

    if (!res.ok) {
      throw new ServiceUnavailableError(
        "Không thể tạo liên kết truy cập có chữ ký cho ảnh hóa đơn.",
        "STORAGE_SIGN_FAILED"
      );
    }

    const data = (await res.json()) as { signedURL?: string };
    if (!data.signedURL) {
      throw new ServiceUnavailableError(
        "Phản hồi từ Supabase Storage không hợp lệ.",
        "STORAGE_SIGN_FAILED"
      );
    }

    return `${baseUrl}/storage/v1${data.signedURL}`;
  }

  async download(params: {
    bucket: string;
    key: string;
  }): Promise<{ buffer: Buffer; contentType: string } | null> {
    const baseUrl = this.getBaseUrl();
    const targetUrl = `${baseUrl}/storage/v1/object/${params.bucket}/${params.key}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new ServiceUnavailableError(
        `Không thể tải tập tin từ Supabase Storage (Mã lỗi: ${res.status}).`,
        "STORAGE_DOWNLOAD_FAILED"
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") || "application/octet-stream";

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  }
}

/**
 * Provider lưu trữ in-memory cho môi trường kiểm thử (Unit / Integration Tests)
 * hoặc khi muốn chạy offline độc lập không phụ thuộc hạ tầng mạng.
 */
export class MemoryReceiptStorageProvider implements ReceiptStorageProvider {
  private store = new Map<string, { buffer: Buffer; contentType: string }>();

  isConfigured(): boolean {
    return true;
  }

  async upload(params: {
    bucket: string;
    key: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ key: string }> {
    const storageKey = `${params.bucket}:${params.key}`;
    this.store.set(storageKey, {
      buffer: Buffer.from(params.buffer),
      contentType: params.contentType,
    });
    return { key: params.key };
  }

  async createSignedUrl(params: {
    bucket: string;
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + params.expiresInSeconds;
    return `https://storage.local.mock/${params.bucket}/${params.key}?token=mock-signed-token&exp=${expires}`;
  }

  async download(params: {
    bucket: string;
    key: string;
  }): Promise<{ buffer: Buffer; contentType: string } | null> {
    const storageKey = `${params.bucket}:${params.key}`;
    const found = this.store.get(storageKey);
    if (!found) return null;
    return {
      buffer: Buffer.from(found.buffer),
      contentType: found.contentType,
    };
  }

  clear(): void {
    this.store.clear();
  }

  has(bucket: string, key: string): boolean {
    return this.store.has(`${bucket}:${key}`);
  }
}

/**
 * Quản lý Provider hiện tại.
 */
let customProviderForTesting: ReceiptStorageProvider | null = null;

export function setReceiptStorageProviderForTesting(
  provider: ReceiptStorageProvider | null
): void {
  customProviderForTesting = provider;
}

export function getReceiptStorageProvider(): ReceiptStorageProvider {
  if (customProviderForTesting) {
    return customProviderForTesting;
  }
  return new SupabaseRestStorageProvider();
}
