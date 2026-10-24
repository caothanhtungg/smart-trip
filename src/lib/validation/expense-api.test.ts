import { describe, it, expect } from "vitest";
import {
  CreateExpenseApiSchema,
  UpdateExpenseApiSchema,
  ExpenseQuerySchema,
} from "./expense-api";
import { MAX_EXPENSE_AMOUNT } from "@/lib/money/constants";

describe("Expense API Validation Schemas (src/lib/validation/expense-api)", () => {
  const VALID_MEMBER_1 = "11111111-1111-4111-8111-111111111111";
  const VALID_MEMBER_2 = "22222222-2222-4222-8222-222222222222";

  describe("CreateExpenseApiSchema - EQUAL Split", () => {
    it("validates a valid EQUAL split expense payload", () => {
      const payload = {
        title: "Ăn trưa bún chả",
        amount: 150000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: VALID_MEMBER_1,
        participantMemberIds: [VALID_MEMBER_1, VALID_MEMBER_2],
        note: "Quán ngon",
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Ăn trưa bún chả");
        expect(result.data.amount).toBe(150000);
        expect(result.data.splitMethod).toBe("EQUAL");
      }
    });

    it("rejects empty title or title longer than 200 characters", () => {
      const payloadEmpty = {
        title: "   ",
        amount: 150000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: VALID_MEMBER_1,
        participantMemberIds: [VALID_MEMBER_1],
      };
      expect(CreateExpenseApiSchema.safeParse(payloadEmpty).success).toBe(false);

      const payloadTooLong = {
        ...payloadEmpty,
        title: "A".repeat(201),
      };
      expect(CreateExpenseApiSchema.safeParse(payloadTooLong).success).toBe(false);
    });

    it("rejects invalid amounts (negative, float, zero, exceeding max)", () => {
      const base = {
        title: "Cafe",
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: VALID_MEMBER_1,
        participantMemberIds: [VALID_MEMBER_1],
      };

      expect(CreateExpenseApiSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
      expect(CreateExpenseApiSchema.safeParse({ ...base, amount: -50000 }).success).toBe(false);
      expect(CreateExpenseApiSchema.safeParse({ ...base, amount: 150.5 }).success).toBe(false);
      expect(CreateExpenseApiSchema.safeParse({ ...base, amount: MAX_EXPENSE_AMOUNT + 1 }).success).toBe(false);
    });

    it("rejects duplicate participant IDs in EQUAL split", () => {
      const payload = {
        title: "Xem phim",
        amount: 200000,
        category: "TICKET",
        splitMethod: "EQUAL",
        paidByMemberId: VALID_MEMBER_1,
        participantMemberIds: [VALID_MEMBER_1, VALID_MEMBER_1],
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty participant list in EQUAL split", () => {
      const payload = {
        title: "Xem phim",
        amount: 200000,
        category: "TICKET",
        splitMethod: "EQUAL",
        paidByMemberId: VALID_MEMBER_1,
        participantMemberIds: [],
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects unknown/injected fields (strict schema)", () => {
      const payload = {
        title: "Ăn tối",
        amount: 300000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: VALID_MEMBER_1,
        participantMemberIds: [VALID_MEMBER_1],
        role: "HOST", // Unauthorized injection
        createdByMemberId: "hacker", // Unauthorized injection
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateExpenseApiSchema - ITEMIZED Split", () => {
    it("validates a valid ITEMIZED expense with exact reconciliation", () => {
      const payload = {
        title: "Ăn tối nhà hàng hải sản",
        amount: 550000,
        surchargeAmount: 50000,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: VALID_MEMBER_1,
        items: [
          {
            name: "Cua rang me",
            amount: 300000,
            assignedMemberIds: [VALID_MEMBER_1, VALID_MEMBER_2],
          },
          {
            name: "Mực nướng",
            amount: 200000,
            assignedMemberIds: [VALID_MEMBER_2],
          },
        ],
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects ITEMIZED expense when sum(items) + surcharge !== amount", () => {
      const payload = {
        title: "Ăn trưa",
        amount: 500000, // Should be 300k + 200k + 50k = 550k
        surchargeAmount: 50000,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: VALID_MEMBER_1,
        items: [
          {
            name: "Cua rang me",
            amount: 300000,
            assignedMemberIds: [VALID_MEMBER_1],
          },
          {
            name: "Mực nướng",
            amount: 200000,
            assignedMemberIds: [VALID_MEMBER_2],
          },
        ],
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects empty items array in ITEMIZED split", () => {
      const payload = {
        title: "Ăn trưa",
        amount: 500000,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: VALID_MEMBER_1,
        items: [],
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects item without assigned members or with duplicate assigned members", () => {
      const base = {
        title: "Ăn trưa",
        amount: 300000,
        surchargeAmount: 0,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: VALID_MEMBER_1,
      };

      const noMembers = {
        ...base,
        items: [
          {
            name: "Lẩu",
            amount: 300000,
            assignedMemberIds: [],
          },
        ],
      };
      expect(CreateExpenseApiSchema.safeParse(noMembers).success).toBe(false);

      const duplicateMembers = {
        ...base,
        items: [
          {
            name: "Lẩu",
            amount: 300000,
            assignedMemberIds: [VALID_MEMBER_1, VALID_MEMBER_1],
          },
        ],
      };
      expect(CreateExpenseApiSchema.safeParse(duplicateMembers).success).toBe(false);
    });

    it("rejects negative surchargeAmount", () => {
      const payload = {
        title: "Ăn trưa",
        amount: 300000,
        surchargeAmount: -10000,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: VALID_MEMBER_1,
        items: [
          {
            name: "Lẩu",
            amount: 310000,
            assignedMemberIds: [VALID_MEMBER_1],
          },
        ],
      };

      const result = CreateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateExpenseApiSchema", () => {
    it("validates partial metadata update", () => {
      const payload = {
        title: "Tên mới cập nhật",
        note: "Ghi chú mới",
      };

      const result = UpdateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects empty object update (at least one field required)", () => {
      const result = UpdateExpenseApiSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects injected fields in PATCH", () => {
      const payload = {
        title: "Title",
        role: "HOST",
        tripId: "some-trip-id",
      };

      const result = UpdateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("validates updating to ITEMIZED with items and amount", () => {
      const payload = {
        splitMethod: "ITEMIZED" as const,
        amount: 250000,
        surchargeAmount: 50000,
        items: [
          {
            name: "Món 1",
            amount: 200000,
            assignedMemberIds: [VALID_MEMBER_1],
          },
        ],
      };

      const result = UpdateExpenseApiSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("ExpenseQuerySchema", () => {
    it("parses query parameters properly", () => {
      const validQuery = {
        category: "FOOD",
        splitMethod: "EQUAL",
      };
      const result = ExpenseQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("accepts empty query parameters", () => {
      const result = ExpenseQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
