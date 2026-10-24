import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";
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
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("/api/trips/[id]/itinerary/[itemId] Route Handlers", () => {
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
  const VALID_ITEM_ID = "22222222-3333-4444-8555-666666666666";
  const INVALID_UUID = "not-a-valid-uuid";

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

  const mockCreatorMember = {
    id: "mem-creator-1",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Creator)",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockOtherMember = {
    id: "mem-other-2",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Other Member)",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date("2026-10-02T00:00:00Z"),
    leftAt: null,
  };

  const mockHostMember = {
    id: "mem-host-3",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Host)",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 3,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockDbItem = {
    id: VALID_ITEM_ID,
    tripId: VALID_TRIP_ID,
    dayDate: new Date("2026-11-20T00:00:00Z"),
    sortOrder: 1,
    placeName: "Cà phê Mê Linh",
    address: "Tà Nung",
    note: "Ngắm đồi chè",
    startTime: new Date(Date.UTC(1970, 0, 1, 8, 30)),
    endTime: new Date(Date.UTC(1970, 0, 1, 10, 30)),
    createdByMemberId: "mem-creator-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByMember: {
      id: "mem-creator-1",
      displayName: "Lan (Creator)",
    },
    expenses: [],
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
      mockCreatorMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );
    vi.mocked(prisma.itineraryItem.findFirst).mockResolvedValue(
      mockDbItem as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.findFirst>>
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });
  });

  describe("PATCH /api/trips/[id]/itinerary/[itemId]", () => {
    it("trả về 401 khi chưa đăng nhập", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ placeName: "Địa điểm mới" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });

      expect(res.status).toBe(401);
    });

    it("trả về 404 khi tripId hoặc itemId không phải UUID hợp lệ", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${INVALID_UUID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ placeName: "Địa điểm mới" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: INVALID_UUID }),
      });

      expect(res.status).toBe(404);
    });

    it("trả về 400 khi chuyến đi đã đóng hoặc không ở trạng thái ACTIVE (ví dụ: SETTLING)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValue({
        ...mockDbTrip,
        status: "SETTLING",
      } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ placeName: "Sửa tên" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.message).toContain("trạng thái lên kế hoạch");
    });

    it("trả về 404 khi không tìm thấy item hoặc item thuộc về trip khác (IDOR protection)", async () => {
      vi.mocked(prisma.itineraryItem.findFirst).mockResolvedValue(null);

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ placeName: "Sửa tên" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error.message).toContain("Không tìm thấy điểm dừng");
    });

    it("trả về 403 khi thành viên thường cố sửa điểm dừng do người khác tạo", async () => {
      // Caller là mockOtherMember (không phải Host, không phải Creator)
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockOtherMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );
      vi.mocked(prisma.itineraryItem.findFirst).mockResolvedValue(
        mockDbItem as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ placeName: "Sửa tên trái phép" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.message).toContain("Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền chỉnh sửa.");
    });

    it("trả về 400 khi body rỗng", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({}),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("trả về 400 khi ngày mới nằm ngoài khoảng thời gian chuyến đi", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ dayDate: "2026-11-26" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.message).toContain("phải nằm trong khoảng thời gian chuyến đi");
    });

    it("trả về 400 khi sửa endTime dẫn đến endTime < startTime hiện tại của DB", async () => {
      // startTime hiện tại trong DB là 08:30. Client gửi endTime = 08:00
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ endTime: "08:00" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.message).toContain("Giờ kết thúc không thể trước giờ bắt đầu.");
    });

    it("chỉnh sửa thành công khi người tạo tự sửa điểm dừng của mình", async () => {
      const mockUpdated = {
        ...mockDbItem,
        placeName: "Cà phê Mê Linh Garden (Đã sửa)",
        startTime: new Date(Date.UTC(1970, 0, 1, 9, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 11, 0)),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.itineraryItem.update).mockResolvedValue(
        mockUpdated as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.update>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            placeName: "Cà phê Mê Linh Garden (Đã sửa)",
            startTime: "09:00",
            endTime: "11:00",
          }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.placeName).toBe("Cà phê Mê Linh Garden (Đã sửa)");
      expect(json.data.startTime).toBe("09:00");
      expect(json.data.endTime).toBe("11:00");
    });

    it("chỉnh sửa thành công khi Trưởng nhóm (HOST) sửa điểm dừng của người khác", async () => {
      // Caller là Host
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const mockUpdated = {
        ...mockDbItem,
        note: "Host bổ sung ghi chú di chuyển",
      };

      vi.mocked(prisma.itineraryItem.update).mockResolvedValue(
        mockUpdated as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.update>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        {
          method: "PATCH",
          body: JSON.stringify({ note: "Host bổ sung ghi chú di chuyển" }),
        }
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.note).toBe("Host bổ sung ghi chú di chuyển");
    });
  });

  describe("DELETE /api/trips/[id]/itinerary/[itemId]", () => {
    it("trả về 401 khi chưa đăng nhập", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });

      expect(res.status).toBe(401);
    });

    it("trả về 404 khi itemId không phải UUID hợp lệ", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${INVALID_UUID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: INVALID_UUID }),
      });

      expect(res.status).toBe(404);
    });

    it("trả về 400 khi chuyến đi không ở trạng thái ACTIVE (ví dụ: COMPLETED)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValue({
        ...mockDbTrip,
        status: "COMPLETED",
      } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.message).toContain("trạng thái lên kế hoạch");
    });

    it("trả về 404 khi không tìm thấy item hoặc item thuộc chuyến đi khác", async () => {
      vi.mocked(prisma.itineraryItem.findFirst).mockResolvedValue(null);

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
    });

    it("trả về 403 khi thành viên thường cố xóa điểm dừng của người khác", async () => {
      // Caller là mockOtherMember
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockOtherMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );
      vi.mocked(prisma.itineraryItem.findFirst).mockResolvedValue(
        mockDbItem as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.message).toContain("Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền xóa.");
    });

    it("xóa thành công khi chính người tạo xóa điểm dừng của mình", async () => {
      vi.mocked(prisma.itineraryItem.delete).mockResolvedValue(
        mockDbItem as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.delete>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain("Đã xóa địa điểm khỏi lịch trình.");
      expect(prisma.itineraryItem.delete).toHaveBeenCalledWith({ where: { id: VALID_ITEM_ID } });
    });

    it("xóa thành công khi Trưởng nhóm (HOST) xóa điểm dừng của người khác", async () => {
      // Caller là Host
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );
      vi.mocked(prisma.itineraryItem.delete).mockResolvedValue(
        mockDbItem as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.delete>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/itinerary/${VALID_ITEM_ID}`,
        { method: "DELETE" }
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, itemId: VALID_ITEM_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.itineraryItem.delete).toHaveBeenCalledWith({ where: { id: VALID_ITEM_ID } });
    });
  });
});
