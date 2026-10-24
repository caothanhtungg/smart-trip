import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireTripMembership, isValidUuid } from "./auth-guard";
import { ForbiddenError, NotFoundError } from "./errors";
import { requireAuth, UnauthorizedError, type AuthUser, type AuthSession } from "@/lib/auth/session";
import type { PrismaClient } from "@/generated/prisma/client";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

describe("Trip Membership Authorization Guard (src/lib/api/auth-guard)", () => {
  const VALID_TRIP_ID = "123e4567-e89b-12d3-a456-426614174000";

  const mockUser: AuthUser = {
    id: "usr-1",
    email: "user@test.com",
    name: "User One",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "User One",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-1",
    token: "tok-1",
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const mockTrip = {
    id: VALID_TRIP_ID,
    name: "Chuyến đi Đà Lạt",
    destination: "Đà Lạt",
    startDate: new Date("2026-11-01"),
    endDate: new Date("2026-11-05"),
    budgetAmount: 5000000,
    status: "ACTIVE" as const,
    inviteCode: "ABCDEF-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: "mem-1",
    tripId: VALID_TRIP_ID,
    userId: "usr-1",
    displayName: "User One",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date(),
    leftAt: null,
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  type MockPrisma = {
    trip: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    tripMember: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  let mockPrisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      trip: {
        findUnique: vi.fn(),
      },
      tripMember: {
        findFirst: vi.fn(),
      },
    };

    // Mặc định: user đã đăng nhập
    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });
  });

  describe("isValidUuid helper", () => {
    it("returns true for valid UUID format", () => {
      expect(isValidUuid(VALID_TRIP_ID)).toBe(true);
      expect(isValidUuid("c3e98688-66b9-450f-90db-3df265322cbb")).toBe(true);
    });

    it("returns false for non-UUID strings", () => {
      expect(isValidUuid("not-a-uuid")).toBe(false);
      expect(isValidUuid("123")).toBe(false);
      expect(isValidUuid("")).toBe(false);
      // @ts-expect-error test non-string
      expect(isValidUuid(null)).toBe(false);
    });
  });

  describe("requireTripMembership security verification", () => {
    it("throws UnauthorizedError when user is not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      await expect(
        requireTripMembership(VALID_TRIP_ID, {
          prismaClient: mockPrisma as unknown as PrismaClient,
        })
      ).rejects.toThrow(UnauthorizedError);

      expect(mockPrisma.trip.findUnique).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when tripId is not a valid UUID", async () => {
      await expect(
        requireTripMembership("invalid-trip-id", {
          prismaClient: mockPrisma as unknown as PrismaClient,
        })
      ).rejects.toThrow(NotFoundError);

      expect(mockPrisma.trip.findUnique).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when trip does not exist in database", async () => {
      mockPrisma.trip.findUnique.mockResolvedValueOnce(null);

      await expect(
        requireTripMembership(VALID_TRIP_ID, {
          prismaClient: mockPrisma as unknown as PrismaClient,
        })
      ).rejects.toThrow(NotFoundError);

      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: VALID_TRIP_ID },
      });
      expect(mockPrisma.tripMember.findFirst).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when user is not a member of the trip", async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.tripMember.findFirst.mockResolvedValue(null);

      const promise = requireTripMembership(VALID_TRIP_ID, {
        prismaClient: mockPrisma as unknown as PrismaClient,
      });
      await expect(promise).rejects.toThrow(ForbiddenError);
      await expect(promise).rejects.toThrow(/Bạn không phải là thành viên của chuyến đi này/);

      expect(mockPrisma.tripMember.findFirst).toHaveBeenCalledWith({
        where: {
          tripId: VALID_TRIP_ID,
          userId: mockUser.id,
          status: "ACTIVE",
        },
      });
    });

    it("throws ForbiddenError when user is MEMBER but action requires HOST role", async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.tripMember.findFirst.mockResolvedValue(mockMember); // role: MEMBER

      const promise = requireTripMembership(VALID_TRIP_ID, {
        requiredRole: "HOST",
        prismaClient: mockPrisma as unknown as PrismaClient,
      });

      await expect(promise).rejects.toThrow(ForbiddenError);
      await expect(promise).rejects.toThrow(/Thao tác này chỉ dành cho Trưởng nhóm/);
    });

    it("succeeds and returns full context when user is an active MEMBER", async () => {
      mockPrisma.trip.findUnique.mockResolvedValueOnce(mockTrip);
      mockPrisma.tripMember.findFirst.mockResolvedValueOnce(mockMember);

      const result = await requireTripMembership(VALID_TRIP_ID, {
        prismaClient: mockPrisma as unknown as PrismaClient,
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
        member: mockMember,
        trip: mockTrip,
      });
    });

    it("succeeds when user is HOST and requiredRole is HOST", async () => {
      const hostMember = {
        ...mockMember,
        id: "mem-host",
        role: "HOST" as const,
        joinOrder: 1,
      };

      mockPrisma.trip.findUnique.mockResolvedValueOnce(mockTrip);
      mockPrisma.tripMember.findFirst.mockResolvedValueOnce(hostMember);

      const result = await requireTripMembership(VALID_TRIP_ID, {
        requiredRole: "HOST",
        prismaClient: mockPrisma as unknown as PrismaClient,
      });

      expect(result.member.role).toBe("HOST");
      expect(result.user.id).toBe(mockUser.id);
    });

    it("throws ForbiddenError when user has LEFT status and allowLeftMember is false/undefined", async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.tripMember.findFirst.mockResolvedValue(null);

      await expect(
        requireTripMembership(VALID_TRIP_ID, {
          prismaClient: mockPrisma as unknown as PrismaClient,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.tripMember.findFirst).toHaveBeenCalledWith({
        where: {
          tripId: VALID_TRIP_ID,
          userId: mockUser.id,
          status: "ACTIVE",
        },
      });
    });

    it("succeeds when user has LEFT status and allowLeftMember is true", async () => {
      const leftMember = {
        ...mockMember,
        status: "LEFT" as const,
        leftAt: new Date(),
      };

      mockPrisma.trip.findUnique.mockResolvedValueOnce(mockTrip);
      mockPrisma.tripMember.findFirst.mockResolvedValueOnce(leftMember);

      const result = await requireTripMembership(VALID_TRIP_ID, {
        allowLeftMember: true,
        prismaClient: mockPrisma as unknown as PrismaClient,
      });

      expect(result.member.status).toBe("LEFT");
      expect(mockPrisma.tripMember.findFirst).toHaveBeenCalledWith({
        where: {
          tripId: VALID_TRIP_ID,
          userId: mockUser.id,
          status: { in: ["ACTIVE", "LEFT"] },
        },
      });
    });
  });
});
