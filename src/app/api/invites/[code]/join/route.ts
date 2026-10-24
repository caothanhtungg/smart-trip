import {
  apiSuccess,
  handleApiError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  AlreadyMemberError,
} from "@/lib/api";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  validateInviteCode,
  isUserMembershipUniqueViolation,
} from "@/lib/trips/invite-code";
import {
  isDisplayNameUniqueViolation,
  isJoinOrderUniqueViolation,
} from "@/app/api/trips/[id]/members/route";

interface RouteContext {
  params: Promise<{ code: string }> | { code: string };
}

export const MAX_DISPLAY_NAME_ATTEMPTS = 20;

/**
 * POST /api/invites/[code]/join
 * Người dùng đã đăng nhập tham gia chuyến đi qua mã mời.
 *
 * BẢO MẬT & TOÀN VẸN DỮ LIỆU:
 * 1. Bắt buộc người dùng đã đăng nhập (requireAuth). Tuyệt đối không tin userId/role từ client.
 * 2. Khóa dòng chuyến đi bằng câu lệnh tham số hóa `SELECT ... FOR UPDATE` trong transaction.
 * 3. Kiểm tra trạng thái chuyến đi trong transaction: chỉ cho phép tham gia khi chuyến đi ACTIVE.
 * 4. Nếu đã là thành viên ACTIVE: trả về 409 Conflict.
 * 5. Nếu đã từng rời nhóm (status = LEFT): kích hoạt lại bản ghi cũ (không insert mới vì có unique constraint (tripId, userId)).
 * 6. Cấp joinOrder tuần tự = max(joinOrder) + 1 (tính cả bản ghi LEFT), đồng bộ cơ chế với API thêm placeholder.
 * 7. Nếu tên mặc định bị trùng, tự động giải quyết bằng hậu tố số theo vòng lặp có giới hạn.
 * 8. Phân biệt rõ các lỗi unique constraint (userId, displayName, joinOrder) và lỗi DB khác.
 */
export async function POST(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    // 1. Xác thực người dùng qua phiên làm việc bảo mật phía server
    const { user } = await requireAuth();

    // 2. Validate và chuẩn hóa mã mời
    const params = await context.params;
    const rawCode = params.code;

    const validation = validateInviteCode(rawCode);
    if (!validation.isValid || !validation.normalizedCode) {
      throw new BadRequestError(
        validation.error || "Mã mời chuyến đi không đúng định dạng."
      );
    }

    const normalizedCode = validation.normalizedCode;

    // 3. Thực thi transaction tuần tự hóa
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 3.1. Tìm chuyến đi theo mã mời
        const tripRecord = await tx.trip.findUnique({
          where: { inviteCode: normalizedCode },
          select: { id: true },
        });

        if (!tripRecord) {
          throw new NotFoundError(
            "Không tìm thấy chuyến đi tương ứng với mã mời này."
          );
        }

        const tripId = tripRecord.id;

        // 3.2. Khóa dòng trips để tuần tự hóa các request tham gia đồng thời
        await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR UPDATE`;

        // 3.3. Đọc lại thông tin và trạng thái trip sau khi đã giữ khóa
        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { id: true, name: true, status: true },
        });

        if (!trip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (trip.status !== "ACTIVE") {
          throw new BadRequestError(
            "Chỉ có thể tham gia khi chuyến đi đang ở trạng thái lên kế hoạch."
          );
        }

        // 3.4. Kiểm tra membership hiện tại của user trong chuyến đi
        const existingMember = await tx.tripMember.findFirst({
          where: { tripId, userId: user.id },
        });

        if (existingMember && existingMember.status === "ACTIVE") {
          throw new AlreadyMemberError("Bạn đã là thành viên của chuyến đi này.");
        }

        // 3.5. Tính joinOrder tuần tự: lớn nhất hiện có (bao gồm cả ACTIVE và LEFT) + 1
        const maxMember = await tx.tripMember.findFirst({
          where: { tripId },
          orderBy: { joinOrder: "desc" },
          select: { joinOrder: true },
        });
        const nextJoinOrder = (maxMember?.joinOrder ?? 0) + 1;

        // 3.6. Trường hợp đã từng rời nhóm (status = LEFT): kích hoạt lại bản ghi cũ
        if (existingMember && existingMember.status === "LEFT") {
          const reactivated = await tx.tripMember.update({
            where: { id: existingMember.id },
            data: {
              status: "ACTIVE",
              leftAt: null,
              joinedAt: new Date(),
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

          return {
            member: reactivated,
            tripId: trip.id,
            tripName: trip.name,
            isRejoined: true,
          };
        }

        // 3.7. Trường hợp người dùng mới: xác định displayName và phân giải trùng lặp
        const baseDisplayName = (
          user.displayName ||
          user.name ||
          "Thành viên"
        ).trim();

        let resolvedDisplayName = baseDisplayName;
        let attempt = 1;
        let isUnique = false;

        while (attempt <= MAX_DISPLAY_NAME_ATTEMPTS) {
          const candidateName =
            attempt === 1 ? baseDisplayName : `${baseDisplayName} (${attempt})`;

          const duplicate = await tx.tripMember.findFirst({
            where: {
              tripId,
              displayName: {
                equals: candidateName,
                mode: "insensitive",
              },
            },
            select: { id: true },
          });

          if (!duplicate) {
            resolvedDisplayName = candidateName;
            isUnique = true;
            break;
          }
          attempt++;
        }

        if (!isUnique) {
          throw new ConflictError(
            "Không thể tạo tên hiển thị duy nhất trong chuyến đi. Vui lòng cập nhật tên trong hồ sơ cá nhân và thử lại."
          );
        }

        // 3.8. Tạo mới bản ghi TripMember
        const created = await tx.tripMember.create({
          data: {
            tripId,
            userId: user.id,
            displayName: resolvedDisplayName,
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

        return {
          member: created,
          tripId: trip.id,
          tripName: trip.name,
          isRejoined: false,
        };
      });

      return apiSuccess(
        {
          memberId: result.member.id,
          tripId: result.tripId,
          tripName: result.tripName,
          displayName: result.member.displayName,
          role: result.member.role,
          status: result.member.status,
          joinOrder: result.member.joinOrder,
          joinedAt: result.member.joinedAt.toISOString(),
          isRejoined: result.isRejoined,
        },
        {
          status: result.isRejoined ? 200 : 201,
          message: result.isRejoined
            ? "Chào mừng bạn quay trở lại chuyến đi!"
            : "Tham gia chuyến đi thành công!",
        }
      );
    } catch (dbError) {
      if (isUserMembershipUniqueViolation(dbError)) {
        throw new AlreadyMemberError("Bạn đã là thành viên của chuyến đi này.");
      }
      if (isDisplayNameUniqueViolation(dbError)) {
        throw new ConflictError(
          "Tên hiển thị này đã được sử dụng trong chuyến đi. Vui lòng thử lại."
        );
      }
      if (isJoinOrderUniqueViolation(dbError)) {
        throw new ConflictError(
          "Không thể tham gia do xung đột thứ tự tham gia. Vui lòng thử lại."
        );
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
