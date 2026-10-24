import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  ExpensesApiError,
  mapApiExpenseToDomain,
  mapFormDataToCreateExpenseInput,
  mapFormDataToUpdateExpenseInput,
  ApiExpenseDto,
} from "./expenses-api";
import { CreateExpenseFormData } from "@/types/trip";

describe("Expenses API Service (src/lib/services/expenses-api)", () => {
  const mockFetch = vi.fn();
  const validTripId = "11111111-2222-4333-8444-555555555555";
  const validExpenseId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const member1Id = "12345678-1234-4234-8234-123456789abc";
  const member2Id = "87654321-4321-4321-8321-cba987654321";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleExpenseDto: ApiExpenseDto = {
    id: validExpenseId,
    tripId: validTripId,
    title: "Bữa tối hải sản",
    amount: 300000,
    surchargeAmount: 30000,
    category: "FOOD",
    paidByMemberId: member1Id,
    paidBy: {
      id: member1Id,
      displayName: "Nguyễn Văn A",
      role: "HOST",
      status: "ACTIVE",
    },
    createdByMemberId: member1Id,
    createdBy: {
      id: member1Id,
      displayName: "Nguyễn Văn A",
    },
    splitMethod: "ITEMIZED",
    spentAt: "2026-11-20T19:00:00.000Z",
    receiptImageUrl: "https://example.com/receipt.jpg",
    note: "Ăn tại quán Bờ Biển",
    createdAt: "2026-11-20T19:30:00.000Z",
    updatedAt: "2026-11-20T19:30:00.000Z",
    itineraryItemId: "22222222-3333-4444-8555-666666666666",
    itineraryItem: {
      id: "22222222-3333-4444-8555-666666666666",
      placeName: "Nhà hàng Biển Xanh",
      dayDate: "2026-11-20",
    },
    shares: [
      {
        id: "share-1",
        memberId: member1Id,
        amount: 165000,
        member: { id: member1Id, displayName: "Nguyễn Văn A", status: "ACTIVE" },
      },
      {
        id: "share-2",
        memberId: member2Id,
        amount: 135000,
        member: { id: member2Id, displayName: "Trần Thị B", status: "ACTIVE" },
      },
    ],
    items: [
      {
        id: "item-1",
        name: "Lẩu cua",
        amount: 200000,
        assignedMembers: [{ id: member1Id, displayName: "Nguyễn Văn A", status: "ACTIVE" }],
      },
      {
        id: "item-2",
        name: "Mực nướng",
        amount: 70000,
        assignedMembers: [{ id: member2Id, displayName: "Trần Thị B", status: "ACTIVE" }],
      },
    ],
  };

  describe("1. fetchTripExpenses", () => {
    it("rejects when tripId is not a valid UUID", async () => {
      await expect(
        fetchTripExpenses("invalid-id", undefined, { customFetch: mockFetch })
      ).rejects.toThrow("Mã chuyến đi không hợp lệ");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("fetches expenses successfully and maps DTOs to domain TripExpense", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleExpenseDto],
        }),
      });

      const expenses = await fetchTripExpenses(validTripId, undefined, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/trips/${validTripId}/expenses`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      expect(expenses).toHaveLength(1);
      const exp = expenses[0];
      expect(exp.id).toBe(validExpenseId);
      expect(exp.amount).toBe(300000);
      expect(exp.category).toBe("FOOD");
      expect(exp.locationName).toBe("Nhà hàng Biển Xanh");
      expect(exp.surcharge?.amount).toBe(30000);
      expect(exp.shares).toHaveLength(2);
      expect(exp.items).toHaveLength(2);
      expect(exp.items?.[0].assignedMemberIds).toEqual([member1Id]);
    });

    it("appends category and splitMethod filters as query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      await fetchTripExpenses(
        validTripId,
        { category: "FOOD", splitMethod: "ITEMIZED" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/expenses?category=FOOD&splitMethod=ITEMIZED`,
        expect.any(Object)
      );
    });

    it("returns empty array when GET returns 200 with empty list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const expenses = await fetchTripExpenses(validTripId, undefined, {
        customFetch: mockFetch,
      });
      expect(expenses).toEqual([]);
    });

    it("throws ExpensesApiError on 401 Unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập." },
        }),
      });

      await expect(
        fetchTripExpenses(validTripId, undefined, { customFetch: mockFetch })
      ).rejects.toThrow(ExpensesApiError);
    });

    it("throws ExpensesApiError on 403 Forbidden", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập." },
        }),
      });

      await expect(
        fetchTripExpenses(validTripId, undefined, { customFetch: mockFetch })
      ).rejects.toThrow("Bạn không có quyền truy cập.");
    });

    it("throws ExpensesApiError on invalid JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Syntax error");
        },
      });

      await expect(
        fetchTripExpenses(validTripId, undefined, { customFetch: mockFetch })
      ).rejects.toThrow("Không thể đọc dữ liệu phản hồi");
    });
  });

  describe("2. createExpense", () => {
    it("rejects when tripId is not a valid UUID", async () => {
      await expect(
        createExpense(
          "invalid-id",
          {
            title: "Test",
            amount: 100000,
            category: "FOOD",
            paidByMemberId: member1Id,
            splitMethod: "EQUAL",
            participantMemberIds: [member1Id],
          },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow("Mã chuyến đi không hợp lệ");
    });

    it("posts EQUAL expense successfully and maps returned DTO", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            ...sampleExpenseDto,
            splitMethod: "EQUAL",
            surchargeAmount: 0,
            items: [],
          },
        }),
      });

      const res = await createExpense(
        validTripId,
        {
          title: "Bữa trưa",
          amount: 200000,
          category: "FOOD",
          paidByMemberId: member1Id,
          splitMethod: "EQUAL",
          participantMemberIds: [member1Id, member2Id],
        },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/expenses`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          credentials: "same-origin",
        })
      );
      expect(res.id).toBe(validExpenseId);
      expect(res.splitMethod).toBe("EQUAL");
    });

    it("accepts CreateExpenseFormData and converts to valid payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: sampleExpenseDto,
        }),
      });

      const formData: CreateExpenseFormData = {
        title: "Bữa tối hải sản",
        amount: 300000,
        category: "FOOD",
        paidByMemberId: member1Id,
        spentAtDate: "2026-11-20",
        spentAtTime: "19:00",
        splitMethod: "ITEMIZED",
        participantMemberIds: [member1Id, member2Id],
        surcharge: { name: "VAT", amount: 30000 },
        items: [
          { id: "1", name: "Lẩu", amount: 200000, assignedMemberIds: [member1Id] },
          { id: "2", name: "Mực", amount: 70000, assignedMemberIds: [member2Id] },
        ],
      };

      const res = await createExpense(validTripId, formData, { customFetch: mockFetch });
      expect(res.id).toBe(validExpenseId);

      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(calledBody.title).toBe("Bữa tối hải sản");
      expect(calledBody.splitMethod).toBe("ITEMIZED");
      expect(calledBody.surchargeAmount).toBe(30000);
      expect(calledBody.items).toHaveLength(2);
      expect(calledBody.tripId).toBeUndefined();
      expect(calledBody.createdByMemberId).toBeUndefined();
    });

    it("throws ExpensesApiError on 400 Bad Request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Số tiền không hợp lệ." },
        }),
      });

      await expect(
        createExpense(
          validTripId,
          {
            title: "Test",
            amount: 0,
            category: "FOOD",
            paidByMemberId: member1Id,
            splitMethod: "EQUAL",
            participantMemberIds: [member1Id],
          },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow("Số tiền không hợp lệ.");
    });
  });

  describe("3. updateExpense", () => {
    it("rejects when expenseId is not a valid UUID", async () => {
      await expect(
        updateExpense(
          validTripId,
          "invalid-id",
          { title: "Sửa tên" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow("Mã khoản chi không hợp lệ");
    });

    it("updates expense metadata via PATCH successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            ...sampleExpenseDto,
            title: "Tên đã sửa",
          },
        }),
      });

      const updated = await updateExpense(
        validTripId,
        validExpenseId,
        { title: "Tên đã sửa" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/expenses/${validExpenseId}`,
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          credentials: "same-origin",
        })
      );
      expect(updated.title).toBe("Tên đã sửa");
    });

    it("throws ExpensesApiError on 403 Forbidden", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: { code: "FORBIDDEN", message: "Bạn không có quyền sửa khoản chi này." },
        }),
      });

      await expect(
        updateExpense(
          validTripId,
          validExpenseId,
          { title: "Tên đã sửa" },
          { customFetch: mockFetch }
        )
      ).rejects.toThrow("Bạn không có quyền sửa khoản chi này.");
    });
  });

  describe("4. deleteExpense", () => {
    it("rejects when expenseId is not a valid UUID", async () => {
      await expect(
        deleteExpense(validTripId, "invalid-id", { customFetch: mockFetch })
      ).rejects.toThrow("Mã khoản chi không hợp lệ");
    });

    it("deletes expense successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: validExpenseId },
          message: "Đã xóa khoản chi thành công.",
        }),
      });

      const res = await deleteExpense(validTripId, validExpenseId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/expenses/${validExpenseId}`,
        expect.objectContaining({
          method: "DELETE",
          credentials: "same-origin",
        })
      );
      expect(res.id).toBe(validExpenseId);
    });

    it("throws ExpensesApiError on 404 Not Found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: "NOT_FOUND", message: "Không tìm thấy khoản chi." },
        }),
      });

      await expect(
        deleteExpense(validTripId, validExpenseId, { customFetch: mockFetch })
      ).rejects.toThrow("Không tìm thấy khoản chi.");
    });
  });

  describe("5. Mappers & Data Integrity", () => {
    it("mapApiExpenseToDomain preserves UUIDs, integer VND, items, shares, and surcharge", () => {
      const domain = mapApiExpenseToDomain(sampleExpenseDto);
      expect(domain.id).toBe(validExpenseId);
      expect(domain.tripId).toBe(validTripId);
      expect(domain.amount).toBe(300000);
      expect(domain.surcharge?.amount).toBe(30000);
      expect(domain.shares).toHaveLength(2);
      expect(domain.shares[0].amount).toBe(165000);
      expect(domain.items?.[0].amount).toBe(200000);
      expect(domain.locationName).toBe("Nhà hàng Biển Xanh");
      expect(domain.itineraryItemId).toBe("22222222-3333-4444-8555-666666666666");
    });

    it("mapFormDataToCreateExpenseInput excludes forbidden fields (tripId, createdByMemberId)", () => {
      const formData: CreateExpenseFormData = {
        title: "Cà phê",
        amount: 50000,
        category: "FOOD",
        paidByMemberId: member1Id,
        participantMemberIds: [member1Id],
        spentAtDate: "2026-11-20",
        spentAtTime: "08:30",
        splitMethod: "EQUAL",
      };

      const input = mapFormDataToCreateExpenseInput(formData);
      expect(input.title).toBe("Cà phê");
      expect(input.amount).toBe(50000);
      expect(input.splitMethod).toBe("EQUAL");
      // @ts-expect-error verification
      expect(input.tripId).toBeUndefined();
      // @ts-expect-error verification
      expect(input.createdByMemberId).toBeUndefined();
    });

    it("mapFormDataToUpdateExpenseInput formats fields for PATCH", () => {
      const formData: CreateExpenseFormData = {
        title: "Cà phê sáng",
        amount: 60000,
        category: "FOOD",
        paidByMemberId: member1Id,
        participantMemberIds: [member1Id],
        spentAtDate: "2026-11-20",
        splitMethod: "EQUAL",
      };

      const input = mapFormDataToUpdateExpenseInput(formData);
      expect(input.title).toBe("Cà phê sáng");
      expect(input.amount).toBe(60000);
      expect(input.splitMethod).toBe("EQUAL");
    });
  });
});
