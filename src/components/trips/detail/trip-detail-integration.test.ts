import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchTripDetailApi,
  updateTripApi,
  rotateInviteCodeApi,
  archiveTripApi,
  TripsApiError,
  mapApiTripDetailToTripDetailData,
  isUuid,
  type ApiTripDetailResponseDto,
  type ApiUpdateTripResponseDto,
} from "@/lib/services/trips-api";
import { getTripDetailById, MOCK_TRIPS } from "@/lib/mock/trips";
import { generateMetadata } from "@/app/(app)/trips/[id]/layout";

describe("Phase 3D-2D: Trip Detail & Header Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validUuid = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
  const validUuid2 = "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f";
  const legacySlug = "trip-dalat-3n2d";

  const sampleApiDetailDto: ApiTripDetailResponseDto = {
    id: validUuid,
    name: "Khám phá Quy Nhơn 4N3Đ",
    destination: "Quy Nhơn, Bình Định",
    startDate: "2026-11-10",
    endDate: "2026-11-13",
    budgetAmount: 20000000,
    status: "ACTIVE",
    inviteCode: "QN2026-BIEN88",
    createdAt: "2026-10-15T08:00:00.000Z",
    updatedAt: "2026-10-16T12:00:00.000Z",
    memberCount: 2,
    myMemberId: "mem-current-uuid-1111",
    myRole: "HOST",
    members: [
      {
        id: "mem-current-uuid-1111",
        userId: "user-current-uuid-0001",
        name: "Trưởng nhóm A",
        displayName: "Trưởng nhóm A",
        role: "HOST",
        status: "ACTIVE",
        joinOrder: 1,
        avatarUrl: "https://example.com/avatar1.jpg",
        isCurrentUser: true,
        isHost: true,
        isNoAccount: false,
      },
      {
        id: "mem-member-uuid-2222",
        userId: "user-member-uuid-0002",
        name: "Thành viên B",
        displayName: "Thành viên B",
        role: "MEMBER",
        status: "ACTIVE",
        joinOrder: 2,
        avatarUrl: null,
        isCurrentUser: false,
        isHost: false,
        isNoAccount: false,
      },
    ],
  };

  // =========================================================================
  // 1. Phân biệt UUID database và Mock Slug
  // =========================================================================
  describe("1. Differentiate Database UUID vs Mock Slug", () => {
    it("1.1. Nhận diện chính xác UUID v1-v7 và phân biệt với mock slug", () => {
      expect(isUuid(validUuid)).toBe(true);
      expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isUuid("00000000-0000-0000-0000-000000000000")).toBe(true);

      expect(isUuid(legacySlug)).toBe(false);
      expect(isUuid("trip-sapa-trekking")).toBe(false);
      expect(isUuid("")).toBe(false);
      expect(isUuid(null)).toBe(false);
      expect(isUuid(undefined)).toBe(false);
      expect(isUuid("invalid-uuid-format-1234")).toBe(false);
    });

    it("1.2. Mock slug legacy mở đúng dữ liệu mock fixture", () => {
      const mockTrip = getTripDetailById(legacySlug);
      expect(mockTrip).not.toBeNull();
      expect(mockTrip?.id).toBe(legacySlug);
      expect(mockTrip?.name).toContain("Đà Lạt");
      expect(mockTrip?.members.length).toBeGreaterThan(0);
      expect(mockTrip?.expenses?.length).toBeGreaterThan(0);
    });

    it("1.3. UUID không tồn tại trong getTripDetailById không fallback sang mock", () => {
      const result = getTripDetailById(validUuid);
      expect(result).toBeNull();
    });

    it("1.4. Mock fixtures trong MOCK_TRIPS được bảo toàn nguyên vẹn", () => {
      expect(MOCK_TRIPS.length).toBeGreaterThanOrEqual(2);
      const dalat = MOCK_TRIPS.find((t) => t.id === "trip-dalat-3n2d");
      expect(dalat).toBeDefined();
      expect(dalat?.name).toBe("Đà Lạt 3N2Đ");
    });

    it("1.5. generateMetadata cho UUID trả về tiêu đề chung an toàn, chống rò rỉ thông tin riêng tư (IDOR)", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ id: validUuid }),
      });

      expect(meta.title).toBe("Chi tiết chuyến đi | Smart Trip");
      expect(meta.description).toContain("Quản lý kế hoạch");
      // Tuyệt đối không chứa tên chuyến đi riêng tư hoặc tra cứu database không có auth
      expect(meta.title).not.toContain("Quy Nhơn");
    });

    it("1.6. generateMetadata cho mock slug legacy vẫn hiển thị tiêu đề mock chuyến đi", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ id: legacySlug }),
      });

      expect(meta.title).toBe("Đà Lạt 3N2Đ — Chi tiết chuyến đi | Smart Trip");
      expect(meta.description).toContain("Đà Lạt 3N2Đ");
    });

    it("1.7. generateMetadata cho slug không tồn tại trả về trạng thái không tìm thấy", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ id: "slug-khong-ton-tai" }),
      });

      expect(meta.title).toBe("Không tìm thấy chuyến đi | Smart Trip");
    });
  });

  // =========================================================================
  // 2. Ánh xạ DTO từ API sang Domain (mapApiTripDetailToTripDetailData)
  // =========================================================================
  describe("2. Mapping API Response DTO to TripDetailData", () => {
    it("2.1. Bảo toàn UUID, myMemberId, myRole và không gán cứng m1", () => {
      const mapped = mapApiTripDetailToTripDetailData(sampleApiDetailDto);

      expect(mapped.id).toBe(validUuid);
      expect(mapped.currentMemberId).toBe("mem-current-uuid-1111");
      expect(mapped.currentRole).toBe("HOST");
      expect(mapped.name).toBe("Khám phá Quy Nhơn 4N3Đ");
      expect(mapped.destination).toBe("Quy Nhơn, Bình Định");
      expect(mapped.startDate).toBe("2026-11-10");
      expect(mapped.endDate).toBe("2026-11-13");
      expect(mapped.budgetAmount).toBe(20000000);
      expect(mapped.status).toBe("ACTIVE");
      expect(mapped.inviteCode).toBe("QN2026-BIEN88");
    });

    it("2.2. Phân biệt rõ id và userId của TripMember", () => {
      const mapped = mapApiTripDetailToTripDetailData(sampleApiDetailDto);

      const hostMember = mapped.members.find((m) => m.id === "mem-current-uuid-1111");
      expect(hostMember).toBeDefined();
      expect(hostMember?.id).toBe("mem-current-uuid-1111");
      expect(hostMember?.userId).toBe("user-current-uuid-0001");
      expect(hostMember?.isCurrentUser).toBe(true);
      expect(hostMember?.isHost).toBe(true);

      const normalMember = mapped.members.find((m) => m.id === "mem-member-uuid-2222");
      expect(normalMember).toBeDefined();
      expect(normalMember?.id).toBe("mem-member-uuid-2222");
      expect(normalMember?.userId).toBe("user-member-uuid-0002");
      expect(normalMember?.isCurrentUser).toBe(false);
      expect(normalMember?.isHost).toBe(false);
    });

    it("2.3. Ánh xạ chính xác khi người dùng là MEMBER (không tự suy diễn là HOST)", () => {
      const memberRoleDto: ApiTripDetailResponseDto = {
        ...sampleApiDetailDto,
        myMemberId: "mem-member-uuid-2222",
        myRole: "MEMBER",
        members: [
          {
            ...sampleApiDetailDto.members[0],
            isCurrentUser: false,
          },
          {
            ...sampleApiDetailDto.members[1],
            isCurrentUser: true,
          },
        ],
      };

      const mapped = mapApiTripDetailToTripDetailData(memberRoleDto);
      expect(mapped.currentMemberId).toBe("mem-member-uuid-2222");
      expect(mapped.currentRole).toBe("MEMBER");
      const currentMember = mapped.members.find((m) => m.id === mapped.currentMemberId);
      expect(currentMember?.role).toBe("MEMBER");
      expect(currentMember?.isCurrentUser).toBe(true);
      expect(currentMember?.isHost).toBe(false);
    });

    it("2.4. Phân hệ chưa tích hợp (expenses, itinerary) khởi tạo trạng thái rỗng an toàn", () => {
      const mapped = mapApiTripDetailToTripDetailData(sampleApiDetailDto);

      expect(mapped.expenses).toEqual([]);
      expect(mapped.itineraryItems).toEqual([]);
      expect(mapped.recentExpenses).toEqual([]);
      expect(mapped.categoryAllocations).toEqual([]);
      expect(mapped.totalSpent).toBe(0);
      expect(mapped.userSpent).toBe(0);
      expect(mapped.expenseCount).toBe(0);
    });
  });

  // =========================================================================
  // 3. Tải chi tiết chuyến đi qua Service API (fetchTripDetailApi)
  // =========================================================================
  describe("3. Fetch Trip Detail via API Service", () => {
    it("3.1. Tải thành công từ API trả về dữ liệu đúng định dạng", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: sampleApiDetailDto,
        }),
      });

      const result = await fetchTripDetailApi(validUuid, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(result.id).toBe(validUuid);
      expect(result.name).toBe("Khám phá Quy Nhơn 4N3Đ");
      expect(result.currentMemberId).toBe("mem-current-uuid-1111");
      expect(result.currentRole).toBe("HOST");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validUuid}`,
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
    });

    it("3.2. Ném lỗi INVALID_TRIP_ID khi truyền tripId không hợp lệ", async () => {
      await expect(fetchTripDetailApi("")).rejects.toThrow("Mã chuyến đi không hợp lệ.");
      await expect(fetchTripDetailApi("   ")).rejects.toThrow(TripsApiError);
    });

    it("3.3. Xử lý lỗi 401 UNAUTHORIZED", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.",
          },
        }),
      });

      await expect(
        fetchTripDetailApi(validUuid, {
          customFetch: mockFetch as unknown as typeof fetch,
        })
      ).rejects.toSatisfy((err) => {
        expect(err).toBeInstanceOf(TripsApiError);
        expect((err as TripsApiError).status).toBe(401);
        expect((err as TripsApiError).code).toBe("UNAUTHORIZED");
        return true;
      });
    });

    it("3.4. Xử lý lỗi 403 FORBIDDEN khi người dùng không phải thành viên", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bạn không có quyền xem thông tin chuyến đi này.",
          },
        }),
      });

      await expect(
        fetchTripDetailApi(validUuid, {
          customFetch: mockFetch as unknown as typeof fetch,
        })
      ).rejects.toSatisfy((err) => {
        expect(err).toBeInstanceOf(TripsApiError);
        expect((err as TripsApiError).status).toBe(403);
        expect((err as TripsApiError).code).toBe("FORBIDDEN");
        return true;
      });
    });

    it("3.5. Xử lý lỗi 404 NOT_FOUND khi chuyến đi không tồn tại", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
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
        fetchTripDetailApi(validUuid, {
          customFetch: mockFetch as unknown as typeof fetch,
        })
      ).rejects.toSatisfy((err) => {
        expect(err).toBeInstanceOf(TripsApiError);
        expect((err as TripsApiError).status).toBe(404);
        expect((err as TripsApiError).code).toBe("NOT_FOUND");
        return true;
      });
    });

    it("3.6. Xử lý lỗi mạng khi fetch thất bại (NETWORK_ERROR)", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      await expect(
        fetchTripDetailApi(validUuid, {
          customFetch: mockFetch as unknown as typeof fetch,
        })
      ).rejects.toSatisfy((err) => {
        expect(err).toBeInstanceOf(TripsApiError);
        expect((err as TripsApiError).code).toBe("NETWORK_ERROR");
        return true;
      });
    });
  });

  // =========================================================================
  // 4. Chỉnh sửa thông tin chuyến đi qua API (updateTripApi & PATCH)
  // =========================================================================
  describe("4. Update Trip via PATCH API", () => {
    it("4.1. Gửi đúng các trường được phép và nhận response cập nhật", async () => {
      const updatedResponseDto: ApiUpdateTripResponseDto = {
        id: validUuid,
        name: "Quy Nhơn 4N3Đ — Mùa hè rực rỡ",
        destination: "Quy Nhơn, Bình Định",
        startDate: "2026-11-12",
        endDate: "2026-11-15",
        budgetAmount: 25000000,
        status: "ACTIVE",
        inviteCode: "QN2026-BIEN88",
        updatedAt: "2026-10-21T01:30:00.000Z",
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedResponseDto,
        }),
      });

      const result = await updateTripApi(
        validUuid,
        {
          name: "  Quy Nhơn 4N3Đ — Mùa hè rực rỡ  ",
          destination: "Quy Nhơn, Bình Định",
          startDate: "2026-11-12",
          endDate: "2026-11-15",
          budgetAmount: 25000000,
        },
        { customFetch: mockFetch as unknown as typeof fetch }
      );

      expect(result.name).toBe("Quy Nhơn 4N3Đ — Mùa hè rực rỡ");
      expect(result.budgetAmount).toBe(25000000);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validUuid}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            name: "Quy Nhơn 4N3Đ — Mùa hè rực rỡ",
            destination: "Quy Nhơn, Bình Định",
            startDate: "2026-11-12",
            endDate: "2026-11-15",
            budgetAmount: 25000000,
          }),
        })
      );
    });

    it("4.2. Lọc bỏ các trường không hợp lệ hoặc xử lý budgetAmount <= 0 thành null", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            ...sampleApiDetailDto,
            budgetAmount: null,
          },
        }),
      });

      await updateTripApi(
        validUuid,
        {
          name: "Chuyến đi mới",
          budgetAmount: 0,
        },
        { customFetch: mockFetch as unknown as typeof fetch }
      );

      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(calledBody.budgetAmount).toBeNull();
      expect(calledBody.name).toBe("Chuyến đi mới");
    });

    it("4.3. PATCH thất bại với 403 khi người dùng không phải HOST", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Chỉ nhóm trưởng (HOST) mới có quyền chỉnh sửa thông tin chuyến đi.",
          },
        }),
      });

      await expect(
        updateTripApi(
          validUuid,
          { name: "Tên mới" },
          { customFetch: mockFetch as unknown as typeof fetch }
        )
      ).rejects.toSatisfy((err) => {
        expect(err).toBeInstanceOf(TripsApiError);
        expect((err as TripsApiError).status).toBe(403);
        expect((err as TripsApiError).code).toBe("FORBIDDEN");
        expect((err as TripsApiError).message).toContain("Chỉ nhóm trưởng");
        return true;
      });
    });

    it("4.4. PATCH thất bại không báo thành công khi gặp lỗi 400 validation", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Ngày kết thúc không được trước ngày bắt đầu.",
          },
        }),
      });

      await expect(
        updateTripApi(
          validUuid,
          {
            name: "Hợp lệ",
            startDate: "2026-12-10",
            endDate: "2026-12-05",
          },
          { customFetch: mockFetch as unknown as typeof fetch }
        )
      ).rejects.toThrow("Ngày kết thúc không được trước ngày bắt đầu.");
    });
  });

  // =========================================================================
  // 5. TripSessionContext Logic & Phân quyền thao tác
  // =========================================================================
  describe("5. TripSessionContext State & Permissions", () => {
    it("5.1. Chuyến đi thật không đưa mock itinerary hoặc mock expenses vào", () => {
      const realTripData = mapApiTripDetailToTripDetailData(sampleApiDetailDto);
      expect(realTripData.expenses).toHaveLength(0);
      expect(realTripData.itineraryItems).toHaveLength(0);
      expect(realTripData.currentRole).toBe("HOST");
    });

    it("5.2. Chuyến đi mock legacy giữ nguyên mock itinerary và mock expenses", () => {
      const mockTrip = getTripDetailById(legacySlug);
      expect(mockTrip?.expenses?.length).toBeGreaterThan(0);
    });

    it("5.3. Chuyển giữa 2 Trip ID khác nhau phân biệt dữ liệu hoàn toàn", () => {
      const trip1Dto = { ...sampleApiDetailDto, id: validUuid, name: "Chuyến 1" };
      const trip2Dto = { ...sampleApiDetailDto, id: validUuid2, name: "Chuyến 2" };

      const trip1 = mapApiTripDetailToTripDetailData(trip1Dto);
      const trip2 = mapApiTripDetailToTripDetailData(trip2Dto);

      expect(trip1.id).not.toBe(trip2.id);
      expect(trip1.name).toBe("Chuyến 1");
      expect(trip2.name).toBe("Chuyến 2");
    });

    it("5.4. rotateInviteCodeApi gửi POST request đến /api/trips/[id]/rotate-invite", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { tripId: validUuid, inviteCode: "NEWCOD-123456" },
        }),
      });

      const res = await rotateInviteCodeApi(validUuid, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(res.inviteCode).toBe("NEWCOD-123456");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validUuid}/rotate-invite`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("5.5. archiveTripApi gửi POST request đến /api/trips/[id]/archive", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: validUuid,
            name: "Chuyến 1",
            status: "ARCHIVED",
            updatedAt: "2026-10-24T00:00:00Z",
          },
        }),
      });

      const res = await archiveTripApi(validUuid, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(res.status).toBe("ARCHIVED");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validUuid}/archive`,
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
