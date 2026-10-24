import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  detectImageFormat,
  validateReceiptFile,
  generateReceiptObjectKey,
  getMaxReceiptSizeBytes,
  DEFAULT_MAX_RECEIPT_SIZE_BYTES,
  MemoryReceiptStorageProvider,
  SupabaseRestStorageProvider,
  getReceiptStorageProvider,
  setReceiptStorageProviderForTesting,
} from "./receipts";
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  BadRequestError,
  ServiceUnavailableError,
} from "@/lib/api/errors";

describe("Receipt Storage Module (src/lib/storage/receipts)", () => {
  // Sample valid magic bytes
  const VALID_JPEG_BUFFER = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);

  const VALID_PNG_BUFFER = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);

  const VALID_WEBP_BUFFER = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // 'RIFF'
    0x24, 0x00, 0x00, 0x00, // file size
    0x57, 0x45, 0x42, 0x50, // 'WEBP'
    0x56, 0x50, 0x38, 0x20, // 'VP8 '
  ]);

  const INVALID_TEXT_BUFFER = Buffer.from("Hello world! Not an image at all.");
  const INVALID_PDF_BUFFER = Buffer.from("%PDF-1.4 1 0 obj <</Type /Catalog>>");

  afterEach(() => {
    setReceiptStorageProviderForTesting(null);
    vi.restoreAllMocks();
  });

  describe("detectImageFormat (Magic bytes inspection)", () => {
    it("correctly identifies JPEG from magic bytes", () => {
      const res = detectImageFormat(VALID_JPEG_BUFFER);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe("image/jpeg");
      expect(res?.extension).toBe(".jpg");
    });

    it("correctly identifies PNG from magic bytes", () => {
      const res = detectImageFormat(VALID_PNG_BUFFER);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe("image/png");
      expect(res?.extension).toBe(".png");
    });

    it("correctly identifies WebP from magic bytes", () => {
      const res = detectImageFormat(VALID_WEBP_BUFFER);
      expect(res).not.toBeNull();
      expect(res?.mimeType).toBe("image/webp");
      expect(res?.extension).toBe(".webp");
    });

    it("returns null for text or PDF files disguised as images", () => {
      expect(detectImageFormat(INVALID_TEXT_BUFFER)).toBeNull();
      expect(detectImageFormat(INVALID_PDF_BUFFER)).toBeNull();
    });

    it("returns null for buffers shorter than 12 bytes", () => {
      expect(detectImageFormat(Buffer.from([0xff, 0xd8]))).toBeNull();
      expect(detectImageFormat(Buffer.alloc(0))).toBeNull();
    });
  });

  describe("validateReceiptFile", () => {
    it("accepts a valid JPEG image within size limit", () => {
      const validated = validateReceiptFile({
        buffer: VALID_JPEG_BUFFER,
        declaredMimeType: "image/jpeg",
      });
      expect(validated.mimeType).toBe("image/jpeg");
      expect(validated.extension).toBe(".jpg");
      expect(validated.size).toBe(VALID_JPEG_BUFFER.length);
    });

    it("accepts a valid PNG image within size limit", () => {
      const validated = validateReceiptFile({
        buffer: VALID_PNG_BUFFER,
        declaredMimeType: "image/png",
      });
      expect(validated.mimeType).toBe("image/png");
      expect(validated.extension).toBe(".png");
    });

    it("accepts a valid WebP image within size limit", () => {
      const validated = validateReceiptFile({
        buffer: VALID_WEBP_BUFFER,
        declaredMimeType: "image/webp",
      });
      expect(validated.mimeType).toBe("image/webp");
      expect(validated.extension).toBe(".webp");
    });

    it("rejects an empty buffer with BadRequestError", () => {
      expect(() =>
        validateReceiptFile({
          buffer: Buffer.alloc(0),
        })
      ).toThrow(BadRequestError);
    });

    it("rejects a file exceeding the size limit with PayloadTooLargeError", () => {
      const oversizedBuffer = Buffer.alloc(DEFAULT_MAX_RECEIPT_SIZE_BYTES + 100);
      expect(() =>
        validateReceiptFile({
          buffer: oversizedBuffer,
          declaredMimeType: "image/jpeg",
        })
      ).toThrow(PayloadTooLargeError);
    });

    it("rejects unsupported declared MIME types (e.g. image/gif, application/pdf)", () => {
      expect(() =>
        validateReceiptFile({
          buffer: VALID_JPEG_BUFFER,
          declaredMimeType: "image/gif",
        })
      ).toThrow(UnsupportedMediaTypeError);

      expect(() =>
        validateReceiptFile({
          buffer: VALID_JPEG_BUFFER,
          declaredMimeType: "application/pdf",
        })
      ).toThrow(UnsupportedMediaTypeError);
    });

    it("rejects files where declared MIME is image/jpeg but content fails magic bytes", () => {
      expect(() =>
        validateReceiptFile({
          buffer: INVALID_TEXT_BUFFER,
          declaredMimeType: "image/jpeg",
        })
      ).toThrow(UnsupportedMediaTypeError);
    });

    it("uses default max receipt size and respects env variable override", () => {
      expect(getMaxReceiptSizeBytes()).toBe(DEFAULT_MAX_RECEIPT_SIZE_BYTES);

      const oldEnv = process.env.RECEIPT_MAX_SIZE_BYTES;
      try {
        process.env.RECEIPT_MAX_SIZE_BYTES = "10485760"; // 10MB
        expect(getMaxReceiptSizeBytes()).toBe(10485760);
      } finally {
        if (oldEnv !== undefined) {
          process.env.RECEIPT_MAX_SIZE_BYTES = oldEnv;
        } else {
          delete process.env.RECEIPT_MAX_SIZE_BYTES;
        }
      }
    });
  });

  describe("generateReceiptObjectKey", () => {
    it("generates a random UUID-based key under receipts/{tripId}/", () => {
      const tripId = "11111111-2222-4333-8444-555555555555";
      const { key, fileId } = generateReceiptObjectKey(tripId, ".jpg");

      expect(key.startsWith(`receipts/${tripId}/`)).toBe(true);
      expect(key.endsWith(".jpg")).toBe(true);
      expect(key).toBe(`receipts/${tripId}/${fileId}.jpg`);
      expect(fileId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("does not include user-provided dangerous characters in the object key", () => {
      const tripId = "11111111-2222-4333-8444-555555555555";
      const { key } = generateReceiptObjectKey(tripId, "png");
      expect(key).not.toContain("../");
      expect(key.endsWith(".png")).toBe(true);
    });
  });

  describe("MemoryReceiptStorageProvider", () => {
    it("allows uploading and downloading stored receipt files in-memory", async () => {
      const provider = new MemoryReceiptStorageProvider();
      expect(provider.isConfigured()).toBe(true);

      const result = await provider.upload({
        bucket: "trip-receipts",
        key: "receipts/test-trip/photo.jpg",
        buffer: VALID_JPEG_BUFFER,
        contentType: "image/jpeg",
      });

      expect(result.key).toBe("receipts/test-trip/photo.jpg");
      expect(provider.has("trip-receipts", "receipts/test-trip/photo.jpg")).toBe(true);

      const downloaded = await provider.download({
        bucket: "trip-receipts",
        key: "receipts/test-trip/photo.jpg",
      });

      expect(downloaded).not.toBeNull();
      expect(downloaded?.contentType).toBe("image/jpeg");
      expect(downloaded?.buffer.equals(VALID_JPEG_BUFFER)).toBe(true);
    });

    it("returns null when downloading a non-existent file", async () => {
      const provider = new MemoryReceiptStorageProvider();
      const downloaded = await provider.download({
        bucket: "trip-receipts",
        key: "not-found.jpg",
      });
      expect(downloaded).toBeNull();
    });

    it("creates a signed url with token and expiration", async () => {
      const provider = new MemoryReceiptStorageProvider();
      const signed = await provider.createSignedUrl({
        bucket: "trip-receipts",
        key: "receipts/1/2.png",
        expiresInSeconds: 300,
      });

      expect(signed).toContain("storage.local.mock");
      expect(signed).toContain("mock-signed-token");
    });
  });

  describe("SupabaseRestStorageProvider", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      delete process.env.SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("reports isConfigured() = false when credentials are missing", () => {
      const provider = new SupabaseRestStorageProvider();
      expect(provider.isConfigured()).toBe(false);
    });

    it("throws ServiceUnavailableError if attempting upload without configuration", async () => {
      const provider = new SupabaseRestStorageProvider();
      await expect(
        provider.upload({
          bucket: "trip-receipts",
          key: "test.jpg",
          buffer: VALID_JPEG_BUFFER,
          contentType: "image/jpeg",
        })
      ).rejects.toThrow(ServiceUnavailableError);
    });

    it("reports isConfigured() = true when both URL and service key are present", () => {
      process.env.SUPABASE_URL = "https://mockproject.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";

      const provider = new SupabaseRestStorageProvider();
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe("getReceiptStorageProvider and test override", () => {
    it("allows injecting a custom test provider", () => {
      const memoryProvider = new MemoryReceiptStorageProvider();
      setReceiptStorageProviderForTesting(memoryProvider);

      expect(getReceiptStorageProvider()).toBe(memoryProvider);
    });
  });
});
