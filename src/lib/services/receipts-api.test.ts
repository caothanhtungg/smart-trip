import { describe, it, expect, vi } from "vitest";
import {
  uploadReceiptImage,
  ReceiptsApiError,
} from "./receipts-api";
import { DEFAULT_MAX_RECEIPT_SIZE_BYTES } from "@/lib/storage/receipts";

describe("Receipts API Client (src/lib/services/receipts-api)", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const INVALID_TRIP_ID = "not-a-uuid";

  it("throws ReceiptsApiError if tripId is not a valid UUID", async () => {
    const file = new File(["dummy"], "receipt.jpg", { type: "image/jpeg" });
    await expect(uploadReceiptImage(INVALID_TRIP_ID, file)).rejects.toThrow(
      ReceiptsApiError
    );
  });

  it("throws ReceiptsApiError if file is missing", async () => {
    // @ts-expect-error Testing missing argument
    await expect(uploadReceiptImage(VALID_TRIP_ID, null)).rejects.toThrow(
      "Vui lòng chọn tập tin ảnh hóa đơn."
    );
  });

  it("throws ReceiptsApiError if file exceeds size limit before sending network request", async () => {
    const largeContent = new Uint8Array(DEFAULT_MAX_RECEIPT_SIZE_BYTES + 100);
    const largeFile = new File([largeContent], "huge.jpg", {
      type: "image/jpeg",
    });

    const mockFetch = vi.fn();
    await expect(
      uploadReceiptImage(VALID_TRIP_ID, largeFile, { customFetch: mockFetch })
    ).rejects.toThrow("Dung lượng ảnh vượt quá giới hạn");

    // Network request should NOT be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws ReceiptsApiError if declared file type is unsupported (e.g. text/plain)", async () => {
    const file = new File(["test content"], "document.txt", {
      type: "text/plain",
    });

    const mockFetch = vi.fn();
    await expect(
      uploadReceiptImage(VALID_TRIP_ID, file, { customFetch: mockFetch })
    ).rejects.toThrow("Định dạng ảnh không được hỗ trợ");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("successfully uploads valid image file and returns durable url and key", async () => {
    const file = new File(["binary content"], "receipt.png", {
      type: "image/png",
    });

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: {
          key: `receipts/${VALID_TRIP_ID}/test-uuid.png`,
          fileId: "test-uuid",
          url: `/api/trips/${VALID_TRIP_ID}/receipts/test-uuid`,
          size: file.size,
          mimeType: "image/png",
        },
      }),
    });

    const result = await uploadReceiptImage(VALID_TRIP_ID, file, {
      customFetch: mockFetch,
    });

    expect(result.fileId).toBe("test-uuid");
    expect(result.url).toBe(`/api/trips/${VALID_TRIP_ID}/receipts/test-uuid`);
    expect(result.mimeType).toBe("image/png");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws ReceiptsApiError with server message if upload fails on server", async () => {
    const file = new File(["binary content"], "receipt.jpg", {
      type: "image/jpeg",
    });

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        error: {
          code: "STORAGE_NOT_CONFIGURED",
          message: "Dịch vụ lưu trữ chưa được cấu hình.",
        },
      }),
    });

    await expect(
      uploadReceiptImage(VALID_TRIP_ID, file, { customFetch: mockFetch })
    ).rejects.toThrow("Dịch vụ lưu trữ chưa được cấu hình.");
  });
});
