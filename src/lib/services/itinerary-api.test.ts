import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripItinerary,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  mapApiItineraryItemToDomain,
  ItineraryApiError,
  type ApiItineraryItemDto,
  type CreateItineraryItemInput,
  type UpdateItineraryItemInput,
} from "./itinerary-api";

describe("Itinerary API Client Service (src/lib/services/itinerary-api)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleItemDto: ApiItineraryItemDto = {
    id: "itin-item-uuid-1",
    tripId: "11111111-2222-4333-8444-555555555555",
    dayDate: "2026-11-20",
    sortOrder: 1,
    placeName: "Quảng trường Lâm Viên",
    address: "Đường Trần Quốc Toản, Phường 10, Đà Lạt",
    note: "Tập trung chụp ảnh check-in",
    startTime: "09:00",
    endTime: "10:30",
    createdByMemberId: "mem-host-uuid-1",
    createdByMember: {
      id: "mem-host-uuid-1",
      displayName: "Lan",
    },
    createdAt: "2026-10-21T02:00:00.000Z",
    updatedAt: "2026-10-21T02:00:00.000Z",
    expenses: [
      {
        id: "exp-uuid-1",
        title: "Vé vào cổng",
        amount: 50000,
      },
    ],
  };

  describe("mapApiItineraryItemToDomain", () => {
    it("ánh xạ chính xác DTO sang ItineraryItem với giờ HH:mm và expenseId", () => {
      const domain = mapApiItineraryItemToDomain(sampleItemDto);

      expect(domain.id).toBe("itin-item-uuid-1");
      expect(domain.tripId).toBe("11111111-2222-4333-8444-555555555555");
      expect(domain.dayDate).toBe("2026-11-20");
      expect(domain.placeName).toBe("Quảng trường Lâm Viên");
      expect(domain.startTime).toBe("09:00");
      expect(domain.endTime).toBe("10:30");
      expect(domain.expenseId).toBe("exp-uuid-1");
      expect(domain.createdByMemberId).toBe("mem-host-uuid-1");
    });

    it("giữ null cho endTime và legacy items không có giờ", () => {
      const legacyDto: ApiItineraryItemDto = {
        ...sampleItemDto,
        id: "itin-legacy-1",
        startTime: null,
        endTime: null,
        address: null,
        note: null,
        expenses: [],
      };

      const domain = mapApiItineraryItemToDomain(legacyDto);

      expect(domain.id).toBe("itin-legacy-1");
      expect(domain.startTime).toBeNull();
      expect(domain.endTime).toBeNull();
      expect(domain.address).toBeNull();
      expect(domain.note).toBeNull();
      expect(domain.expenseId).toBeNull();
    });
  });

  describe("fetchTripItinerary", () => {
    const tripId = "11111111-2222-4333-8444-555555555555";

    it("trả về danh sách điểm dừng đã map sang domain khi API thành công", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleItemDto],
        }),
      });

      const items = await fetchTripItinerary(tripId, undefined, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${tripId}/itinerary`,
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("itin-item-uuid-1");
      expect(items[0].placeName).toBe("Quảng trường Lâm Viên");
      expect(items[0].startTime).toBe("09:00");
    });

    it("truyền đúng query param dayDate khi có bộ lọc ngày", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleItemDto],
        }),
      });

      await fetchTripItinerary(tripId, "2026-11-20", {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${tripId}/itinerary?dayDate=2026-11-20`,
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
    });

    it("xử lý danh sách lịch trình rỗng thành công", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const items = await fetchTripItinerary(tripId, undefined, {
        customFetch: mockFetch,
      });

      expect(items).toEqual([]);
    });

    it("chặn gọi API và ném INVALID_TRIP_ID khi tripId rỗng", async () => {
      await expect(
        fetchTripItinerary("   ", undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_TRIP_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ném lỗi UNAUTHORIZED khi HTTP 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Yêu cầu đăng nhập để xem lịch trình.",
          },
        }),
      });

      await expect(
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toSatisfy((err) => {
        expect(err).toBeInstanceOf(ItineraryApiError);
        const apiErr = err as ItineraryApiError;
        expect(apiErr.status).toBe(401);
        expect(apiErr.code).toBe("UNAUTHORIZED");
        expect(apiErr.message).toBe("Yêu cầu đăng nhập để xem lịch trình.");
        return true;
      });
    });

    it("ném lỗi FORBIDDEN khi HTTP 403 (không phải thành viên ACTIVE)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bạn không có quyền truy cập lịch trình này.",
          },
        }),
      });

      await expect(
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "ItineraryApiError",
        status: 403,
        code: "FORBIDDEN",
        message: "Bạn không có quyền truy cập lịch trình này.",
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
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "ItineraryApiError",
        status: 404,
        code: "NOT_FOUND",
      });
    });

    it("ném lỗi khi server gặp sự cố (HTTP 500)", async () => {
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
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "ItineraryApiError",
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("ném lỗi NETWORK_ERROR khi fetch bị mất kết nối", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "ItineraryApiError",
        status: 0,
        code: "NETWORK_ERROR",
        message: "Failed to fetch",
      });
    });

    it("ném lỗi INVALID_RESPONSE khi phản hồi không phải JSON hợp lệ", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("Unexpected HTML response");
        },
      });

      await expect(
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "ItineraryApiError",
        status: 502,
        code: "INVALID_RESPONSE",
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
        fetchTripItinerary(tripId, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "ItineraryApiError",
        code: "MALFORMED_RESPONSE",
      });
    });
  });

  describe("createItineraryItem", () => {
    const tripId = "11111111-2222-4333-8444-555555555555";
    const validInput: CreateItineraryItemInput = {
      dayDate: "2026-11-20",
      placeName: "Hồ Xuân Hương",
      startTime: "14:00",
      endTime: "16:00",
      address: "Trung tâm Đà Lạt",
      note: "Đi dạo hoặc đạp vịt",
    };

    it("thêm điểm dừng thành công và lọc bỏ các trường nhạy cảm tripId, createdByMemberId", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            ...sampleItemDto,
            id: "itin-new-uuid-1",
            placeName: "Hồ Xuân Hương",
            startTime: "14:00",
            endTime: "16:00",
            expenses: [],
          },
        }),
      });

      // Thử truyền các trường client không được quyền gửi
      const maliciousInput = {
        ...validInput,
        tripId: "fake-trip-id",
        createdByMemberId: "fake-member-id",
        userId: "fake-user-id",
        role: "HOST",
      };

      const result = await createItineraryItem(
        tripId,
        maliciousInput as unknown as CreateItineraryItemInput,
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe(`/api/trips/${tripId}/itinerary`);
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].credentials).toBe("same-origin");

      const sentBody = JSON.parse(callArgs[1].body);

      // BẢO MẬT: Tuyệt đối không gửi các trường nhạy cảm do server tự xác thực
      expect(sentBody).not.toHaveProperty("tripId");
      expect(sentBody).not.toHaveProperty("createdByMemberId");
      expect(sentBody).not.toHaveProperty("userId");
      expect(sentBody).not.toHaveProperty("role");

      // Payload phải chứa đúng các trường hợp lệ
      expect(sentBody).toEqual({
        dayDate: "2026-11-20",
        placeName: "Hồ Xuân Hương",
        startTime: "14:00",
        endTime: "16:00",
        address: "Trung tâm Đà Lạt",
        note: "Đi dạo hoặc đạp vịt",
      });

      expect(result.id).toBe("itin-new-uuid-1");
      expect(result.placeName).toBe("Hồ Xuân Hương");
      expect(result.startTime).toBe("14:00");
      expect(result.endTime).toBe("16:00");
    });

    it("chặn gọi API và ném INVALID_TRIP_ID khi tripId không hợp lệ", async () => {
      await expect(
        createItineraryItem("", validInput, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_TRIP_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ném lỗi khi backend từ chối tạo điểm dừng (ví dụ chuyến đi đã kết thúc)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Chỉ có thể thêm lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch.",
          },
        }),
      });

      await expect(
        createItineraryItem(tripId, validInput, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        message: "Chỉ có thể thêm lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch.",
      });
    });
  });

  describe("updateItineraryItem", () => {
    const tripId = "11111111-2222-4333-8444-555555555555";
    const itemId = "itin-item-uuid-1";

    it("cập nhật điểm dừng thành công và chỉ gửi partial payload", async () => {
      const updateInput: UpdateItineraryItemInput = {
        startTime: "10:00",
        endTime: "12:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            ...sampleItemDto,
            startTime: "10:00",
            endTime: "12:00",
          },
        }),
      });

      const result = await updateItineraryItem(tripId, itemId, updateInput, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${tripId}/itinerary/${itemId}`,
        expect.objectContaining({
          method: "PATCH",
          credentials: "same-origin",
        })
      );

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody).toEqual({
        startTime: "10:00",
        endTime: "12:00",
      });
      expect(sentBody).not.toHaveProperty("placeName");
      expect(sentBody).not.toHaveProperty("tripId");

      expect(result.startTime).toBe("10:00");
      expect(result.endTime).toBe("12:00");
    });

    it("ném lỗi INVALID_ITEM_ID khi itemId rỗng", async () => {
      await expect(
        updateItineraryItem(tripId, "   ", { placeName: "Test" }, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_ITEM_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ném lỗi FORBIDDEN khi người dùng không có quyền sửa (không phải HOST hay người tạo)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền chỉnh sửa.",
          },
        }),
      });

      await expect(
        updateItineraryItem(tripId, itemId, { placeName: "Test" }, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
        message: "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền chỉnh sửa.",
      });
    });
  });

  describe("deleteItineraryItem", () => {
    const tripId = "11111111-2222-4333-8444-555555555555";
    const itemId = "itin-item-uuid-1";

    it("xóa điểm dừng thành công trả về id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: itemId },
          message: "Đã xóa địa điểm khỏi lịch trình.",
        }),
      });

      const result = await deleteItineraryItem(tripId, itemId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${tripId}/itinerary/${itemId}`,
        expect.objectContaining({
          method: "DELETE",
          credentials: "same-origin",
        })
      );
      expect(result).toEqual({ id: itemId });
    });

    it("ném lỗi INVALID_TRIP_ID hoặc INVALID_ITEM_ID khi tham số rỗng", async () => {
      await expect(
        deleteItineraryItem("", itemId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_TRIP_ID",
      });

      await expect(
        deleteItineraryItem(tripId, " ", { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_ITEM_ID",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ném lỗi khi server từ chối xóa (ví dụ không có quyền)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền xóa.",
          },
        }),
      });

      await expect(
        deleteItineraryItem(tripId, itemId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
        message: "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền xóa.",
      });
    });
  });
});
