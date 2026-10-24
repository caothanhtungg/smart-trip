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
  const parts: string[] = [];
  if (typeof error.meta?.constraint === "string") parts.push(error.meta.constraint);
  if (typeof error.cause?.constraint === "string") parts.push(error.cause.constraint);
  if (Array.isArray(error.meta?.target)) {
    parts.push(error.meta.target.join("_"));
  } else if (typeof error.meta?.target === "string") {
    parts.push(error.meta.target);
  }
  if (typeof error.meta?.field_name === "string") parts.push(error.meta.field_name);
  if (typeof error.meta?.table_name === "string") parts.push(error.meta.table_name);
  if (typeof error.message === "string") parts.push(error.message);
  if (typeof error.cause?.message === "string") parts.push(error.cause.message);
  if (typeof error.cause?.detail === "string") parts.push(error.cause.detail);
  return parts.join(" ").toLowerCase();
}

/**
 * Ánh xạ các lỗi database constraint đã biết liên quan đến Settlement & Transfers thành AppError an toàn.
 * Trả về null nếu lỗi không khớp với bất kỳ constraint đã biết nào (để handleApiError xử lý thành 500).
 */
export function mapSettlementDatabaseError(error: unknown): AppError | null {
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
      constraintId.includes("one_active_settlement") ||
      (constraintId.includes("trip_id") && constraintId.includes("status")) ||
      (constraintId.includes("settlements") && constraintId.includes("trip_id"))
    ) {
      return new ConflictError(
        "Chuyến đi đã có sổ quyết toán đang hoạt động."
      );
    }
  }

  // 2. P2003 / 23503: Foreign Key Constraint Violations
  const isForeignKeyViolation =
    code === "P2003" ||
    code === "23503" ||
    constraintId.includes("foreign key constraint");

  if (isForeignKeyViolation) {
    if (constraintId.includes("settlement_id")) {
      return new NotFoundError(
        "Không tìm thấy sổ quyết toán liên kết."
      );
    }
    if (
      constraintId.includes("from_member_id") ||
      constraintId.includes("to_member_id") ||
      constraintId.includes("paid_marked_by_member_id") ||
      constraintId.includes("completed_by_member_id") ||
      constraintId.includes("created_by_member_id")
    ) {
      return new BadRequestError(
        "Thành viên liên quan không tồn tại trong chuyến đi."
      );
    }
    if (constraintId.includes("trip_id")) {
      return new NotFoundError("Không tìm thấy chuyến đi.");
    }
  }

  // 3. 23514 / CHECK Constraint Violations
  const isCheckViolation =
    code === "23514" ||
    constraintId.includes("check constraint") ||
    constraintId.includes("violates check constraint");

  if (isCheckViolation) {
    if (constraintId.includes("settlement_transfers_amount_positive")) {
      return new BadRequestError(
        "Số tiền chuyển khoản phải là số nguyên dương lớn hơn 0."
      );
    }
    if (constraintId.includes("settlement_transfers_distinct_members")) {
      return new BadRequestError(
        "Người chuyển tiền và người nhận tiền không được trùng nhau."
      );
    }
    if (constraintId.includes("settlement_transfers_unpaid_has_no_payment_metadata")) {
      return new ConflictError(
        "Khoản chuyển tiền ở trạng thái chưa thanh toán không được chứa thông tin thanh toán."
      );
    }
    if (constraintId.includes("settlement_transfers_paid_has_paid_metadata")) {
      return new ConflictError(
        "Khoản chuyển tiền ở trạng thái đã thanh toán phải có thời gian và người đánh dấu, không được có thông tin hoàn tất."
      );
    }
    if (constraintId.includes("settlement_transfers_completed_has_completion_metadata")) {
      return new ConflictError(
        "Khoản chuyển tiền ở trạng thái hoàn tất phải có đầy đủ thông tin thanh toán và xác nhận."
      );
    }
  }

  // 4. P2034 / 40P01 / 40001: Transaction Serialization / Deadlock / Write Conflict
  if (
    code === "P2034" ||
    code === "40P01" ||
    code === "40001" ||
    constraintId.includes("deadlock detected") ||
    constraintId.includes("could not serialize access")
  ) {
    return new ConflictError(
      "Đang có thao tác khác can thiệp vào quyết toán hoặc chuyển tiền. Vui lòng thử lại sau.",
      { code: "TRANSACTION_CONFLICT" }
    );
  }

  return null;
}
