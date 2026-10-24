import { requireTripMembership } from "@/lib/api/auth-guard";
import {
  apiSuccess,
  handleApiError,
  parseRouteParams,
  BadRequestError,
  InviteCodeCollisionError,
} from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import {
  generateInviteCode,
  isInviteCodeUniqueViolation,
  MAX_INVITE_CODE_ATTEMPTS,
} from "@/lib/trips/invite-code";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

const RouteParamsSchema = z.object({
  id: z.string().uuid("ID chuyến đi không hợp lệ."),
});

/**
 * POST /api/trips/[id]/rotate-invite
 * Đổi mã mời mới cho chuyến đi (Use Case UC28).
 *
 * QUY TẮC BẢO MẬT & TOÀN VẸN:
 * 1. Phân quyền nghiêm ngặt: Chỉ Trưởng nhóm (HOST) đang ACTIVE mới có quyền đổi mã mời (403 nếu là MEMBER).
 * 2. Trạng thái hợp lệ: Chỉ cho phép đổi mã mời khi chuyến đi đang ACTIVE (lên kế hoạch).
 *    Nếu chuyến đi đã chốt sổ (SETTLING), hoàn tất (COMPLETED) hoặc lưu trữ (ARCHIVED), từ chối bằng HTTP 400.
 * 3. Sinh mã ngẫu nhiên an toàn mật mã theo chuẩn Base31 (12 ký tự Base31 định dạng XXXXXX-XXXXXX).
 * 4. Xử lý va chạm (collision retry): Thực hiện tối đa MAX_INVITE_CODE_ATTEMPTS lần thử; ném InviteCodeCollisionError (409) nếu vượt quá.
 * 5. Cập nhật cơ sở dữ liệu nguyên tử: Mã cũ lập tức mất hiệu lực và không thể dùng để tham gia chuyến đi nữa.
 * 6. Không chấp nhận body tùy ý từ client (mã mời do server tự sinh độc quyền).
 */
export async function POST(
  _req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id: tripId } = await parseRouteParams(context.params, RouteParamsSchema);

    // 1. Xác thực quyền Trưởng nhóm (HOST)
    const { trip } = await requireTripMembership(tripId, {
      requiredRole: "HOST",
    });

    // 2. Kiểm tra trạng thái chuyến đi
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể đổi mã mời khi chuyến đi đang trong giai đoạn lên kế hoạch (ACTIVE)."
      );
    }

    // 3. Sinh mã mời mới và cập nhật database kèm retry an toàn khi va chạm
    let attempts = 0;
    let newInviteCode: string | null = null;

    while (attempts < MAX_INVITE_CODE_ATTEMPTS) {
      attempts++;
      const candidateCode = generateInviteCode();

      try {
        const updatedTrip = await prisma.trip.update({
          where: { id: tripId },
          data: {
            inviteCode: candidateCode,
          },
          select: {
            id: true,
            inviteCode: true,
            updatedAt: true,
          },
        });

        newInviteCode = updatedTrip.inviteCode;
        break;
      } catch (err) {
        if (isInviteCodeUniqueViolation(err)) {
          // Xảy ra trùng mã mời trong bảng trips, thử lại với mã mới
          continue;
        }
        throw err;
      }
    }

    if (!newInviteCode) {
      throw new InviteCodeCollisionError(
        "Không thể sinh mã mời mới duy nhất sau nhiều lần thử. Vui lòng thử lại sau."
      );
    }

    return apiSuccess(
      {
        tripId,
        inviteCode: newInviteCode,
      },
      {
        message: `Đã đổi mã mời mới thành công: ${newInviteCode}. Mã cũ đã bị vô hiệu hóa.`,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
