import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  BadRequestError,
  NotFoundError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { OptimizeItinerarySchema } from "@/lib/validation/itinerary";
import { optimizeDayRoute } from "@/lib/geo/distance";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * POST /api/trips/[id]/itinerary/optimize
 * Tự động tối ưu hóa thứ tự các điểm dừng trong ngày theo tuyến đường ngắn nhất (TSP).
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

    // Xác thực người dùng và quyền thành viên ACTIVE
    const { trip } = await requireTripMembership(tripId);

    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể tối ưu lộ trình khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    const input = await parseJsonBody(req, OptimizeItinerarySchema);
    const dayDateObj = new Date(`${input.dayDate}T00:00:00Z`);

    // Lấy toàn bộ items của ngày đó
    const items = await prisma.itineraryItem.findMany({
      where: {
        tripId,
        dayDate: dayDateObj,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (items.length <= 1) {
      return apiSuccess(items);
    }

    // Tối ưu lộ trình bằng thuật toán TSP (Nearest Neighbor + 2-Opt)
    const optimizedItems = optimizeDayRoute(items);

    // Cập nhật lại sortOrder trong transaction
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < optimizedItems.length; i++) {
        const item = optimizedItems[i];
        if (item.sortOrder !== i) {
          await tx.itineraryItem.update({
            where: { id: item.id },
            data: { sortOrder: i },
          });
          item.sortOrder = i;
        }
      }
    });

    return apiSuccess(optimizedItems);
  } catch (error) {
    return handleApiError(error);
  }
}
