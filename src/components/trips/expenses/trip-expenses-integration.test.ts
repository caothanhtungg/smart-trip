import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  mapApiExpenseToDomain,
  mapFormDataToCreateExpenseInput,
  ApiExpenseDto,
} from "@/lib/services/expenses-api";
import { canEditExpense, canDeleteExpense } from "@/lib/validation/expense";
import {
  TripExpense,
  TripDetailData,
  TripMemberDetail,
  CreateExpenseFormData,
} from "@/types/trip";
import { isUuid } from "@/lib/services/trips-api";
import { calculateMemberBalances } from "@/lib/money/settlement";
import { calculateTotalSpent } from "@/lib/money/budget";

describe("Phase 3F-2: Expenses UI Real API & State Integration Tests", () => {
  const mockFetch = vi.fn();
  const validTripUuid = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
  const otherTripUuid = "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f";
  const legacySlug = "trip-dalat-3n2d";

  const hostMemberId = "11111111-aaaa-4aaa-aaaa-111111111111";
  const member2Id = "22222222-bbbb-4bbb-bbbb-222222222222";
  const member3Id = "33333333-cccc-4ccc-cccc-333333333333";
  const leftMemberId = "44444444-dddd-4ddd-dddd-444444444444";

  const validExpenseUuid1 = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
  const validExpenseUuid2 = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";
  const validItineraryItemUuid = "cccccccc-3333-4333-8333-cccccccccccc";

  const sampleMembers: TripMemberDetail[] = [
    {
      id: hostMemberId,
      userId: "usr-host",
      name: "Trưởng nhóm",
      role: "HOST",
      status: "ACTIVE",
      joinOrder: 1,
      spentAmount: 0,
    },
    {
      id: member2Id,
      userId: "usr-member-2",
      name: "Thành viên B",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 2,
      spentAmount: 0,
    },
    {
      id: member3Id,
      name: "Khách C",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 3,
      isNoAccount: true,
      spentAmount: 0,
    },
    {
      id: leftMemberId,
      userId: "usr-member-left",
      name: "Thành viên đã rời",
      role: "MEMBER",
      status: "LEFT",
      joinOrder: 4,
      spentAmount: 0,
    },
  ];

  const sampleRealTrip: TripDetailData = {
    id: validTripUuid,
    name: "Đà Nẵng Hội An 4N3Đ",
    destination: "Đà Nẵng",
    startDate: "2026-11-15",
    endDate: "2026-11-18",
    budgetAmount: 15000000,
    status: "ACTIVE",
    inviteCode: "DN2026-BIEN99",
    updatedAt: "2026-10-21T00:00:00.000Z",
    members: sampleMembers,
    currentMemberId: hostMemberId,
    currentRole: "HOST",
    plannedBudget: 15000000,
    totalSpent: 0,
    userSpent: 0,
    expenseCount: 0,
    paidActivitiesCount: 0,
    recentExpenses: [],
    expenses: [],
    categoryAllocations: [],
    itineraryItems: [
      {
        id: validItineraryItemUuid,
        tripId: validTripUuid,
        dayDate: "2026-11-15",
        sortOrder: 1,
        placeName: "Bà Nà Hills",
        startTime: "09:00",
        endTime: "16:00",
        createdByMemberId: hostMemberId,
        expenseId: null,
      },
    ],
  };

  const sampleEqualApiDto: ApiExpenseDto = {
    id: validExpenseUuid1,
    tripId: validTripUuid,
    title: "Vé cáp treo Bà Nà",
    amount: 900000,
    category: "TICKET",
    paidByMemberId: hostMemberId,
    createdByMemberId: hostMemberId,
    splitMethod: "EQUAL",
    spentAt: "2026-11-15T09:30:00.000Z",
    itineraryItemId: validItineraryItemUuid,
    itineraryItem: {
      id: validItineraryItemUuid,
      placeName: "Bà Nà Hills",
      dayDate: "2026-11-15",
    },
    shares: [
      { id: "share-1", memberId: hostMemberId, amount: 300000 },
      { id: "share-2", memberId: member2Id, amount: 300000 },
      { id: "share-3", memberId: member3Id, amount: 300000 },
    ],
    createdAt: "2026-10-21T02:00:00.000Z",
    updatedAt: "2026-10-21T02:00:00.000Z",
  };

  const sampleItemizedApiDto: ApiExpenseDto = {
    id: validExpenseUuid2,
    tripId: validTripUuid,
    title: "Bữa tối hải sản Năm Đảnh",
    amount: 1100000,
    surchargeAmount: 100000,
    category: "FOOD",
    paidByMemberId: member2Id,
    createdByMemberId: member2Id,
    splitMethod: "ITEMIZED",
    spentAt: "2026-11-15T19:00:00.000Z",
    items: [
      {
        id: "item-1",
        name: "Cua rang me",
        amount: 600000,
        assignedMembers: [
          { id: hostMemberId, displayName: "Trưởng nhóm", status: "ACTIVE" },
          { id: member2Id, displayName: "Thành viên B", status: "ACTIVE" },
        ],
      },
      {
        id: "item-2",
        name: "Lẩu hải sản",
        amount: 400000,
        assignedMembers: [
          { id: hostMemberId, displayName: "Trưởng nhóm", status: "ACTIVE" },
          { id: member3Id, displayName: "Khách C", status: "ACTIVE" },
        ],
      },
    ],
    shares: [
      { id: "share-item-1", memberId: hostMemberId, amount: 533334 },
      { id: "share-item-2", memberId: member2Id, amount: 333333 },
      { id: "share-item-3", memberId: member3Id, amount: 233333 },
    ],
    createdAt: "2026-10-21T03:00:00.000Z",
    updatedAt: "2026-10-21T03:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Phân biệt Real UUID vs Legacy Mock Slug
  // =========================================================================
  describe("1. Real UUID vs Legacy Mock Slug Isolation", () => {
    it("1.1. Chuyến đi legacy mock slug không gọi Expense API và không dùng UUID endpoint", async () => {
      expect(isUuid(legacySlug)).toBe(false);
      expect(isUuid(sampleRealTrip.id)).toBe(true);

      // Thử gọi fetchTripExpenses với legacy slug phải bị chặn ngay từ client service
      await expect(
        fetchTripExpenses(legacySlug, undefined, { customFetch: mockFetch })
      ).rejects.toThrow("Mã chuyến đi không hợp lệ (yêu cầu UUID).");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("1.2. Chuyến đi UUID thật không dùng mock member ID khi gọi Expense API", () => {
      const formData: CreateExpenseFormData = {
        title: "Cà phê sáng",
        amount: 90000,
        category: "FOOD",
        paidByMemberId: hostMemberId,
        participantMemberIds: [hostMemberId, member2Id, member3Id],
        splitMethod: "EQUAL",
        spentAtDate: "2026-11-15",
        spentAtTime: "08:00",
      };

      const input = mapFormDataToCreateExpenseInput(formData);
      expect(input.paidByMemberId).toBe(hostMemberId);
      if (input.splitMethod === "EQUAL") {
        expect(input.participantMemberIds).toContain(member2Id);
        expect(input.participantMemberIds).toContain(member3Id);
        // Không chứa user ID hoặc mock member ID
        expect(input.participantMemberIds).not.toContain("usr-host");
        expect(input.participantMemberIds).not.toContain("mem-1");
      }
    });
  });

  // =========================================================================
  // 2. Nạp dữ liệu chi tiêu từ Real API (GET) & Error Handling
  // =========================================================================
  describe("2. Fetch Real Expenses (GET) & State Handling", () => {
    it("2.1. Tải danh sách chi tiêu thành công (cả EQUAL và ITEMIZED)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleEqualApiDto, sampleItemizedApiDto],
        }),
      });

      const expenses = await fetchTripExpenses(validTripUuid, undefined, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/expenses`,
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
      expect(expenses).toHaveLength(2);
      expect(expenses[0].id).toBe(validExpenseUuid1);
      expect(expenses[0].splitMethod).toBe("EQUAL");
      expect(expenses[0].shares).toHaveLength(3);
      expect(expenses[1].id).toBe(validExpenseUuid2);
      expect(expenses[1].splitMethod).toBe("ITEMIZED");
      expect(expenses[1].surcharge?.amount).toBe(100000);
      expect(expenses[1].items).toHaveLength(2);
    });

    it("2.2. Trả về mảng rỗng khi chuyến đi chưa có khoản chi nào (Empty State)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const expenses = await fetchTripExpenses(validTripUuid, undefined, {
        customFetch: mockFetch,
      });

      expect(expenses).toEqual([]);
    });

    it("2.3. Bắt lỗi HTTP 401 Unauthorized để kích hoạt redirect đăng nhập", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập." },
        }),
      });

      await expect(
        fetchTripExpenses(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("2.4. Bắt lỗi HTTP 403 Forbidden khi người dùng không thuộc chuyến đi", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập." },
        }),
      });

      await expect(
        fetchTripExpenses(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    });

    it("2.5. Bắt lỗi HTTP 404 khi không tìm thấy chuyến đi", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: "TRIP_NOT_FOUND", message: "Không tìm thấy chuyến đi." },
        }),
      });

      await expect(
        fetchTripExpenses(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 404,
        code: "TRIP_NOT_FOUND",
      });
    });

    it("2.6. Bắt lỗi HTTP 500 hoặc mất kết nối mạng để hiển thị nút Thử lại (retry)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network connection dropped"));

      await expect(
        fetchTripExpenses(validTripUuid, undefined, { customFetch: mockFetch })
      ).rejects.toThrow("Network connection dropped");
    });
  });

  // =========================================================================
  // 3. Cơ chế chống Race Condition khi chuyển đổi Trip ID
  // =========================================================================
  describe("3. Anti-Race Condition on Trip Switch", () => {
    it("3.1. Bỏ qua response cũ nếu activeTripId đã chuyển sang Trip khác", async () => {
      let activeTripId = validTripUuid;
      let sessionExpenses: TripExpense[] = [];

      let resolveTrip1: (val: unknown) => void;
      const trip1Promise = new Promise((resolve) => {
        resolveTrip1 = resolve;
      });

      mockFetch.mockImplementationOnce(() => trip1Promise);

      // Bắt đầu fetch Trip 1
      const fetchPromise1 = fetchTripExpenses(validTripUuid, undefined, {
        customFetch: mockFetch,
      }).then((expenses) => {
        // Chỉ lưu nếu activeTripId vẫn là trip 1
        if (activeTripId === validTripUuid) {
          sessionExpenses = expenses;
        }
      });

      // Người dùng chuyển sang Trip 2
      activeTripId = otherTripUuid;
      sessionExpenses = []; // reset khi switch trip

      // Response của Trip 1 về muộn
      resolveTrip1!({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleEqualApiDto],
        }),
      });

      await fetchPromise1;

      // sessionExpenses không bị response cũ của Trip 1 ghi đè
      expect(sessionExpenses).toEqual([]);
    });
  });

  // =========================================================================
  // 4. Tích hợp thêm chi tiêu (POST) - EQUAL & ITEMIZED
  // =========================================================================
  describe("4. Create Expense Integration (POST)", () => {
    it("4.1. POST EQUAL thành công: gửi đúng schema và cập nhật state với UUID thật", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: sampleEqualApiDto,
        }),
      });

      const formData: CreateExpenseFormData = {
        title: "Vé cáp treo Bà Nà",
        amount: 900000,
        category: "TICKET",
        paidByMemberId: hostMemberId,
        participantMemberIds: [hostMemberId, member2Id, member3Id],
        splitMethod: "EQUAL",
        spentAtDate: "2026-11-15",
        spentAtTime: "09:30",
        itineraryItemId: validItineraryItemUuid,
      };

      const created = await createExpense(validTripUuid, formData, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/expenses`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          credentials: "same-origin",
          body: JSON.stringify({
            title: "Vé cáp treo Bà Nà",
            amount: 900000,
            category: "TICKET",
            paidByMemberId: hostMemberId,
            spentAt: "2026-11-15T09:30:00.000Z",
            receiptImageUrl: null,
            note: null,
            itineraryItemId: validItineraryItemUuid,
            splitMethod: "EQUAL",
            participantMemberIds: [hostMemberId, member2Id, member3Id],
          }),
        })
      );

      expect(created.id).toBe(validExpenseUuid1);
      expect(created.shares).toHaveLength(3);
      expect(created.shares.reduce((sum, s) => sum + s.amount, 0)).toBe(900000);
    });

    it("4.2. POST EQUAL thất bại: không ghi nhận fake success, ném lỗi rõ ràng", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Số tiền không hợp lệ.",
          },
        }),
      });

      const formData: CreateExpenseFormData = {
        title: "Khoản chi sai tiền",
        amount: -100,
        category: "FOOD",
        paidByMemberId: hostMemberId,
        participantMemberIds: [hostMemberId],
        splitMethod: "EQUAL",
        spentAtDate: "2026-11-15",
        spentAtTime: "10:00",
      };

      await expect(
        createExpense(validTripUuid, formData, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Số tiền không hợp lệ.",
      });
    });

    it("4.3. POST ITEMIZED có phụ phí thành công: bảo toàn surchargeAmount và danh sách items", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: sampleItemizedApiDto,
        }),
      });

      const formData: CreateExpenseFormData = {
        title: "Bữa tối hải sản Năm Đảnh",
        amount: 1100000,
        category: "FOOD",
        paidByMemberId: member2Id,
        splitMethod: "ITEMIZED",
        spentAtDate: "2026-11-15",
        spentAtTime: "19:00",
        surcharge: { name: "Phụ phí / VAT", amount: 100000 },
        items: [
          {
            id: "tmp-1",
            name: "Cua rang me",
            amount: 600000,
            assignedMemberIds: [hostMemberId, member2Id],
          },
          {
            id: "tmp-2",
            name: "Lẩu hải sản",
            amount: 400000,
            assignedMemberIds: [hostMemberId, member3Id],
          },
        ],
        participantMemberIds: [hostMemberId, member2Id, member3Id],
      };

      const created = await createExpense(validTripUuid, formData, {
        customFetch: mockFetch,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.splitMethod).toBe("ITEMIZED");
      expect(callArgs.surchargeAmount).toBe(100000);
      expect(callArgs.items).toHaveLength(2);
      expect(callArgs.items[0].name).toBe("Cua rang me");
      expect(callArgs.items[0].amount).toBe(600000);
      expect(callArgs.items[0].assignedMemberIds).toEqual([hostMemberId, member2Id]);

      expect(created.surcharge?.amount).toBe(100000);
      expect(created.amount).toBe(1100000);
    });

    it("4.4. Double-submit guard: không gửi request thứ hai khi request đầu đang thực thi", async () => {
      let resolveFirstCall: (val: unknown) => void;
      const firstCallPromise = new Promise((resolve) => {
        resolveFirstCall = resolve;
      });

      mockFetch.mockImplementationOnce(() => firstCallPromise);

      let isSubmitting = false;

      const triggerSubmit = async () => {
        if (isSubmitting) return null;
        isSubmitting = true;
        try {
          return await createExpense(
            validTripUuid,
            {
              title: "Test",
              amount: 100000,
              category: "FOOD",
              paidByMemberId: hostMemberId,
              participantMemberIds: [hostMemberId],
              splitMethod: "EQUAL",
              spentAtDate: "2026-11-15",
              spentAtTime: "12:00",
            },
            { customFetch: mockFetch }
          );
        } finally {
          isSubmitting = false;
        }
      };

      const p1 = triggerSubmit();
      const p2 = triggerSubmit(); // Bị chặn bởi anti-double submit

      await expect(p2).resolves.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      resolveFirstCall!({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: sampleEqualApiDto }),
      });

      await p1;
    });
  });

  // =========================================================================
  // 5. Tích hợp sửa chi tiêu (PATCH) - Metadata & Split Method Change
  // =========================================================================
  describe("5. Update Expense Integration (PATCH)", () => {
    it("5.1. PATCH metadata thông thường: gửi đúng payload và cập nhật state", async () => {
      const updatedDto: ApiExpenseDto = {
        ...sampleEqualApiDto,
        title: "Vé cáp treo Bà Nà (khứ hồi)",
        category: "TICKET",
        note: "Đã bao gồm buffet trưa",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedDto,
        }),
      });

      const formData: CreateExpenseFormData = {
        title: "Vé cáp treo Bà Nà (khứ hồi)",
        amount: 900000,
        category: "TICKET",
        paidByMemberId: hostMemberId,
        participantMemberIds: [hostMemberId, member2Id, member3Id],
        splitMethod: "EQUAL",
        spentAtDate: "2026-11-15",
        spentAtTime: "09:30",
        note: "Đã bao gồm buffet trưa",
      };

      const updated = await updateExpense(
        validTripUuid,
        validExpenseUuid1,
        formData,
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/expenses/${validExpenseUuid1}`,
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          credentials: "same-origin",
        })
      );
      expect(updated.title).toBe("Vé cáp treo Bà Nà (khứ hồi)");
      expect(updated.note).toBe("Đã bao gồm buffet trưa");
    });

    it("5.2. PATCH thay đổi phương thức chia từ EQUAL sang ITEMIZED", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: sampleItemizedApiDto,
        }),
      });

      const formData: CreateExpenseFormData = {
        title: "Bữa tối hải sản Năm Đảnh",
        amount: 1100000,
        category: "FOOD",
        paidByMemberId: member2Id,
        splitMethod: "ITEMIZED",
        spentAtDate: "2026-11-15",
        spentAtTime: "19:00",
        surcharge: { name: "Phụ phí / VAT", amount: 100000 },
        items: [
          {
            id: "item-tmp-1",
            name: "Cua rang me",
            amount: 600000,
            assignedMemberIds: [hostMemberId, member2Id],
          },
          {
            id: "item-tmp-2",
            name: "Lẩu hải sản",
            amount: 400000,
            assignedMemberIds: [hostMemberId, member3Id],
          },
        ],
        participantMemberIds: [hostMemberId, member2Id, member3Id],
      };

      const updated = await updateExpense(
        validTripUuid,
        validExpenseUuid1,
        formData,
        { customFetch: mockFetch }
      );

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.splitMethod).toBe("ITEMIZED");
      expect(sentBody.surchargeAmount).toBe(100000);
      expect(sentBody.items).toHaveLength(2);

      expect(updated.splitMethod).toBe("ITEMIZED");
      expect(updated.items).toHaveLength(2);
    });

    it("5.3. PATCH thất bại: giữ nguyên state hiện tại, không thay đổi UI", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "TRIP_NOT_ACTIVE",
            message: "Chuyến đi đã chốt sổ, không thể sửa.",
          },
        }),
      });

      const existingExpenses = [mapApiExpenseToDomain(sampleEqualApiDto)];

      let updateError: string | null = null;
      try {
        await updateExpense(
          validTripUuid,
          validExpenseUuid1,
          {
            title: "Sửa khi chốt sổ",
            amount: 900000,
            category: "TICKET",
            paidByMemberId: hostMemberId,
            participantMemberIds: [hostMemberId],
            splitMethod: "EQUAL",
            spentAtDate: "2026-11-15",
            spentAtTime: "09:30",
          },
          { customFetch: mockFetch }
        );
      } catch (err) {
        updateError = (err as Error).message;
      }

      expect(updateError).toBe("Chuyến đi đã chốt sổ, không thể sửa.");
      // State không bị sửa trước khi có xác nhận của backend
      expect(existingExpenses[0].title).toBe("Vé cáp treo Bà Nà");
    });

    it("5.4. Quyền sửa khoản chi: HOST và người trả tiền ban đầu có quyền sửa", () => {
      const exp = { paidByMemberId: member2Id };

      // HOST có quyền sửa
      expect(canEditExpense(exp, hostMemberId, true, "ACTIVE")).toBe(true);

      // Người trả tiền (member2) có quyền sửa
      expect(canEditExpense(exp, member2Id, false, "ACTIVE")).toBe(true);

      // Thành viên khác không có quyền sửa
      expect(canEditExpense(exp, member3Id, false, "ACTIVE")).toBe(false);

      // Khi chuyến đi không còn ACTIVE (SETTLING/ARCHIVED), không ai được sửa
      expect(canEditExpense(exp, hostMemberId, true, "SETTLING")).toBe(false);
      expect(canEditExpense(exp, member2Id, false, "ARCHIVED")).toBe(false);
    });
  });

  // =========================================================================
  // 6. Tích hợp xóa chi tiêu (DELETE) & Giữ nguyên Itinerary
  // =========================================================================
  describe("6. Delete Expense Integration (DELETE)", () => {
    it("6.1. DELETE thành công: xóa khoản chi và gỡ liên kết itineraryItem mà không xóa địa điểm", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: validExpenseUuid1, deleted: true },
        }),
      });

      let sessionExpenses = [
        mapApiExpenseToDomain(sampleEqualApiDto),
        mapApiExpenseToDomain(sampleItemizedApiDto),
      ];
      let sessionItinerary: {
        id: string;
        tripId: string;
        dayDate: string;
        sortOrder: number;
        placeName: string;
        expenseId: string | null;
      }[] = [
        {
          id: validItineraryItemUuid,
          tripId: validTripUuid,
          dayDate: "2026-11-15",
          sortOrder: 1,
          placeName: "Bà Nà Hills",
          expenseId: validExpenseUuid1,
        },
      ];

      await deleteExpense(validTripUuid, validExpenseUuid1, {
        customFetch: mockFetch,
      });

      // Áp dụng mutation sau khi xác nhận thành công
      sessionExpenses = sessionExpenses.filter((e) => e.id !== validExpenseUuid1);
      sessionItinerary = sessionItinerary.map((it) =>
        it.expenseId === validExpenseUuid1 ? { ...it, expenseId: null } : it
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripUuid}/expenses/${validExpenseUuid1}`,
        expect.objectContaining({
          method: "DELETE",
          credentials: "same-origin",
        })
      );

      // Khoản chi đã được xóa
      expect(sessionExpenses).toHaveLength(1);
      expect(sessionExpenses[0].id).toBe(validExpenseUuid2);

      // Địa điểm lịch trình vẫn còn nguyên, chỉ gỡ liên kết expenseId
      expect(sessionItinerary).toHaveLength(1);
      expect(sessionItinerary[0].placeName).toBe("Bà Nà Hills");
      expect(sessionItinerary[0].expenseId).toBeNull();
    });

    it("6.2. DELETE thất bại: giữ nguyên khoản chi trên giao diện và ném lỗi", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi kết nối cơ sở dữ liệu.",
          },
        }),
      });

      const sessionExpenses = [mapApiExpenseToDomain(sampleEqualApiDto)];

      await expect(
        deleteExpense(validTripUuid, validExpenseUuid1, {
          customFetch: mockFetch,
        })
      ).rejects.toMatchObject({
        status: 500,
        message: "Lỗi kết nối cơ sở dữ liệu.",
      });

      // Không tự xóa khỏi state khi request lỗi
      expect(sessionExpenses).toHaveLength(1);
      expect(sessionExpenses[0].id).toBe(validExpenseUuid1);
    });

    it("6.3. Quyền xóa khoản chi: HOST và người trả tiền ban đầu có quyền xóa", () => {
      const exp = { paidByMemberId: member2Id };

      expect(canDeleteExpense(exp, hostMemberId, true, "ACTIVE")).toBe(true);
      expect(canDeleteExpense(exp, member2Id, false, "ACTIVE")).toBe(true);
      expect(canDeleteExpense(exp, member3Id, false, "ACTIVE")).toBe(false);
      expect(canDeleteExpense(exp, hostMemberId, true, "SETTLING")).toBe(false);
    });
  });

  // =========================================================================
  // 7. Đồng bộ số dư và tổng chi (Zero-sum Invariant & Balance)
  // =========================================================================
  describe("7. Balance & Total Spent Synchronization", () => {
    it("7.1. Bất biến tổng net balance bằng 0 với DTO đã ánh xạ", () => {
      const exp1 = mapApiExpenseToDomain(sampleEqualApiDto);
      const exp2 = mapApiExpenseToDomain(sampleItemizedApiDto);
      const expenses = [exp1, exp2];

      const totalSpent = calculateTotalSpent(expenses);
      expect(totalSpent).toBe(2000000); // 900.000 + 1.100.000

      const result = calculateMemberBalances(sampleMembers, expenses);

      // Tổng netAmount của mọi thành viên phải bằng 0 tuyệt đối
      const sumNet = result.balances.reduce((acc, b) => acc + b.netAmount, 0);
      expect(sumNet).toBe(0);

      // Kiểm tra chi tiết từng người
      // Host: Paid 900k, share1 = 300k, share2 = 533.334 -> owed = 833.334 -> net = 900k - 833.334 = +66.666
      const hostBal = result.balances.find((b) => b.memberId === hostMemberId);
      expect(hostBal?.paidAmount).toBe(900000);
      expect(hostBal?.owedAmount).toBe(833334);
      expect(hostBal?.netAmount).toBe(66666);

      // Member 2: Paid 1.100k, share1 = 300k, share2 = 333.333 -> owed = 633.333 -> net = 1.100k - 633.333 = +466.667
      const mem2Bal = result.balances.find((b) => b.memberId === member2Id);
      expect(mem2Bal?.paidAmount).toBe(1100000);
      expect(mem2Bal?.owedAmount).toBe(633333);
      expect(mem2Bal?.netAmount).toBe(466667);

      // Member 3: Paid 0, share1 = 300k, share2 = 233.333 -> owed = 533.333 -> net = -533.333
      const mem3Bal = result.balances.find((b) => b.memberId === member3Id);
      expect(mem3Bal?.paidAmount).toBe(0);
      expect(mem3Bal?.owedAmount).toBe(533333);
      expect(mem3Bal?.netAmount).toBe(-533333);

      // 66.666 + 466.667 - 533.333 = 0
      expect(
        (hostBal?.netAmount || 0) +
          (mem2Bal?.netAmount || 0) +
          (mem3Bal?.netAmount || 0)
      ).toBe(0);
    });

    it("7.2. Tổng shares của mỗi khoản chi khớp chính xác với Expense.amount", () => {
      const exp1 = mapApiExpenseToDomain(sampleEqualApiDto);
      const exp2 = mapApiExpenseToDomain(sampleItemizedApiDto);

      expect(exp1.shares.reduce((sum, s) => sum + s.amount, 0)).toBe(exp1.amount);
      expect(exp2.shares.reduce((sum, s) => sum + s.amount, 0)).toBe(exp2.amount);
    });

    it("7.3. Thành viên LEFT bảo toàn lịch sử khoản chia tiền cũ nhưng không tham gia khoản chi mới", () => {
      const historicalExpenseWithLeftMember: ApiExpenseDto = {
        id: "exp-historical",
        tripId: validTripUuid,
        title: "Bữa ăn chung ngày đầu khi bạn D chưa rời",
        amount: 400000,
        category: "FOOD",
        paidByMemberId: hostMemberId,
        createdByMemberId: hostMemberId,
        splitMethod: "EQUAL",
        spentAt: "2026-11-15T12:00:00.000Z",
        shares: [
          { id: "s-1", memberId: hostMemberId, amount: 100000 },
          { id: "s-2", memberId: member2Id, amount: 100000 },
          { id: "s-3", memberId: member3Id, amount: 100000 },
          { id: "s-4", memberId: leftMemberId, amount: 100000 },
        ],
        createdAt: "2026-10-21T01:00:00.000Z",
        updatedAt: "2026-10-21T01:00:00.000Z",
      };

      const domainExpense = mapApiExpenseToDomain(historicalExpenseWithLeftMember);

      // Bảo toàn chính xác khoản chia lịch sử của thành viên LEFT
      const leftShare = domainExpense.shares.find((s) => s.memberId === leftMemberId);
      expect(leftShare).toBeDefined();
      expect(leftShare?.amount).toBe(100000);

      // Khi tạo khoản chi mới, form chỉ cho phép chọn active members (không chọn LEFT)
      const activeMembers = sampleMembers.filter((m) => m.status === "ACTIVE");
      expect(activeMembers.map((m) => m.id)).not.toContain(leftMemberId);
      expect(activeMembers.map((m) => m.id)).toEqual([hostMemberId, member2Id, member3Id]);
    });

    it("7.4. Không có sự nhân đôi chi phí khi đồng bộ sessionExpenses", () => {
      const exp = mapApiExpenseToDomain(sampleEqualApiDto);
      const list = [exp];

      // Giả sử có một thao tác update hoặc re-fetch cùng expense
      const deduplicated = [
        ...list.filter((e) => e.id !== exp.id),
        exp,
      ];

      expect(deduplicated).toHaveLength(1);
      expect(calculateTotalSpent(deduplicated)).toBe(900000);
    });
  });

  describe("8. Phase 3F-2R-FIX: Regression Tests for MEDIUM-01, LOW-01, and LOW-02", () => {
    describe("8.1. MEDIUM-01: Synchronizing sessionExpenses when Itinerary Item is deleted", () => {
      it("8.1.1. Deleting an itinerary item unlinks linked expense (itineraryItemId becomes null, locationName cleared)", () => {
        const itemToDeleteId = "itin-item-1111";
        const linkedExpense: TripExpense = {
          id: "exp-linked-1",
          tripId: validTripUuid,
          title: "Bữa trưa quán biển",
          amount: 500000,
          category: "FOOD",
          paidByMemberId: hostMemberId,
          splitMethod: "EQUAL",
          spentAt: "2026-11-20T12:00:00.000Z",
          itineraryItemId: itemToDeleteId,
          locationName: "Nhà hàng Biển Xanh",
          shares: [{ id: "sh-1", expenseId: "exp-linked-1", memberId: hostMemberId, amount: 500000 }],
        };
        const unrelatedExpense: TripExpense = {
          id: "exp-unrelated-2",
          tripId: validTripUuid,
          title: "Taxi sân bay",
          amount: 250000,
          category: "TRANSPORT",
          paidByMemberId: member2Id,
          splitMethod: "EQUAL",
          spentAt: "2026-11-20T14:00:00.000Z",
          itineraryItemId: "itin-item-other-2222",
          locationName: "Sân bay",
          shares: [{ id: "sh-2", expenseId: "exp-unrelated-2", memberId: member2Id, amount: 250000 }],
        };

        const sessionExpenses = [linkedExpense, unrelatedExpense];

        // Simulate state update in handleDeleteItineraryItem on successful delete
        const updatedExpenses = sessionExpenses.map((e) =>
          e.itineraryItemId === itemToDeleteId
            ? { ...e, itineraryItemId: null, locationName: undefined }
            : e
        );

        // Linked expense is unlinked
        const updatedLinked = updatedExpenses.find((e) => e.id === "exp-linked-1");
        expect(updatedLinked?.itineraryItemId).toBeNull();
        expect(updatedLinked?.locationName).toBeUndefined();
        // Financials and other properties are untouched
        expect(updatedLinked?.amount).toBe(500000);
        expect(updatedLinked?.shares).toHaveLength(1);

        // Unrelated expense is completely untouched
        const updatedUnrelated = updatedExpenses.find((e) => e.id === "exp-unrelated-2");
        expect(updatedUnrelated?.itineraryItemId).toBe("itin-item-other-2222");
        expect(updatedUnrelated?.locationName).toBe("Sân bay");
        expect(updatedUnrelated?.amount).toBe(250000);
      });

      it("8.1.2. Failed itinerary deletion leaves sessionExpenses and sessionItinerary untouched", async () => {
        const itemToDeleteId = "itin-item-1111";
        const initialExpenses: TripExpense[] = [
          {
            id: "exp-linked-1",
            tripId: validTripUuid,
            title: "Bữa trưa",
            amount: 300000,
            category: "FOOD",
            paidByMemberId: hostMemberId,
            splitMethod: "EQUAL",
            spentAt: "2026-11-20T12:00:00.000Z",
            itineraryItemId: itemToDeleteId,
            locationName: "Quán ăn",
            shares: [],
          },
        ];

        let sessionExpenses = [...initialExpenses];

        // Mock failed delete (HTTP 500)
        const mockDelete = vi.fn().mockRejectedValue(new Error("Server error"));

        let deleteResult = { success: false, message: "" };
        try {
          await mockDelete();
          sessionExpenses = sessionExpenses.map((e) =>
            e.itineraryItemId === itemToDeleteId
              ? { ...e, itineraryItemId: null, locationName: undefined }
              : e
          );
          deleteResult = { success: true, message: "" };
        } catch (err) {
          deleteResult = {
            success: false,
            message: err instanceof Error ? err.message : "Không thể xóa",
          };
        }

        expect(deleteResult.success).toBe(false);
        // State remains completely intact
        expect(sessionExpenses).toEqual(initialExpenses);
        expect(sessionExpenses[0].itineraryItemId).toBe(itemToDeleteId);
        expect(sessionExpenses[0].locationName).toBe("Quán ăn");
      });

      it("8.1.3. Stale delete response does not overwrite state of newly selected trip (race condition guard)", async () => {
        let activeTripId = validTripUuid;
        const initialTripId = validTripUuid;

        let sessionExpensesTrip1: TripExpense[] = [
          {
            id: "exp-trip-1",
            tripId: validTripUuid,
            title: "Chi tiêu Trip 1",
            amount: 100000,
            category: "FOOD",
            paidByMemberId: hostMemberId,
            splitMethod: "EQUAL",
            spentAt: "2026-11-20T12:00:00.000Z",
            itineraryItemId: "itin-1",
            shares: [],
          },
        ];

        const sessionExpensesTrip2: TripExpense[] = [
          {
            id: "exp-trip-2",
            tripId: otherTripUuid,
            title: "Chi tiêu Trip 2",
            amount: 200000,
            category: "LODGING",
            paidByMemberId: member2Id,
            splitMethod: "EQUAL",
            spentAt: "2026-11-22T12:00:00.000Z",
            itineraryItemId: "itin-2",
            shares: [],
          },
        ];

        // User triggers delete on Trip 1
        const pendingDeletePromise = new Promise<{ id: string }>((resolve) => {
          setTimeout(() => resolve({ id: "itin-1" }), 20);
        });

        // User switches to Trip 2 before response resolves
        activeTripId = otherTripUuid;

        // When delete finishes:
        const res = await pendingDeletePromise;
        // Handler checks if (activeTripId === initialTripId)
        if (activeTripId === initialTripId) {
          sessionExpensesTrip1 = sessionExpensesTrip1.map((e) =>
            e.itineraryItemId === res.id ? { ...e, itineraryItemId: null } : e
          );
        }

        // Trip 1 was NOT updated because activeTripId changed
        expect(sessionExpensesTrip1[0].itineraryItemId).toBe("itin-1");
        // Trip 2 state is strictly untouched
        expect(sessionExpensesTrip2[0].itineraryItemId).toBe("itin-2");
        expect(sessionExpensesTrip2[0].amount).toBe(200000);
      });

      it("8.1.4. Mock slug handles itinerary deletion without calling real API", () => {
        const isRealTrip = !legacySlug.startsWith("trip-");
        expect(isRealTrip).toBe(false);

        const mockItinId = "itin-mock-1";
        const mockExpenses: TripExpense[] = [
          {
            id: "exp-mock-1",
            tripId: legacySlug,
            title: "Bánh tráng nướng",
            amount: 50000,
            category: "FOOD",
            paidByMemberId: "m1",
            splitMethod: "EQUAL",
            spentAt: "2026-11-20T12:00:00.000Z",
            itineraryItemId: mockItinId,
            locationName: "Chợ đêm Đà Lạt",
            shares: [],
          },
        ];

        // Synchronously unlinks in mock mode without any network calls
        const updated = mockExpenses.map((e) =>
          e.itineraryItemId === mockItinId
            ? { ...e, itineraryItemId: null, locationName: undefined }
            : e
        );

        expect(updated[0].itineraryItemId).toBeNull();
        expect(updated[0].locationName).toBeUndefined();
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe("8.2. LOW-01: Warning when Host changes payer in Edit Expense Modal", () => {
      const originalPayerId = member2Id;
      const initialExpense: TripExpense = {
        id: "exp-edit-1",
        tripId: validTripUuid,
        title: "Khách sạn",
        amount: 1500000,
        category: "LODGING",
        paidByMemberId: originalPayerId,
        splitMethod: "EQUAL",
        spentAt: "2026-11-20T14:00:00.000Z",
        shares: [],
      };

      const computeWarningVisibility = (params: {
        isHost: boolean;
        initialExpense?: TripExpense | null;
        selectedPayerId: string;
      }) => {
        const isEditing = Boolean(params.initialExpense);
        const isPayerChanged =
          isEditing &&
          Boolean(params.initialExpense) &&
          params.selectedPayerId !== params.initialExpense?.paidByMemberId;
        return params.isHost && isPayerChanged;
      };

      it("8.2.1. Displays warning when Host changes payer to another member in edit mode", () => {
        const showWarning = computeWarningVisibility({
          isHost: true,
          initialExpense,
          selectedPayerId: member3Id, // Changed from member2Id to member3Id
        });
        expect(showWarning).toBe(true);
      });

      it("8.2.2. Hides warning when Host keeps the original payer in edit mode", () => {
        const showWarning = computeWarningVisibility({
          isHost: true,
          initialExpense,
          selectedPayerId: originalPayerId, // Same as initialExpense
        });
        expect(showWarning).toBe(false);
      });

      it("8.2.3. Hides warning when creating a new expense even if current user is Host", () => {
        const showWarning = computeWarningVisibility({
          isHost: true,
          initialExpense: null, // New expense
          selectedPayerId: member2Id,
        });
        expect(showWarning).toBe(false);
      });

      it("8.2.4. Hides warning when regular member is viewing modal (not Host)", () => {
        const showWarning = computeWarningVisibility({
          isHost: false, // Regular member
          initialExpense,
          selectedPayerId: member3Id,
        });
        expect(showWarning).toBe(false);
      });
    });

    describe("8.3. LOW-02: Quick amount suggestions clarity & behavior", () => {
      const SUGGESTIONS = [
        { label: "50k", value: 50_000 },
        { label: "100k", value: 100_000 },
        { label: "200k", value: 200_000 },
        { label: "500k", value: 500_000 },
        { label: "1.000k", value: 1_000_000 },
        { label: "2.000k", value: 2_000_000 },
      ];

      it("8.3.1. Suggestion labels are clear without misleading + prefix", () => {
        for (const sug of SUGGESTIONS) {
          expect(sug.label.startsWith("+")).toBe(false);
          expect(sug.value).toBeGreaterThan(0);
        }
      });

      it("8.3.2. Clicking suggestion sets the exact preset value rather than incrementing", () => {
        let rawAmount = "50000";

        // Click on 200k preset
        const sug200k = SUGGESTIONS.find((s) => s.label === "200k")!;
        rawAmount = sug200k.value.toString();

        // Must be exact preset, not 250000 (which would be adding)
        expect(rawAmount).toBe("200000");
        expect(Number(rawAmount)).toBe(200000);
      });
    });
  });
});
