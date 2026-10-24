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
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    expenseShare: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    expenseItemMember: {
      count: vi.fn(),
    },
    settlementTransfer: {
      count: vi.fn(),
    },
    settlement: {
      count: vi.fn(),
    },
    itineraryItem: {
      count: vi.fn(),
    },
    memberClaim: {
      count: vi.fn(),
    },
    bankClaimSnapshot: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

describe("/api/trips/[id]/members/[memberId] Route Handlers", () => {
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
  const VALID_MEMBER_ID = "22222222-3333-4444-8555-666666666666";
  const VALID_HOST_MEMBER_ID = "33333333-3333-4333-8333-333333333333";
  const VALID_REGULAR_MEMBER_ID = "44444444-4444-4444-8444-444444444444";
  const INVALID_UUID = "invalid-uuid-format";

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

  const mockHostCallerMember = {
    id: VALID_HOST_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Host)",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockRegularCallerMember = {
    id: VALID_REGULAR_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-current-123",
    displayName: "Lan (Member)",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date("2026-10-02T00:00:00Z"),
    leftAt: null,
  };

  const mockPlaceholderTarget = {
    id: VALID_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: null,
    displayName: "Bác tài",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 3,
    joinedAt: new Date("2026-10-03T00:00:00Z"),
    leftAt: null,
  };

  const mockUserTarget = {
    id: VALID_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-other-789",
    displayName: "Hùng Đã Link User",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 4,
    joinedAt: new Date("2026-10-04T00:00:00Z"),
    leftAt: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });
  });

  describe("Authentication & UUID Validation (Shared)", () => {
    it("returns 401 UNAUTHORIZED when unauthenticated for PATCH", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED when unauthenticated for DELETE", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 NOT_FOUND when tripId or memberId is invalid UUID", async () => {
      const res1 = await PATCH(
        new Request(`http://localhost:3000/api/trips/${INVALID_UUID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: INVALID_UUID, memberId: VALID_MEMBER_ID }),
        }
      );
      expect(res1.status).toBe(404);

      const res2 = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${INVALID_UUID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: INVALID_UUID }),
        }
      );
      expect(res2.status).toBe(404);
    });

    it("returns 404 NOT_FOUND when trip does not exist in database", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/trips/[id]/members/[memberId]", () => {
    it("returns 403 FORBIDDEN when caller is a regular MEMBER (Host only)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockRegularCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác tài Xịn" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Thao tác này chỉ dành cho Trưởng nhóm.");
    });

    it("returns 404 NOT_FOUND when target member does not exist in trip", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null); // target member not found

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 FORBIDDEN when target member is NOT a placeholder (already linked user)", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // caller is host
        .mockResolvedValueOnce(mockUserTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // target has userId !== null

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toContain("đã liên kết tài khoản");
    });

    it("returns 400 BAD_REQUEST when trip status is not ACTIVE (e.g. COMPLETED)", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce({
          ...mockDbTrip,
          status: "COMPLETED",
        } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Tên mới" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("returns 400 VALIDATION_ERROR when displayName is invalid", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: " A " }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].message).toContain("ít nhất 2 ký tự");
    });

    it("returns 409 CONFLICT when new displayName duplicates another member in trip", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // caller is host
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // target is placeholder
        .mockResolvedValueOnce({ id: "mem-other" } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // duplicate found

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "lan (host)" }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("đã được sử dụng bởi một thành viên khác");
    });

    it("allows ACTIVE HOST to successfully update placeholder member's displayName", async () => {
      vi.mocked(prisma.trip.findUnique)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
        .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(null); // no duplicate

      const updatedMember = {
        ...mockPlaceholderTarget,
        displayName: "Bác tài Mới",
      };

      vi.mocked(prisma.tripMember.update).mockResolvedValueOnce(
        updatedMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.update>>
      );

      const res = await PATCH(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "  Bác tài Mới  " }),
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.displayName).toBe("Bác tài Mới");
      expect(body.data.isPlaceholder).toBe(true);
      expect(prisma.tripMember.update).toHaveBeenCalledWith({
        where: { id: VALID_MEMBER_ID },
        data: { displayName: "Bác tài Mới" },
        select: expect.any(Object),
      });
    });
  });

  describe("DELETE /api/trips/[id]/members/[memberId]", () => {
    it("returns 400 BAD_REQUEST when trip is not ACTIVE (e.g. SETTLING)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
        ...mockDbTrip,
        status: "SETTLING",
      } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("returns 403 FORBIDDEN when attempting to delete the HOST", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // caller is host
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // target is also host

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_HOST_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_HOST_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toContain("Trưởng nhóm không thể tự rời chuyến đi");
    });

    it("returns 403 FORBIDDEN when a regular MEMBER attempts to delete another member", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockRegularCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // caller is member
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // target is placeholder

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toContain("không có quyền xóa");
    });

    it("returns 409 CONFLICT when member netBalance > 0 (owed money)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      // Paid 500,000 VND, Owed 200,000 VND -> Net = +300,000 VND
      vi.mocked(prisma.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 500000 },
      } as unknown as Awaited<ReturnType<typeof prisma.expense.aggregate>>);
      vi.mocked(prisma.expenseShare.aggregate).mockResolvedValueOnce({
        _sum: { amount: 200000 },
      } as unknown as Awaited<ReturnType<typeof prisma.expenseShare.aggregate>>);

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("đang được nợ tiền (+300.000 ₫)");
    });

    it("returns 409 CONFLICT when member netBalance < 0 (owes money)", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      // Paid 0 VND, Owed 150,000 VND -> Net = -150,000 VND
      vi.mocked(prisma.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expense.aggregate>>);
      vi.mocked(prisma.expenseShare.aggregate).mockResolvedValueOnce({
        _sum: { amount: 150000 },
      } as unknown as Awaited<ReturnType<typeof prisma.expenseShare.aggregate>>);

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("đang nợ tiền (-150.000 ₫)");
    });

    it("performs HARD DELETE when netBalance === 0 and member has NO history in any RESTRICT tables", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      // netBalance = 0
      vi.mocked(prisma.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expense.aggregate>>);
      vi.mocked(prisma.expenseShare.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expenseShare.aggregate>>);

      // All FK count checks return 0
      vi.mocked(prisma.expense.count).mockResolvedValue(0);
      vi.mocked(prisma.expenseShare.count).mockResolvedValue(0);
      vi.mocked(prisma.expenseItemMember.count).mockResolvedValue(0);
      vi.mocked(prisma.settlementTransfer.count).mockResolvedValue(0);
      vi.mocked(prisma.settlement.count).mockResolvedValue(0);
      vi.mocked(prisma.itineraryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.memberClaim.count).mockResolvedValue(0);
      vi.mocked(prisma.bankClaimSnapshot.count).mockResolvedValue(0);

      vi.mocked(prisma.tripMember.delete).mockResolvedValueOnce(
        mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.delete>>
      );

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.type).toBe("HARD_DELETE");
      expect(body.data.memberId).toBe(VALID_MEMBER_ID);
      expect(prisma.tripMember.delete).toHaveBeenCalledWith({
        where: { id: VALID_MEMBER_ID },
      });
      expect(prisma.tripMember.update).not.toHaveBeenCalled();
    });

    it("performs SOFT DELETE (status = LEFT) when netBalance === 0 but member has financial or referential history", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      // netBalance = 0 (paid 500k, owed 500k)
      vi.mocked(prisma.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 500000 },
      } as unknown as Awaited<ReturnType<typeof prisma.expense.aggregate>>);
      vi.mocked(prisma.expenseShare.aggregate).mockResolvedValueOnce({
        _sum: { amount: 500000 },
      } as unknown as Awaited<ReturnType<typeof prisma.expenseShare.aggregate>>);

      // Has history: sharesCount = 1
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expenseShare.count).mockResolvedValue(1);
      vi.mocked(prisma.expenseItemMember.count).mockResolvedValue(0);
      vi.mocked(prisma.settlementTransfer.count).mockResolvedValue(0);
      vi.mocked(prisma.settlement.count).mockResolvedValue(0);
      vi.mocked(prisma.itineraryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.memberClaim.count).mockResolvedValue(0);
      vi.mocked(prisma.bankClaimSnapshot.count).mockResolvedValue(0);

      const softDeletedResult = {
        id: VALID_MEMBER_ID,
        displayName: "Bác tài",
        status: "LEFT" as const,
        leftAt: new Date("2026-10-20T22:00:00Z"),
      };

      vi.mocked(prisma.tripMember.update).mockResolvedValueOnce(
        softDeletedResult as unknown as Awaited<ReturnType<typeof prisma.tripMember.update>>
      );

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.type).toBe("SOFT_DELETE");
      expect(body.data.member.status).toBe("LEFT");
      expect(body.message).toContain("Đã chuyển trạng thái sang Đã rời nhóm");
      expect(prisma.tripMember.update).toHaveBeenCalledWith({
        where: { id: VALID_MEMBER_ID },
        data: {
          status: "LEFT",
          leftAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
      expect(prisma.tripMember.delete).not.toHaveBeenCalled();
    });

    it("allows a regular MEMBER to voluntarily leave their own trip membership when netBalance === 0", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );

      // Caller is regular member AND target is self
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockRegularCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // in requireTripMembership
        .mockResolvedValueOnce(mockRegularCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>); // find target member

      // netBalance = 0
      vi.mocked(prisma.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expense.aggregate>>);
      vi.mocked(prisma.expenseShare.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expenseShare.aggregate>>);

      // No history
      vi.mocked(prisma.expense.count).mockResolvedValue(0);
      vi.mocked(prisma.expenseShare.count).mockResolvedValue(0);
      vi.mocked(prisma.expenseItemMember.count).mockResolvedValue(0);
      vi.mocked(prisma.settlementTransfer.count).mockResolvedValue(0);
      vi.mocked(prisma.settlement.count).mockResolvedValue(0);
      vi.mocked(prisma.itineraryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.memberClaim.count).mockResolvedValue(0);
      vi.mocked(prisma.bankClaimSnapshot.count).mockResolvedValue(0);

      vi.mocked(prisma.tripMember.delete).mockResolvedValueOnce(
        mockRegularCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.delete>>
      );

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_REGULAR_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_REGULAR_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.type).toBe("HARD_DELETE");
      expect(body.data.memberId).toBe(VALID_REGULAR_MEMBER_ID);
    });

    it("catches Foreign Key Restrict violation (P2003) during Hard Delete and throws 409 ConflictError", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
        mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
      );
      vi.mocked(prisma.tripMember.findFirst)
        .mockResolvedValueOnce(mockHostCallerMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
        .mockResolvedValueOnce(mockPlaceholderTarget as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

      vi.mocked(prisma.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expense.aggregate>>);
      vi.mocked(prisma.expenseShare.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as unknown as Awaited<ReturnType<typeof prisma.expenseShare.aggregate>>);

      // Counts return 0, but during delete a race condition happens
      vi.mocked(prisma.expense.count).mockResolvedValue(0);
      vi.mocked(prisma.expenseShare.count).mockResolvedValue(0);
      vi.mocked(prisma.expenseItemMember.count).mockResolvedValue(0);
      vi.mocked(prisma.settlementTransfer.count).mockResolvedValue(0);
      vi.mocked(prisma.settlement.count).mockResolvedValue(0);
      vi.mocked(prisma.itineraryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.memberClaim.count).mockResolvedValue(0);
      vi.mocked(prisma.bankClaimSnapshot.count).mockResolvedValue(0);

      const fkError = new Error("Foreign key constraint violated on the database: (`paid_by_member_id`)");
      Object.assign(fkError, { code: "P2003" });

      vi.mocked(prisma.tripMember.delete).mockRejectedValueOnce(fkError);

      const res = await DELETE(
        new Request(`http://localhost:3000/api/trips/${VALID_TRIP_ID}/members/${VALID_MEMBER_ID}`, {
          method: "DELETE",
        }),
        {
          params: Promise.resolve({ id: VALID_TRIP_ID, memberId: VALID_MEMBER_ID }),
        }
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toContain("phát sinh liên kết dữ liệu");
    });
  });
});
