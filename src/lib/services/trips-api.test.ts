import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchMyTrips,
  fetchMyTripsRaw,
  createTripApi,
  fetchTripDetailApi,
  fetchTripDetailRawApi,
  updateTripApi,
  TripsApiError,
  mapApiTripToDomain,
  mapApiTripDetailToTripDetailData,
  mapCreateTripResponseToDomain,
  rotateInviteCodeApi,
  archiveTripApi,
  createClaimApi,
  fetchTripClaimsApi,
  decideClaimApi,
  type ApiTripListItemDto,
  type ApiTripDetailResponseDto,
  type ApiCreateTripResponseDto,
} from "./trips-api";

describe("Trips API Client Service (src/lib/services/trips-api)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleTripDto: ApiTripListItemDto = {
    id: "11111111-2222-4333-8444-555555555555",
    name: "Đà Lạt 3N2Đ",
    destination: "Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-23",
    budgetAmount: 10000000,
    status: "ACTIVE",
    inviteCode: "ABCDEF-234567",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    memberCount: 1,
    myRole: "HOST",
    members: [
      {
        id: "mem-host-uuid-1",
        userId: "usr-uuid-1",
        name: "Lan",
        displayName: "Lan",
        role: "HOST",
        avatarUrl: "https://example.com/avatar.jpg",
        isCurrentUser: true,
        isHost: true,
        joinOrder: 1,
        status: "ACTIVE",
      },
    ],
    userBalance: {
      type: "SETTLED",
      amount: 0,
    },
  };

  const sampleDetailDto: ApiTripDetailResponseDto = {
    id: "11111111-2222-4333-8444-555555555555",
    name: "Đà Lạt 3N2Đ",
    destination: "Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-23",
    budgetAmount: 10000000,
    status: "ACTIVE",
    inviteCode: "ABCDEF-234567",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    memberCount: 1,
    myMemberId: "mem-host-uuid-1",
    myRole: "HOST",
    members: [
      {
        id: "mem-host-uuid-1",
        userId: "usr-uuid-1",
        name: "Lan",
        displayName: "Lan",
        role: "HOST",
        status: "ACTIVE",
        joinOrder: 1,
        avatarUrl: null,
        isCurrentUser: true,
        isHost: true,
        isNoAccount: false,
      },
    ],
  };

  describe("fetchMyTrips", () => {
    it("trả về danh sách chuyến đi đã map sang domain khi API thành công", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleTripDto],
        }),
      });

      const trips = await fetchMyTrips(
        { tab: "active", sortBy: "latest" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/trips?tab=active&sortBy=latest",
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );

      expect(trips).toHaveLength(1);
      expect(trips[0].id).toBe("11111111-2222-4333-8444-555555555555");
      expect(trips[0].name).toBe("Đà Lạt 3N2Đ");
      expect(trips[0].members[0].id).toBe("mem-host-uuid-1");
      expect(trips[0].members[0].role).toBe("HOST");
      expect(trips[0].members[0].isCurrentUser).toBe(true);

      // Đồng thời kiểm tra fetchMyTripsRaw trả về đúng DTO gốc
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleTripDto],
        }),
      });
      const rawList = await fetchMyTripsRaw(undefined, { customFetch: mockFetch });
      expect(rawList).toEqual([sampleTripDto]);
    });

    it("xử lý danh sách rỗng thành công", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const trips = await fetchMyTrips(undefined, { customFetch: mockFetch });
      expect(trips).toEqual([]);
    });

    it("ném lỗi UNAUTHORIZED khi HTTP 401", async () => {
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

      try {
        await fetchMyTrips(undefined, { customFetch: mockFetch });
        expect.unreachable("Phải ném lỗi TripsApiError");
      } catch (error) {
        expect(error).toBeInstanceOf(TripsApiError);
        const apiErr = error as TripsApiError;
        expect(apiErr.status).toBe(401);
        expect(apiErr.code).toBe("UNAUTHORIZED");
        expect(apiErr.message).toBe("Yêu cầu đăng nhập để thực hiện thao tác này.");
      }
    });

    it("ném lỗi INTERNAL_SERVER_ERROR khi HTTP 500", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Đã có lỗi hệ thống xảy ra.",
          },
        }),
      });

      await expect(
        fetchMyTrips(undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "TripsApiError",
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("ném lỗi MALFORMED_RESPONSE khi data không phải là mảng", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { notAnArray: true },
        }),
      });

      await expect(
        fetchMyTrips(undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "TripsApiError",
        code: "MALFORMED_RESPONSE",
      });
    });

    it("ném lỗi INVALID_RESPONSE khi phản hồi không phải JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("Unexpected token < in JSON");
        },
      });

      await expect(
        fetchMyTrips(undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "TripsApiError",
        status: 502,
        code: "INVALID_RESPONSE",
      });
    });

    it("ném lỗi NETWORK_ERROR khi fetch bị mất kết nối", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(
        fetchMyTrips(undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "TripsApiError",
        status: 0,
        code: "NETWORK_ERROR",
        message: "Failed to fetch",
      });
    });
  });

  describe("createTripApi", () => {
    const validCreateInput = {
      name: "Phú Quốc 4N3Đ",
      destination: "Kiên Giang",
      startDate: "2026-12-10",
      endDate: "2026-12-13",
      budgetAmount: 15000000,
    };

    const mockCreateResponse: ApiCreateTripResponseDto = {
      id: "22222222-3333-4444-8555-666666666666",
      name: "Phú Quốc 4N3Đ",
      destination: "Kiên Giang",
      startDate: "2026-12-10",
      endDate: "2026-12-13",
      budgetAmount: 15000000,
      status: "ACTIVE",
      inviteCode: "PQ2026-999999",
      createdAt: "2026-10-21T00:00:00.000Z",
      updatedAt: "2026-10-21T00:00:00.000Z",
      host: {
        memberId: "mem-host-created-1",
        userId: "usr-creator-1",
        displayName: "Lan Nguyễn",
        role: "HOST",
      },
    };

    it("tạo chuyến đi thành công và lọc bỏ các trường phân quyền do client tự ý thêm", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: "Tạo chuyến đi thành công.",
          data: mockCreateResponse,
        }),
      });

      // Client cố tình tiêm trường phân quyền trái phép
      const maliciousInput = {
        ...validCreateInput,
        userId: "injected-user-id",
        role: "SUPER_ADMIN",
        memberId: "injected-member",
        createdByMemberId: "fake-creator",
      };

      const result = await createTripApi(maliciousInput, { customFetch: mockFetch });

      // Xác minh fetch được gọi với đúng endpoint và chỉ có payload chuẩn
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("/api/trips");
      const sentBody = JSON.parse(callArgs[1].body);

      // BẢO MẬT: Tuyệt đối không chứa các trường tiêm
      expect(sentBody).toEqual({
        name: "Phú Quốc 4N3Đ",
        destination: "Kiên Giang",
        startDate: "2026-12-10",
        endDate: "2026-12-13",
        budgetAmount: 15000000,
      });
      expect(sentBody).not.toHaveProperty("userId");
      expect(sentBody).not.toHaveProperty("role");
      expect(sentBody).not.toHaveProperty("memberId");
      expect(sentBody).not.toHaveProperty("createdByMemberId");

      // Dữ liệu trả về bảo toàn UUID và gán đúng Host
      expect(result.trip.id).toBe("22222222-3333-4444-8555-666666666666");
      expect(result.trip.members[0].id).toBe("mem-host-created-1");
      expect(result.trip.members[0].role).toBe("HOST");
      expect(result.dto.host.displayName).toBe("Lan Nguyễn");
    });

    it("ném lỗi VALIDATION_ERROR khi backend trả 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Tên chuyến đi không được để trống.",
          },
        }),
      });

      await expect(
        createTripApi({ ...validCreateInput, name: "" }, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Tên chuyến đi không được để trống.",
      });
    });
  });

  describe("fetchTripDetailApi", () => {
    it("trả về TripDetailData khi tripId hợp lệ và API thành công", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: sampleDetailDto,
        }),
      });

      const detail = await fetchTripDetailApi(
        "11111111-2222-4333-8444-555555555555",
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/trips/11111111-2222-4333-8444-555555555555",
        expect.objectContaining({ method: "GET" })
      );

      expect(detail.id).toBe("11111111-2222-4333-8444-555555555555");
      expect(detail.currentMemberId).toBe("mem-host-uuid-1");
      expect(detail.members[0].role).toBe("HOST");

      // Kiểm tra fetchTripDetailRawApi trả về DTO thô
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: sampleDetailDto,
        }),
      });
      const rawDetail = await fetchTripDetailRawApi(
        "11111111-2222-4333-8444-555555555555",
        { customFetch: mockFetch }
      );
      expect(rawDetail).toEqual(sampleDetailDto);
    });

    it("chặn gọi fetch và ném INVALID_TRIP_ID khi tripId rỗng", async () => {
      await expect(
        fetchTripDetailApi("   ", { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_TRIP_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ném lỗi FORBIDDEN khi người dùng không phải thành viên ACTIVE (HTTP 403)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bạn không phải là thành viên của chuyến đi này.",
          },
        }),
      });

      await expect(
        fetchTripDetailApi("11111111-2222-4333-8444-555555555555", {
          customFetch: mockFetch,
        })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
        message: "Bạn không phải là thành viên của chuyến đi này.",
      });
    });

    it("ném lỗi NOT_FOUND khi chuyến đi không tồn tại (HTTP 404)", async () => {
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
        fetchTripDetailApi("00000000-0000-0000-0000-000000000000", {
          customFetch: mockFetch,
        })
      ).rejects.toMatchObject({
        status: 404,
        code: "NOT_FOUND",
      });
    });
  });

  describe("updateTripApi", () => {
    it("chỉnh sửa chuyến đi thành công và chỉ gửi các trường được phép", async () => {
      const mockUpdatedDto = {
        id: "11111111-2222-4333-8444-555555555555",
        name: "Đà Lạt 4N3Đ (Mới)",
        destination: "Lâm Đồng",
        startDate: "2026-11-20",
        endDate: "2026-11-24",
        budgetAmount: 12000000,
        status: "ACTIVE" as const,
        inviteCode: "ABCDEF-234567",
        updatedAt: "2026-10-21T01:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Cập nhật thông tin chuyến đi thành công.",
          data: mockUpdatedDto,
        }),
      });

      const res = await updateTripApi(
        "11111111-2222-4333-8444-555555555555",
        {
          name: "Đà Lạt 4N3Đ (Mới)",
          endDate: "2026-11-24",
          budgetAmount: 12000000,
        },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/trips/11111111-2222-4333-8444-555555555555",
        expect.objectContaining({
          method: "PATCH",
        })
      );
      expect(res.name).toBe("Đà Lạt 4N3Đ (Mới)");
      expect(res.endDate).toBe("2026-11-24");
    });
  });

  describe("DTO Mappers", () => {
    it("mapApiTripToDomain bảo toàn UUID và quan hệ", () => {
      const domainTrip = mapApiTripToDomain(sampleTripDto);
      expect(domainTrip.id).toBe("11111111-2222-4333-8444-555555555555");
      expect(domainTrip.members[0].id).toBe("mem-host-uuid-1");
      expect(domainTrip.members[0].role).toBe("HOST");
      expect(domainTrip.members[0].status).toBe("ACTIVE");
      expect(domainTrip.userBalance.amount).toBe(0);
    });

    it("mapApiTripDetailToTripDetailData gán đúng currentMemberId từ myMemberId", () => {
      const detailData = mapApiTripDetailToTripDetailData(sampleDetailDto);
      expect(detailData.id).toBe("11111111-2222-4333-8444-555555555555");
      expect(detailData.currentMemberId).toBe("mem-host-uuid-1");
      expect(detailData.plannedBudget).toBe(10000000);
      expect(detailData.totalSpent).toBe(0);
      expect(detailData.members[0].isCurrentUser).toBe(true);
    });

    it("mapCreateTripResponseToDomain tạo đúng Trip với thành viên Host ban đầu", () => {
      const createdDomain = mapCreateTripResponseToDomain({
        id: "33333333-4444-5555-8666-777777777777",
        name: "Hà Giang 3N2Đ",
        destination: "Hà Giang",
        startDate: "2026-11-01",
        endDate: "2026-11-03",
        budgetAmount: 8000000,
        status: "ACTIVE",
        inviteCode: "HG2026-111111",
        createdAt: "2026-10-21T00:00:00.000Z",
        updatedAt: "2026-10-21T00:00:00.000Z",
        host: {
          memberId: "mem-host-hg-1",
          userId: "usr-hg-1",
          displayName: "Minh",
          role: "HOST",
        },
      });

      expect(createdDomain.id).toBe("33333333-4444-5555-8666-777777777777");
      expect(createdDomain.members).toHaveLength(1);
      expect(createdDomain.members[0].id).toBe("mem-host-hg-1");
      expect(createdDomain.members[0].role).toBe("HOST");
      expect(createdDomain.members[0].isHost).toBe(true);
    });
  });

  describe("rotateInviteCodeApi", () => {
    const TRIP_ID = "11111111-2222-4333-8444-555555555555";

    it("chặn gọi fetch khi tripId rỗng", async () => {
      await expect(
        rotateInviteCodeApi("   ", { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_TRIP_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("gửi POST request đến /api/trips/[id]/rotate-invite và trả về mã mới", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            tripId: TRIP_ID,
            inviteCode: "DL3N2D-TRIP99",
          },
        }),
      });

      const res = await rotateInviteCodeApi(TRIP_ID, { customFetch: mockFetch });
      expect(res).toEqual({
        tripId: TRIP_ID,
        inviteCode: "DL3N2D-TRIP99",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${TRIP_ID}/rotate-invite`,
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("ném lỗi FORBIDDEN khi người dùng không phải Trưởng nhóm (HTTP 403)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bạn không có quyền đổi mã mời.",
          },
        }),
      });

      await expect(
        rotateInviteCodeApi(TRIP_ID, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });
  });

  describe("archiveTripApi", () => {
    const TRIP_ID = "11111111-2222-4333-8444-555555555555";

    it("chặn gọi fetch khi tripId rỗng", async () => {
      await expect(
        archiveTripApi("   ", { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_TRIP_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("gửi POST request đến /api/trips/[id]/archive và trả về chuyến đi ARCHIVED", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: TRIP_ID,
            name: "Đà Lạt 3N2Đ",
            status: "ARCHIVED",
            updatedAt: "2026-10-24T00:00:00Z",
          },
        }),
      });

      const res = await archiveTripApi(TRIP_ID, { customFetch: mockFetch });
      expect(res).toEqual({
        id: TRIP_ID,
        name: "Đà Lạt 3N2Đ",
        status: "ARCHIVED",
        updatedAt: "2026-10-24T00:00:00Z",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${TRIP_ID}/archive`,
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("ném lỗi CONFLICT khi chuyến đi còn nợ chưa quyết toán (HTTP 409)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "CONFLICT",
            message: "Không thể lưu trữ chuyến đi khi còn các khoản nợ chưa quyết toán.",
          },
        }),
      });

      await expect(
        archiveTripApi(TRIP_ID, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 409,
        code: "CONFLICT",
      });
    });
  });

  describe("createClaimApi (POST /api/trips/[id]/claims - UC33)", () => {
    const TRIP_ID = "11111111-2222-4333-8444-555555555555";
    const PLACEHOLDER_ID = "22222222-3333-4444-8555-666666666666";

    it("chặn gọi fetch nếu tripId không phải UUID hợp lệ", async () => {
      await expect(
        createClaimApi("invalid-trip", PLACEHOLDER_ID, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("chặn gọi fetch nếu placeholderMemberId không phải UUID hợp lệ", async () => {
      await expect(
        createClaimApi(TRIP_ID, "invalid-placeholder", { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION_ERROR",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("gọi POST /api/trips/[id]/claims và trả về DTO khi thành công", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            id: "claim-123",
            tripId: TRIP_ID,
            placeholderMemberId: PLACEHOLDER_ID,
            status: "PENDING",
            createdAt: "2026-10-24T00:00:00Z",
          },
        }),
      });

      const res = await createClaimApi(TRIP_ID, PLACEHOLDER_ID, {
        customFetch: mockFetch,
      });

      expect(res.id).toBe("claim-123");
      expect(res.status).toBe("PENDING");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${TRIP_ID}/claims`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ placeholderMemberId: PLACEHOLDER_ID }),
        })
      );
    });
  });

  describe("fetchTripClaimsApi (GET /api/trips/[id]/claims - UC30)", () => {
    const TRIP_ID = "11111111-2222-4333-8444-555555555555";

    it("gọi GET /api/trips/[id]/claims và trả về danh sách claims", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            {
              id: "claim-1",
              tripId: TRIP_ID,
              placeholderMemberId: "mem-1",
              placeholderMemberName: "Minh Béo",
              userId: "usr-1",
              userName: "Bảo Minh",
              userEmail: "minh@example.com",
              status: "PENDING",
              createdAt: "2026-10-24T00:00:00Z",
            },
          ],
        }),
      });

      const claims = await fetchTripClaimsApi(TRIP_ID, { customFetch: mockFetch });
      expect(claims).toHaveLength(1);
      expect(claims[0].userName).toBe("Bảo Minh");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${TRIP_ID}/claims`,
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("decideClaimApi (PATCH /api/trips/[id]/claims/[claimId]/decision - UC30)", () => {
    const TRIP_ID = "11111111-2222-4333-8444-555555555555";
    const CLAIM_ID = "33333333-4444-4555-8666-777777777777";

    it("gọi PATCH /api/trips/[id]/claims/[claimId]/decision với decision = APPROVE", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: CLAIM_ID,
            status: "APPROVED",
            tripId: TRIP_ID,
            placeholderMemberId: "mem-1",
            userId: "usr-1",
            message: "Đã phê duyệt",
          },
        }),
      });

      const res = await decideClaimApi(TRIP_ID, CLAIM_ID, "APPROVE", {
        customFetch: mockFetch,
      });

      expect(res.status).toBe("APPROVED");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ decision: "APPROVE" }),
        })
      );
    });
  });
});
