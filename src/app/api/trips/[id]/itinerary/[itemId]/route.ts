import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import {
  UpdateItineraryItemSchema,
  validateDateWithinTrip,
} from "@/lib/validation/itinerary";
import { timeStringToDbTime, dbTimeToTimeString } from "@/lib/itinerary/date";

interface ItemRouteContext {
  params: Promise<{ id: string; itemId: string }> | { id: string; itemId: string };
}

/**
 * PATCH /api/trips/[id]/itinerary/[itemId]
 * Chỉnh sửa thông tin một điểm dừng trong lịch trình chuyến đi (UC09).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Chỉ Trưởng nhóm (HOST) HOẶC chính người tạo điểm dừng mới có quyền sửa.
 * - Chuyến đi bắt buộc phải ở trạng thái ACTIVE (chặn khi SETTLING, COMPLETED, ARCHIVED).
 * - Điểm dừng phải tồn tại và thuộc đúng chuyến đi (tripId); nếu không trả 404 chống IDOR.
 * - Khi chỉ sửa startTime hoặc endTime, kết hợp với giờ còn lại từ database để đảm bảo endTime >= startTime.
 */
export async function PATCH(
  req: Request,
  context: ItemRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, itemId } = params;

    if (!tripId || !isValidUuid(tripId) || !itemId || !isValidUuid(itemId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc điểm dừng.");
    }

    // 1. Phân quyền: Người dùng phải là thành viên ACTIVE của chuyến đi
    const { member, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi bắt buộc phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể chỉnh sửa lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Parse và validate payload đầu vào
    const input = await parseJsonBody(req, UpdateItineraryItemSchema);

    // 4. Thực thi cập nhật trong transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Đọc lại trạng thái trip
      const currentTrip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { status: true, startDate: true, endDate: true },
      });

      if (!currentTrip || currentTrip.status !== "ACTIVE") {
        throw new BadRequestError(
          "Chỉ có thể chỉnh sửa lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch."
        );
      }

      // Tìm điểm dừng mục tiêu, đảm bảo đúng tripId (IDOR protection)
      const targetItem = await tx.itineraryItem.findFirst({
        where: { id: itemId, tripId },
      });

      if (!targetItem) {
        throw new NotFoundError("Không tìm thấy điểm dừng trong chuyến đi.");
      }

      // Kiểm tra quyền: Chỉ HOST hoặc chính người tạo mới được sửa
      if (member.role !== "HOST" && targetItem.createdByMemberId !== member.id) {
        throw new ForbiddenError(
          "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền chỉnh sửa."
        );
      }

      // Nếu cập nhật dayDate, kiểm tra nằm trong khoảng ngày của chuyến đi
      if (input.dayDate !== undefined) {
        if (!validateDateWithinTrip(input.dayDate, currentTrip.startDate, currentTrip.endDate)) {
          const startText = currentTrip.startDate.toISOString().split("T")[0];
          const endText = currentTrip.endDate.toISOString().split("T")[0];
          throw new BadRequestError(
            `Ngày đã chọn phải nằm trong khoảng thời gian chuyến đi (${startText} đến ${endText}).`
          );
        }
      }

      // Kiểm tra tính nhất quán startTime và endTime khi chỉ một trong hai được cập nhật
      const effectiveStartTime =
        input.startTime !== undefined
          ? input.startTime
          : dbTimeToTimeString(targetItem.startTime);

      const effectiveEndTime =
        input.endTime !== undefined
          ? input.endTime
          : dbTimeToTimeString(targetItem.endTime);

      if (effectiveStartTime && effectiveEndTime) {
        if (effectiveEndTime < effectiveStartTime) {
          throw new BadRequestError("Giờ kết thúc không thể trước giờ bắt đầu.");
        }
      }

      const updateData: {
        placeName?: string;
        dayDate?: Date;
        address?: string | null;
        note?: string | null;
        startTime?: Date | null;
        endTime?: Date | null;
        sortOrder?: number;
      } = {};

      if (input.placeName !== undefined) updateData.placeName = input.placeName;
      if (input.dayDate !== undefined) updateData.dayDate = new Date(`${input.dayDate}T00:00:00Z`);
      if (input.address !== undefined) updateData.address = input.address;
      if (input.note !== undefined) updateData.note = input.note;
      if (input.startTime !== undefined) updateData.startTime = timeStringToDbTime(input.startTime);
      if (input.endTime !== undefined) updateData.endTime = timeStringToDbTime(input.endTime);
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

      return await tx.itineraryItem.update({
        where: { id: itemId },
        data: updateData,
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
      });
    });

    const formattedItem = {
      id: updated.id,
      tripId: updated.tripId,
      dayDate: updated.dayDate.toISOString().split("T")[0],
      sortOrder: updated.sortOrder,
      placeName: updated.placeName,
      address: updated.address,
      note: updated.note,
      startTime: dbTimeToTimeString(updated.startTime),
      endTime: dbTimeToTimeString(updated.endTime),
      createdByMemberId: updated.createdByMemberId,
      createdByMember: {
        id: updated.createdByMember.id,
        displayName: updated.createdByMember.displayName,
      },
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      expenses: updated.expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
      })),
    };

    return apiSuccess(formattedItem);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/trips/[id]/itinerary/[itemId]
 * Xóa một điểm dừng khỏi lịch trình chuyến đi (UC09).
 *
 * PHÂN QUYỀN & TOÀN VẸN DỮ LIỆU:
 * - Chỉ Trưởng nhóm (HOST) HOẶC chính người tạo điểm dừng mới có quyền xóa.
 * - Chuyến đi bắt buộc phải ở trạng thái ACTIVE.
 * - Điểm dừng phải thuộc đúng tripId (IDOR protection).
 * - Tôn trọng ràng buộc ON DELETE SET NULL: Các khoản chi gắn kèm điểm dừng này
 *   sẽ tự động unbind (expenses.itinerary_item_id = NULL) mà không bị xóa mất số tiền.
 */
export async function DELETE(
  _req: Request,
  context: ItemRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, itemId } = params;

    if (!tripId || !isValidUuid(tripId) || !itemId || !isValidUuid(itemId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc điểm dừng.");
    }

    // 1. Phân quyền: Caller phải là thành viên ACTIVE
    const { member, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi bắt buộc phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể xóa lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Thực thi xóa trong transaction
    await prisma.$transaction(async (tx) => {
      const currentTrip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { status: true },
      });

      if (!currentTrip || currentTrip.status !== "ACTIVE") {
        throw new BadRequestError(
          "Chỉ có thể xóa lịch trình khi chuyến đi đang ở trạng thái lên kế hoạch."
        );
      }

      const targetItem = await tx.itineraryItem.findFirst({
        where: { id: itemId, tripId },
      });

      if (!targetItem) {
        throw new NotFoundError("Không tìm thấy điểm dừng trong chuyến đi.");
      }

      // Kiểm tra quyền: Chỉ HOST hoặc chính người tạo mới được xóa
      if (member.role !== "HOST" && targetItem.createdByMemberId !== member.id) {
        throw new ForbiddenError(
          "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền xóa."
        );
      }

      await tx.itineraryItem.delete({
        where: { id: itemId },
      });
    });

    return apiSuccess(
      { id: itemId },
      { message: "Đã xóa địa điểm khỏi lịch trình." }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
