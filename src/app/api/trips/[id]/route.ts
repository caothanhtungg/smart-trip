import { requireTripMembership } from "@/lib/api/auth-guard";
import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  BadRequestError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { UpdateTripSchema } from "@/lib/validation/trip";

export const TRIP_DATE_CHECK_CONSTRAINT = "trips_end_date_gte_start_date";

/**
 * Kiểm tra xem một lỗi cơ sở dữ liệu có phải là vi phạm ràng buộc CHECK
 * trips_end_date_gte_start_date trên bảng trips hay không.
 *
 * Hỗ trợ nhận diện cả hai dạng lỗi trong Prisma Client + @prisma/adapter-pg:
 * 1. Lỗi Prisma P2004 (database constraint failed) kèm metadata / message.
 * 2. Lỗi DriverAdapterError với nguyên nhân lồng bên trong (cause.kind = "postgres",
 *    SQLSTATE 23514, và tên constraint cụ thể).
 *
 * Lưu ý bảo mật & tính chính xác:
 * - Mã lỗi 23514 hoặc P2004 đơn lẻ KHÔNG đủ điều kiện (phải khớp chính xác constraint trips_end_date_gte_start_date).
 * - Các CHECK constraint khác (vd: expenses_amount_positive) hoặc lỗi Postgres khác tuyệt đối không được ánh xạ nhầm.
 */
export function isTripDateConstraintViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  interface NestedPgCause {
    kind?: string;
    code?: string;
    originalCode?: string;
    severity?: string;
    message?: string;
    originalMessage?: string;
    detail?: string;
    column?: string;
    hint?: string;
    table?: string;
    constraint?: string;
  }

  const e = error as {
    name?: string;
    code?: string;
    message?: string;
    meta?: {
      constraint?: unknown;
      database_error?: unknown;
      target?: unknown;
      driverAdapterError?: {
        name?: string;
        cause?: NestedPgCause;
        message?: string;
      };
    };
    cause?: NestedPgCause;
  };

  const pgCause =
    e.cause?.kind === "postgres" || e.name === "DriverAdapterError"
      ? e.cause
      : e.meta?.driverAdapterError?.cause?.kind === "postgres"
      ? e.meta.driverAdapterError.cause
      : e.cause;

  // 1. Kiểm tra dấu hiệu vi phạm CHECK constraint (P2004 hoặc SQLSTATE 23514)
  const isP2004 = e.code === "P2004";
  const isSqlstate23514 =
    e.code === "23514" ||
    pgCause?.code === "23514" ||
    pgCause?.originalCode === "23514";

  const hasCheckConstraintMessage =
    (typeof e.message === "string" &&
      (e.message.includes("check constraint") || e.message.includes("violates check constraint"))) ||
    (typeof pgCause?.message === "string" &&
      (pgCause.message.includes("check constraint") || pgCause.message.includes("violates check constraint")));

  const isConstraintViolation = isP2004 || isSqlstate23514 || hasCheckConstraintMessage;

  if (!isConstraintViolation) {
    return false;
  }

  // 2. Bắt buộc phải xác nhận đúng constraint trips_end_date_gte_start_date cụ thể
  const targetConstraint = TRIP_DATE_CHECK_CONSTRAINT;

  // Kiểm tra meta (Prisma P2004)
  if (typeof e.meta?.constraint === "string" && e.meta.constraint.includes(targetConstraint)) {
    return true;
  }
  if (typeof e.meta?.database_error === "string" && e.meta.database_error.includes(targetConstraint)) {
    return true;
  }

  // Kiểm tra DriverAdapterError cause fields
  if (typeof pgCause?.constraint === "string" && pgCause.constraint.includes(targetConstraint)) {
    return true;
  }
  if (typeof pgCause?.message === "string" && pgCause.message.includes(targetConstraint)) {
    return true;
  }
  if (typeof pgCause?.detail === "string" && pgCause.detail.includes(targetConstraint)) {
    return true;
  }

  // Kiểm tra error top-level message
  if (typeof e.message === "string" && e.message.includes(targetConstraint)) {
    return true;
  }

  return false;
}

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * GET /api/trips/[id]
 * Lấy thông tin chi tiết của chuyến đi và danh sách thành viên ACTIVE.
 *
 * BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ (401 nếu chưa).
 * - Trả 404 cho ID không hợp lệ hoặc chuyến đi không tồn tại trong database.
 * - Chỉ thành viên có status = 'ACTIVE' trong chuyến đi mới được xem (403 nếu không thuộc chuyến đi hoặc đã LEFT).
 * - Tuyệt đối không trả về bankAccountNo, bankBin, bankAccountKeyVersion, tokens hay password.
 */
export async function GET(
  _req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;

    // Xác thực người dùng và quyền thành viên ACTIVE
    const { user, member } = await requireTripMembership(tripId);

    // Truy vấn thông tin chuyến đi cùng danh sách thành viên ACTIVE
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            userId: true,
            displayName: true,
            role: true,
            status: true,
            joinOrder: true,
            user: {
              select: {
                image: true,
              },
            },
          },
          orderBy: {
            joinOrder: "asc",
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }

    const data = {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate.toISOString().split("T")[0],
      endDate: trip.endDate.toISOString().split("T")[0],
      budgetAmount: trip.budgetAmount,
      status: trip.status,
      inviteCode: trip.inviteCode,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
      memberCount: trip.members.length,
      myMemberId: member.id,
      myRole: member.role,
      members: trip.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.displayName,
        displayName: m.displayName,
        role: m.role,
        status: m.status,
        joinOrder: m.joinOrder,
        avatarUrl: m.user?.image ?? null,
        isCurrentUser: m.userId === user.id,
        isHost: m.role === "HOST",
        isNoAccount: m.userId === null,
      })),
    };

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/trips/[id]
 * Cập nhật thông tin chuyến đi (tên, điểm đến, ngày khởi hành, ngày kết thúc, ngân sách dự kiến).
 *
 * BẢO MẬT & TOÀN VẸN:
 * - Yêu cầu phiên đăng nhập và quyền HOST đang ACTIVE trong chuyến đi (403 nếu là MEMBER).
 * - Chỉ cho phép sửa: name, destination, startDate, endDate, budgetAmount.
 * - Từ chối mọi trường khác (id, userId, role, inviteCode, status...) bằng HTTP 400.
 * - Từ chối payload rỗng {} bằng HTTP 400.
 * - Không cho phép chỉnh sửa chuyến đi đã COMPLETED hoặc ARCHIVED.
 * - Đảm bảo bất biến endDate >= startDate (kể cả khi chỉ cập nhật 1 trong 2 ngày).
 */
export async function PATCH(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;

    // 1. Xác thực quyền Trưởng nhóm (HOST)
    const { trip: existingTrip } = await requireTripMembership(tripId, {
      requiredRole: "HOST",
    });

    // 2. Không cho phép sửa chuyến đi đã kết thúc hoặc lưu trữ
    if (
      existingTrip.status === "COMPLETED" ||
      existingTrip.status === "ARCHIVED"
    ) {
      throw new BadRequestError(
        "Chuyến đi đã hoàn tất hoặc lưu trữ, không thể chỉnh sửa."
      );
    }

    // 3. Xác thực request body bằng Zod (strict mode chặn trường lạ và chặn rỗng)
    const input = await parseJsonBody(req, UpdateTripSchema);

    // 4. Kiểm tra invariant ngày tháng khi chỉ cập nhật 1 ngày
    if (input.startDate && !input.endDate) {
      const newStart = new Date(input.startDate);
      if (newStart > existingTrip.endDate) {
        throw new ValidationError(
          "Ngày khởi hành không thể diễn ra sau ngày kết thúc hiện tại của chuyến đi.",
          [
            {
              field: "startDate",
              message: "Ngày khởi hành phải diễn ra vào hoặc trước ngày kết thúc hiện tại.",
            },
          ]
        );
      }
    }

    if (input.endDate && !input.startDate) {
      const newEnd = new Date(input.endDate);
      if (newEnd < existingTrip.startDate) {
        throw new ValidationError(
          "Ngày kết thúc không thể diễn ra trước ngày khởi hành hiện tại của chuyến đi.",
          [
            {
              field: "endDate",
              message: "Ngày kết thúc phải diễn ra vào hoặc sau ngày khởi hành hiện tại.",
            },
          ]
        );
      }
    }

    // 5. Cập nhật dữ liệu vào database (chỉ cập nhật các trường được truyền)
    try {
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.destination !== undefined ? { destination: input.destination } : {}),
          ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
          ...(input.budgetAmount !== undefined ? { budgetAmount: input.budgetAmount } : {}),
        },
      });

      return apiSuccess(
        {
          id: updated.id,
          name: updated.name,
          destination: updated.destination,
          startDate: updated.startDate.toISOString().split("T")[0],
          endDate: updated.endDate.toISOString().split("T")[0],
          budgetAmount: updated.budgetAmount,
          status: updated.status,
          inviteCode: updated.inviteCode,
          updatedAt: updated.updatedAt.toISOString(),
        },
        {
          message: "Cập nhật thông tin chuyến đi thành công.",
        }
      );
    } catch (dbError) {
      if (isTripDateConstraintViolation(dbError)) {
        throw new ConflictError(
          "Không thể cập nhật ngày do xung đột với trạng thái hiện tại của chuyến đi. Vui lòng thử lại sau."
        );
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
