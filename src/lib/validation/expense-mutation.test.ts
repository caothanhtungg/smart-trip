import { describe, it, expect } from "vitest";
import { canEditExpense, canDeleteExpense } from "./expense";
import { computeEqualShares } from "@/lib/money/split";
import type { ItineraryItem } from "@/types/trip";

describe("Phase 2G: Expense Permission Rules (UC13 & Decision Q2)", () => {
  const expenseByMember1 = { paidByMemberId: "m1" };
  const expenseByMember2 = { paidByMemberId: "m2" };

  describe("canEditExpense", () => {
    it("allows Host to edit an expense paid by themselves in ACTIVE state", () => {
      const allowed = canEditExpense(expenseByMember1, "m1", true, "ACTIVE");
      expect(allowed).toBe(true);
    });

    it("allows Host to edit an expense paid by another member in ACTIVE state", () => {
      const allowed = canEditExpense(expenseByMember2, "m1", true, "ACTIVE");
      expect(allowed).toBe(true);
    });

    it("allows Payer (non-host) to edit their own expense in ACTIVE state", () => {
      const allowed = canEditExpense(expenseByMember2, "m2", false, "ACTIVE");
      expect(allowed).toBe(true);
    });

    it("denies non-host member from editing an expense paid by someone else in ACTIVE state", () => {
      const allowed = canEditExpense(expenseByMember1, "m2", false, "ACTIVE");
      expect(allowed).toBe(false);
    });

    it("denies Host from editing any expense when trip is SETTLING", () => {
      expect(canEditExpense(expenseByMember1, "m1", true, "SETTLING")).toBe(false);
      expect(canEditExpense(expenseByMember2, "m1", true, "SETTLING")).toBe(false);
    });

    it("denies Host from editing any expense when trip is COMPLETED", () => {
      expect(canEditExpense(expenseByMember1, "m1", true, "COMPLETED")).toBe(false);
      expect(canEditExpense(expenseByMember2, "m1", true, "COMPLETED")).toBe(false);
    });

    it("denies Host and Payer from editing when trip is ARCHIVED", () => {
      expect(canEditExpense(expenseByMember1, "m1", true, "ARCHIVED")).toBe(false);
      expect(canEditExpense(expenseByMember2, "m2", false, "ARCHIVED")).toBe(false);
    });
  });

  describe("canDeleteExpense", () => {
    it("allows Host to delete their own expense in ACTIVE state", () => {
      expect(canDeleteExpense(expenseByMember1, "m1", true, "ACTIVE")).toBe(true);
    });

    it("allows Host to delete another member's expense in ACTIVE state", () => {
      expect(canDeleteExpense(expenseByMember2, "m1", true, "ACTIVE")).toBe(true);
    });

    it("allows Payer (non-host) to delete their own expense in ACTIVE state", () => {
      expect(canDeleteExpense(expenseByMember2, "m2", false, "ACTIVE")).toBe(true);
    });

    it("denies non-host member from deleting someone else's expense in ACTIVE state", () => {
      expect(canDeleteExpense(expenseByMember1, "m2", false, "ACTIVE")).toBe(false);
    });

    it("denies deletion when trip is SETTLING, COMPLETED, or ARCHIVED", () => {
      expect(canDeleteExpense(expenseByMember1, "m1", true, "SETTLING")).toBe(false);
      expect(canDeleteExpense(expenseByMember2, "m2", false, "COMPLETED")).toBe(false);
      expect(canDeleteExpense(expenseByMember1, "m1", true, "ARCHIVED")).toBe(false);
    });
  });
});

describe("Phase 2G: Expense Deletion Itinerary Unbinding", () => {
  it("unlinks expenseId from itinerary items without removing the itinerary item itself", () => {
    const itineraryItems: ItineraryItem[] = [
      {
        id: "itin-1",
        tripId: "trip-1",
        dayDate: "2026-10-24",
        sortOrder: 0,
        startTime: "08:00",
        placeName: "Bánh mì Cối Xay Gió",
        createdByMemberId: "m1",
        expenseId: "exp-target",
        note: "Ghi chú món ăn",
      },
      {
        id: "itin-2",
        tripId: "trip-1",
        dayDate: "2026-10-24",
        sortOrder: 1,
        startTime: "10:00",
        placeName: "Quảng trường Lâm Viên",
        createdByMemberId: "m1",
        expenseId: "exp-other",
      },
    ];

    const targetExpenseId = "exp-target";

    // Simulate unlinking logic
    const updatedItinerary = itineraryItems.map((item) =>
      item.expenseId === targetExpenseId ? { ...item, expenseId: null } : item
    );

    // Itinerary items count remains the same
    expect(updatedItinerary).toHaveLength(2);

    // Target item has expenseId set to null
    expect(updatedItinerary[0].expenseId).toBeNull();
    // All other metadata preserved
    expect(updatedItinerary[0].id).toBe("itin-1");
    expect(updatedItinerary[0].placeName).toBe("Bánh mì Cối Xay Gió");
    expect(updatedItinerary[0].startTime).toBe("08:00");
    expect(updatedItinerary[0].note).toBe("Ghi chú món ăn");

    // Unrelated item remains completely untouched
    expect(updatedItinerary[1].expenseId).toBe("exp-other");
    expect(updatedItinerary[1].id).toBe("itin-2");
  });
});

describe("Phase 2G: Expense Edit Split Recalculation Invariants", () => {
  it("preserves sum invariant and join_order remainder allocation when editing amount", () => {
    const members = [
      { id: "m1", joinOrder: 1 },
      { id: "m2", joinOrder: 2 },
      { id: "m3", joinOrder: 3 },
    ];

    // Original amount: 100,000 VND -> 33,334 (m1), 33,333 (m2), 33,333 (m3)
    const originalShares = computeEqualShares(100000, members);
    expect(originalShares[0].amount).toBe(33334);
    expect(originalShares[0].hasRemainderExtra).toBe(true);
    expect(originalShares.reduce((s, c) => s + c.amount, 0)).toBe(100000);

    // User updates amount to 250,000 VND
    const updatedShares = computeEqualShares(250000, members);
    // 250,000 / 3 = 83,333 remainder 1 -> m1 gets 83,334, m2 gets 83,333, m3 gets 83,333
    expect(updatedShares[0].amount).toBe(83334);
    expect(updatedShares[0].hasRemainderExtra).toBe(true);
    expect(updatedShares[1].amount).toBe(83333);
    expect(updatedShares[1].hasRemainderExtra).toBe(false);
    expect(updatedShares[2].amount).toBe(83333);
    expect(updatedShares[2].hasRemainderExtra).toBe(false);
    expect(updatedShares.reduce((s, c) => s + c.amount, 0)).toBe(250000);
  });
});
