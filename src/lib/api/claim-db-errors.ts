import { ConflictError, NotFoundError, AppError } from "./errors";

interface DatabaseErrorLike {
  name?: string;
  code?: string;
  message?: string;
  meta?: {
    target?: unknown;
    constraint?: unknown;
    field_name?: unknown;
    table_name?: unknown;
  };
  cause?: {
    code?: string;
    constraint?: unknown;
    message?: string;
    detail?: string;
  };
}

/**
 * Trích xuất định danh constraint hoặc target từ lỗi Prisma hoặc PostgreSQL.
 */
function extractConstraintIdentifier(error: DatabaseErrorLike): string {
  const metaConstraint =
    typeof error.meta?.constraint === "string" ? error.meta.constraint : "";
  if (metaConstraint) return metaConstraint;

  const causeConstraint =
    typeof error.cause?.constraint === "string" ? error.cause.constraint : "";
  if (causeConstraint) return causeConstraint;

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.join("_");
  }
  if (typeof target === "string") {
    return target;
  }

  const fieldName =
    typeof error.meta?.field_name === "string" ? error.meta.field_name : "";
  if (fieldName) return fieldName;

  const msg = typeof error.message === "string" ? error.message : "";
  const causeMsg = typeof error.cause?.message === "string" ? error.cause.message : "";
  return `${msg} ${causeMsg}`;
}

/**
 * Ánh xạ các lỗi database constraint đã biết liên quan đến Member Claims (UC33, Rule R20).
 * Trả về AppError tương ứng (ví dụ: ConflictError 409 khi vi phạm index one_pending_claim),
 * hoặc null nếu không phải lỗi constraint nghiệp vụ đã biết (để handleApiError xử lý thành 500 an toàn).
 */
export function mapClaimDatabaseError(error: unknown): AppError | null {
  if (!error || typeof error !== "object") return null;

  const e = error as DatabaseErrorLike;
  const code = e.code || e.cause?.code || "";
  const constraintId = extractConstraintIdentifier(e);

  // 1. P2002 / 23505: Unique Constraint Violations
  const isUniqueViolation =
    code === "P2002" ||
    code === "23505" ||
    constraintId.includes("unique constraint");

  if (isUniqueViolation) {
    // Unique constraint on trip_members: (trip_id, user_id)
    if (
      constraintId.includes("trip_members_trip_id_user_id") ||
      (constraintId.includes("trip_members") &&
        (constraintId.includes("user_id") || constraintId.includes("userId")))
    ) {
      return new ConflictError(
        "Người dùng này hiện đã là thành viên trong chuyến đi."
      );
    }

    // Partial unique index: "one_pending_claim" ON member_claims("trip_id", "userId") WHERE "status" = 'PENDING'
    if (
      constraintId.includes("one_pending_claim") ||
      (constraintId.includes("trip_id") && constraintId.includes("userId")) ||
      (constraintId.includes("tripId") && constraintId.includes("userId")) ||
      (constraintId.includes("member_claims") && constraintId.includes("userId"))
    ) {
      return new ConflictError(
        "Bạn đã có một yêu cầu nhận diện đang chờ duyệt trong chuyến đi này (Rule R20)."
      );
    }
  }

  // 2. P2003 / 23503: Foreign Key Constraint Violations
  const isForeignKeyViolation =
    code === "P2003" ||
    code === "23503" ||
    constraintId.includes("foreign key constraint");

  if (isForeignKeyViolation) {
    if (
      constraintId.includes("member_claims_trip_id_fkey") ||
      constraintId.includes("trip_id")
    ) {
      return new NotFoundError("Không tìm thấy chuyến đi.");
    }
    if (
      constraintId.includes("member_claims_placeholder_member_id_fkey") ||
      constraintId.includes("placeholder_member_id")
    ) {
      return new NotFoundError("Không tìm thấy vị trí thành viên trong chuyến đi.");
    }
    if (
      constraintId.includes("member_claims_userId_fkey") ||
      constraintId.includes("userId")
    ) {
      return new NotFoundError("Không tìm thấy tài khoản người dùng.");
    }
  }

  return null;
}
