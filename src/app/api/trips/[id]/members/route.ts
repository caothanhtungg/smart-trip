import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { CreateGuestMemberSchema } from "@/lib/validation/member";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export const TRIP_MEMBER_DISPLAY_NAME_KEY = "trip_members_trip_id_display_name_key";
export const TRIP_MEMBER_JOIN_ORDER_KEY = "trip_members_trip_id_join_order_key";

/**
 * Kiểm tra xem lỗi database có phải là vi phạm unique constraint trên displayName hay không.
 */
export function isDisplayNameUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const e = error as {
    name?: string;
    code?: string;
    message?: string;
    meta?: { target?: unknown; constraint?: unknown };
    cause?: { code?: string; constraint?: unknown; message?: string };
  };

  const isUniqueError =
    e.code === "P2002" ||
    e.code === "23505" ||
    e.cause?.code === "23505" ||
    (typeof e.message === "string" && e.message.includes("unique constraint"));

  if (!isUniqueError) return false;

  const target = e.meta?.target;
  if (Array.isArray(target) && target.includes("display_name")) return true;
  if (typeof target === "string" && target.includes("display_name")) return true;

  const constraint = typeof e.meta?.constraint === "string"
    ? e.meta.constraint
    : typeof e.cause?.constraint === "string"
    ? e.cause.constraint
    : "";

  if (constraint.includes(TRIP_MEMBER_DISPLAY_NAME_KEY) || constraint.includes("display_name")) {
    return true;
  }

  if (typeof e.message === "string" && (e.message.includes(TRIP_MEMBER_DISPLAY_NAME_KEY) || e.message.includes("display_name"))) {
    return true;
  }

  if (typeof e.cause?.message === "string" && (e.cause.message.includes(TRIP_MEMBER_DISPLAY_NAME_KEY) || e.cause.message.includes("display_name"))) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem lỗi database có phải là vi phạm unique constraint trên joinOrder hay không.
 */
export function isJoinOrderUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const e = error as {
    name?: string;
    code?: string;
    message?: string;
    meta?: { target?: unknown; constraint?: unknown };
    cause?: { code?: string; constraint?: unknown; message?: string };
  };

  const isUniqueError =
    e.code === "P2002" ||
    e.code === "23505" ||
    e.cause?.code === "23505" ||
    (typeof e.message === "string" && e.message.includes("unique constraint"));

  if (!isUniqueError) return false;

  const target = e.meta?.target;
  if (Array.isArray(target) && target.includes("join_order")) return true;
  if (typeof target === "string" && target.includes("join_order")) return true;

  const constraint = typeof e.meta?.constraint === "string"
    ? e.meta.constraint
    : typeof e.cause?.constraint === "string"
    ? e.cause.constraint
    : "";

  if (constraint.includes(TRIP_MEMBER_JOIN_ORDER_KEY) || constraint.includes("join_order")) {
    return true;
  }

  if (typeof e.message === "string" && (e.message.includes(TRIP_MEMBER_JOIN_ORDER_KEY) || e.message.includes("join_order"))) {
    return true;
  }

  if (typeof e.cause?.message === "string" && (e.cause.message.includes(TRIP_MEMBER_JOIN_ORDER_KEY) || e.cause.message.includes("join_order"))) {
    return true;
  }

  return false;
}

/**
 * GET /api/trips/[id]/members
 * Lấy danh sách thành viên của chuyến đi.
 *
 * BẢO MẬT & QUYỀN TRUY CẬP:
 * - Yêu cầu phiên đăng nhập và tư cách thành viên ACTIVE trong chuyến đi.
 * - Trả về đầy đủ thành viên (cả ACTIVE và LEFT) kèm trạng thái rõ ràng.
 * - Tuyệt đối không trả về số tài khoản ngân hàng, mật khẩu hoặc token xác thực.
 */
export async function GET(
  _req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;

    if (!tripId || !isValidUuid(tripId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }

    const { user } = await requireTripMembership(tripId);

    const members = await prisma.tripMember.findMany({
      where: { tripId },
      select: {
        id: true,
        tripId: true,
        userId: true,
        displayName: true,
        role: true,
        status: true,
        joinOrder: true,
        joinedAt: true,
        leftAt: true,
        user: {
          select: {
            image: true,
          },
        },
      },
      orderBy: { joinOrder: "asc" },
    });

    const data = members.map((m) => ({
      id: m.id,
      tripId: m.tripId,
      userId: m.userId,
      displayName: m.displayName,
      role: m.role,
      status: m.status,
      joinOrder: m.joinOrder,
      joinedAt: m.joinedAt.toISOString(),
      leftAt: m.leftAt ? m.leftAt.toISOString() : null,
      avatarUrl: m.user?.image ?? null,
      isPlaceholder: m.userId === null,
      isCurrentUser: m.userId === user.id,
      isHost: m.role === "HOST",
    }));

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/trips/[id]/members
 * Thêm thành viên chưa có tài khoản (guest/placeholder) vào chuyến đi.
 *
 * BẢO MẬT & QUYỀN TRUY CẬP:
 * - Chỉ Trưởng nhóm (HOST) đang ACTIVE mới được thêm thành viên.
 * - Chỉ tạo placeholder với userId = null, role = MEMBER, status = ACTIVE.
 * - Chuyến đi phải ở trạng thái ACTIVE (chặn khi SETTLING, COMPLETED, ARCHIVED).
 * - joinOrder tính tuần tự max(joinOrder) + 1 và được bảo vệ bằng khóa bi quan FOR UPDATE.
 * - Kiểm tra trùng tên theo constraint DB (bao gồm cả thành viên LEFT).
 */
export async function POST(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;

    if (!tripId || !isValidUuid(tripId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }

    // 1. Phân quyền: Caller phải là HOST đang ACTIVE trong chuyến đi
    await requireTripMembership(tripId, { requiredRole: "HOST" });

    // 2. Validate payload đầu vào
    const input = await parseJsonBody(req, CreateGuestMemberSchema);

    // 3. Thực thi transaction tuần tự hóa
    try {
      const created = await prisma.$transaction(async (tx) => {
        // Khóa dòng trip để tuần tự hóa các request thêm thành viên đồng thời
        await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR UPDATE`;

        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { status: true },
        });

        if (!trip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (trip.status !== "ACTIVE") {
          throw new BadRequestError(
            "Chỉ có thể thêm thành viên khi chuyến đi đang ở trạng thái lên kế hoạch."
          );
        }

        // Kiểm tra trùng tên hiển thị (bao gồm cả thành viên LEFT theo unique constraint)
        const existingMember = await tx.tripMember.findFirst({
          where: {
            tripId,
            displayName: {
              equals: input.displayName,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (existingMember) {
          throw new ConflictError(
            "Tên hiển thị này đã được sử dụng trong chuyến đi (bao gồm cả thành viên đã rời nhóm)."
          );
        }

        // Cấp joinOrder tuần tự
        const maxMember = await tx.tripMember.findFirst({
          where: { tripId },
          orderBy: { joinOrder: "desc" },
          select: { joinOrder: true },
        });

        const nextJoinOrder = (maxMember?.joinOrder ?? 0) + 1;

        return await tx.tripMember.create({
          data: {
            tripId,
            displayName: input.displayName,
            userId: null,
            role: "MEMBER",
            status: "ACTIVE",
            joinOrder: nextJoinOrder,
          },
          select: {
            id: true,
            tripId: true,
            userId: true,
            displayName: true,
            role: true,
            status: true,
            joinOrder: true,
            joinedAt: true,
            leftAt: true,
          },
        });
      });

      return apiSuccess(
        {
          id: created.id,
          tripId: created.tripId,
          userId: created.userId,
          displayName: created.displayName,
          role: created.role,
          status: created.status,
          joinOrder: created.joinOrder,
          joinedAt: created.joinedAt.toISOString(),
          leftAt: created.leftAt ? created.leftAt.toISOString() : null,
          isPlaceholder: true,
          isCurrentUser: false,
          isHost: false,
        },
        {
          status: 201,
          message: "Thêm thành viên chưa có tài khoản thành công.",
        }
      );
    } catch (dbError) {
      if (isDisplayNameUniqueViolation(dbError)) {
        throw new ConflictError(
          "Tên hiển thị này đã được sử dụng trong chuyến đi (bao gồm cả thành viên đã rời nhóm)."
        );
      }
      if (isJoinOrderUniqueViolation(dbError)) {
        throw new ConflictError(
          "Không thể thêm thành viên do xung đột thứ tự tham gia. Vui lòng thử lại."
        );
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
