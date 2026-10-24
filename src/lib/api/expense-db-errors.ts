import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  AppError,
} from "./errors";

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
 * Trích xuất tên constraint hoặc target từ lỗi Prisma / PostgreSQL.
 */
function extractConstraintIdentifier(error: DatabaseErrorLike): string {
  const metaConstraint = typeof error.meta?.constraint === "string" ? error.meta.constraint : "";
  if (metaConstraint) return metaConstraint;

  const causeConstraint = typeof error.cause?.constraint === "string" ? error.cause.constraint : "";
  if (causeConstraint) return causeConstraint;

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.join("_");
  }
  if (typeof target === "string") {
    return target;
  }

  const fieldName = typeof error.meta?.field_name === "string" ? error.meta.field_name : "";
  if (fieldName) return fieldName;

  const msg = typeof error.message === "string" ? error.message : "";
  const causeMsg = typeof error.cause?.message === "string" ? error.cause.message : "";
  return `${msg} ${causeMsg}`;
}

/**
 * Ánh xạ các lỗi database constraint đã biết liên quan đến Expense thành AppError an toàn.
 * Trả về null nếu lỗi không khớp với bất kỳ constraint đã biết nào (để handleApiError xử lý thành 500).
 */
export function mapExpenseDatabaseError(error: unknown): AppError | null {
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
    if (
      constraintId.includes("expense_shares_expense_id_member_id_key") ||
      (constraintId.includes("expense_id") && constraintId.includes("member_id"))
    ) {
      return new ConflictError(
        "Thành viên này đã có phần chia chi phí trong khoản chi."
      );
    }
    if (
      constraintId.includes("expense_item_members_pkey") ||
      (constraintId.includes("item_id") && constraintId.includes("member_id"))
    ) {
      return new ConflictError(
        "Thành viên này đã được gán vào món ăn."
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
      constraintId.includes("paid_by_member_id") ||
      constraintId.includes("created_by_member_id") ||
      constraintId.includes("expense_shares_member_id_fkey") ||
      constraintId.includes("expense_item_members_member_id_fkey")
    ) {
      return new BadRequestError(
        "Thành viên liên quan không tồn tại hoặc không thuộc chuyến đi này."
      );
    }
    if (constraintId.includes("itinerary_item_id")) {
      return new BadRequestError(
        "Điểm dừng lịch trình liên quan không tồn tại hoặc không hợp lệ."
      );
    }
    if (constraintId.includes("trip_id")) {
      return new NotFoundError("Không tìm thấy chuyến đi.");
    }
  }

  // 3. P2004 / 23514: Check Constraint Violations
  const isCheckViolation =
    code === "P2004" ||
    code === "23514" ||
    constraintId.includes("check constraint");

  if (isCheckViolation) {
    if (constraintId.includes("expenses_amount_positive")) {
      return new BadRequestError("Số tiền khoản chi phải là số nguyên dương lớn hơn 0 ₫.");
    }
    if (constraintId.includes("expenses_surcharge_amount_non_negative")) {
      return new BadRequestError("Số tiền phụ phí không được là số âm.");
    }
    if (constraintId.includes("expense_shares_amount_non_negative")) {
      return new BadRequestError("Phần chia chi phí của thành viên không được là số âm.");
    }
    if (constraintId.includes("expense_items_amount_positive")) {
      return new BadRequestError("Giá của món ăn phải là số nguyên dương lớn hơn 0 ₫.");
    }
  }

  // Không khớp constraint đã biết -> không tự ý phân loại thành lỗi người dùng
  return null;
}
