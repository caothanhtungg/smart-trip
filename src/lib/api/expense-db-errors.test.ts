import { describe, it, expect } from "vitest";
import { mapExpenseDatabaseError } from "./expense-db-errors";
import { BadRequestError, ConflictError, NotFoundError } from "./errors";

describe("Expense Database Error Mapping (src/lib/api/expense-db-errors)", () => {
  it("maps P2002 unique constraint on expense_shares to ConflictError", () => {
    const error = {
      code: "P2002",
      meta: {
        target: ["expense_id", "member_id"],
      },
    };
    const mapped = mapExpenseDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("phần chia chi phí");
  });

  it("maps P2002 unique constraint on expense_item_members to ConflictError", () => {
    const error = {
      code: "P2002",
      meta: {
        constraint: "expense_item_members_pkey",
      },
    };
    const mapped = mapExpenseDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("gán vào món ăn");
  });

  it("maps P2003 foreign key violation on member to BadRequestError", () => {
    const error = {
      code: "P2003",
      meta: {
        field_name: "expenses_paid_by_member_id_fkey",
      },
    };
    const mapped = mapExpenseDatabaseError(error);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
    expect(mapped?.message).toContain("Thành viên liên quan không tồn tại");
  });

  it("maps P2003 foreign key violation on itinerary to BadRequestError", () => {
    const error = {
      code: "P2003",
      meta: {
        field_name: "expenses_itinerary_item_id_fkey",
      },
    };
    const mapped = mapExpenseDatabaseError(error);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
    expect(mapped?.message).toContain("Điểm dừng lịch trình liên quan không tồn tại");
  });

  it("maps P2003 foreign key violation on trip to NotFoundError", () => {
    const error = {
      code: "P2003",
      meta: {
        field_name: "expenses_trip_id_fkey",
      },
    };
    const mapped = mapExpenseDatabaseError(error);
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(mapped?.statusCode).toBe(404);
  });

  it("maps P2004 check constraint on positive expense amount to BadRequestError", () => {
    const error = {
      code: "P2004",
      cause: {
        code: "23514",
        constraint: "expenses_amount_positive",
      },
    };
    const mapped = mapExpenseDatabaseError(error);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
    expect(mapped?.message).toContain("Số tiền khoản chi phải là số nguyên dương");
  });

  it("returns null for unknown / internal errors so they can be handled safely as 500", () => {
    const unknownError = {
      code: "P9999",
      message: "Something went completely wrong internally",
    };
    const mapped = mapExpenseDatabaseError(unknownError);
    expect(mapped).toBeNull();

    expect(mapExpenseDatabaseError(null)).toBeNull();
    expect(mapExpenseDatabaseError("not an object")).toBeNull();
  });
});
