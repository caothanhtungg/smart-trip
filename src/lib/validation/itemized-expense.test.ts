import { describe, it, expect } from "vitest";
import { validateItemizedExpense } from "@/lib/validation/itemized-expense";
import type { TripMember, ExpenseItemData } from "@/types/trip";

const MOCK_MEMBERS: TripMember[] = [
  {
    id: "mem-1",
    tripId: "trip-dalat",
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
    tripId: "trip-dalat",
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
    tripId: "trip-dalat",
    userId: null,
    name: "Nam (Chưa có TK)",
    role: "MEMBER",
    status: "ACTIVE",
    isHost: false,
    isCurrentUser: false,
    isNoAccount: true,
    joinOrder: 3,
  },
  {
    id: "mem-left",
    tripId: "trip-dalat",
    userId: "user-left",
    name: "Đã Rời Nhóm",
    role: "MEMBER",
    status: "LEFT",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 4,
  },
];

describe("validateItemizedExpense", () => {
  const baseValidItems: ExpenseItemData[] = [
    { id: "i-1", name: "Lẩu bò", amount: 450_000, assignedMemberIds: ["mem-1", "mem-2", "mem-3"] },
    { id: "i-2", name: "Bia Tiger", amount: 150_000, assignedMemberIds: ["mem-1", "mem-3"] },
  ];
  const baseSurcharge = { name: "VAT 10%", amount: 60_000 };
  const totalBill = 660_000; // 450k + 150k + 60k

  it("passes for valid itemized expense with matched total", () => {
    const res = validateItemizedExpense(totalBill, baseValidItems, baseSurcharge, MOCK_MEMBERS);
    expect(res.isValid).toBe(true);
    expect(res.difference).toBe(0);
    expect(res.errors).toEqual({});
  });

  it("passes when there is no surcharge and items exactly match total", () => {
    const itemsWithoutSurcharge: ExpenseItemData[] = [
      { id: "i-1", name: "Cơm tấm", amount: 120_000, assignedMemberIds: ["mem-1"] },
      { id: "i-2", name: "Trà đá", amount: 20_000, assignedMemberIds: ["mem-1", "mem-2"] },
    ];
    const res = validateItemizedExpense(140_000, itemsWithoutSurcharge, null, MOCK_MEMBERS);
    expect(res.isValid).toBe(true);
    expect(res.difference).toBe(0);
  });

  describe("reconciliation & difference checks", () => {
    it("rejects when sum of items + surcharge exceeds total amount", () => {
      // items = 600k, surcharge = 60k -> 660k, but bill is 600k -> +60k excess
      const res = validateItemizedExpense(600_000, baseValidItems, baseSurcharge, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.difference).toBe(60_000);
      expect(res.errors.reconciliation).toMatch(/đang lớn hơn số tiền hóa đơn/);
      expect(res.errors.reconciliation).toMatch(/60\.000/);
    });

    it("rejects when sum of items + surcharge is less than total amount", () => {
      // items = 600k, surcharge = 60k -> 660k, but bill is 700k -> -40k deficit
      const res = validateItemizedExpense(700_000, baseValidItems, baseSurcharge, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.difference).toBe(-40_000);
      expect(res.errors.reconciliation).toMatch(/đang nhỏ hơn số tiền hóa đơn/);
      expect(res.errors.reconciliation).toMatch(/40\.000/);
    });
  });

  describe("items validation", () => {
    it("rejects empty items list", () => {
      const res = validateItemizedExpense(100_000, [], null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.items).toMatch(/ít nhất một món ăn/);
    });

    it("rejects item with empty or whitespace name", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "   ", amount: 100_000, assignedMemberIds: ["mem-1"] },
      ];
      const res = validateItemizedExpense(100_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.name).toMatch(/nhập tên món/);
    });

    it("rejects item with name exceeding 200 characters", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "M".repeat(201), amount: 100_000, assignedMemberIds: ["mem-1"] },
      ];
      const res = validateItemizedExpense(100_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.name).toMatch(/không được vượt quá 200 ký tự/);
    });

    it("rejects non-positive, zero, float, or NaN item amounts", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "Món 1", amount: 0, assignedMemberIds: ["mem-1"] },
        { id: "i-2", name: "Món 2", amount: -50_000, assignedMemberIds: ["mem-1"] },
        { id: "i-3", name: "Món 3", amount: 99.5, assignedMemberIds: ["mem-1"] },
      ];
      const res = validateItemizedExpense(100_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.amount).toMatch(/lớn hơn 0 ₫/);
      expect(res.errors.itemsList?.["i-2"]?.amount).toMatch(/lớn hơn 0 ₫/);
      expect(res.errors.itemsList?.["i-3"]?.amount).toMatch(/vượt quá giới hạn an toàn/);
    });

    it("rejects item without any assigned members", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "Lẩu gà", amount: 200_000, assignedMemberIds: [] },
      ];
      const res = validateItemizedExpense(200_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.members).toMatch(/chưa có người nhận/);
    });

    it("rejects item with duplicate member IDs in the same item", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "Lẩu gà", amount: 200_000, assignedMemberIds: ["mem-1", "mem-1"] },
      ];
      const res = validateItemizedExpense(200_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.members).toMatch(/trùng lặp/);
    });

    it("rejects item with non-existent member", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "Lẩu gà", amount: 200_000, assignedMemberIds: ["mem-fake"] },
      ];
      const res = validateItemizedExpense(200_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.members).toMatch(/không thuộc danh sách thành viên/);
    });

    it("rejects item with member whose status is LEFT", () => {
      const items: ExpenseItemData[] = [
        { id: "i-1", name: "Lẩu gà", amount: 200_000, assignedMemberIds: ["mem-left"] },
      ];
      const res = validateItemizedExpense(200_000, items, null, MOCK_MEMBERS);
      expect(res.isValid).toBe(false);
      expect(res.errors.itemsList?.["i-1"]?.members).toMatch(/đã rời nhóm/);
    });
  });

  describe("surcharge validation", () => {
    it("rejects negative surcharge amount", () => {
      const res = validateItemizedExpense(
        600_000,
        baseValidItems,
        { name: "VAT", amount: -20_000 },
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.surcharge).toMatch(/không được là số âm/);
    });

    it("accepts surcharge of 0 VND", () => {
      const res = validateItemizedExpense(
        600_000,
        baseValidItems,
        { name: "VAT", amount: 0 },
        MOCK_MEMBERS
      );
      expect(res.isValid).toBe(true);
    });
  });
});
