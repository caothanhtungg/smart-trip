import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, isTripDateConstraintViolation } from "./route";
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
      update: vi.fn(),
    },
    tripMember: {
      findFirst: vi.fn(),
    },
  },
}));

describe("/api/trips/[id] Route Handlers", () => {
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
    inviteCode: "DL3N2D-TRIP99",
    createdAt: new Date("2026-10-01T00:00:00Z"),
    updatedAt: new Date("2026-10-15T00:00:00Z"),
    members: [
      {
        id: "mem-host-1",
        userId: "usr-current-123",
        displayName: "Lan",
        role: "HOST" as const,
        status: "ACTIVE" as const,
        joinOrder: 1,
        user: { image: "https://example.com/lan.jpg" },
      },
      {
        id: "mem-guest-2",
        userId: null,
        displayName: "Bác Tài xế",
        role: "MEMBER" as const,
        status: "ACTIVE" as const,
        joinOrder: 2,
        user: null,
      },
    ],
  };

  const mockHostMember = {
    id: "mem-host-1",
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date(),
    leftAt: null,
    bankBin: "970436",
    bankAccountNo: "iv:tag:cipher",
    bankAccountName: "NGUYEN THI LAN",
    bankAccountKeyVersion: 1,
  };

  const mockNormalMember = {
    ...mockHostMember,
    role: "MEMBER" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication & ID Validation (Shared)", () => {
    it("returns 401 UNAUTHORIZED when unauthenticated for GET", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED when unauthenticated for PATCH", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên mới" }),
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
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const res = await GET(new Request(`http://localhost:3000/api/trips/${INVALID_UUID}`), {
        params: Promise.resolve({ id: INVALID_UUID }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 NOT_FOUND when tripId is not a valid UUID format (PATCH)", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${INVALID_UUID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên mới" }),
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
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
      expect(body.error.message).toBe("Không tìm thấy chuyến đi.");
    });

    it("returns 403 FORBIDDEN when user has no membership in the trip", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      // Trip exists
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      // Member not found
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Bạn không phải là thành viên của chuyến đi này.");
    });

    it("returns 403 FORBIDDEN when user membership status is LEFT", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      // findFirst queries with status: 'ACTIVE', so a LEFT member returns null
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Bạn không phải là thành viên của chuyến đi này.");
    });
  });

  describe("GET /api/trips/[id]", () => {
    it("allows ACTIVE MEMBER to view trip details and active members list", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      // 1st findUnique for requireTripMembership
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        // 2nd findUnique for fetching trip with members relation
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockNormalMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(VALID_TRIP_ID);
      expect(body.data.name).toBe("Đà Lạt 3N2Đ");
      expect(body.data.startDate).toBe("2026-11-20");
      expect(body.data.endDate).toBe("2026-11-23");
      expect(body.data.myRole).toBe("MEMBER");
      expect(body.data.myMemberId).toBe("mem-host-1");
      expect(body.data.memberCount).toBe(2);
      expect(body.data.members).toHaveLength(2);
      expect(body.data.members[0].isCurrentUser).toBe(true);
      expect(body.data.members[1].isNoAccount).toBe(true);
      expect(body.data.members[1].userId).toBeNull();
    });

    it("allows ACTIVE HOST to view trip details with myRole = HOST", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.myRole).toBe("HOST");
      expect(body.data.members[0].isHost).toBe(true);
    });

    it("never exposes bankAccountNo, bankBin, password, or auth tokens in GET response", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await GET(new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`), {
        params: Promise.resolve({ id: VALID_TRIP_ID }),
      });

      const body = await res.json();
      const jsonStr = JSON.stringify(body);
      expect(jsonStr).not.toContain("bankAccountNo");
      expect(jsonStr).not.toContain("bankBin");
      expect(jsonStr).not.toContain("bankAccountKeyVersion");
      expect(jsonStr).not.toContain("password");
      expect(jsonStr).not.toContain("accessToken");
      expect(jsonStr).not.toContain("refreshToken");
    });
  });

  describe("PATCH /api/trips/[id]", () => {
    it("returns 403 FORBIDDEN when ACTIVE MEMBER attempts to PATCH (host only)", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockNormalMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên chuyến mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Thao tác này chỉ dành cho Trưởng nhóm.");
      expect(prisma.trip.update).not.toHaveBeenCalled();
    });

    it("allows ACTIVE HOST to update name, destination, and budgetAmount", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const updatedDbTrip = {
        ...mockDbTrip,
        name: "Đà Lạt Săn Mây 4N3Đ",
        destination: "Cầu Đất",
        budgetAmount: 15000000,
        updatedAt: new Date("2026-10-20T21:00:00Z"),
      };
      vi.mocked(prisma.trip.update).mockResolvedValueOnce(
        updatedDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.update>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Đà Lạt Săn Mây 4N3Đ",
            destination: "Cầu Đất",
            budgetAmount: 15000000,
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe("Cập nhật thông tin chuyến đi thành công.");
      expect(body.data.name).toBe("Đà Lạt Săn Mây 4N3Đ");
      expect(body.data.destination).toBe("Cầu Đất");
      expect(body.data.budgetAmount).toBe(15000000);

      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: VALID_TRIP_ID },
        data: {
          name: "Đà Lạt Săn Mây 4N3Đ",
          destination: "Cầu Đất",
          budgetAmount: 15000000,
        },
      });
    });

    it("allows ACTIVE HOST to clear budgetAmount by setting it to null", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const updatedDbTrip = {
        ...mockDbTrip,
        budgetAmount: null,
      };
      vi.mocked(prisma.trip.update).mockResolvedValueOnce(
        updatedDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.update>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetAmount: null,
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.budgetAmount).toBeNull();
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: VALID_TRIP_ID },
        data: {
          budgetAmount: null,
        },
      });
    });

    it("allows updating dates when both dates are provided and endDate >= startDate", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const updatedDbTrip = {
        ...mockDbTrip,
        startDate: new Date("2026-12-01T00:00:00Z"),
        endDate: new Date("2026-12-05T00:00:00Z"),
      };
      vi.mocked(prisma.trip.update).mockResolvedValueOnce(
        updatedDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.update>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-12-01",
            endDate: "2026-12-05",
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.startDate).toBe("2026-12-01");
      expect(body.data.endDate).toBe("2026-12-05");
    });

    it("allows updating only startDate when newStart <= existingTrip.endDate", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      // existingTrip has endDate: 2026-11-23
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const updatedDbTrip = {
        ...mockDbTrip,
        startDate: new Date("2026-11-21T00:00:00Z"),
      };
      vi.mocked(prisma.trip.update).mockResolvedValueOnce(
        updatedDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.update>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-11-21",
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.startDate).toBe("2026-11-21");
    });

    it("allows updating only endDate when newEnd >= existingTrip.startDate", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      // existingTrip has startDate: 2026-11-20
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const updatedDbTrip = {
        ...mockDbTrip,
        endDate: new Date("2026-11-25T00:00:00Z"),
      };
      vi.mocked(prisma.trip.update).mockResolvedValueOnce(
        updatedDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.update>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endDate: "2026-11-25",
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.endDate).toBe("2026-11-25");
    });

    it("returns 400 VALIDATION_ERROR when both dates are provided and endDate < startDate", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-12-10",
            endDate: "2026-12-05",
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].message).toMatch(/Ngày kết thúc phải diễn ra vào hoặc sau/);
    });

    it("returns 400 VALIDATION_ERROR when new startDate is later than existing endDate in DB", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      // existingTrip has endDate: 2026-11-23
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-11-25", // > 2026-11-23
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toMatch(/Ngày khởi hành không thể diễn ra sau ngày kết thúc/);
    });

    it("returns 400 VALIDATION_ERROR when new endDate is earlier than existing startDate in DB", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      // existingTrip has startDate: 2026-11-20
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endDate: "2026-11-15", // < 2026-11-20
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toMatch(/Ngày kết thúc không thể diễn ra trước ngày khởi hành/);
    });

    it("returns 400 VALIDATION_ERROR when budgetAmount is negative or exceeds limit", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetAmount: -100,
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when payload is empty {}", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].message).toMatch(/Vui lòng cung cấp ít nhất một trường/);
    });

    it("returns 400 VALIDATION_ERROR when payload contains forbidden fields", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Tên hợp lệ",
            id: "fake-id",
            userId: "fake-user-id",
            role: "MEMBER",
            inviteCode: "NEW-CODE-9999",
            status: "COMPLETED",
          }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(prisma.trip.update).not.toHaveBeenCalled();
    });

    it("returns 400 BAD_REQUEST when trying to PATCH a COMPLETED trip", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      const completedTrip = {
        ...mockDbTrip,
        status: "COMPLETED" as const,
      };
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        completedTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Sửa chuyến đã xong" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toMatch(/Chuyến đi đã hoàn tất hoặc lưu trữ/);
    });

    it("returns 400 BAD_REQUEST when trying to PATCH an ARCHIVED trip", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      const archivedTrip = {
        ...mockDbTrip,
        status: "ARCHIVED" as const,
      };
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        archivedTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Sửa chuyến đã lưu trữ" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toMatch(/Chuyến đi đã hoàn tất hoặc lưu trữ/);
    });

    it("returns 500 INTERNAL_SERVER_ERROR safe response when database throws an unexpected error", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );
      vi.mocked(prisma.trip.update).mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.");
      expect(JSON.stringify(body)).not.toContain("connection lost");
    });

    it("maps trips_end_date_gte_start_date CHECK constraint violation (P2004) to HTTP 409 CONFLICT", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      // Mô phỏng lỗi P2004 thực tế từ Prisma adapter PostgreSQL khi vi phạm CHECK constraint
      const p2004Error = new Error(
        'A constraint failed on the database: new row for relation "trips" violates check constraint "trips_end_date_gte_start_date"'
      );
      (p2004Error as unknown as {
        code: string;
        meta: { constraint: string; database_error: string };
      }).code = "P2004";
      (p2004Error as unknown as {
        code: string;
        meta: { constraint: string; database_error: string };
      }).meta = {
        constraint: "trips_end_date_gte_start_date",
        database_error:
          'new row for relation "trips" violates check constraint "trips_end_date_gte_start_date"',
      };

      vi.mocked(prisma.trip.update).mockRejectedValueOnce(p2004Error);

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: "2026-11-21" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toMatch(
        /Không thể cập nhật ngày do xung đột với trạng thái hiện tại/
      );

      // BẢO MẬT: Tuyệt đối không để lộ tên constraint, SQL hoặc mã lỗi nội bộ cho client
      const jsonStr = JSON.stringify(body);
      expect(jsonStr).not.toContain("trips_end_date_gte_start_date");
      expect(jsonStr).not.toContain("P2004");
      expect(jsonStr).not.toContain("check constraint");
      expect(jsonStr).not.toContain("violates");
    });

    it("does not map unrelated P2004 constraint violations to 409 CONFLICT", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      // Mô phỏng lỗi P2004 của một constraint khác (không phải ngày tháng của trip)
      const otherConstraintError = new Error(
        'A constraint failed on the database: new row violates check constraint "expenses_amount_positive"'
      );
      (otherConstraintError as unknown as {
        code: string;
        meta: { constraint: string };
      }).code = "P2004";
      (otherConstraintError as unknown as {
        code: string;
        meta: { constraint: string };
      }).meta = {
        constraint: "expenses_amount_positive",
      };

      vi.mocked(prisma.trip.update).mockRejectedValueOnce(otherConstraintError);

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      // Phải đi qua xử lý lỗi thông thường (HTTP 500), không bị nhầm thành 409 CONFLICT
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.code).not.toBe("CONFLICT");
    });

    it("returns 409 CONFLICT when DriverAdapterError occurs with SQLSTATE 23514 and trips_end_date_gte_start_date constraint", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      // Mô phỏng DriverAdapterError ném ra từ @prisma/adapter-pg khi vi phạm CHECK constraint ngày
      const driverAdapterError = new Error(
        'new row for relation "trips" violates check constraint "trips_end_date_gte_start_date"'
      );
      Object.assign(driverAdapterError, {
        name: "DriverAdapterError",
        cause: {
          kind: "postgres",
          code: "23514",
          severity: "ERROR",
          message:
            'new row for relation "trips" violates check constraint "trips_end_date_gte_start_date"',
          detail: "Failing row contains (..., 2026-11-20, 2026-11-15).",
          constraint: "trips_end_date_gte_start_date",
          table: "trips",
        },
      });

      vi.mocked(prisma.trip.update).mockRejectedValueOnce(driverAdapterError);

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: "2026-11-21" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toMatch(
        /Không thể cập nhật ngày do xung đột với trạng thái hiện tại/
      );

      // BẢO MẬT: Tuyệt đối không để lộ SQL, tên constraint hoặc chi tiết adapter nội bộ
      const jsonStr = JSON.stringify(body);
      expect(jsonStr).not.toContain("trips_end_date_gte_start_date");
      expect(jsonStr).not.toContain("DriverAdapterError");
      expect(jsonStr).not.toContain("23514");
      expect(jsonStr).not.toContain("postgres");
      expect(jsonStr).not.toContain("check constraint");
      expect(jsonStr).not.toContain("violates");
    });

    it("does not map DriverAdapterError with unrelated check constraint to 409 CONFLICT", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      // Mô phỏng DriverAdapterError với CHECK constraint khác (không phải ngày tháng của trip)
      const otherCheckError = new Error(
        'new row for relation "expenses" violates check constraint "expenses_amount_positive"'
      );
      Object.assign(otherCheckError, {
        name: "DriverAdapterError",
        cause: {
          kind: "postgres",
          code: "23514",
          severity: "ERROR",
          message:
            'new row for relation "expenses" violates check constraint "expenses_amount_positive"',
          constraint: "expenses_amount_positive",
        },
      });

      vi.mocked(prisma.trip.update).mockRejectedValueOnce(otherCheckError);

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.code).not.toBe("CONFLICT");
    });

    it("does not map unrelated DriverAdapterError (e.g. foreign key 23503) to 409 CONFLICT", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const fkError = new Error(
        'insert or update on table "trips" violates foreign key constraint "trips_user_id_fkey"'
      );
      Object.assign(fkError, {
        name: "DriverAdapterError",
        cause: {
          kind: "postgres",
          code: "23503",
          severity: "ERROR",
          message:
            'insert or update on table "trips" violates foreign key constraint "trips_user_id_fkey"',
        },
      });

      vi.mocked(prisma.trip.update).mockRejectedValueOnce(fkError);

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID }),
        }
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.code).not.toBe("CONFLICT");
    });
  });

  describe("isTripDateConstraintViolation helper", () => {
    describe("Prisma P2004 format", () => {
      it("identifies P2004 with trips_end_date_gte_start_date in meta.constraint", () => {
        expect(
          isTripDateConstraintViolation({
            code: "P2004",
            meta: { constraint: "trips_end_date_gte_start_date" },
          })
        ).toBe(true);
      });

      it("identifies P2004 with trips_end_date_gte_start_date in meta.database_error", () => {
        expect(
          isTripDateConstraintViolation({
            code: "P2004",
            meta: {
              database_error:
                'violates check constraint "trips_end_date_gte_start_date"',
            },
          })
        ).toBe(true);
      });

      it("identifies error with trips_end_date_gte_start_date in message", () => {
        expect(
          isTripDateConstraintViolation({
            code: "P2004",
            message:
              'A constraint failed on the database: violates check constraint "trips_end_date_gte_start_date"',
          })
        ).toBe(true);
      });

      it("returns false for P2004 with unrelated constraint", () => {
        expect(
          isTripDateConstraintViolation({
            code: "P2004",
            meta: { constraint: "expenses_amount_positive" },
          })
        ).toBe(false);

        expect(
          isTripDateConstraintViolation({
            code: "P2004",
            meta: { database_error: "some other constraint failed" },
          })
        ).toBe(false);
      });
    });

    describe("PostgreSQL DriverAdapterError format", () => {
      it("identifies DriverAdapterError with SQLSTATE 23514 and constraint in cause.constraint", () => {
        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23514",
              constraint: "trips_end_date_gte_start_date",
            },
          })
        ).toBe(true);
      });

      it("identifies DriverAdapterError with SQLSTATE 23514 and constraint in cause.message", () => {
        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23514",
              message:
                'new row for relation "trips" violates check constraint "trips_end_date_gte_start_date"',
            },
          })
        ).toBe(true);
      });

      it("identifies DriverAdapterError with SQLSTATE 23514 and constraint in cause.detail", () => {
        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23514",
              message: "violates check constraint",
              detail: "Failing row violates trips_end_date_gte_start_date",
            },
          })
        ).toBe(true);
      });

      it("identifies DriverAdapterError nested inside meta.driverAdapterError", () => {
        expect(
          isTripDateConstraintViolation({
            code: "P2004",
            meta: {
              driverAdapterError: {
                name: "DriverAdapterError",
                cause: {
                  kind: "postgres",
                  code: "23514",
                  constraint: "trips_end_date_gte_start_date",
                },
              },
            },
          })
        ).toBe(true);
      });

      it("returns false for DriverAdapterError with 23514 but unrelated check constraint", () => {
        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23514",
              constraint: "expenses_amount_positive",
            },
          })
        ).toBe(false);

        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23514",
              message:
                'new row for relation "expenses" violates check constraint "expenses_amount_positive"',
            },
          })
        ).toBe(false);
      });

      it("returns false when SQLSTATE 23514 appears alone without trips_end_date_gte_start_date", () => {
        // Điều kiện nghiêm ngặt: 23514 đơn lẻ KHÔNG được coi là vi phạm ràng buộc ngày tháng
        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23514",
              message: "violates check constraint",
            },
          })
        ).toBe(false);

        expect(
          isTripDateConstraintViolation({
            code: "23514",
          })
        ).toBe(false);
      });

      it("returns false for DriverAdapterError with unrelated PostgreSQL error codes", () => {
        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23503", // Foreign key violation
              constraint: "trips_user_id_fkey",
            },
          })
        ).toBe(false);

        expect(
          isTripDateConstraintViolation({
            name: "DriverAdapterError",
            cause: {
              kind: "postgres",
              code: "23505", // Unique violation
              constraint: "trips_invite_code_key",
            },
          })
        ).toBe(false);
      });
    });

    describe("General invalid inputs and other error types", () => {
      it("returns false for non-P2004 / non-23514 errors", () => {
        expect(isTripDateConstraintViolation({ code: "P2002" })).toBe(false);
        expect(isTripDateConstraintViolation({ code: "P2003" })).toBe(false);
        expect(isTripDateConstraintViolation(new Error("Connection error"))).toBe(false);
        expect(isTripDateConstraintViolation(null)).toBe(false);
        expect(isTripDateConstraintViolation(undefined)).toBe(false);
        expect(isTripDateConstraintViolation("some string error")).toBe(false);
        expect(isTripDateConstraintViolation(12345)).toBe(false);
      });
    });
  });
});
