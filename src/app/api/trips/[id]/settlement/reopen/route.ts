import {
  apiSuccess,
  handleApiError,
  NotFoundError,
  ConflictError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { mapSettlementDatabaseError } from "@/lib/api/settlement-db-errors";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * POST /api/trips/[id]/settlement/reopen
 * Hủy sổ quyết toán hiện hành và mở lại chuyến đi về trạng thái ACTIVE.
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ (401).
 * - Chỉ Trưởng nhóm (HOST) mới có quyền mở lại sổ (403 nếu không phải Host).
 * - Chuyến đi phải có sổ quyết toán ACTIVE (404/409 nếu không có).
 * - Sử dụng khóa độc quyền PostgreSQL `SELECT ... FOR UPDATE` trên hàng Trip.
 * - BẮT BUỘC toàn bộ SettlementTransfers phải ở trạng thái UNPAID.
 * - Nếu đã có ít nhất một giao dịch PAID hoặc COMPLETED -> từ chối với 409 Conflict.
 * - Chuyển Settlement sang CANCELLED (kèm cancelledAt = now()) và Trip về ACTIVE trong cùng transaction.
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

    // 1. Phân quyền: Bắt buộc là Trưởng nhóm (HOST)
    await requireTripMembership(tripId, { requiredRole: "HOST" });

    // 2. Thực thi toàn bộ thao tác trong transaction nguyên tử với khóa FOR UPDATE
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 2.1. Khóa hàng Trip bằng FOR UPDATE độc quyền
        await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR UPDATE`;

        // 2.2. Đọc lại thông tin Trip sau khi đã có khóa
        const currentTrip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { id: true, status: true },
        });

        if (!currentTrip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (currentTrip.status !== "SETTLING" && currentTrip.status !== "COMPLETED") {
          throw new ConflictError(
            `Không thể mở lại sổ khi chuyến đi đang ở trạng thái "${currentTrip.status}". Chỉ có thể mở lại khi chuyến đi đang quyết toán (SETTLING) hoặc đã hoàn tất (COMPLETED).`
          );
        }

        // 2.3. Tìm Settlement ACTIVE của chuyến đi
        const activeSettlement = await tx.settlement.findFirst({
          where: { tripId, status: "ACTIVE" },
          include: {
            transfers: {
              select: { id: true, status: true },
            },
          },
        });

        if (!activeSettlement) {
          throw new NotFoundError(
            "Không tìm thấy sổ quyết toán đang hoạt động để mở lại."
          );
        }

        // 2.4. Kiểm tra điều kiện: Mọi giao dịch phải đang UNPAID
        const hasPaidOrCompleted = activeSettlement.transfers.some(
          (t) => t.status !== "UNPAID"
        );

        if (hasPaidOrCompleted) {
          throw new ConflictError(
            "Không thể mở lại sổ vì đã có giao dịch được thanh toán hoặc xác nhận hoàn tất."
          );
        }

        // 2.5. Chuyển Settlement sang CANCELLED và Trip về ACTIVE
        const now = new Date();
        await tx.settlement.update({
          where: { id: activeSettlement.id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
          },
        });

        await tx.trip.update({
          where: { id: tripId },
          data: {
            status: "ACTIVE",
          },
        });

        return {
          settlementId: activeSettlement.id,
          reopenedAt: now.toISOString(),
        };
      });

      return apiSuccess(result, {
        message:
          "Đã mở lại sổ chi tiêu thành công. Chuyến đi đã trở về trạng thái Đang lên kế hoạch (ACTIVE).",
      });
    } catch (txError) {
      const mapped = mapSettlementDatabaseError(txError);
      if (mapped) throw mapped;
      throw txError;
    }
  } catch (error) {
    const mapped = mapSettlementDatabaseError(error);
    return handleApiError(mapped || error);
  }
}
