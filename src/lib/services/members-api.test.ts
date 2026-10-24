import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripMembers,
  createGuestMember,
  updateGuestMember,
  deleteTripMember,
  mapApiMemberToDomain,
  MembersApiError,
  type ApiMemberDto,
  type ApiDeleteMemberResultDto,
} from "./members-api";

describe("Members API Client Service (src/lib/services/members-api)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validTripId = "11111111-2222-4333-8444-555555555555";
  const validMemberId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const validHostId = "99999999-8888-4777-8666-555555555555";

  const sampleHostDto: ApiMemberDto = {
    id: validHostId,
    tripId: validTripId,
    userId: "user-host-1",
    displayName: "Lan Trưởng Nhóm",
    role: "HOST",
    status: "ACTIVE",
    joinOrder: 1,
    joinedAt: "2026-10-21T01:00:00.000Z",
    leftAt: null,
    avatarUrl: "https://example.com/avatar.jpg",
    isPlaceholder: false,
    isCurrentUser: true,
    isHost: true,
  };

  const sampleGuestDto: ApiMemberDto = {
    id: validMemberId,
    tripId: validTripId,
    userId: null,
    displayName: "Hoàng Guest",
    role: "MEMBER",
    status: "ACTIVE",
    joinOrder: 2,
    joinedAt: "2026-10-21T02:00:00.000Z",
    leftAt: null,
    avatarUrl: null,
    isPlaceholder: true,
    isCurrentUser: false,
    isHost: false,
  };

  const sampleLeftMemberDto: ApiMemberDto = {
    id: "33333333-4444-4555-8666-777777777777",
    tripId: validTripId,
    userId: "user-left-1",
    displayName: "Thành Viên Đã Rời",
    role: "MEMBER",
    status: "LEFT",
    joinOrder: 3,
    joinedAt: "2026-10-21T03:00:00.000Z",
    leftAt: "2026-10-21T04:00:00.000Z",
    avatarUrl: null,
    isPlaceholder: false,
    isCurrentUser: false,
    isHost: false,
  };

  describe("mapApiMemberToDomain", () => {
    it("ánh xạ chính xác DTO HOST sang TripMember", () => {
      const domain = mapApiMemberToDomain(sampleHostDto);

      expect(domain.id).toBe(validHostId);
      expect(domain.userId).toBe("user-host-1");
      expect(domain.name).toBe("Lan Trưởng Nhóm");
      expect(domain.role).toBe("HOST");
      expect(domain.status).toBe("ACTIVE");
      expect(domain.joinOrder).toBe(1);
      expect(domain.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(domain.isCurrentUser).toBe(true);
      expect(domain.isHost).toBe(true);
      expect(domain.isNoAccount).toBe(false);
    });

    it("ánh xạ chính xác DTO Guest (placeholder) sang TripMember", () => {
      const domain = mapApiMemberToDomain(sampleGuestDto);

      expect(domain.id).toBe(validMemberId);
      expect(domain.userId).toBeNull();
      expect(domain.name).toBe("Hoàng Guest");
      expect(domain.role).toBe("MEMBER");
      expect(domain.status).toBe("ACTIVE");
      expect(domain.joinOrder).toBe(2);
      expect(domain.isNoAccount).toBe(true);
      expect(domain.isHost).toBe(false);
    });

    it("ánh xạ chính xác thành viên đã rời nhóm (status = LEFT)", () => {
      const domain = mapApiMemberToDomain(sampleLeftMemberDto);

      expect(domain.status).toBe("LEFT");
      expect(domain.name).toBe("Thành Viên Đã Rời");
    });
  });

  describe("fetchTripMembers", () => {
    it("ném lỗi nếu tripId không phải UUID hợp lệ", async () => {
      await expect(
        fetchTripMembers("mock-slug-1", { customFetch: mockFetch })
      ).rejects.toThrow(MembersApiError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("gọi đúng GET endpoint và trả về danh sách TripMember", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleHostDto, sampleGuestDto, sampleLeftMemberDto],
        }),
      });

      const members = await fetchTripMembers(validTripId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/members`,
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
      expect(members).toHaveLength(3);
      expect(members[0].name).toBe("Lan Trưởng Nhóm");
      expect(members[1].name).toBe("Hoàng Guest");
      expect(members[2].status).toBe("LEFT");
    });

    it("xử lý danh sách rỗng (empty state)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const members = await fetchTripMembers(validTripId, {
        customFetch: mockFetch,
      });

      expect(members).toEqual([]);
    });

    it("ném lỗi 401 UNAUTHORIZED khi chưa đăng nhập", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Yêu cầu đăng nhập để thực hiện thao tác này.",
          },
        }),
      });

      await expect(
        fetchTripMembers(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("ném lỗi 403 FORBIDDEN khi không phải thành viên chuyến đi", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bạn không có quyền truy cập chuyến đi này.",
          },
        }),
      });

      await expect(
        fetchTripMembers(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });

    it("ném lỗi 404 NOT_FOUND khi chuyến đi không tồn tại", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Không tìm thấy chuyến đi.",
          },
        }),
      });

      await expect(
        fetchTripMembers(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 404,
        code: "NOT_FOUND",
      });
    });

    it("xử lý lỗi kết nối mạng (NETWORK_ERROR)", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(
        fetchTripMembers(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        code: "NETWORK_ERROR",
        status: 0,
      });
    });
  });

  describe("createGuestMember", () => {
    it("ném lỗi nếu tripId không phải UUID hợp lệ", async () => {
      await expect(
        createGuestMember(
          "mock-slug",
          { displayName: "Guest 1" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow(MembersApiError);
    });

    it("ném lỗi validation nếu displayName dưới 2 ký tự hoặc quá 100 ký tự", async () => {
      await expect(
        createGuestMember(
          validTripId,
          { displayName: " " },
          { customFetch: mockFetch }
        )
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
      });

      await expect(
        createGuestMember(
          validTripId,
          { displayName: "a".repeat(101) },
          { customFetch: mockFetch }
        )
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
      });
    });

    it("gửi POST với payload chỉ chứa displayName và trả về TripMember", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: sampleGuestDto,
          message: "Thêm thành viên chưa có tài khoản thành công.",
        }),
      });

      const member = await createGuestMember(
        validTripId,
        { displayName: "  Hoàng Guest  ", note: "Ghi chú client" },
        { customFetch: mockFetch }
      );

      // BẢO MẬT: Kiểm tra chặt chẽ payload gửi lên chỉ có displayName, không có role/userId/note
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/members`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ displayName: "Hoàng Guest" }),
        })
      );
      expect(member.name).toBe("Hoàng Guest");
      expect(member.isNoAccount).toBe(true);
    });

    it("ném lỗi 409 CONFLICT khi tên bị trùng lặp trong nhóm", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "CONFLICT",
            message:
              "Tên hiển thị này đã được sử dụng trong chuyến đi (bao gồm cả thành viên đã rời nhóm).",
          },
        }),
      });

      await expect(
        createGuestMember(
          validTripId,
          { displayName: "Hoàng Guest" },
          { customFetch: mockFetch }
        )
      ).rejects.toMatchObject({
        status: 409,
        code: "CONFLICT",
      });
    });

    it("ném lỗi 403 FORBIDDEN nếu caller không phải HOST", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bạn không có quyền thực hiện thao tác này.",
          },
        }),
      });

      await expect(
        createGuestMember(
          validTripId,
          { displayName: "Guest New" },
          { customFetch: mockFetch }
        )
      ).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe("updateGuestMember", () => {
    it("ném lỗi nếu tripId hoặc memberId không phải UUID hợp lệ", async () => {
      await expect(
        updateGuestMember(
          "invalid-trip",
          validMemberId,
          { displayName: "New Name" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow(MembersApiError);

      await expect(
        updateGuestMember(
          validTripId,
          "invalid-member",
          { displayName: "New Name" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow(MembersApiError);
    });

    it("gửi PATCH với payload chỉ chứa displayName và trả về TripMember cập nhật", async () => {
      const updatedDto = { ...sampleGuestDto, displayName: "Hoàng Đã Đổi Tên" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedDto,
          message: "Cập nhật tên thành viên thành công.",
        }),
      });

      const member = await updateGuestMember(
        validTripId,
        validMemberId,
        { displayName: "  Hoàng Đã Đổi Tên  " },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/members/${validMemberId}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ displayName: "Hoàng Đã Đổi Tên" }),
        })
      );
      expect(member.name).toBe("Hoàng Đã Đổi Tên");
    });

    it("ném lỗi 403 khi cố sửa tên thành viên có tài khoản thật", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Không thể sửa tên của thành viên đã liên kết tài khoản.",
          },
        }),
      });

      await expect(
        updateGuestMember(
          validTripId,
          validMemberId,
          { displayName: "New Name" },
          { customFetch: mockFetch }
        )
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });
  });

  describe("deleteTripMember", () => {
    it("ném lỗi nếu tripId hoặc memberId không phải UUID", async () => {
      await expect(
        deleteTripMember("invalid", validMemberId, { customFetch: mockFetch })
      ).rejects.toThrow(MembersApiError);

      await expect(
        deleteTripMember(validTripId, "invalid", { customFetch: mockFetch })
      ).rejects.toThrow(MembersApiError);
    });

    it("xử lý phản hồi HARD_DELETE thành công", async () => {
      const hardDeleteDto: ApiDeleteMemberResultDto = {
        type: "HARD_DELETE",
        memberId: validMemberId,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: hardDeleteDto,
          message: "Đã xóa thành viên khỏi chuyến đi thành công.",
        }),
      });

      const result = await deleteTripMember(validTripId, validMemberId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/members/${validMemberId}`,
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result.type).toBe("HARD_DELETE");
    });

    it("xử lý phản hồi SOFT_DELETE thành công khi có lịch sử tài chính", async () => {
      const softDeleteDto: ApiDeleteMemberResultDto = {
        type: "SOFT_DELETE",
        member: {
          id: validMemberId,
          displayName: "Hoàng Guest",
          status: "LEFT",
          leftAt: "2026-10-21T04:00:00.000Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: softDeleteDto,
          message:
            "Thành viên đã có lịch sử trong chuyến đi. Đã chuyển trạng thái sang Đã rời nhóm.",
        }),
      });

      const result = await deleteTripMember(validTripId, validMemberId, {
        customFetch: mockFetch,
      });

      expect(result.type).toBe("SOFT_DELETE");
      if (result.type === "SOFT_DELETE") {
        expect(result.member.status).toBe("LEFT");
      }
    });

    it("ném lỗi 409 CONFLICT khi thành viên còn công nợ chưa tất toán", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "CONFLICT",
            message:
              "Không thể xóa hoặc rời nhóm: Thành viên đang nợ tiền (-50.000 ₫). Cần tất toán công nợ trước.",
          },
        }),
      });

      await expect(
        deleteTripMember(validTripId, validMemberId, {
          customFetch: mockFetch,
        })
      ).rejects.toMatchObject({
        status: 409,
        code: "CONFLICT",
        message: expect.stringContaining("Cần tất toán công nợ trước"),
      });
    });

    it("ném lỗi 403 FORBIDDEN khi cố xóa hoặc rời khỏi nhóm với vai trò HOST", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Trưởng nhóm không thể tự rời chuyến đi trong Release 1.",
          },
        }),
      });

      await expect(
        deleteTripMember(validTripId, validHostId, {
          customFetch: mockFetch,
        })
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining("Trưởng nhóm"),
      });
    });
  });
});
