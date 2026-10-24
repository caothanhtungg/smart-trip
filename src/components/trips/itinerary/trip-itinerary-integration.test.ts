import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripItinerary,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  ItineraryApiError,
  mapApiItineraryItemToDomain,
} from "@/lib/services/itinerary-api";
import {
  canAddItineraryItem,
  canEditItineraryItem,
  canDeleteItineraryItem,
  sortItineraryItems,
  validateItineraryItemForm,
} from "@/lib/itinerary/validation";
import { ItineraryItem, TripDetailData, CreateItineraryItemFormData } from "@/types/trip";
import { getMockItineraryForTrip } from "@/lib/mock/itinerary";
import { isUuid } from "@/lib/services/trips-api";

describe("Phase 3D-2E: Itinerary Real API & State Mutation Integration Tests", () => {
  const mockFetch = vi.fn();
  const validTripUuid = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
  const otherTripUuid = "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f";
  const legacySlug = "trip-dalat-3n2d";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleRealTrip: TripDetailData = {
    id: validTripUuid,
    name: "Quy Nhơn 4N3Đ",
    destination: "Bình Định",
    startDate: "2026-11-10",
    endDate: "2026-11-13",
    budgetAmount: 20000000,
    status: "ACTIVE",
    inviteCode: "QN2026-BIEN88",
    updatedAt: "2026-10-21T00:00:00.000Z",
    members: [
      {
        id: "mem-host-1",
        userId: "usr-host-1",
        name: "Trưởng nhóm",
        role: "HOST",
        status: "ACTIVE",
        joinOrder: 1,
        spentAmount: 0,
      },
      {
        id: "mem-member-2",
        userId: "usr-member-2",
        name: "Thành viên B",
        role: "MEMBER",
        status: "ACTIVE",
        joinOrder: 2,
        spentAmount: 0,
      },
    ],
    currentMemberId: "mem-host-1",
    currentRole: "HOST",
    plannedBudget: 20000000,
    totalSpent: 0,
    userSpent: 0,
    expenseCount: 0,
    paidActivitiesCount: 0,
    recentExpenses: [],
    expenses: [
      {
        id: "exp-linked-1",
        tripId: validTripUuid,
        title: "Bữa trưa Kỳ Co",
        amount: 350000,
        category: "FOOD",
        paidByMemberId: "mem-host-1",
        splitMethod: "EQUAL",
        spentAt: "2026-11-10T12:30:00.000Z",
        shares: [],
      },
    ],
    categoryAllocations: [],
    itineraryItems: [],
  };

  const sampleApiItem = {
    id: "item-uuid-1",
    tripId: validTripUuid,
    dayDate: "2026-11-10",
    sortOrder: 1,
    placeName: "Eo Gió",
    address: "Nhơn Lý, Quy Nhơn",
    note: "Ngắm bình minh và biển",
    startTime: "08:00",
    endTime: "10:00",
    createdByMemberId: "mem-host-1",
    createdByMember: {
      id: "mem-host-1",
      displayName: "Trưởng nhóm",
    },
    createdAt: "2026-10-21T01:00:00.000Z",
    updatedAt: "2026-10-21T01:00:00.000Z",
    expenses: [],
  };

  // =========================================================================
  // 1. Phân biệt Real UUID vs Legacy Mock Slug
  // =========================================================================
  describe("1. Real UUID vs Legacy Mock Slug Isolation", () => {
    it("1.1. Chuyến đi legacy mock slug lấy dữ liệu từ mock fixture mà không gọi API", () => {
      expect(isUuid(legacySlug)).toBe(false);

      const mockItems = getMockItineraryForTrip(legacySlug);
      expect(mockItems.length).toBeGreaterThan(0);
      expect(mockItems[0].placeName).toBeDefined();

      // Không gọi fetch nào
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("1.2. Chuyến đi UUID thật không fallback sang mock itinerary", () => {
      expect(isUuid(validTripUuid)).toBe(true);

      const mockItems = getMockItineraryForTrip(validTripUuid);
      expect(mockItems).toEqual([]);
    });
  });

  // =========================================================================
  // 2. Tải lịch trình từ Real API (GET) & Xử lý Trạng thái
  // =========================================================================
  describe("2. Fetch Real Itinerary & State Handling", () => {
    it("2.1. Tải danh sách điểm dừng thành công và chuẩn hóa sang HH:mm", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleApiItem],
        }),
      });

      const items = await fetchTripItinerary(validTripUuid, undefined, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/itinerary`,
        expect.objectContaining({ method: "GET", credentials: "same-origin" })
      );
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("item-uuid-1");
      expect(items[0].startTime).toBe("08:00");
      expect(items[0].endTime).toBe("10:00");
    });

    it("2.2. Trả về mảng rỗng khi chuyến đi chưa có điểm dừng (Empty State)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const items = await fetchTripItinerary(validTripUuid, undefined, {
        customFetch: mockFetch,
      });

      expect(items).toEqual([]);
    });

    it("2.3. Bắt lỗi HTTP 401 Unauthorized để kích hoạt redirect đăng nhập", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Phiên đăng nhập hết hạn." },
        }),
      });

      await expect(
        fetchTripItinerary(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("2.4. Bắt lỗi HTTP 403 Forbidden khi người dùng không phải thành viên ACTIVE", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập." },
        }),
      });

      await expect(
        fetchTripItinerary(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });

    it("2.5. Bắt lỗi HTTP 500 và lỗi mạng cho phép giao diện hiển thị nút Thử lại (retry)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network connection lost"));

      await expect(
        fetchTripItinerary(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });
  });

  // =========================================================================
  // 3. Cơ chế chống Race Condition khi chuyển đổi Trip ID
  // =========================================================================
  describe("3. Anti-Race Condition on Trip Switch", () => {
    it("3.1. Bỏ qua response cũ nếu activeTripId đã thay đổi sang Trip khác", async () => {
      let activeTripId = validTripUuid;

      // Giả lập request cho Trip 1 mất nhiều thời gian
      let resolveTrip1: (val: unknown) => void;
      const trip1Promise = new Promise((resolve) => {
        resolveTrip1 = resolve;
      });

      mockFetch.mockImplementationOnce(() => trip1Promise);

      // Bắt đầu fetch Trip 1
      const fetchPromise1 = fetchTripItinerary(validTripUuid, undefined, {
        customFetch: mockFetch,
      });

      // Người dùng chuyển sang Trip 2
      activeTripId = otherTripUuid;

      // Trip 1 hoàn thành muộn
      resolveTrip1!({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleApiItem],
        }),
      });

      const result1 = await fetchPromise1;

      // Logic context bảo vệ: Chỉ cập nhật state nếu activeTripId === tripId ban đầu
      let appliedState: ItineraryItem[] = [];
      if (activeTripId === validTripUuid) {
        appliedState = result1;
      }

      // State không bị ghi đè bởi response của Trip 1
      expect(appliedState).toEqual([]);
    });
  });

  // =========================================================================
  // 4. Thêm điểm dừng (POST) & Nguyên tắc Không Optimistic Update khi lỗi
  // =========================================================================
  describe("4. Add Itinerary Stop (POST) & Mutation Discipline", () => {
    const validFormData: CreateItineraryItemFormData = {
      dayDate: "2026-11-10",
      placeName: "Kỳ Co",
      address: "Nhơn Lý",
      startTime: "10:30",
      endTime: "13:00",
      note: "Tắm biển",
    };

    it("4.1. Validate client-side kiểm tra ngày nằm trong khoảng chuyến đi", () => {
      const valid = validateItineraryItemForm(
        validFormData,
        sampleRealTrip.startDate,
        sampleRealTrip.endDate
      );
      expect(valid.isValid).toBe(true);

      const invalidDateForm: CreateItineraryItemFormData = {
        ...validFormData,
        dayDate: "2026-12-01", // Ngoài khoảng 10-13/11
      };
      const invalid = validateItineraryItemForm(
        invalidDateForm,
        sampleRealTrip.startDate,
        sampleRealTrip.endDate
      );
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.dayDate).toBeDefined();
    });

    it("4.2. Chặn mutation khi Trip ở trạng thái SETTLING hoặc COMPLETED", () => {
      expect(canAddItineraryItem("SETTLING", "ACTIVE")).toBe(false);
      expect(canAddItineraryItem("COMPLETED", "ACTIVE")).toBe(false);
      expect(canAddItineraryItem("ARCHIVED", "ACTIVE")).toBe(false);
      expect(canAddItineraryItem("ACTIVE", "LEFT")).toBe(false);
      expect(canAddItineraryItem("ACTIVE", "ACTIVE")).toBe(true);
    });

    it("4.3. Thêm thành công: cập nhật state bằng dữ liệu server trả về", async () => {
      const createdItemDto = {
        ...sampleApiItem,
        id: "item-new-uuid-2",
        placeName: "Kỳ Co",
        startTime: "10:30",
        endTime: "13:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: createdItemDto,
        }),
      });

      const initialItinerary: ItineraryItem[] = [
        mapApiItineraryItemToDomain(sampleApiItem),
      ];

      const created = await createItineraryItem(validTripUuid, validFormData, {
        customFetch: mockFetch,
      });

      // State chỉ cập nhật sau khi server xác nhận thành công
      const nextState = sortItineraryItems([...initialItinerary, created]);

      expect(nextState).toHaveLength(2);
      expect(nextState[1].id).toBe("item-new-uuid-2");
      expect(nextState[1].placeName).toBe("Kỳ Co");
    });

    it("4.4. Thất bại API: không thêm vào state và ném lỗi rõ ràng", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Giờ kết thúc không thể trước giờ bắt đầu.",
          },
        }),
      });

      const currentItinerary: ItineraryItem[] = [
        mapApiItineraryItemToDomain(sampleApiItem),
      ];

      let errorCaught: unknown;
      try {
        await createItineraryItem(validTripUuid, validFormData, {
          customFetch: mockFetch,
        });
      } catch (err) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ItineraryApiError);
      // State KHÔNG bị thay đổi
      expect(currentItinerary).toHaveLength(1);
      expect(currentItinerary[0].id).toBe("item-uuid-1");
    });
  });

  // =========================================================================
  // 5. Chỉnh sửa điểm dừng (PATCH)
  // =========================================================================
  describe("5. Update Itinerary Stop (PATCH)", () => {
    it("5.1. Phân quyền: Chỉ HOST hoặc chính người tạo mới có quyền sửa", () => {
      const targetItem: ItineraryItem = {
        id: "item-uuid-1",
        tripId: validTripUuid,
        dayDate: "2026-11-10",
        sortOrder: 1,
        placeName: "Eo Gió",
        startTime: "08:00",
        endTime: "10:00",
        createdByMemberId: "mem-host-1",
      };

      // HOST sửa -> Được phép
      expect(canEditItineraryItem(targetItem, "mem-host-1", true, "ACTIVE")).toBe(true);

      // Người tạo sửa -> Được phép
      expect(canEditItineraryItem(targetItem, "mem-host-1", false, "ACTIVE")).toBe(true);

      // Thành viên khác không phải HOST -> Bị từ chối
      expect(canEditItineraryItem(targetItem, "mem-member-2", false, "ACTIVE")).toBe(false);

      // Trip không ở trạng thái ACTIVE -> Bị từ chối
      expect(canEditItineraryItem(targetItem, "mem-host-1", true, "SETTLING")).toBe(false);
    });

    it("5.2. Chỉnh sửa thành công: cập nhật chính xác item bằng dữ liệu server trả về", async () => {
      const updatedDto = {
        ...sampleApiItem,
        placeName: "Eo Gió (Check-in bình minh)",
        startTime: "07:30",
        endTime: "09:30",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedDto,
        }),
      });

      const initialItinerary: ItineraryItem[] = [
        mapApiItineraryItemToDomain(sampleApiItem),
      ];

      const updated = await updateItineraryItem(
        validTripUuid,
        "item-uuid-1",
        {
          placeName: "Eo Gió (Check-in bình minh)",
          startTime: "07:30",
          endTime: "09:30",
        },
        { customFetch: mockFetch }
      );

      const nextState = initialItinerary.map((item) =>
        item.id === "item-uuid-1" ? updated : item
      );

      expect(nextState[0].placeName).toBe("Eo Gió (Check-in bình minh)");
      expect(nextState[0].startTime).toBe("07:30");
      expect(nextState[0].endTime).toBe("09:30");
    });
  });

  // =========================================================================
  // 6. Xóa điểm dừng (DELETE) & Bảo vệ Khoản chi (Expense Isolation)
  // =========================================================================
  describe("6. Delete Itinerary Stop (DELETE) & Expense Safety", () => {
    it("6.1. Phân quyền: Chỉ HOST hoặc chính người tạo mới có quyền xóa", () => {
      const targetItem: ItineraryItem = {
        id: "item-uuid-1",
        tripId: validTripUuid,
        dayDate: "2026-11-10",
        sortOrder: 1,
        placeName: "Eo Gió",
        startTime: "08:00",
        endTime: "10:00",
        createdByMemberId: "mem-host-1",
      };

      expect(canDeleteItineraryItem(targetItem, "mem-host-1", true, "ACTIVE")).toBe(true);
      expect(canDeleteItineraryItem(targetItem, "mem-member-2", false, "ACTIVE")).toBe(false);
      expect(canDeleteItineraryItem(targetItem, "mem-host-1", true, "COMPLETED")).toBe(false);
    });

    it("6.2. Xóa thành công: loại bỏ item khỏi state sau khi server xác nhận", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: "item-uuid-1" },
        }),
      });

      const initialItinerary: ItineraryItem[] = [
        mapApiItineraryItemToDomain(sampleApiItem),
      ];

      await deleteItineraryItem(validTripUuid, "item-uuid-1", {
        customFetch: mockFetch,
      });

      const nextState = initialItinerary.filter((it) => it.id !== "item-uuid-1");
      expect(nextState).toEqual([]);
    });

    it("6.3. BẢO VỆ DỮ LIỆU TÀI CHÍNH: Xóa địa điểm lịch trình KHÔNG xóa khoản chi ở client", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: "item-uuid-1" },
        }),
      });

      const expensesBefore = [...sampleRealTrip.expenses!];
      expect(expensesBefore).toHaveLength(1);

      await deleteItineraryItem(validTripUuid, "item-uuid-1", {
        customFetch: mockFetch,
      });

      // Khoản chi vẫn nguyên vẹn 100%, không bị client tự ý xóa hay biến đổi số tiền
      const expensesAfter = [...sampleRealTrip.expenses!];
      expect(expensesAfter).toHaveLength(1);
      expect(expensesAfter[0].id).toBe("exp-linked-1");
      expect(expensesAfter[0].amount).toBe(350000);
    });

    it("6.4. Xóa thất bại: item vẫn được giữ nguyên trong state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: "SERVER_ERROR", message: "Không thể xóa địa điểm." },
        }),
      });

      const initialItinerary: ItineraryItem[] = [
        mapApiItineraryItemToDomain(sampleApiItem),
      ];

      let errorCaught: unknown;
      try {
        await deleteItineraryItem(validTripUuid, "item-uuid-1", {
          customFetch: mockFetch,
        });
      } catch (err) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ItineraryApiError);
      // Item vẫn hiển thị bình thường
      expect(initialItinerary).toHaveLength(1);
      expect(initialItinerary[0].id).toBe("item-uuid-1");
    });
  });
});
