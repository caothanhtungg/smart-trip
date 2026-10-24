import { requireTripMembership } from "@/lib/api/auth-guard";
import {
  apiSuccess,
  handleApiError,
  parseRouteParams,
  BadRequestError,
  ConflictError,
} from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

const RouteParamsSchema = z.object({
  id: z.string().uuid("ID chuyến đi không hợp lệ."),
});

/**
 * POST /api/trips/[id]/archive
 * Lưu trữ chuyến đi (Use Case UC24).
 *
 * QUY TẮC BẢO MẬT & NGHIỆP VỤ:
 * 1. Phân quyền: Chỉ Trưởng nhóm (HOST) đang ACTIVE mới có quyền lưu trữ chuyến đi (403 nếu là MEMBER).
 * 2. Vòng đời chuyến đi (Trip Lifecycle):
 *    - Không cho phép lưu trữ lại chuyến đi đã ở trạng thái ARCHIVED (400).
 *    - Nếu chuyến đi đang trong giai đoạn quyết toán (SETTLING):
 *      Bắt buộc kiểm tra toàn bộ các khoản chuyển tiền (transfers). Nếu còn khoản nợ chưa hoàn tất (UNPAID hoặc PAID),
 *      từ chối lưu trữ bằng HTTP 409 (ConflictError).
 *    - Cho phép lưu trữ chuyến đi đang ACTIVE (hủy chuyến trước khi khởi hành) hoặc đã COMPLETED (sau khi quyết toán xong).
 * 3. Bảo toàn dữ liệu tài chính:
 *    Tuyệt đối KHÔNG xóa bản ghi chuyến đi, thành viên, chi tiêu, hóa đơn, hay quyết toán.
 * 4. Cập nhật trạng thái nguyên tử sang ARCHIVED.
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

    // 2. Kiểm tra nếu đã được lưu trữ trước đó
    if (trip.status === "ARCHIVED") {
      throw new BadRequestError("Chuyến đi này đã được lưu trữ trước đó.");
    }

    // 3. Kiểm tra điều kiện quyết toán nếu đang SETTLING
    if (trip.status === "SETTLING") {
      const pendingTransfersCount = await prisma.settlementTransfer.count({
        where: {
          settlement: {
            tripId,
            status: "ACTIVE",
          },
          status: {
            in: ["UNPAID", "PAID"],
          },
        },
      });

      if (pendingTransfersCount > 0) {
        throw new ConflictError(
          "Không thể lưu trữ chuyến đi khi còn các khoản nợ quyết toán chưa hoàn tất."
        );
      }
    }

    // 4. Cập nhật trạng thái chuyến đi sang ARCHIVED
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: "ARCHIVED",
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return apiSuccess(
      {
        id: updatedTrip.id,
        name: updatedTrip.name,
        status: updatedTrip.status,
        updatedAt: updatedTrip.updatedAt.toISOString(),
      },
      {
        message: "Chuyến đi đã được lưu trữ thành công (ARCHIVED).",
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
