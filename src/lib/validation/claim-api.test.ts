import { describe, it, expect } from "vitest";
import { CreateClaimSchema, DecideClaimSchema } from "./claim-api";

describe("Claim API Validation Schemas", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  describe("CreateClaimSchema (UC33)", () => {
    it("accepts valid UUID placeholderMemberId", () => {
      const parsed = CreateClaimSchema.safeParse({ placeholderMemberId: validUuid });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.placeholderMemberId).toBe(validUuid);
      }
    });

    it("rejects non-UUID placeholderMemberId", () => {
      const parsed = CreateClaimSchema.safeParse({ placeholderMemberId: "not-a-uuid" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0].message).toContain("không hợp lệ");
      }
    });

    it("rejects missing placeholderMemberId", () => {
      const parsed = CreateClaimSchema.safeParse({});
      expect(parsed.success).toBe(false);
    });

    it("rejects extraneous fields (strict object)", () => {
      const parsed = CreateClaimSchema.safeParse({
        placeholderMemberId: validUuid,
        userId: validUuid,
        role: "HOST",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("DecideClaimSchema (UC30)", () => {
    it("accepts decision = APPROVE", () => {
      const parsed = DecideClaimSchema.safeParse({ decision: "APPROVE" });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe("APPROVE");
      }
    });

    it("accepts decision = REJECT", () => {
      const parsed = DecideClaimSchema.safeParse({ decision: "REJECT" });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe("REJECT");
      }
    });

    it("accepts action = APPROVE as alias and normalizes to decision", () => {
      const parsed = DecideClaimSchema.safeParse({ action: "APPROVE" });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe("APPROVE");
      }
    });

    it("accepts action = REJECT as alias and normalizes to decision", () => {
      const parsed = DecideClaimSchema.safeParse({ action: "REJECT" });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.decision).toBe("REJECT");
      }
    });

    it("rejects invalid decision enum value", () => {
      const parsed = DecideClaimSchema.safeParse({ decision: "CANCEL" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0].message).toContain("APPROVE");
      }
    });

    it("rejects empty payload", () => {
      const parsed = DecideClaimSchema.safeParse({});
      expect(parsed.success).toBe(false);
    });
  });
});
