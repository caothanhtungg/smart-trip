import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET,
  POST,
  isDisplayNameUniqueViolation,
  isJoinOrderUniqueViolation,
} from "./route";
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
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

describe("/api/trips/[id]/members Route Handlers", () => {
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

  const mockHostMember = {
    id: "mem-host-1",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Host)",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockRegularMember = {
    id: "mem-regular-2",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Member)",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date("2026-10-02T00:00:00Z"),
    leftAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });
  });

  describe("Authentication & Authorization (Shared)", () => {
    it("returns 401 UNAUTHORIZED when unauthenticated for GET", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED when unauthenticated for POST", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 NOT_FOUND when tripId is not a valid UUID format (GET)", async () => {
      const res = await GET(new Request(`http://localhost:3000/api/trips/${INVALID_UUID}/members`), {
        params: Promise.resolve({ id: INVALID_UUID }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 NOT_FOUND when tripId is not a valid UUID format (POST)", async () => {
      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${INVALID_UUID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài" }),
        }),
        {
          params: Promise.resolve({ id: INVALID_UUID }),
        }
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 NOT_FOUND when trip does not exist in database", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 FORBIDDEN when user has no membership in the trip", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Bạn không phải là thành viên của chuyến đi này.");
    });

    it("returns 403 FORBIDDEN when user membership is LEFT", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      // requireTripMembership queries findFirst with status: 'ACTIVE', so a LEFT member returns null
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 FORBIDDEN when a regular MEMBER attempts to POST a new member (Host only)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockRegularMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Thao tác này chỉ dành cho Trưởng nhóm.");
    });
  });

  describe("GET /api/trips/[id]/members", () => {
    it("returns list of members including ACTIVE and LEFT with mapped fields", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const mockDbMembers = [
        {
          id: "mem-1",
          tripId: VALID_TRIP_ID,
          userId: "usr-current-123",
          displayName: "Lan (Host)",
          role: "HOST" as const,
          status: "ACTIVE" as const,
          joinOrder: 1,
          joinedAt: new Date("2026-10-01T00:00:00Z"),
          leftAt: null,
          user: { image: "https://example.com/lan.jpg" },
        },
        {
          id: "mem-2",
          tripId: VALID_TRIP_ID,
          userId: null,
          displayName: "Bác tài",
          role: "MEMBER" as const,
          status: "ACTIVE" as const,
          joinOrder: 2,
          joinedAt: new Date("2026-10-02T00:00:00Z"),
          leftAt: null,
          user: null,
        },
        {
          id: "mem-3",
          tripId: VALID_TRIP_ID,
          userId: "usr-other-456",
          displayName: "Hùng Đã Rời",
          role: "MEMBER" as const,
          status: "LEFT" as const,
          joinOrder: 3,
          joinedAt: new Date("2026-10-03T00:00:00Z"),
          leftAt: new Date("2026-10-05T00:00:00Z"),
          user: { image: null },
        },
      ];

      vi.mocked(prisma.tripMember.findMany).mockResolvedValueOnce(
        mockDbMembers as unknown as Awaited<ReturnType<typeof prisma.tripMember.findMany>>
      );

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(3);

      // Check first member (current user host)
      expect(body.data[0].id).toBe("mem-1");
      expect(body.data[0].displayName).toBe("Lan (Host)");
      expect(body.data[0].isCurrentUser).toBe(true);
      expect(body.data[0].isHost).toBe(true);
      expect(body.data[0].isPlaceholder).toBe(false);
      expect(body.data[0].avatarUrl).toBe("https://example.com/lan.jpg");

      // Check second member (placeholder)
      expect(body.data[1].id).toBe("mem-2");
      expect(body.data[1].displayName).toBe("Bác tài");
      expect(body.data[1].isCurrentUser).toBe(false);
      expect(body.data[1].isHost).toBe(false);
      expect(body.data[1].isPlaceholder).toBe(true);
      expect(body.data[1].userId).toBeNull();

      // Check third member (LEFT member)
      expect(body.data[2].id).toBe("mem-3");
      expect(body.data[2].status).toBe("LEFT");
      expect(body.data[2].leftAt).toBe("2026-10-05T00:00:00.000Z");

      // BẢO MẬT: Tuyệt đối không để lộ STK, bankBin, password
      const jsonStr = JSON.stringify(body);
      expect(jsonStr).not.toContain("bankAccountNo");
      expect(jsonStr).not.toContain("bankBin");
      expect(jsonStr).not.toContain("cipher");
    });
  });

  describe("POST /api/trips/[id]/members", () => {
    it("allows ACTIVE HOST to create placeholder member with joinOrder = max + 1", async () => {
      // 1. requireTripMembership check
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>) // in requireTripMembership
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>); // in transaction

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // caller is host
        .mockResolvedValueOnce(null) // check duplicate name -> not found
        .mockResolvedValueOnce({ joinOrder: 4 } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // max joinOrder

      const createdMember = {
        id: "mem-new-5",
        tripId: VALID_TRIP_ID,
        userId: null,
        displayName: "Bác tài Xế",
        role: "MEMBER" as const,
        status: "ACTIVE" as const,
        joinOrder: 5,
        joinedAt: new Date("2026-10-20T00:00:00Z"),
        leftAt: null,
      };

      vi.mocked(prisma.tripMember.create).mockResolvedValueOnce(
        createdMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.create>>
      );

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "   Bác tài Xế   " }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe("mem-new-5");
      expect(body.data.displayName).toBe("Bác tài Xế");
      expect(body.data.joinOrder).toBe(5);
      expect(body.data.isPlaceholder).toBe(true);
      expect(body.data.isHost).toBe(false);
      expect(body.data.userId).toBeNull();
      expect(body.data.role).toBe("MEMBER");
      expect(body.data.status).toBe("ACTIVE");

      // Kiểm tra gọi khóa dòng SELECT id FROM trips ... FOR UPDATE
      expect(prisma.$queryRaw).toHaveBeenCalled();
      // Kiểm tra gọi create với đúng dữ liệu
      expect(prisma.tripMember.create).toHaveBeenCalledWith({
        data: {
          tripId: VALID_TRIP_ID,
          displayName: "Bác tài Xế",
          userId: null,
          role: "MEMBER",
          status: "ACTIVE",
          joinOrder: 5,
        },
        select: expect.any(Object),
      });
    });

    it("returns 400 VALIDATION_ERROR when displayName is empty or < 2 characters", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: " A " }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].message).toContain("ít nhất 2 ký tự");
    });

    it("returns 400 VALIDATION_ERROR when displayName exceeds 100 characters", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const longName = "a".repeat(101);
      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: longName }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].message).toContain("không được vượt quá 100 ký tự");
    });

    it("returns 400 VALIDATION_ERROR when payload contains forbidden fields", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài", role: "HOST" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 BAD_REQUEST when trip status is not ACTIVE (e.g. SETTLING)", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce({
          ...mockDbTrip,
          status: "SETTLING",
        } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce({
          ...mockDbTrip,
          status: "SETTLING",
        } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toContain("lên kế hoạch");
    });

    it("returns 409 CONFLICT when displayName already exists in trip (case-insensitive check)", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // caller is host
        .mockResolvedValueOnce({ id: "mem-existing" } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // duplicate found

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "lan (host)" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("Tên hiển thị này đã được sử dụng");
    });

    it("returns 409 CONFLICT when DB throws unique constraint on displayName (P2002)", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const p2002NameError = new Error("Unique constraint failed on the fields: (`display_name`)");
      Object.assign(p2002NameError, {
        code: "P2002",
        meta: { target: ["trip_id", "display_name"] },
      });

      vi.mocked(prisma.tripMember.create).mockRejectedValueOnce(p2002NameError);

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("Tên hiển thị này đã được sử dụng");
    });

    it("returns 409 CONFLICT when DB throws unique constraint on joinOrder (P2002)", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const p2002JoinOrderError = new Error("Unique constraint failed on the fields: (`join_order`)");
      Object.assign(p2002JoinOrderError, {
        code: "P2002",
        meta: { target: ["trip_id", "join_order"] },
      });

      vi.mocked(prisma.tripMember.create).mockRejectedValueOnce(p2002JoinOrderError);

      const res = await POST(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("xung đột thứ tự tham gia");
    });
  });

  describe("Helper Functions", () => {
    it("isDisplayNameUniqueViolation correctly identifies name constraints and rejects others", () => {
      expect(
        isDisplayNameUniqueViolation({
          code: "P2002",
          meta: { target: ["trip_id", "display_name"] },
        })
      ).toBe(true);

      expect(
        isDisplayNameUniqueViolation({
          code: "23505",
          meta: { constraint: "trip_members_trip_id_display_name_key" },
        })
      ).toBe(true);

      expect(
        isDisplayNameUniqueViolation({
          name: "DriverAdapterError",
          cause: { code: "23505", constraint: "trip_members_trip_id_display_name_key" },
        })
      ).toBe(true);

      expect(
        isDisplayNameUniqueViolation({
          code: "P2002",
          meta: { target: ["trip_id", "join_order"] },
        })
      ).toBe(false);

      expect(isDisplayNameUniqueViolation(null)).toBe(false);
      expect(isDisplayNameUniqueViolation(new Error("Generic"))).toBe(false);
    });

    it("isJoinOrderUniqueViolation correctly identifies join_order constraints and rejects others", () => {
      expect(
        isJoinOrderUniqueViolation({
          code: "P2002",
          meta: { target: ["trip_id", "join_order"] },
        })
      ).toBe(true);

      expect(
        isJoinOrderUniqueViolation({
          code: "23505",
          meta: { constraint: "trip_members_trip_id_join_order_key" },
        })
      ).toBe(true);

      expect(
        isJoinOrderUniqueViolation({
          code: "P2002",
          meta: { target: ["trip_id", "display_name"] },
        })
      ).toBe(false);

      expect(isJoinOrderUniqueViolation(null)).toBe(false);
    });
  });
});
