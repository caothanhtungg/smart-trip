import { describe, it, expect } from "vitest";
import { mapSettlementDatabaseError } from "./settlement-db-errors";
import { ConflictError, BadRequestError } from "./errors";
import { Prisma } from "@/generated/prisma/client";

describe("mapSettlementDatabaseError", () => {
  it("ánh xạ unique constraint 'one_active_settlement' thành ConflictError (409)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed on one_active_settlement", {
      code: "P2002",
      clientVersion: "7.0.0",
      meta: { target: ["trip_id", "status"] },
    });

    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Chuyến đi đã có sổ quyết toán đang hoạt động");
  });

  it("ánh xạ CHECK constraint số tiền dương thành BadRequestError (400)", () => {
    const error = new Error("new row violates check constraint settlement_transfers_amount_positive");
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
    expect(mapped?.message).toContain("Số tiền chuyển khoản phải là số nguyên dương lớn hơn 0");
  });

  it("ánh xạ CHECK constraint hai thành viên khác nhau thành BadRequestError (400)", () => {
    const error = new Error("violates check constraint settlement_transfers_distinct_members");
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
    expect(mapped?.message).toContain("Người chuyển tiền và người nhận tiền không được trùng nhau");
  });

  it("ánh xạ CHECK constraint metadata UNPAID thành ConflictError (409)", () => {
    const error = new Error("violates check constraint settlement_transfers_unpaid_has_no_payment_metadata");
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Khoản chuyển tiền ở trạng thái chưa thanh toán không được chứa thông tin thanh toán");
  });

  it("ánh xạ CHECK constraint metadata PAID thành ConflictError (409)", () => {
    const error = new Error("violates check constraint settlement_transfers_paid_has_paid_metadata");
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Khoản chuyển tiền ở trạng thái đã thanh toán phải có thời gian và người đánh dấu");
  });

  it("ánh xạ CHECK constraint metadata COMPLETED thành ConflictError (409)", () => {
    const error = new Error("violates check constraint settlement_transfers_completed_has_completion_metadata");
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Khoản chuyển tiền ở trạng thái hoàn tất phải có đầy đủ thông tin");
  });

  it("ánh xạ foreign key P2003 thành BadRequestError (400) cho member liên quan", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
      code: "P2003",
      clientVersion: "7.0.0",
      meta: { field_name: "from_member_id" },
    });
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
    expect(mapped?.message).toContain("Thành viên liên quan không tồn tại");
  });

  it("ánh xạ deadlock P2034 thành ConflictError (409)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Transaction failed due to a write conflict or deadlock", {
      code: "P2034",
      clientVersion: "7.0.0",
    });
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Đang có thao tác khác can thiệp vào quyết toán hoặc chuyển tiền");
  });

  it("trả về null cho lỗi thông thường không thuộc danh mục DB", () => {
    const error = new Error("Some standard programming error");
    const mapped = mapSettlementDatabaseError(error);
    expect(mapped).toBeNull();
  });
});
