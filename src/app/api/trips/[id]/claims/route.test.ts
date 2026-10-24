import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { requireAuth } from "@/lib/auth/session";
import { requireTripMembership, type TripMembershipAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/api";
import { UnauthorizedError } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/api/auth-guard", () => ({
  requireTripMembership: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
    },
    tripMember: {
      findFirst: vi.fn(),
    },
    memberClaim: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    bankClaimSnapshot: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        memberClaim: {
          create: vi.fn().mockImplementation((args) =>
            Promise.resolve({
              id: "claim-new-123",
              ...args.data,
              createdAt: new Date("2026-10-24T00:00:00Z"),
            })
          ),
        },
        bankClaimSnapshot: {
          create: vi.fn().mockResolvedValue({ id: "snap-123" }),
        },
      })
    ),
  },
}));

describe("API /api/trips/[id]/claims", () => {
  const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";
  const PLACEHOLDER_ID = "660e8400-e29b-41d4-a716-446655440001";
  const USER_ID = "770e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: USER_ID,
    name: "Claimant User",
    email: "claimant@example.com",
    displayName: "Claimant",
  };

  const mockTripActive = {
    id: TRIP_ID,
    name: "Đà Lạt 3N2Đ",
    status: "ACTIVE" as const,
  };

  describe("POST /api/trips/[id]/claims (UC33 Submit Identity Claim)", () => {
    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(
        new UnauthorizedError("Yêu cầu đăng nhập.")
      );

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 when tripId is not a valid UUID", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      const req = new Request("http://localhost/api/trips/not-a-uuid/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "not-a-uuid" }) });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when payload is invalid (missing placeholderMemberId)", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when trip is not found", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 400 when trip is not ACTIVE (e.g. SETTLING, COMPLETED, ARCHIVED)", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
        id: TRIP_ID,
        status: "SETTLING",
      } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("không còn ở trạng thái cho phép nhận diện");
    });

    it("returns 404 when placeholder member is not found in trip", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("Không tìm thấy vị trí thành viên");
    });

    it("returns 409 when placeholder is already linked to another account", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce({
        id: PLACEHOLDER_ID,
        status: "ACTIVE",
        userId: "other-user-uuid",
        displayName: "Minh Béo",
      } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("đã được liên kết với một tài khoản khác");
    });

    it("returns 409 when claimant is already an ACTIVE member of this trip", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      // 1. Placeholder check: OK
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce({
          id: PLACEHOLDER_ID,
          status: "ACTIVE",
          userId: null,
          displayName: "Minh Béo",
        } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        // 2. Existing membership check: user is already a member
        .mockResolvedValueOnce({
          id: "mem-existing",
        } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("Bạn đã là thành viên của chuyến đi này");
    });

    it("returns 409 when claimant already has a PENDING claim in this trip (Rule R20)", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      // 1. Placeholder check: OK
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce({
          id: PLACEHOLDER_ID,
          status: "ACTIVE",
          userId: null,
          displayName: "Minh Béo",
        } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        // 2. Existing membership check: not a member
        .mockResolvedValueOnce(null);

      // 3. Existing pending claim check: found!
      vi.mocked(prisma.memberClaim.findFirst).mockResolvedValueOnce({
        id: "claim-existing-pending",
      } as unknown as Awaited<ReturnType<typeof prisma.memberClaim.findFirst>>);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("Rule R20");
    });

    it("successfully creates claim and returns 201 with safe DTO", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce({
          id: PLACEHOLDER_ID,
          status: "ACTIVE",
          userId: null,
          displayName: "Minh Béo",
        } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.memberClaim.findFirst).mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.tripId).toBe(TRIP_ID);
      expect(body.data.placeholderMemberId).toBe(PLACEHOLDER_ID);
      expect(body.data.status).toBe("PENDING");
      expect(body.message).toContain("Đã gửi yêu cầu nhận diện thành viên");
    });

    it("handles race condition: maps P2002 unique constraint on one_pending_claim to 409 Conflict (Rule R20)", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce({
          id: PLACEHOLDER_ID,
          status: "ACTIVE",
          userId: null,
          displayName: "Minh Béo",
        } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null);

      // findFirst ban đầu không thấy claim nào (cả 2 request đồng thời đều vượt qua)
      vi.mocked(prisma.memberClaim.findFirst).mockResolvedValueOnce(null);

      // Nhưng khi insert vào DB, PostgreSQL chặn lại bằng index "one_pending_claim"
      const p2002Error = {
        code: "P2002",
        meta: {
          target: ["trip_id", "userId"],
          constraint: "one_pending_claim",
        },
      };

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(p2002Error);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("Rule R20");
    });

    it("handles unexpected database error: fails closed with 500 without leaking internals", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        user: mockUser,
        session: { id: "sess-1", userId: USER_ID },
      } as unknown as Awaited<ReturnType<typeof requireAuth>>);

      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce({
          id: PLACEHOLDER_ID,
          status: "ACTIVE",
          userId: null,
          displayName: "Minh Béo",
        } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.memberClaim.findFirst).mockResolvedValueOnce(null);

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(
        new Error("Connection reset by peer at postgres://secret-url")
      );

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).not.toContain("postgres://");
      expect(body.error.message).toContain("Đã có lỗi hệ thống xảy ra");
    });
  });

  describe("GET /api/trips/[id]/claims (UC30 Host Claim List)", () => {
    it("returns 403 when requester is a regular MEMBER (Rule R1)", async () => {
      vi.mocked(requireTripMembership).mockRejectedValueOnce(
        new ForbiddenError("Bạn không có quyền thực hiện thao tác này.")
      );

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "GET",
      });

      const res = await GET(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 with formatted claims list when requester is HOST", async () => {
      const mockHostAuth: TripMembershipAuth = {
        user: { id: "usr-host", name: "Host", email: "host@example.com" } as unknown as TripMembershipAuth["user"],
        session: { id: "sess-1", userId: "usr-host" } as unknown as TripMembershipAuth["session"],
        member: { id: "mem-host", tripId: TRIP_ID, userId: "usr-host", role: "HOST", status: "ACTIVE" } as unknown as TripMembershipAuth["member"],
        trip: mockTripActive as unknown as TripMembershipAuth["trip"],
      };

      vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

      vi.mocked(prisma.memberClaim.findMany).mockResolvedValueOnce([
        {
          id: "claim-1",
          tripId: TRIP_ID,
          placeholderMemberId: PLACEHOLDER_ID,
          userId: USER_ID,
          status: "PENDING",
          createdAt: new Date("2026-10-24T00:00:00Z"),
          decidedAt: null,
          decidedByMemberId: null,
          placeholderMember: {
            id: PLACEHOLDER_ID,
            displayName: "Minh Béo",
          },
          user: {
            id: USER_ID,
            name: "Bảo Minh",
            displayName: "Minh",
            email: "minh@example.com",
            image: "https://example.com/avatar.jpg",
          },
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.memberClaim.findMany>>);

      const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims`, {
        method: "GET",
      });

      const res = await GET(req, { params: Promise.resolve({ id: TRIP_ID }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toEqual({
        id: "claim-1",
        tripId: TRIP_ID,
        placeholderMemberId: PLACEHOLDER_ID,
        placeholderMemberName: "Minh Béo",
        userId: USER_ID,
        userName: "Minh",
        userEmail: "minh@example.com",
        userAvatarUrl: "https://example.com/avatar.jpg",
        status: "PENDING",
        createdAt: "2026-10-24T00:00:00.000Z",
        decidedAt: null,
        decidedByMemberId: null,
      });
    });
  });
});
