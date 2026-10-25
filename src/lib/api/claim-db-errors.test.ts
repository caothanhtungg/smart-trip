import { describe, it, expect } from "vitest";
import { mapClaimDatabaseError } from "./claim-db-errors";
import { ConflictError, NotFoundError } from "./errors";

describe("mapClaimDatabaseError (Phase 3ZN-H: Claim Concurrency Hardening)", () => {
  it("maps P2002 unique constraint on one_pending_claim to ConflictError (Rule R20)", () => {
    const error = {
      code: "P2002",
      meta: {
        target: ["trip_id", "userId"],
        constraint: "one_pending_claim",
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Rule R20");
  });

  it("maps PostgreSQL code 23505 with one_pending_claim constraint name to ConflictError", () => {
    const error = {
      code: "23505",
      meta: {
        constraint: "one_pending_claim",
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Rule R20");
  });

  it("maps nested cause error with one_pending_claim to ConflictError", () => {
    const error = {
      message: "An operation failed in the transaction",
      cause: {
        code: "23505",
        constraint: "one_pending_claim",
        message: 'duplicate key value violates unique constraint "one_pending_claim"',
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Rule R20");
  });

  it("maps P2002 / 23505 unique constraint on trip_members (trip_id, user_id) to ConflictError", () => {
    const error = {
      code: "P2002",
      meta: {
        target: ["trip_id", "user_id"],
        constraint: "trip_members_trip_id_user_id_key",
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).toContain("Người dùng này hiện đã là thành viên trong chuyến đi.");
  });

  it("maps foreign key violation on trip_id (P2003) to NotFoundError", () => {
    const error = {
      code: "P2003",
      meta: {
        constraint: "member_claims_trip_id_fkey",
        field_name: "trip_id",
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(mapped?.statusCode).toBe(404);
    expect(mapped?.message).toContain("Không tìm thấy chuyến đi");
  });

  it("maps foreign key violation on placeholder_member_id (P2003) to NotFoundError", () => {
    const error = {
      code: "P2003",
      meta: {
        constraint: "member_claims_placeholder_member_id_fkey",
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(mapped?.statusCode).toBe(404);
    expect(mapped?.message).toContain("Không tìm thấy vị trí thành viên");
  });

  it("returns null for non-claim unique constraints (fail-closed, not blindly converted)", () => {
    const error = {
      code: "P2002",
      meta: {
        target: ["some_unrelated_table_col"],
        constraint: "other_custom_unique",
      },
    };

    const mapped = mapClaimDatabaseError(error);
    expect(mapped).toBeNull();
  });

  it("returns null for generic or unhandled errors (e.g. disk full, connection drop)", () => {
    expect(mapClaimDatabaseError(new Error("Connection reset"))).toBeNull();
    expect(mapClaimDatabaseError({ code: "P2025" })).toBeNull();
    expect(mapClaimDatabaseError(null)).toBeNull();
    expect(mapClaimDatabaseError(undefined)).toBeNull();
    expect(mapClaimDatabaseError("string error")).toBeNull();
  });
});
