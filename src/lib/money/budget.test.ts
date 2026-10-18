import { describe, it, expect } from "vitest";
import {
  calculateTotalSpent,
  calculateBudgetStatus,
  calculateAvgSpentPerPerson,
  calculateUserSpent,
  calculateUserShareTotal,
} from "@/lib/money/budget";

describe("budget calculations", () => {
  describe("calculateTotalSpent", () => {
    it("calculates sum of expense amounts safely", () => {
      expect(calculateTotalSpent([])).toBe(0);
      expect(
        calculateTotalSpent([{ amount: 150000 }, { amount: 350000 }])
      ).toBe(500000);
    });

    it("throws TypeError if expense amount is a decimal/float, NaN or Infinity", () => {
      expect(() => calculateTotalSpent([{ amount: 100000.7 }])).toThrow(TypeError);
      expect(() => calculateTotalSpent([{ amount: NaN }])).toThrow(TypeError);
      expect(() => calculateTotalSpent([{ amount: Infinity }])).toThrow(TypeError);
    });

    it("throws RangeError if expense amount is negative", () => {
      expect(() => calculateTotalSpent([{ amount: -50000 }])).toThrow(RangeError);
    });
  });

  describe("calculateBudgetStatus", () => {
    it("returns hasBudget: false and isOverBudget: false when planned budget is null or 0, even if money spent", () => {
      const nullBudgetStatus = calculateBudgetStatus(null, 5000000);
      expect(nullBudgetStatus).toEqual({
        hasBudget: false,
        remainingBudget: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
      });

      const zeroBudgetStatus = calculateBudgetStatus(0, 5000000);
      expect(zeroBudgetStatus).toEqual({
        hasBudget: false,
        remainingBudget: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
      });
    });

    it("handles under budget scenario when budget is set", () => {
      const status = calculateBudgetStatus(10000000, 8450000);
      expect(status).toEqual({
        hasBudget: true,
        remainingBudget: 1550000,
        isOverBudget: false,
        overBudgetAmount: 0,
      });
    });

    it("handles exact budget scenario when budget is set", () => {
      const status = calculateBudgetStatus(10000000, 10000000);
      expect(status).toEqual({
        hasBudget: true,
        remainingBudget: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
      });
    });

    it("handles over budget scenario when budget is set", () => {
      const status = calculateBudgetStatus(10000000, 11200000);
      expect(status).toEqual({
        hasBudget: true,
        remainingBudget: 0,
        isOverBudget: true,
        overBudgetAmount: 1200000,
      });
    });

    it("throws if amounts are decimals or negative", () => {
      expect(() => calculateBudgetStatus(100000.5, 50000)).toThrow(TypeError);
      expect(() => calculateBudgetStatus(100000, 50000.2)).toThrow(TypeError);
      expect(() => calculateBudgetStatus(-100000, 50000)).toThrow(RangeError);
      expect(() => calculateBudgetStatus(100000, -50000)).toThrow(RangeError);
    });
  });

  describe("calculateAvgSpentPerPerson", () => {
    it("divides total spent by member count (floor integer VND)", () => {
      expect(calculateAvgSpentPerPerson(1000000, 4)).toBe(250000);
      expect(calculateAvgSpentPerPerson(100000, 3)).toBe(33333);
    });

    it("throws RangeError if memberCount <= 0 or not a safe integer", () => {
      expect(() => calculateAvgSpentPerPerson(100000, 0)).toThrow(RangeError);
      expect(() => calculateAvgSpentPerPerson(100000, -1)).toThrow(RangeError);
      expect(() => calculateAvgSpentPerPerson(100000, 2.5)).toThrow(RangeError);
    });

    it("throws if totalSpent is not a safe integer or is negative", () => {
      expect(() => calculateAvgSpentPerPerson(100000.5, 2)).toThrow(TypeError);
      expect(() => calculateAvgSpentPerPerson(-100000, 2)).toThrow(RangeError);
    });
  });

  describe("calculateUserSpent", () => {
    it("sums amounts paid by a specific member", () => {
      const expenses = [
        { paidByMemberId: "m1", amount: 200000 },
        { paidByMemberId: "m2", amount: 500000 },
        { paidByMemberId: "m1", amount: 350000 },
      ];
      expect(calculateUserSpent(expenses, "m1")).toBe(550000);
      expect(calculateUserSpent(expenses, "m2")).toBe(500000);
      expect(calculateUserSpent(expenses, "m3")).toBe(0);
    });

    it("throws if any expense amount is decimal or negative", () => {
      expect(() =>
        calculateUserSpent([{ paidByMemberId: "m1", amount: 100.5 }], "m1")
      ).toThrow(TypeError);
      expect(() =>
        calculateUserSpent([{ paidByMemberId: "m1", amount: -100 }], "m1")
      ).toThrow(RangeError);
    });
  });

  describe("calculateUserShareTotal", () => {
    it("sums user shares across multiple expenses", () => {
      const expenses = [
        {
          shares: [
            { memberId: "m1", amount: 100000 },
            { memberId: "m2", amount: 100000 },
          ],
        },
        {
          shares: [
            { memberId: "m1", amount: 250000 },
            { memberId: "m3", amount: 250000 },
          ],
        },
      ];
      expect(calculateUserShareTotal(expenses, "m1")).toBe(350000);
      expect(calculateUserShareTotal(expenses, "m2")).toBe(100000);
      expect(calculateUserShareTotal(expenses, "m4")).toBe(0);
    });

    it("throws if any share amount is decimal or negative", () => {
      const expenses = [
        { shares: [{ memberId: "m1", amount: 50.5 }] },
      ];
      expect(() => calculateUserShareTotal(expenses, "m1")).toThrow(TypeError);
    });
  });
});
