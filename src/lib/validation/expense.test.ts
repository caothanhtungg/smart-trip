import { describe, it, expect } from "vitest";
import { validateExpenseForm, MAX_EXPENSE_AMOUNT } from "@/lib/validation/expense";
import {
  EXPENSE_CATEGORY_COLOR_CLASSES,
  getExpenseCategoryColorClasses,
  getExpenseCategoryLabel,
} from "@/lib/labels";
import type { TripMember, ExpenseCategory } from "@/types/trip";

const MOCK_MEMBERS: TripMember[] = [
  {
    id: "mem-1",
    tripId: "trip-dalat-3n2d",
    userId: "user-1",
    name: "Minh",
    role: "HOST",
    status: "ACTIVE",
    isHost: true,
    isCurrentUser: true,
    joinOrder: 1,
  },
  {
    id: "mem-2",
    tripId: "trip-dalat-3n2d",
    userId: "user-2",
    name: "Lan",
    role: "MEMBER",
    status: "ACTIVE",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 2,
  },
  {
    id: "mem-3",
    tripId: "trip-dalat-3n2d",
    userId: "user-3",
    name: "Tùng",
    role: "MEMBER",
    status: "ACTIVE",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 3,
  },
  {
    id: "mem-4",
    tripId: "trip-dalat-3n2d",
    userId: "user-4",
    name: "Hà",
    role: "MEMBER",
    status: "ACTIVE",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 4,
  },
  {
    id: "mem-5",
    tripId: "trip-dalat-3n2d",
    userId: null,
    name: "Nam (Chưa có TK)",
    role: "MEMBER",
    status: "ACTIVE",
    isHost: false,
    isCurrentUser: false,
    isNoAccount: true,
    joinOrder: 5,
  },
  {
    id: "mem-left",
    tripId: "trip-dalat-3n2d",
    userId: "user-left",
    name: "Người Đã Rời Nhóm",
    role: "MEMBER",
    status: "LEFT",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 6,
  },
];

describe("validateExpenseForm", () => {
  const baseValidData = {
    title: "Ăn tối lẩu gà lá é",
    amount: 450_000,
    category: "FOOD" as const,
    paidByMemberId: "mem-1",
    participantMemberIds: ["mem-1", "mem-2", "mem-3"],
    spentAtDate: "2026-11-20",
    splitMethod: "EQUAL" as const,
  };

  it("passes for valid complete data", () => {
    const result = validateExpenseForm(baseValidData, "mem-1", true, MOCK_MEMBERS);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  describe("title validation", () => {
    it("rejects empty or whitespace title", () => {
      const r1 = validateExpenseForm({ ...baseValidData, title: "" }, "mem-1", true, MOCK_MEMBERS);
      expect(r1.isValid).toBe(false);
      expect(r1.errors.title).toMatch(/Vui lòng nhập tên khoản chi/);

      const r2 = validateExpenseForm({ ...baseValidData, title: "   " }, "mem-1", true, MOCK_MEMBERS);
      expect(r2.isValid).toBe(false);
      expect(r2.errors.title).toMatch(/Vui lòng nhập tên khoản chi/);
    });

    it("rejects titles exceeding 200 characters", () => {
      const longTitle = "A".repeat(201);
      const res = validateExpenseForm({ ...baseValidData, title: longTitle }, "mem-1", true, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.title).toMatch(/không được vượt quá 200 ký tự/);
    });

    it("accepts title of exactly 200 characters", () => {
      const validTitle = "B".repeat(200);
      const res = validateExpenseForm({ ...baseValidData, title: validTitle }, "mem-1", true, MOCK_MEMBERS);
      expect(res.isValid).toBe(true);
    });
  });

  describe("amount validation (Rule R3 integer VND & PostgreSQL INT safety)", () => {
    it("rejects non-positive amounts, zero, NaN, or non-integers", () => {
      expect(validateExpenseForm({ ...baseValidData, amount: 0 }, "mem-1", true, MOCK_MEMBERS).isValid).toBe(false);
      expect(validateExpenseForm({ ...baseValidData, amount: -100 }, "mem-1", true, MOCK_MEMBERS).isValid).toBe(false);
      expect(validateExpenseForm({ ...baseValidData, amount: NaN }, "mem-1", true, MOCK_MEMBERS).isValid).toBe(false);
      expect(validateExpenseForm({ ...baseValidData, amount: 150000.5 }, "mem-1", true, MOCK_MEMBERS).isValid).toBe(false);
    });

    it("rejects amount exceeding MAX_EXPENSE_AMOUNT (2,000,000,000 VND)", () => {
      const rExcess = validateExpenseForm(
        { ...baseValidData, amount: MAX_EXPENSE_AMOUNT + 1 },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(rExcess.isValid).toBe(false);
      expect(rExcess.errors.amount).toMatch(/không được vượt quá 2.000.000.000/);
    });

    it("accepts exactly MAX_EXPENSE_AMOUNT", () => {
      const rMax = validateExpenseForm(
        { ...baseValidData, amount: MAX_EXPENSE_AMOUNT },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(rMax.isValid).toBe(true);
    });

    it("rejects when data.amount + currentTripTotalSpent exceeds MAX_MONEY_VND (2 billion VND)", () => {
      // Đã chi 1.8 tỷ, thêm khoản chi 300 triệu -> tổng 2.1 tỷ > 2 tỷ
      const rOver = validateExpenseForm(
        { ...baseValidData, amount: 300_000_000 },
        "mem-1",
        true,
        MOCK_MEMBERS,
        1_800_000_000
      );
      expect(rOver.isValid).toBe(false);
      expect(rOver.errors.amount).toBe(
        "Tổng chi tiêu của chuyến đi không được vượt quá 2.000.000.000 ₫."
      );

      // Đã chi 1.8 tỷ, thêm khoản chi 200 triệu -> tổng 2.0 tỷ <= 2 tỷ -> hợp lệ
      const rExact = validateExpenseForm(
        { ...baseValidData, amount: 200_000_000 },
        "mem-1",
        true,
        MOCK_MEMBERS,
        1_800_000_000
      );
      expect(rExact.isValid).toBe(true);
    });
  });

  describe("category validation", () => {
    it("rejects invalid category", () => {
      const res = validateExpenseForm(
        { ...baseValidData, category: "FLIGHT" as unknown as ExpenseCategory },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.category).toMatch(/danh mục chi tiêu hợp lệ/);
    });

    it("accepts all 6 ERD categories", () => {
      const categories = ["FOOD", "TRANSPORT", "LODGING", "TICKET", "SHOPPING", "OTHER"] as const;
      for (const cat of categories) {
        const res = validateExpenseForm({ ...baseValidData, category: cat }, "mem-1", true, MOCK_MEMBERS);
        expect(res.isValid).toBe(true);
      }
    });
  });

  describe("payer permissions (Rule R18 & MemberStatus)", () => {
    it("allows regular member to record expense paid by herself", () => {
      const res = validateExpenseForm(
        { ...baseValidData, paidByMemberId: "mem-2" },
        "mem-2",
        false, // not host
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(true);
    });

    it("forbids regular member from recording expense paid by another member (R18)", () => {
      const res = validateExpenseForm(
        { ...baseValidData, paidByMemberId: "mem-1" },
        "mem-2",
        false, // not host
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.paidByMemberId).toMatch(/Quy tắc R18/);
    });

    it("allows host to record on behalf of another active member", () => {
      const res = validateExpenseForm(
        { ...baseValidData, paidByMemberId: "mem-2" },
        "mem-1",
        true, // is host
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(true);
    });

    it("allows host to record on behalf of member without account", () => {
      const res = validateExpenseForm(
        { ...baseValidData, paidByMemberId: "mem-5" },
        "mem-1",
        true, // is host
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(true);
    });

    it("rejects non-existent member as payer", () => {
      const res = validateExpenseForm(
        { ...baseValidData, paidByMemberId: "mem-unknown" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.paidByMemberId).toMatch(/không thuộc danh sách thành viên/);
    });

    it("rejects payer whose status is LEFT", () => {
      const res = validateExpenseForm(
        { ...baseValidData, paidByMemberId: "mem-left" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.paidByMemberId).toMatch(/đã rời nhóm hoặc không ở trạng thái hoạt động/);
    });
  });

  describe("participants validation", () => {
    it("rejects empty participants list", () => {
      const res = validateExpenseForm(
        { ...baseValidData, participantMemberIds: [] },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.participants).toMatch(/ít nhất 1 thành viên/);
    });

    it("rejects participants list with duplicate IDs", () => {
      const res = validateExpenseForm(
        { ...baseValidData, participantMemberIds: ["mem-1", "mem-2", "mem-1"] },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.participants).toMatch(/trùng lặp/);
    });

    it("rejects non-existent participant ID", () => {
      const res = validateExpenseForm(
        { ...baseValidData, participantMemberIds: ["mem-1", "mem-fake"] },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.participants).toMatch(/không thuộc chuyến đi/);
    });

    it("rejects participant with status LEFT", () => {
      const res = validateExpenseForm(
        { ...baseValidData, participantMemberIds: ["mem-1", "mem-left"] },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.participants).toMatch(/đã rời nhóm, không thể tham gia chia tiền/);
    });
  });

  describe("spentAtDate validation", () => {
    it("accepts valid ISO date YYYY-MM-DD", () => {
      const res = validateExpenseForm(
        { ...baseValidData, spentAtDate: "2026-11-20" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(true);
    });

    it("accepts valid Vietnamese date DD/MM/YYYY", () => {
      const res = validateExpenseForm(
        { ...baseValidData, spentAtDate: "20/11/2026" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(true);
    });

    it("rejects empty or whitespace date", () => {
      const res = validateExpenseForm(
        { ...baseValidData, spentAtDate: "" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.spentAtDate).toMatch(/chọn ngày phát sinh/);
    });

    it("rejects impossible calendar dates (31/02, 31/04)", () => {
      const rFeb = validateExpenseForm(
        { ...baseValidData, spentAtDate: "31/02/2026" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(rFeb.isValid).toBe(false);
      expect(rFeb.errors.spentAtDate).toMatch(/không đúng định dạng lịch/);

      const rApr = validateExpenseForm(
        { ...baseValidData, spentAtDate: "2026-04-31" },
        "mem-1",
        true,
        MOCK_MEMBERS
      );
      expect(rApr.isValid).toBe(false);
      expect(rApr.errors.spentAtDate).toMatch(/không đúng định dạng lịch/);
    });
  });
});

describe("category labels and color classes", () => {
  it("maps categories to Vietnamese labels", () => {
    expect(getExpenseCategoryLabel("FOOD")).toBe("Ăn uống");
    expect(getExpenseCategoryLabel("TRANSPORT")).toBe("Di chuyển");
    expect(getExpenseCategoryLabel("LODGING")).toBe("Lưu trú");
    expect(getExpenseCategoryLabel("TICKET")).toBe("Vé tham quan");
    expect(getExpenseCategoryLabel("SHOPPING")).toBe("Mua sắm");
    expect(getExpenseCategoryLabel("OTHER")).toBe("Khác");
  });

  it("provides color token classes for each category without hardcoded hex", () => {
    const categories = ["FOOD", "TRANSPORT", "LODGING", "TICKET", "SHOPPING", "OTHER"] as const;
    for (const cat of categories) {
      const classes = getExpenseCategoryColorClasses(cat);
      expect(classes).toBeDefined();
      expect(typeof classes.bg).toBe("string");
      expect(typeof classes.text).toBe("string");
      expect(classes).toEqual(EXPENSE_CATEGORY_COLOR_CLASSES[cat]);
    }
  });
});
