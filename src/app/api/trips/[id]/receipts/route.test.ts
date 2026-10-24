import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { GET as GET_FILE } from "./[fileId]/route";
import {
  requireAuth,
  UnauthorizedError,
  type AuthUser,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  MemoryReceiptStorageProvider,
  setReceiptStorageProviderForTesting,
  DEFAULT_MAX_RECEIPT_SIZE_BYTES,
  RECEIPT_STORAGE_BUCKET,
} from "@/lib/storage/receipts";

vi.mock("@/lib/auth/session", () => ({
  requireAuth: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Yêu cầu đăng nhập để thực hiện thao tác này.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
    },
    tripMember: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Receipts API (/api/trips/[id]/receipts)", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const VALID_FILE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const INVALID_UUID = "not-a-valid-uuid";

  const mockUser: AuthUser = {
    id: "usr-active-1",
    email: "thanh@example.com",
    name: "Cao Thanh Tùng",
    emailVerified: true,
    bankAccountKeyVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: mockUser.id,
    token: "tok-1",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTrip = {
    id: VALID_TRIP_ID,
    title: "Chuyến đi Đà Lạt 3N2Đ",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockActiveMember = {
    id: "mem-active-1",
    tripId: VALID_TRIP_ID,
    userId: mockUser.id,
    displayName: "Thành Tùng",
    role: "MEMBER",
    status: "ACTIVE",
    joinOrder: 1,
  };

  const VALID_JPEG_BUFFER = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);

  const VALID_PNG_BUFFER = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);

  let memoryProvider: MemoryReceiptStorageProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    memoryProvider = new MemoryReceiptStorageProvider();
    setReceiptStorageProviderForTesting(memoryProvider);

    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.trip.findUnique).mockResolvedValue(mockTrip as never);
    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockActiveMember as never
    );
  });

  afterEach(() => {
    setReceiptStorageProviderForTesting(null);
  });

  function createMultipartRequest(
    fileBuffer?: Buffer,
    fileName = "receipt.jpg",
    fileType = "image/jpeg"
  ): Request {
    const formData = new FormData();
    if (fileBuffer) {
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: fileType });
      formData.append("file", blob, fileName);
    }
    return new Request(
      `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts`,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  describe("POST /api/trips/[id]/receipts", () => {
    it("returns 401 UNAUTHORIZED if user is not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const req = createMultipartRequest(VALID_JPEG_BUFFER);
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 NOT_FOUND if tripId is not a valid UUID", async () => {
      const req = createMultipartRequest(VALID_JPEG_BUFFER);
      const res = await POST(req, { params: { id: INVALID_UUID } });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 NOT_FOUND if trip does not exist in database", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

      const req = createMultipartRequest(VALID_JPEG_BUFFER);
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 FORBIDDEN if user is not an active member of the trip", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const req = createMultipartRequest(VALID_JPEG_BUFFER);
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 BAD_REQUEST if trip is not in ACTIVE state (e.g. COMPLETED)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
        ...mockTrip,
        status: "COMPLETED",
      } as never);

      const req = createMultipartRequest(VALID_JPEG_BUFFER);
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        "không ở trạng thái lên kế hoạch"
      );
    });

    it("returns 400 BAD_REQUEST if request is not multipart/form-data", async () => {
      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: "base64..." }),
        }
      );
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("multipart/form-data");
    });

    it("returns 400 BAD_REQUEST if file parameter is missing in form-data", async () => {
      const formData = new FormData();
      formData.append("note", "No file included");
      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts`,
        {
          method: "POST",
          body: formData,
        }
      );
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("tập tin");
    });

    it("returns 413 PAYLOAD_TOO_LARGE if file exceeds max size limit", async () => {
      const oversizedBuffer = Buffer.alloc(DEFAULT_MAX_RECEIPT_SIZE_BYTES + 1024);
      const req = createMultipartRequest(
        oversizedBuffer,
        "huge.jpg",
        "image/jpeg"
      );
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("returns 415 UNSUPPORTED_MEDIA_TYPE if file fails magic bytes check", async () => {
      const fakeTextBuffer = Buffer.from("Not really an image at all");
      const req = createMultipartRequest(
        fakeTextBuffer,
        "fake.jpg",
        "image/jpeg"
      );
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("returns 503 SERVICE_UNAVAILABLE if storage provider is unconfigured", async () => {
      setReceiptStorageProviderForTesting({
        isConfigured: () => false,
        upload: vi.fn(),
        createSignedUrl: vi.fn(),
        download: vi.fn(),
      });

      const req = createMultipartRequest(VALID_JPEG_BUFFER);
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("STORAGE_NOT_CONFIGURED");
    });

    it("returns 201 CREATED with durable reference on successful upload", async () => {
      const req = createMultipartRequest(
        VALID_PNG_BUFFER,
        "original_client_filename.png",
        "image/png"
      );
      const res = await POST(req, { params: { id: VALID_TRIP_ID } });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.key).toMatch(
        new RegExp(`^receipts/${VALID_TRIP_ID}/[0-9a-f-]+\\.png$`)
      );
      // Ensures original client filename is never exposed or trusted
      expect(json.data.key).not.toContain("original_client_filename");
      expect(json.data.url).toMatch(
        new RegExp(`^/api/trips/${VALID_TRIP_ID}/receipts/[0-9a-f-]+$`)
      );
      expect(json.data.mimeType).toBe("image/png");
      expect(json.data.size).toBe(VALID_PNG_BUFFER.length);

      // Verify stored in memory provider
      expect(memoryProvider.has(RECEIPT_STORAGE_BUCKET, json.data.key)).toBe(
        true
      );
    });
  });

  describe("GET /api/trips/[id]/receipts/[fileId]", () => {
    it("returns 401 UNAUTHORIZED if caller is not logged in", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts/${VALID_FILE_ID}`
      );
      const res = await GET_FILE(req, {
        params: { id: VALID_TRIP_ID, fileId: VALID_FILE_ID },
      });

      expect(res.status).toBe(401);
    });

    it("returns 403 FORBIDDEN if caller is not a member of the trip", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts/${VALID_FILE_ID}`
      );
      const res = await GET_FILE(req, {
        params: { id: VALID_TRIP_ID, fileId: VALID_FILE_ID },
      });

      expect(res.status).toBe(403);
    });

    it("returns 404 NOT_FOUND if fileId is not a valid UUID", async () => {
      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts/${INVALID_UUID}`
      );
      const res = await GET_FILE(req, {
        params: { id: VALID_TRIP_ID, fileId: INVALID_UUID },
      });

      expect(res.status).toBe(404);
    });

    it("returns 404 NOT_FOUND if receipt file does not exist in storage", async () => {
      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts/${VALID_FILE_ID}`
      );
      const res = await GET_FILE(req, {
        params: { id: VALID_TRIP_ID, fileId: VALID_FILE_ID },
      });

      expect(res.status).toBe(404);
    });

    it("returns 200 with image stream and private cache header when file exists", async () => {
      // Pre-populate memory store
      const key = `receipts/${VALID_TRIP_ID}/${VALID_FILE_ID}.jpg`;
      await memoryProvider.upload({
        bucket: RECEIPT_STORAGE_BUCKET,
        key,
        buffer: VALID_JPEG_BUFFER,
        contentType: "image/jpeg",
      });

      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts/${VALID_FILE_ID}`
      );
      const res = await GET_FILE(req, {
        params: { id: VALID_TRIP_ID, fileId: VALID_FILE_ID },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/jpeg");
      expect(res.headers.get("Cache-Control")).toContain("private");

      const arrayBuf = await res.arrayBuffer();
      expect(Buffer.from(arrayBuf).equals(VALID_JPEG_BUFFER)).toBe(true);
    });

    it("allows members who LEFT the trip to view receipts for financial audit", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce({
        ...mockActiveMember,
        status: "LEFT",
      } as never);

      const key = `receipts/${VALID_TRIP_ID}/${VALID_FILE_ID}.png`;
      await memoryProvider.upload({
        bucket: RECEIPT_STORAGE_BUCKET,
        key,
        buffer: VALID_PNG_BUFFER,
        contentType: "image/png",
      });

      const req = new Request(
        `http://localhost:3000/api/trips/${VALID_TRIP_ID}/receipts/${VALID_FILE_ID}`
      );
      const res = await GET_FILE(req, {
        params: { id: VALID_TRIP_ID, fileId: VALID_FILE_ID },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
    });
  });
});
