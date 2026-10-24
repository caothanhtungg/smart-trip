import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { requireAuth, UnauthorizedError, type AuthUser, type AuthSession } from "@/lib/auth/session";
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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    tripMember: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("/api/trips Route Handlers", () => {
  const mockUser: AuthUser = {
    id: "usr-current-123",
    email: "creator@example.com",
    name: "Nguyễn Văn A",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: "https://example.com/avatar.jpg",
    displayName: "Văn A",
    bankBin: "970436",
    bankAccountNo: "iv:tag:cipher",
    bankAccountName: "NGUYEN VAN A",
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/trips", () => {
    it("returns 401 when user is not logged in", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const req = new Request("http://localhost:3000/api/trips");
      const res = await GET(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(prisma.trip.findMany).not.toHaveBeenCalled();
    });

    it("queries trips strictly for current session user and ignores client userId in query", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const mockDbTrips = [
        {
          id: "trip-1",
          name: "Đà Lạt 3N2Đ",
          destination: "Lâm Đồng",
          startDate: new Date("2026-11-20"),
          endDate: new Date("2026-11-22"),
          budgetAmount: 10000000,
          status: "ACTIVE" as const,
          inviteCode: "DL3N2D-TRIP99",
          createdAt: new Date("2026-10-01T00:00:00Z"),
          updatedAt: new Date("2026-10-15T00:00:00Z"),
          members: [
            {
              id: "mem-1",
              userId: "usr-current-123",
              displayName: "Văn A",
              role: "HOST" as const,
              status: "ACTIVE" as const,
              joinOrder: 1,
              user: { image: "https://example.com/avatar.jpg" },
            },
            {
              id: "mem-2",
              userId: "usr-other-456",
              displayName: "Tuấn B",
              role: "MEMBER" as const,
              status: "ACTIVE" as const,
              joinOrder: 2,
              user: { image: null },
            },
          ],
        },
      ];

      vi.mocked(prisma.trip.findMany).mockResolvedValueOnce(
        mockDbTrips as unknown as Awaited<ReturnType<typeof prisma.trip.findMany>>
      );

      // Thử truyền userId giả mạo vào query param
      const req = new Request("http://localhost:3000/api/trips?userId=hacker-user-id&tab=active");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe("trip-1");
      expect(body.data[0].myRole).toBe("HOST");
      expect(body.data[0].memberCount).toBe(2);
      expect(body.data[0].members[0].isCurrentUser).toBe(true);
      expect(body.data[0].members[1].isCurrentUser).toBe(false);

      // BẢO MẬT: Kiểm tra Prisma được gọi với đúng userId từ session, không phải từ query
      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: {
              some: {
                userId: "usr-current-123",
                status: "ACTIVE",
              },
            },
            status: { in: ["ACTIVE", "SETTLING"] },
          },
        })
      );
    });

    it("applies status filter for completed tab and order by departure", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      vi.mocked(prisma.trip.findMany).mockResolvedValueOnce([]);

      const req = new Request("http://localhost:3000/api/trips?tab=completed&sortBy=departure");
      const res = await GET(req);
      expect(res.status).toBe(200);

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: {
              some: {
                userId: "usr-current-123",
                status: "ACTIVE",
              },
            },
            status: { in: ["COMPLETED"] },
          },
          orderBy: { startDate: "asc" },
        })
      );
    });
  });

  describe("POST /api/trips", () => {
    it("returns 401 when user is not logged in", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Chuyến đi mới",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns 400 VALIDATION_ERROR when required fields are missing or invalid", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A", // Quá ngắn (< 2 ký tự)
          startDate: "invalid-date",
          endDate: "2026-11-01",
          budgetAmount: -500, // Âm
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details.length).toBeGreaterThanOrEqual(3);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns 400 VALIDATION_ERROR when endDate is earlier than startDate", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Chuyến đi Nha Trang",
          startDate: "2026-12-10",
          endDate: "2026-12-05", // endDate < startDate
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].message).toMatch(/Ngày kết thúc phải diễn ra vào hoặc sau/);
    });

    it("atomically creates trip and assigns creator as HOST with join_order 1", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const createdTripId = "111e4567-e89b-12d3-a456-426614174000";
      const createdMemberId = "222e4567-e89b-12d3-a456-426614174000";

      // Mock transaction execution
      type TransactionCallback = (tx: unknown) => Promise<unknown>;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        const fn = callback as TransactionCallback;
        const tx = {
          trip: {
            findUnique: vi.fn().mockResolvedValue(null), // Mã mời chưa trùng
            create: vi.fn().mockResolvedValue({
              id: createdTripId,
              name: "Hà Giang Mùa Hoa Tam Giác Mạch",
              destination: "Hà Giang",
              startDate: new Date("2026-10-25"),
              endDate: new Date("2026-10-28"),
              budgetAmount: 8000000,
              status: "ACTIVE",
              inviteCode: "HG2026-ABCDEF",
              createdAt: new Date("2026-10-20T00:00:00Z"),
              updatedAt: new Date("2026-10-20T00:00:00Z"),
            }),
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: "usr-current-123",
              name: "Nguyễn Văn A",
              displayName: "Văn A",
              bankBin: "970436",
              bankAccountNo: "iv:tag:cipher",
              bankAccountName: "NGUYEN VAN A",
              bankAccountKeyVersion: 1,
            }),
          },
          tripMember: {
            create: vi.fn().mockResolvedValue({
              id: createdMemberId,
              tripId: createdTripId,
              userId: "usr-current-123",
              displayName: "Văn A",
              role: "HOST",
              status: "ACTIVE",
              joinOrder: 1,
            }),
          },
        };

        return fn(tx) as ReturnType<typeof prisma.$transaction>;
      });

      // Thử gửi payload có kèm fake userId và role từ client để kiểm tra tính bỏ qua
      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Hà Giang Mùa Hoa Tam Giác Mạch",
          destination: "Hà Giang",
          startDate: "2026-10-25",
          endDate: "2026-10-28",
          budgetAmount: 8000000,
          userId: "fake-user-id", // Cố tình truyền userId giả
          role: "MEMBER", // Cố tình truyền role giả
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe("Tạo chuyến đi thành công.");
      expect(body.data.id).toBe(createdTripId);
      expect(body.data.host).toEqual({
        memberId: createdMemberId,
        userId: "usr-current-123", // Lấy từ session, không phải fake-user-id
        displayName: "Văn A",
        role: "HOST", // Luôn là HOST
      });
    });

    it("fails closed and rolls back when transaction encounters an error", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      // Giả lập lỗi cơ sở dữ liệu trong transaction
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(
        new Error("Database deadlock / rollback")
      );

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Hà Giang Mùa Hoa Tam Giác Mạch",
          destination: "Hà Giang",
          startDate: "2026-10-25",
          endDate: "2026-10-28",
          budgetAmount: 8000000,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.");
      // Không để lộ lỗi deadlock hay stack trace
      expect(JSON.stringify(body)).not.toContain("deadlock");
    });

    it("generates invite code with 1 attempt when there is no collision on first try", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const findUniqueTripMock = vi.fn().mockResolvedValue(null);
      const createTripMock = vi.fn().mockResolvedValue({
        id: "trip-uuid-1",
        name: "Quy Nhơn 4N3Đ",
        destination: "Quy Nhơn",
        startDate: new Date("2026-11-10"),
        endDate: new Date("2026-11-14"),
        budgetAmount: 5000000,
        status: "ACTIVE",
        inviteCode: "QN2026-ABCDEF",
        createdAt: new Date("2026-10-20T00:00:00Z"),
        updatedAt: new Date("2026-10-20T00:00:00Z"),
      });

      type TransactionCallback = (tx: unknown) => Promise<unknown>;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        const fn = callback as TransactionCallback;
        const tx = {
          trip: {
            findUnique: findUniqueTripMock,
            create: createTripMock,
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: "usr-current-123",
              name: "Nguyễn Văn A",
              displayName: "Văn A",
              bankBin: null,
              bankAccountNo: null,
              bankAccountName: null,
              bankAccountKeyVersion: 1,
            }),
          },
          tripMember: {
            create: vi.fn().mockResolvedValue({
              id: "mem-uuid-1",
              tripId: "trip-uuid-1",
              userId: "usr-current-123",
              displayName: "Văn A",
              role: "HOST",
              status: "ACTIVE",
              joinOrder: 1,
            }),
          },
        };
        return fn(tx) as ReturnType<typeof prisma.$transaction>;
      });

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Quy Nhơn 4N3Đ",
          destination: "Quy Nhơn",
          startDate: "2026-11-10",
          endDate: "2026-11-14",
          budgetAmount: 5000000,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(findUniqueTripMock).toHaveBeenCalledTimes(1);
      expect(createTripMock).toHaveBeenCalledTimes(1);
    });

    it("retries and succeeds when invite code collides on first attempt but is free on second attempt", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      // Lần 1: trùng mã (có existing trip)
      // Lần 2: không trùng (null)
      const findUniqueTripMock = vi
        .fn()
        .mockResolvedValueOnce({ id: "existing-trip-id", inviteCode: "COLLIDED-CODE" })
        .mockResolvedValueOnce(null);

      const createTripMock = vi.fn().mockResolvedValue({
        id: "trip-uuid-2",
        name: "Phú Quốc 3N2Đ",
        destination: "Kiên Giang",
        startDate: new Date("2026-11-15"),
        endDate: new Date("2026-11-18"),
        budgetAmount: 12000000,
        status: "ACTIVE",
        inviteCode: "PQ2026-SECOND",
        createdAt: new Date("2026-10-20T00:00:00Z"),
        updatedAt: new Date("2026-10-20T00:00:00Z"),
      });

      type TransactionCallback = (tx: unknown) => Promise<unknown>;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        const fn = callback as TransactionCallback;
        const tx = {
          trip: {
            findUnique: findUniqueTripMock,
            create: createTripMock,
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: "usr-current-123",
              name: "Nguyễn Văn A",
              displayName: "Văn A",
            }),
          },
          tripMember: {
            create: vi.fn().mockResolvedValue({
              id: "mem-uuid-2",
              tripId: "trip-uuid-2",
              userId: "usr-current-123",
              displayName: "Văn A",
              role: "HOST",
              status: "ACTIVE",
              joinOrder: 1,
            }),
          },
        };
        return fn(tx) as ReturnType<typeof prisma.$transaction>;
      });

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Phú Quốc 3N2Đ",
          destination: "Kiên Giang",
          startDate: "2026-11-15",
          endDate: "2026-11-18",
          budgetAmount: 12000000,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      // Đã gọi kiểm tra đúng 2 lần (lần 1 trùng, lần 2 thành công)
      expect(findUniqueTripMock).toHaveBeenCalledTimes(2);
      expect(createTripMock).toHaveBeenCalledTimes(1);
    });

    it("stops after exactly 5 attempts and returns safe error when code collides all 5 times", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      // Cả 5 lần đều trùng mã
      const findUniqueTripMock = vi
        .fn()
        .mockResolvedValue({ id: "collided-trip", inviteCode: "ALWAYS-EXISTS" });
      const createTripMock = vi.fn();

      type TransactionCallback = (tx: unknown) => Promise<unknown>;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        const fn = callback as TransactionCallback;
        const tx = {
          trip: {
            findUnique: findUniqueTripMock,
            create: createTripMock,
          },
          user: {
            findUnique: vi.fn(),
          },
          tripMember: {
            create: vi.fn(),
          },
        };
        return fn(tx) as ReturnType<typeof prisma.$transaction>;
      });

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sapa 2N1Đ",
          destination: "Lào Cai",
          startDate: "2026-12-01",
          endDate: "2026-12-03",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVITE_CODE_COLLISION");
      expect(body.error.message).toMatch(/Không thể tạo mã mời duy nhất/);

      // BẢO MẬT & CHẶN VÒNG LẶP:
      // Kiểm tra chỉ thử đúng 5 lần, không rơi vào vòng lặp vô tận
      expect(findUniqueTripMock).toHaveBeenCalledTimes(5);
      // Chưa bao giờ gọi tạo trip
      expect(createTripMock).not.toHaveBeenCalled();
      // Không để lộ lỗi nội bộ database
      expect(JSON.stringify(body)).not.toContain("ALWAYS-EXISTS");
    });

    it("does not mistake unrelated database errors as invite code collisions", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      // Lỗi database không liên quan đến uniqueness (ví dụ lỗi foreign key P2003 hoặc connection timeout)
      const dbError = new Error("Connection pool timeout / network dropped");
      (dbError as unknown as { code: string }).code = "P2003";

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(dbError);

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sapa 2N1Đ",
          startDate: "2026-12-01",
          endDate: "2026-12-03",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.");
      // Không bị nhầm thành INVITE_CODE_COLLISION
      expect(body.error.code).not.toBe("INVITE_CODE_COLLISION");
      // Chỉ thử 1 lần duy nhất, không vô cớ retry
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("handles race condition where code collides on insert by retrying transaction", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const p2002Error = new Error("Unique constraint failed on the fields: (`invite_code`)");
      (p2002Error as unknown as { code: string; meta: { target: string[] } }).code = "P2002";
      (p2002Error as unknown as { code: string; meta: { target: string[] } }).meta = {
        target: ["invite_code"],
      };

      type TransactionCallback = (tx: unknown) => Promise<unknown>;
      // Lần 1: Bị race condition P2002 khi insert
      // Lần 2: Thành công
      vi.mocked(prisma.$transaction)
        .mockRejectedValueOnce(p2002Error)
        .mockImplementationOnce(async (callback: unknown) => {
          const fn = callback as TransactionCallback;
          const tx = {
            trip: {
              findUnique: vi.fn().mockResolvedValue(null),
              create: vi.fn().mockResolvedValue({
                id: "trip-race-resolved",
                name: "Đà Nẵng Hội An",
                destination: "Đà Nẵng",
                startDate: new Date("2026-12-10"),
                endDate: new Date("2026-12-15"),
                budgetAmount: 15000000,
                status: "ACTIVE",
                inviteCode: "DN2026-RETRY1",
                createdAt: new Date("2026-10-20T00:00:00Z"),
                updatedAt: new Date("2026-10-20T00:00:00Z"),
              }),
            },
            user: {
              findUnique: vi.fn().mockResolvedValue({
                id: "usr-current-123",
                name: "Nguyễn Văn A",
                displayName: "Văn A",
              }),
            },
            tripMember: {
              create: vi.fn().mockResolvedValue({
                id: "mem-race-resolved",
                tripId: "trip-race-resolved",
                userId: "usr-current-123",
                displayName: "Văn A",
                role: "HOST",
                status: "ACTIVE",
                joinOrder: 1,
              }),
            },
          };
          return fn(tx) as ReturnType<typeof prisma.$transaction>;
        });

      const req = new Request("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Đà Nẵng Hội An",
          destination: "Đà Nẵng",
          startDate: "2026-12-10",
          endDate: "2026-12-15",
          budgetAmount: 15000000,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe("trip-race-resolved");
    });
  });
});
