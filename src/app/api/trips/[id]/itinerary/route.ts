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

interface ItineraryItemRecord {
  id: string;
  tripId: string;
  dayDate: Date;
  sortOrder: number;
  placeName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isLocked: boolean;
  note: string | null;
  startTime: Date | null;
  endTime: Date | null;
  createdByMemberId: string;
  createdByMember: {
    id: string;
    displayName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  expenses?: Array<{
    id: string;
    title: string;
    amount: number;
  }>;
}

interface RawItineraryQueryRow {
  id: string;
  trip_id: string;
  day_date: string | Date;
  start_time: Date | null;
  end_time: Date | null;
  place_name: string;
  address: string | null;
  note: string | null;
  sort_order: number;
  created_by_member_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  member_id: string;
  member_name: string;
}

/**
 * GET /api/trips/[id]/itinerary
 * Lấy danh sách toàn bộ các điểm dừng lịch trình của chuyến đi (có hỗ trợ lọc theo ?dayDate=YYYY-MM-DD).
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

    let items: ItineraryItemRecord[] = [];
    try {
      items = await prisma.itineraryItem.findMany({
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
    } catch (dbErr: unknown) {
      const errStr = dbErr instanceof Error ? dbErr.message : String(dbErr || "");
      const errCode = typeof dbErr === "object" && dbErr !== null && "code" in dbErr
        ? String((dbErr as { code?: unknown }).code)
        : "";
      if (
        errCode === "P2022" ||
        errStr.includes("latitude") ||
        errStr.includes("longitude") ||
        errStr.includes("is_locked") ||
        errStr.includes("does not exist")
      ) {
        // Fallback for un-migrated database: query basic columns via raw SQL
        const rawItems = query.dayDate
          ? await prisma.$queryRaw<RawItineraryQueryRow[]>`
              SELECT i.id, i.trip_id, i.day_date, i.start_time, i.end_time, i.place_name, i.address, i.note, i.sort_order, i.created_by_member_id, i.created_at, i.updated_at,
                     m.id as member_id, m.display_name as member_name
              FROM itinerary_items i
              JOIN trip_members m ON i.created_by_member_id = m.id
              WHERE i.trip_id = ${tripId}::uuid AND i.day_date = ${query.dayDate}::date
              ORDER BY i.day_date ASC, i.sort_order ASC, i.created_at ASC
            `
          : await prisma.$queryRaw<RawItineraryQueryRow[]>`
              SELECT i.id, i.trip_id, i.day_date, i.start_time, i.end_time, i.place_name, i.address, i.note, i.sort_order, i.created_by_member_id, i.created_at, i.updated_at,
                     m.id as member_id, m.display_name as member_name
              FROM itinerary_items i
              JOIN trip_members m ON i.created_by_member_id = m.id
              WHERE i.trip_id = ${tripId}::uuid
              ORDER BY i.day_date ASC, i.sort_order ASC, i.created_at ASC
            `;

        items = rawItems.map((r: RawItineraryQueryRow) => ({
          id: r.id,
          tripId: r.trip_id,
          dayDate: new Date(r.day_date),
          sortOrder: r.sort_order,
          placeName: r.place_name,
          address: r.address,
          latitude: null,
          longitude: null,
          isLocked: false,
          note: r.note,
          startTime: r.start_time,
          endTime: r.end_time,
          createdByMemberId: r.created_by_member_id,
          createdByMember: {
            id: r.member_id,
            displayName: r.member_name || "Thành viên",
          },
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
          expenses: [],
        }));
      } else {
        throw dbErr;
      }
    }

    const formattedItems = items.map((item) => ({
      id: item.id,
      tripId: item.tripId,
      dayDate: item.dayDate.toISOString().split("T")[0],
      sortOrder: item.sortOrder,
      placeName: item.placeName,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      isLocked: item.isLocked,
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
      expenses: (item.expenses || []).map((e) => ({
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
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          isLocked: input.isLocked ?? false,
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
      latitude: createdItem.latitude,
      longitude: createdItem.longitude,
      isLocked: createdItem.isLocked,
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
