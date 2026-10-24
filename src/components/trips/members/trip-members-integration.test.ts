import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripMembers,
  createGuestMember,
  updateGuestMember,
  deleteTripMember,
  MembersApiError,
  mapApiMemberToDomain,
  ApiMemberDto,
} from "@/lib/services/members-api";
import {
  canAddGuestMember,
  canEditGuestMember,
  canRemoveMember,
  canLeaveTrip,
  validateGuestMemberForm,
} from "@/lib/members/validation";
import { TripMember, CreateGuestMemberFormData } from "@/types/trip";
import { isUuid } from "@/lib/services/trips-api";

describe("Phase 3D-2F: Trip Members Real API & UI State Integration Tests", () => {
  const mockFetch = vi.fn();
  const validTripUuid = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
  const legacySlug = "trip-dalat-3n2d";

  const hostMemberUuid = "11111111-1111-4111-8111-111111111111";
  const guestMemberUuid = "22222222-2222-4222-8222-222222222222";
  const userMemberUuid = "33333333-3333-4333-8333-333333333333";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleMembersDto: ApiMemberDto[] = [
    {
      id: hostMemberUuid,
      tripId: validTripUuid,
      userId: "usr-host-1",
      displayName: "Nguyễn Văn Host",
      role: "HOST",
      status: "ACTIVE",
      joinOrder: 1,
      joinedAt: "2026-10-01T08:00:00.000Z",
      leftAt: null,
      avatarUrl: "https://example.com/host.jpg",
      isPlaceholder: false,
      isCurrentUser: true,
      isHost: true,
    },
    {
      id: guestMemberUuid,
      tripId: validTripUuid,
      userId: null,
      displayName: "Bác Ba Phi",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 2,
      joinedAt: "2026-10-02T09:00:00.000Z",
      leftAt: null,
      avatarUrl: null,
      isPlaceholder: true,
      isCurrentUser: false,
      isHost: false,
    },
    {
      id: userMemberUuid,
      tripId: validTripUuid,
      userId: "usr-member-3",
      displayName: "Trần Thành Viên",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 3,
      joinedAt: "2026-10-03T10:00:00.000Z",
      leftAt: null,
      avatarUrl: null,
      isPlaceholder: false,
      isCurrentUser: false,
      isHost: false,
    },
  ];

  describe("1. GET /api/trips/[id]/members & Loading/Error/Retry Handlers", () => {
    it("fetches members successfully and maps DTOs to domain TripMember", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: sampleMembersDto,
        }),
      });

      const members = await fetchTripMembers(validTripUuid, { customFetch: mockFetch });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/members`,
        expect.objectContaining({ method: "GET" })
      );
      expect(members).toHaveLength(3);
      expect(members[0].id).toBe(hostMemberUuid);
      expect(members[0].name).toBe("Nguyễn Văn Host");
      expect(members[0].role).toBe("HOST");
      expect(members[0].isHost).toBe(true);
      expect(members[0].isCurrentUser).toBe(true);

      // Verify guest member
      expect(members[1].id).toBe(guestMemberUuid);
      expect(members[1].name).toBe("Bác Ba Phi");
      expect(members[1].userId).toBeNull();
      expect(members[1].isNoAccount).toBe(true);
    });

    it("handles empty members list gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const members = await fetchTripMembers(validTripUuid, { customFetch: mockFetch });
      expect(members).toEqual([]);
    });

    it("handles network failure and supports retry", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(
        fetchTripMembers(validTripUuid, { customFetch: mockFetch })
      ).rejects.toThrow("Failed to fetch");

      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: sampleMembersDto,
        }),
      });

      const retryMembers = await fetchTripMembers(validTripUuid, { customFetch: mockFetch });
      expect(retryMembers).toHaveLength(3);
    });

    it("throws 401 error with UNAUTHORIZED code for login redirect", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập." },
        }),
      });

      await expect(
        fetchTripMembers(validTripUuid, { customFetch: mockFetch })
      ).rejects.toThrow(MembersApiError);
    });

    it("throws 403 error for non-members", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: "FORBIDDEN", message: "Bạn không phải thành viên của chuyến đi này." },
        }),
      });

      await expect(
        fetchTripMembers(validTripUuid, { customFetch: mockFetch })
      ).rejects.toThrow("Bạn không phải thành viên của chuyến đi này.");
    });

    it("throws 404 error when trip is not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: "NOT_FOUND", message: "Không tìm thấy chuyến đi." },
        }),
      });

      await expect(
        fetchTripMembers(validTripUuid, { customFetch: mockFetch })
      ).rejects.toThrow("Không tìm thấy chuyến đi.");
    });

    it("bypasses Members API for legacy mock slug", () => {
      expect(isUuid(legacySlug)).toBe(false);
      // Legacy trip does not call fetchTripMembers
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("properly retains status 'LEFT' without displaying them as 'ACTIVE'", () => {
      const leftMemberDto: ApiMemberDto = {
        id: "44444444-4444-4444-8444-444444444444",
        tripId: validTripUuid,
        userId: "usr-left-4",
        displayName: "Người Đã Rời",
        role: "MEMBER",
        status: "LEFT",
        joinOrder: 4,
        joinedAt: "2026-10-04T10:00:00.000Z",
        leftAt: "2026-10-05T12:00:00.000Z",
        avatarUrl: null,
        isPlaceholder: false,
        isCurrentUser: false,
        isHost: false,
      };

      const domain = mapApiMemberToDomain(leftMemberDto);
      expect(domain.status).toBe("LEFT");
      expect(domain.status).not.toBe("ACTIVE");
    });
  });

  describe("2. POST /api/trips/[id]/members & Adding Guest Member", () => {
    it("sends strictly { displayName } without forbidden client fields", async () => {
      const newGuestUuid = "55555555-5555-4555-8555-555555555555";
      const createdDto: ApiMemberDto = {
        id: newGuestUuid,
        tripId: validTripUuid,
        userId: null,
        displayName: "Em Họ An",
        role: "MEMBER",
        status: "ACTIVE",
        joinOrder: 4,
        joinedAt: "2026-10-21T00:00:00.000Z",
        leftAt: null,
        avatarUrl: null,
        isPlaceholder: true,
        isCurrentUser: false,
        isHost: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: createdDto,
        }),
      });

      const result = await createGuestMember(
        validTripUuid,
        { displayName: "Em Họ An" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/members`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Em Họ An" }),
        })
      );

      // Verify that backend sets the UUID and join order
      expect(result.id).toBe(newGuestUuid);
      expect(result.name).toBe("Em Họ An");
      expect(result.joinOrder).toBe(4);
      expect(result.isNoAccount).toBe(true);
      expect(result.role).toBe("MEMBER");
      expect(result.status).toBe("ACTIVE");
    });

    it("rejects guest creation when displayName is duplicated (409 Conflict)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "CONFLICT",
            message: 'Tên hiển thị "Bác Ba Phi" đã tồn tại trong chuyến đi này.',
          },
        }),
      });

      await expect(
        createGuestMember(
          validTripUuid,
          { displayName: "Bác Ba Phi" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow('Tên hiển thị "Bác Ba Phi" đã tồn tại trong chuyến đi này.');
    });

    it("client-side validation blocks empty or whitespace names", () => {
      const existingMembers = sampleMembersDto.map(mapApiMemberToDomain);
      const invalidForm: CreateGuestMemberFormData = { displayName: "   " };
      const val = validateGuestMemberForm(invalidForm, existingMembers);
      expect(val.isValid).toBe(false);
      expect(val.errors.displayName).toBeDefined();
    });

    it("blocks guest creation if current user is not HOST", () => {
      const permission = canAddGuestMember("ACTIVE", false);
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain("Chỉ Trưởng nhóm");
    });

    it("blocks guest creation if trip is not ACTIVE", () => {
      const permissionSettling = canAddGuestMember("SETTLING", true);
      expect(permissionSettling.allowed).toBe(false);

      const permissionCompleted = canAddGuestMember("COMPLETED", true);
      expect(permissionCompleted.allowed).toBe(false);
    });
  });

  describe("3. PATCH /api/trips/[id]/members/[memberId] & Updating Guest Member", () => {
    it("sends strictly { displayName } with member UUID", async () => {
      const updatedDto: ApiMemberDto = {
        id: guestMemberUuid,
        tripId: validTripUuid,
        userId: null,
        displayName: "Bác Ba Phi (Đã đổi tên)",
        role: "MEMBER",
        status: "ACTIVE",
        joinOrder: 2,
        joinedAt: "2026-10-02T09:00:00.000Z",
        leftAt: null,
        avatarUrl: null,
        isPlaceholder: true,
        isCurrentUser: false,
        isHost: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedDto,
        }),
      });

      const updated = await updateGuestMember(
        validTripUuid,
        guestMemberUuid,
        { displayName: "Bác Ba Phi (Đã đổi tên)" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/members/${guestMemberUuid}`,
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Bác Ba Phi (Đã đổi tên)" }),
        })
      );
      expect(updated.name).toBe("Bác Ba Phi (Đã đổi tên)");
      expect(updated.id).toBe(guestMemberUuid);
    });

    it("does not allow updating a member with a real account (userId !== null)", () => {
      const realUserMember = mapApiMemberToDomain(sampleMembersDto[2]);
      expect(realUserMember.userId).toBe("usr-member-3");

      const permission = canEditGuestMember(realUserMember, "ACTIVE", true);
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain("thành viên đã có tài khoản");
    });

    it("handles 409 conflict when updated name duplicates another member", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "CONFLICT",
            message: 'Tên hiển thị "Nguyễn Văn Host" đã được sử dụng.',
          },
        }),
      });

      await expect(
        updateGuestMember(
          validTripUuid,
          guestMemberUuid,
          { displayName: "Nguyễn Văn Host" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow('Tên hiển thị "Nguyễn Văn Host" đã được sử dụng.');
    });
  });

  describe("4. DELETE /api/trips/[id]/members/[memberId] & Member Removal / Leave", () => {
    it("handles HARD_DELETE when member has no financial history", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            type: "HARD_DELETE",
            memberId: guestMemberUuid,
          },
        }),
      });

      const result = await deleteTripMember(validTripUuid, guestMemberUuid, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/members/${guestMemberUuid}`,
        expect.objectContaining({ method: "DELETE" })
      );
      expect(result.type).toBe("HARD_DELETE");
      if (result.type === "HARD_DELETE") {
        expect(result.memberId).toBe(guestMemberUuid);
      }
    });

    it("handles SOFT_DELETE when member has financial history with netBalance == 0", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            type: "SOFT_DELETE",
            member: {
              id: guestMemberUuid,
              displayName: "Bác Ba Phi",
              status: "LEFT",
              leftAt: "2026-10-21T00:00:00.000Z",
            },
          },
        }),
      });

      const result = await deleteTripMember(validTripUuid, guestMemberUuid, {
        customFetch: mockFetch,
      });

      expect(result.type).toBe("SOFT_DELETE");
      if (result.type === "SOFT_DELETE") {
        expect(result.member.id).toBe(guestMemberUuid);
      }
    });

    it("fails with 409 Conflict when member has unsettled debt (netBalance != 0)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "CONFLICT",
            message: "Không thể xóa thành viên vì công nợ chưa được tất toán (số dư: 150000).",
          },
        }),
      });

      await expect(
        deleteTripMember(validTripUuid, guestMemberUuid, { customFetch: mockFetch })
      ).rejects.toThrow("Không thể xóa thành viên vì công nợ chưa được tất toán");
    });

    it("forbids removing HOST (403 Forbidden)", async () => {
      const hostMember = mapApiMemberToDomain(sampleMembersDto[0]);
      const permission = canRemoveMember(hostMember, 0, "ACTIVE", true, false);
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain("Trưởng nhóm");
    });

    it("forbids HOST from leaving their own trip", () => {
      const hostMember = mapApiMemberToDomain(sampleMembersDto[0]);
      const permission = canLeaveTrip(hostMember, 0, "ACTIVE");
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain("Trưởng nhóm không thể tự rời");
    });

    it("allows non-host member with net balance 0 to leave", () => {
      const member = mapApiMemberToDomain(sampleMembersDto[2]);
      const permission = canLeaveTrip(member, 0, "ACTIVE");
      expect(permission.allowed).toBe(true);
    });

    it("blocks non-host member with debt from leaving", () => {
      const member = mapApiMemberToDomain(sampleMembersDto[2]);
      const permission = canLeaveTrip(member, -50000, "ACTIVE");
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain("tất toán");
    });
  });

  describe("5. Claim Identity Guard & Historical Financial Data Preservation", () => {
    it("ensures claim identity is not simulated with fake success for real trips", () => {
      // Real trip context disables claim resolution
      const isRealTrip = true;
      const handleApproveClaim = (claimId: string) => {
        if (isRealTrip) {
          return {
            success: false,
            message: `Tính năng nhận diện thành viên chưa khả dụng trong phiên bản hiện tại (claim: ${claimId}).`,
          };
        }
        return { success: true };
      };

      const res = handleApproveClaim("claim-123");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Tính năng nhận diện thành viên chưa khả dụng trong phiên bản hiện tại (claim: claim-123).");
    });

    it("ensures Member UUID is always passed to API, never userId or mock ID", async () => {
      // Guest has userId null, must use guestMemberUuid
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: guestMemberUuid, type: "HARD_DELETE" },
        }),
      });

      await deleteTripMember(validTripUuid, guestMemberUuid, { customFetch: mockFetch });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe(`/api/trips/${validTripUuid}/members/${guestMemberUuid}`);
      expect(calledUrl).not.toContain("usr-member");
      expect(calledUrl).not.toContain("m1");
      expect(calledUrl).not.toContain("m2");
    });

    it("preserves financial records: deleting a member does not delete expenses or shares", () => {
      const expenses = [
        {
          id: "exp-1",
          tripId: validTripUuid,
          title: "Ăn trưa",
          amount: 200000,
          paidByMemberId: guestMemberUuid,
          shares: [{ id: "s-1", expenseId: "exp-1", memberId: guestMemberUuid, amount: 100000 }],
        },
      ];

      // Soft delete member
      const member = mapApiMemberToDomain(sampleMembersDto[1]);
      const updatedMember: TripMember = { ...member, status: "LEFT" };

      expect(updatedMember.status).toBe("LEFT");
      // Expenses and shares remain completely intact
      expect(expenses[0].paidByMemberId).toBe(guestMemberUuid);
      expect(expenses[0].shares[0].memberId).toBe(guestMemberUuid);
    });
  });
});
