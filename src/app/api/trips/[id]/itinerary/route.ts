import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseQueryParams,
  BadRequestError,
  NotFoundError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import {
  CreateItineraryItemSchema,
  ItineraryQuerySchema,
  validateDateWithinTrip,
} from "@/lib/validation/itinerary";
import { timeStringToDbTime, dbTimeToTimeString } from "@/lib/itinerary/date";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * GET /api/trips/[id]/itinerary
 * Lấy danh sách toàn bộ các điểm dừng lịch trình của chuyến đi (có hỗ trợ lọc theo ?dayDate=YYYY-MM-DD).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ (401 nếu chưa đăng nhập).
 * - Yêu cầu là thành viên ACTIVE của chuyến đi (403 nếu không thuộc chuyến đi hoặc đã LEFT).
 * - Cho phép xem ở mọi trạng thái chuyến đi (kể cả SETTLING, COMPLETED, ARCHIVED).
 * - Trả 404 nếu tripId không hợp lệ hoặc chuyến đi không tồn tại.
 */
export async function GET(
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
    await requireTripMembership(tripId);

    // Lọc tham số query (tùy chọn)
    const query = parseQueryParams(req, ItineraryQuerySchema);

    const items = await prisma.itineraryItem.findMany({
      where: {
        tripId,
        ...(query.dayDate
          ? {
              dayDate: new Date(`${query.dayDate}T00:00:00Z`),
            }
          : {}),
      },
      include: {
        createdByMember: {
          select: {
            id: true,
            displayName: true,
          },
        },
        expenses: {
          select: {
            id: true,
            title: true,
            amount: true,
          },
        },
      },
      orderBy: [
        { dayDate: "asc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    const formattedItems = items.map((item) => ({
      id: item.id,
      tripId: item.tripId,
      dayDate: item.dayDate.toISOString().split("T")[0],
      sortOrder: item.sortOrder,
      placeName: item.placeName,
      address: item.address,
      note: item.note,
      startTime: dbTimeToTimeString(item.startTime),
      endTime: dbTimeToTimeString(item.endTime),
      createdByMemberId: item.createdByMemberId,
      createdByMember: {
        id: item.createdByMember.id,
        displayName: item.createdByMember.displayName,
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      expenses: item.expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
      })),
    }));

    return apiSuccess(formattedItems);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/trips/[id]/itinerary
 * Thêm một điểm dừng mới vào lịch trình chuyến đi (UC08).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Mọi thành viên ACTIVE của chuyến đi đều có quyền thêm (không giới hạn HOST).
 * - Chuyến đi bắt buộc phải ở trạng thái ACTIVE (chặn khi SETTLING, COMPLETED, ARCHIVED).
 * - createdByMemberId lấy từ membership đã xác minh ở server, không nhận từ client.
 * - Ngày diễn ra hoạt động phải nằm trong khoảng thời gian chuyến đi (trip.startDate -> trip.endDate).
 * - Nếu không gửi sortOrder, server tự động gán sortOrder = (max sortOrder trong ngày đó) + 1.
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

    // 1. Xác thực người dùng và quyền thành viên ACTIVE
    const { member, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi bắt buộc phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể thêm lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Parse và validate payload đầu vào
    const input = await parseJsonBody(req, CreateItineraryItemSchema);

    // 4. Kiểm tra ngày diễn ra nằm trong khoảng thời gian chuyến đi
    if (!validateDateWithinTrip(input.dayDate, trip.startDate, trip.endDate)) {
      const startText = trip.startDate.toISOString().split("T")[0];
      const endText = trip.endDate.toISOString().split("T")[0];
      throw new BadRequestError(
        `Ngày đã chọn phải nằm trong khoảng thời gian chuyến đi (${startText} đến ${endText}).`
      );
    }

    // 5. Tạo mới điểm dừng trong transaction
    const createdItem = await prisma.$transaction(async (tx) => {
      // Đọc lại trạng thái trip trong transaction để đảm bảo toàn vẹn
      const currentTrip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { status: true, startDate: true, endDate: true },
      });

      if (!currentTrip || currentTrip.status !== "ACTIVE") {
        throw new BadRequestError(
          "Chỉ có thể thêm lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch."
        );
      }

      if (!validateDateWithinTrip(input.dayDate, currentTrip.startDate, currentTrip.endDate)) {
        throw new BadRequestError(
          "Ngày đã chọn phải nằm trong khoảng thời gian chuyến đi."
        );
      }

      const dayDateObj = new Date(`${input.dayDate}T00:00:00Z`);
      let sortOrder = input.sortOrder;

      // Tự sinh sortOrder nếu client không cung cấp
      if (sortOrder === undefined) {
        const aggregate = await tx.itineraryItem.aggregate({
          where: {
            tripId,
            dayDate: dayDateObj,
          },
          _max: {
            sortOrder: true,
          },
        });
        sortOrder = (aggregate._max.sortOrder ?? 0) + 1;
      }

      return await tx.itineraryItem.create({
        data: {
          tripId,
          dayDate: dayDateObj,
          sortOrder,
          placeName: input.placeName,
          address: input.address ?? null,
          note: input.note ?? null,
          startTime: timeStringToDbTime(input.startTime),
          endTime: timeStringToDbTime(input.endTime),
          createdByMemberId: member.id,
        },
        include: {
          createdByMember: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });
    });

    const formattedItem = {
      id: createdItem.id,
      tripId: createdItem.tripId,
      dayDate: createdItem.dayDate.toISOString().split("T")[0],
      sortOrder: createdItem.sortOrder,
      placeName: createdItem.placeName,
      address: createdItem.address,
      note: createdItem.note,
      startTime: dbTimeToTimeString(createdItem.startTime),
      endTime: dbTimeToTimeString(createdItem.endTime),
      createdByMemberId: createdItem.createdByMemberId,
      createdByMember: {
        id: createdItem.createdByMember.id,
        displayName: createdItem.createdByMember.displayName,
      },
      createdAt: createdItem.createdAt.toISOString(),
      updatedAt: createdItem.updatedAt.toISOString(),
      expenses: [],
    };

    return apiSuccess(formattedItem, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
