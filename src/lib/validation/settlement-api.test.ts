import { describe, it, expect } from "vitest";
import {
  UpdateTransferInputSchema,
  SettlementQuerySchema,
  PaymentMethodSchema,
  TransferActionSchema,
} from "./settlement-api";

describe("Settlement API Validation Schemas", () => {
  describe("PaymentMethodSchema", () => {
    it("chấp nhận BANK_TRANSFER và CASH", () => {
      expect(PaymentMethodSchema.parse("BANK_TRANSFER")).toBe("BANK_TRANSFER");
      expect(PaymentMethodSchema.parse("CASH")).toBe("CASH");
    });

    it("từ chối các phương thức thanh toán không hợp lệ", () => {
      expect(() => PaymentMethodSchema.parse("CREDIT_CARD")).toThrow();
      expect(() => PaymentMethodSchema.parse("")).toThrow();
    });
  });

  describe("TransferActionSchema", () => {
    it("chấp nhận MARK_PAID và CONFIRM_COMPLETED", () => {
      expect(TransferActionSchema.parse("MARK_PAID")).toBe("MARK_PAID");
      expect(TransferActionSchema.parse("CONFIRM_COMPLETED")).toBe("CONFIRM_COMPLETED");
    });

    it("từ chối action lạ", () => {
      expect(() => TransferActionSchema.parse("CANCEL")).toThrow();
    });
  });

  describe("UpdateTransferInputSchema", () => {
    it("chấp nhận action MARK_PAID có hoặc không có paymentMethod", () => {
      const parsedWithMethod = UpdateTransferInputSchema.parse({
        action: "MARK_PAID",
        paymentMethod: "CASH",
      });
      expect(parsedWithMethod).toEqual({ action: "MARK_PAID", paymentMethod: "CASH" });

      const parsedWithoutMethod = UpdateTransferInputSchema.parse({
        action: "MARK_PAID",
      });
      expect(parsedWithoutMethod).toEqual({ action: "MARK_PAID" });
    });

    it("chấp nhận action CONFIRM_COMPLETED", () => {
      const parsed = UpdateTransferInputSchema.parse({
        action: "CONFIRM_COMPLETED",
      });
      expect(parsed).toEqual({ action: "CONFIRM_COMPLETED" });
    });

    it("chấp nhận status PAID và COMPLETED (phong cách status-based)", () => {
      const parsedPaid = UpdateTransferInputSchema.parse({
        status: "PAID",
        paymentMethod: "BANK_TRANSFER",
      });
      expect(parsedPaid).toEqual({ status: "PAID", paymentMethod: "BANK_TRANSFER" });

      const parsedCompleted = UpdateTransferInputSchema.parse({
        status: "COMPLETED",
      });
      expect(parsedCompleted).toEqual({ status: "COMPLETED" });
    });

    it("từ chối payload không hợp lệ hoặc rỗng", () => {
      expect(() => UpdateTransferInputSchema.parse({})).toThrow();
      expect(() => UpdateTransferInputSchema.parse({ action: "UNKNOWN" })).toThrow();
      expect(() => UpdateTransferInputSchema.parse({ status: "UNPAID" })).toThrow();
    });
  });

  describe("SettlementQuerySchema", () => {
    it("chấp nhận history = true hoặc false", () => {
      expect(SettlementQuerySchema.parse({ history: "true" })).toEqual({ history: "true" });
      expect(SettlementQuerySchema.parse({ history: "false" })).toEqual({ history: "false" });
      expect(SettlementQuerySchema.parse({})).toEqual({});
    });

    it("từ chối history không phải 'true' hoặc 'false'", () => {
      expect(() => SettlementQuerySchema.parse({ history: "yes" })).toThrow();
      expect(() => SettlementQuerySchema.parse({ history: "1" })).toThrow();
    });
  });
});
