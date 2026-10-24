import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import {
  requireAuth,
  UnauthorizedError,
  type AuthUser,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

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
    itineraryItem: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("/api/trips/[id]/itinerary Route Handlers", () => {
  const mockUser: AuthUser = {
    id: "usr-current-123",
    email: "lan@example.com",
    name: "Nguyễn Thị Lan",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: "https://example.com/lan.jpg",
    displayName: "Lan",
    bankBin: "970436",
    bankAccountNo: "iv:auth:cipher",
    bankAccountName: "NGUYEN THI LAN",
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-current-123",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const INVALID_UUID = "not-a-valid-uuid-123";

  const mockDbTrip = {
    id: VALID_TRIP_ID,
    name: "Đà Lạt 3N2Đ",
    destination: "Lâm Đồng",
    startDate: new Date("2026-11-20T00:00:00Z"),
    endDate: new Date("2026-11-23T00:00:00Z"),
    budgetAmount: 10000000,
    status: "ACTIVE" as const,
    inviteCode: "ABCDEF-234567",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: "mem-active-1",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });
    vi.mocked(prisma.trip.findUnique).mockResolvedValue(
      mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );
    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });
  });

  describe("GET /api/trips/[id]/itinerary", () => {
    it("trả về 401 khi chưa đăng nhập", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("trả về 404 khi tripId không phải UUID hợp lệ", async () => {
      const req = new Request(`http://localhost/api/trips/${INVALID_UUID}/itinerary`);
      const res = await GET(req, { params: Promise.resolve({ id: INVALID_UUID }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("trả về 404 khi chuyến đi không tồn tại", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
    });

    it("trả về 403 khi người dùng không phải thành viên của chuyến đi", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("trả về 200 kèm danh sách điểm dừng được định dạng chuẩn", async () => {
      const mockItems = [
        {
          id: "it-1",
          tripId: VALID_TRIP_ID,
          dayDate: new Date("2026-11-20T00:00:00Z"),
          sortOrder: 1,
          placeName: "Cà phê Mê Linh",
          address: "Tà Nung, Đà Lạt",
          note: "Ngắm cảnh",
          startTime: new Date(Date.UTC(1970, 0, 1, 8, 30)),
          endTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
          createdByMemberId: "mem-active-1",
          createdAt: new Date("2026-10-10T08:00:00Z"),
          updatedAt: new Date("2026-10-10T08:00:00Z"),
          createdByMember: {
            id: "mem-active-1",
            displayName: "Lan",
          },
          expenses: [
            {
              id: "exp-1",
              title: "Cà phê sáng",
              amount: 150000,
            },
          ],
        },
      ];

      vi.mocked(prisma.itineraryItem.findMany).mockResolvedValue(
        mockItems as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.findMany>>
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.data[0]).toMatchObject({
        id: "it-1",
        placeName: "Cà phê Mê Linh",
        dayDate: "2026-11-20",
        startTime: "08:30",
        endTime: "10:00",
        sortOrder: 1,
        createdByMember: {
          id: "mem-active-1",
          displayName: "Lan",
        },
      });
      expect(json.data[0].expenses).toHaveLength(1);
      expect(json.data[0].expenses[0].title).toBe("Cà phê sáng");
    });

    it("cho phép xem lịch trình khi chuyến đi đang ở trạng thái SETTLING hoặc COMPLETED", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValue({
        ...mockDbTrip,
        status: "SETTLING",
      } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.itineraryItem.findMany).mockResolvedValue([]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it("lọc theo query param ?dayDate=YYYY-MM-DD", async () => {
      vi.mocked(prisma.itineraryItem.findMany).mockResolvedValue([]);

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary?dayDate=2026-11-21`
      );
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(200);
      expect(prisma.itineraryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tripId: VALID_TRIP_ID,
            dayDate: new Date("2026-11-21T00:00:00Z"),
          }),
        })
      );
    });

    it("trả về 400 khi query param ?dayDate không đúng định dạng", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary?dayDate=2026-02-30`
      );
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/trips/[id]/itinerary", () => {
    const validBody = {
      placeName: "Thung lũng Tình Yêu",
      dayDate: "2026-11-21",
      address: "Mai Anh Đào, Đà Lạt",
      startTime: "14:00",
      endTime: "16:30",
      note: "Đi xe điện quanh hồ",
    };

    it("trả về 401 khi chưa đăng nhập", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(validBody),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(401);
    });

    it("trả về 403 khi người dùng không phải thành viên ACTIVE", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(validBody),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(403);
    });

    it("trả về 400 khi chuyến đi không ở trạng thái ACTIVE (ví dụ: SETTLING hoặc COMPLETED)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValue({
        ...mockDbTrip,
        status: "SETTLING",
      } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(validBody),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("trạng thái lên kế hoạch");
    });

    it("trả về 400 khi ngày hoạt động nằm ngoài khoảng thời gian chuyến đi", async () => {
      const outOfRange = {
        ...validBody,
        dayDate: "2026-11-25", // Chuyến đi kết thúc ngày 2026-11-23
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(outOfRange),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("phải nằm trong khoảng thời gian chuyến đi");
    });

    it("trả về 400 khi thiếu placeName hoặc placeName chỉ chứa khoảng trắng", async () => {
      const badPayload = {
        ...validBody,
        placeName: "   ",
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(badPayload),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("trả về 400 khi endTime nhỏ hơn startTime", async () => {
      const invalidTimes = {
        ...validBody,
        startTime: "15:00",
        endTime: "14:00",
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(invalidTimes),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.details?.[0]?.message).toContain("Giờ kết thúc không thể trước giờ bắt đầu.");
    });

    it("trả về 400 khi payload tiêm các trường cấm (tripId, createdByMemberId)", async () => {
      const injected = {
        ...validBody,
        tripId: "fake-id",
        createdByMemberId: "fake-creator",
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(injected),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("tạo điểm dừng thành công với mã 201 và tự sinh sortOrder = max + 1", async () => {
      const mockCreated = {
        id: "new-itinerary-item-uuid",
        tripId: VALID_TRIP_ID,
        dayDate: new Date("2026-11-21T00:00:00Z"),
        sortOrder: 2,
        placeName: "Thung lũng Tình Yêu",
        address: "Mai Anh Đào, Đà Lạt",
        note: "Đi xe điện quanh hồ",
        startTime: new Date(Date.UTC(1970, 0, 1, 14, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 16, 30)),
        createdByMemberId: "mem-active-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByMember: {
          id: "mem-active-1",
          displayName: "Lan",
        },
      };

      vi.mocked(prisma.itineraryItem.aggregate).mockResolvedValueOnce({
        _max: { sortOrder: 1 },
      } as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.aggregate>>);
      vi.mocked(prisma.itineraryItem.create).mockResolvedValueOnce(
        mockCreated as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.create>>
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(validBody),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("new-itinerary-item-uuid");
      expect(json.data.placeName).toBe("Thung lũng Tình Yêu");
      expect(json.data.dayDate).toBe("2026-11-21");
      expect(json.data.startTime).toBe("14:00");
      expect(json.data.endTime).toBe("16:30");
      expect(json.data.sortOrder).toBe(2);
      expect(json.data.createdByMember.id).toBe("mem-active-1");
    });

    it("cho phép client chủ động truyền sortOrder hợp lệ", async () => {
      const customOrderBody = {
        ...validBody,
        sortOrder: 5,
      };

      const mockCreated = {
        id: "item-custom-order",
        tripId: VALID_TRIP_ID,
        dayDate: new Date("2026-11-21T00:00:00Z"),
        sortOrder: 5,
        placeName: "Thung lũng Tình Yêu",
        address: "Mai Anh Đào, Đà Lạt",
        note: null,
        startTime: new Date(Date.UTC(1970, 0, 1, 14, 0)),
        endTime: null,
        createdByMemberId: "mem-active-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByMember: {
          id: "mem-active-1",
          displayName: "Lan",
        },
      };

      vi.mocked(prisma.itineraryItem.create).mockResolvedValueOnce(
        mockCreated as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.create>>
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/itinerary`, {
        method: "POST",
        body: JSON.stringify(customOrderBody),
      });
      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.sortOrder).toBe(5);
    });
  });
});
