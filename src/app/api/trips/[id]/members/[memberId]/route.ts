import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { UpdateGuestMemberSchema } from "@/lib/validation/member";
import { isDisplayNameUniqueViolation } from "../route";

interface MemberRouteContext {
  params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string };
}

/**
 * PATCH /api/trips/[id]/members/[memberId]
 * Chỉnh sửa tên hiển thị của thành viên chưa có tài khoản (guest/placeholder).
 *
 * BẢO MẬT & QUYỀN TRUY CẬP:
 * - Chỉ Trưởng nhóm (HOST) đang ACTIVE mới có quyền sửa.
 * - Chỉ cho phép sửa thành viên chưa có tài khoản (userId === null).
 * - Bắt buộc chuyến đi phải ở trạng thái ACTIVE (chặn khi SETTLING, COMPLETED, ARCHIVED).
 * - Kiểm tra trùng tên theo DB constraint (áp dụng cả thành viên LEFT).
 */
export async function PATCH(
  req: Request,
  context: MemberRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, memberId } = params;

    if (!tripId || !isValidUuid(tripId) || !memberId || !isValidUuid(memberId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc thành viên.");
    }

    // 1. Phân quyền: Caller phải là HOST đang ACTIVE trong chuyến đi
    await requireTripMembership(tripId, { requiredRole: "HOST" });

    // 2. Validate payload đầu vào (chỉ cho phép displayName)
    const input = await parseJsonBody(req, UpdateGuestMemberSchema);

    // 3. Thực thi cập nhật trong transaction
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { status: true },
        });

        if (!trip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (trip.status !== "ACTIVE") {
          throw new BadRequestError(
            "Chỉ có thể chỉnh sửa thành viên khi chuyến đi đang ở trạng thái lên kế hoạch."
          );
        }

        const targetMember = await tx.tripMember.findFirst({
          where: { id: memberId, tripId },
        });

        if (!targetMember) {
          throw new NotFoundError("Không tìm thấy thành viên trong chuyến đi.");
        }

        // Chỉ cho phép sửa tên placeholder member (userId = null)
        if (targetMember.userId !== null) {
          throw new ForbiddenError(
            "Không thể sửa tên của thành viên đã liên kết tài khoản."
          );
        }

        // Kiểm tra trùng tên với thành viên khác trong cùng trip (bao gồm cả LEFT)
        const duplicate = await tx.tripMember.findFirst({
          where: {
            tripId,
            id: { not: memberId },
            displayName: {
              equals: input.displayName,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (duplicate) {
          throw new ConflictError(
            "Tên hiển thị này đã được sử dụng bởi một thành viên khác trong chuyến đi (bao gồm cả thành viên đã rời nhóm)."
          );
        }

        return await tx.tripMember.update({
          where: { id: memberId },
          data: {
            displayName: input.displayName,
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
          id: updated.id,
          tripId: updated.tripId,
          userId: updated.userId,
          displayName: updated.displayName,
          role: updated.role,
          status: updated.status,
          joinOrder: updated.joinOrder,
          joinedAt: updated.joinedAt.toISOString(),
          leftAt: updated.leftAt ? updated.leftAt.toISOString() : null,
          isPlaceholder: true,
          isCurrentUser: false,
          isHost: false,
        },
        {
          message: "Cập nhật tên thành viên thành công.",
        }
      );
    } catch (dbError) {
      if (isDisplayNameUniqueViolation(dbError)) {
        throw new ConflictError(
          "Tên hiển thị này đã được sử dụng trong chuyến đi (bao gồm cả thành viên đã rời nhóm)."
        );
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/trips/[id]/members/[memberId]
 * Xóa thành viên khỏi chuyến đi (HOST xóa) hoặc Thành viên tự rời chuyến đi.
 *
 * BẢO MẬT & QUYỀN TRUY CẬP:
 * - Chuyến đi phải ở trạng thái ACTIVE.
 * - Trưởng nhóm (HOST) không được xóa hoặc tự rời.
 * - Thành viên thường chỉ được tự rời (userId trùng khớp session).
 * - HOST được xóa thành viên khác.
 * - Bắt buộc số dư netBalance === 0 (tính thực tế paid - owed qua aggregate).
 * - Hard delete nếu không có bất kỳ lịch sử/quan hệ ON DELETE RESTRICT nào.
 * - Soft delete (status = 'LEFT') nếu đã có lịch sử nhưng netBalance === 0.
 */
export async function DELETE(
  _req: Request,
  context: MemberRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, memberId } = params;

    if (!tripId || !isValidUuid(tripId) || !memberId || !isValidUuid(memberId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc thành viên.");
    }

    // 1. Xác thực người dùng và tư cách thành viên trong trip
    const { user, member: callerMember, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể xóa hoặc rời nhóm khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Tìm thành viên mục tiêu trong chuyến đi
    const targetMember = await prisma.tripMember.findFirst({
      where: { id: memberId, tripId },
    });

    if (!targetMember) {
      throw new NotFoundError("Không tìm thấy thành viên trong chuyến đi.");
    }

    // 4. Bảo vệ vai trò Trưởng nhóm (Rule R2): Tuyệt đối không xóa hoặc tự rời đối với HOST
    if (targetMember.role === "HOST") {
      throw new ForbiddenError(
        targetMember.userId === user.id
          ? "Trưởng nhóm không thể tự rời chuyến đi trong Release 1."
          : "Không thể xóa Trưởng nhóm khỏi chuyến đi."
      );
    }

    // 5. Kiểm tra quyền thực hiện:
    // - Tự rời nhóm: targetMember.userId === user.id
    // - Host xóa thành viên: callerMember.role === "HOST"
    const isSelfLeaving = targetMember.userId === user.id;
    const isHostRemoving = callerMember.role === "HOST";

    if (!isSelfLeaving && !isHostRemoving) {
      throw new ForbiddenError("Bạn không có quyền xóa thành viên này khỏi chuyến đi.");
    }

    // 6. Thực thi kiểm tra số dư và quyết định Hard/Soft Delete trong transaction
    const result = await prisma.$transaction(async (tx) => {
      // 6.1. Tính toán số dư thực tế từ cơ sở dữ liệu qua aggregate
      const [paidAgg, owedAgg] = await Promise.all([
        tx.expense.aggregate({
          where: { tripId, paidByMemberId: memberId },
          _sum: { amount: true },
        }),
        tx.expenseShare.aggregate({
          where: { expense: { tripId }, memberId },
          _sum: { amount: true },
        }),
      ]);

      const paid = paidAgg._sum.amount ?? 0;
      const owed = owedAgg._sum.amount ?? 0;
      const netBalance = paid - owed;

      // Rule R6: Số dư khác 0 không được phép rời hoặc xóa
      if (netBalance !== 0) {
        const formatted = Math.abs(netBalance).toLocaleString("vi-VN");
        if (netBalance > 0) {
          throw new ConflictError(
            `Không thể xóa hoặc rời nhóm: Thành viên đang được nợ tiền (+${formatted} ₫). Cần tất toán công nợ trước.`
          );
        } else {
          throw new ConflictError(
            `Không thể xóa hoặc rời nhóm: Thành viên đang nợ tiền (-${formatted} ₫). Cần tất toán công nợ trước.`
          );
        }
      }

      // 6.2. Kiểm tra toàn bộ các quan hệ có ràng buộc ON DELETE RESTRICT tới TripMember
      const [
        paidExpCount,
        createdExpCount,
        sharesCount,
        itemMembersCount,
        transfersFromCount,
        transfersToCount,
        transfersPaidMarkedCount,
        transfersCompletedCount,
        createdSettlementsCount,
        itineraryCreatedCount,
        claimsPlaceholderCount,
        claimsDecidedCount,
        snapshotsPlaceholderCount,
      ] = await Promise.all([
        tx.expense.count({ where: { paidByMemberId: memberId } }),
        tx.expense.count({ where: { createdByMemberId: memberId } }),
        tx.expenseShare.count({ where: { memberId } }),
        tx.expenseItemMember.count({ where: { memberId } }),
        tx.settlementTransfer.count({ where: { fromMemberId: memberId } }),
        tx.settlementTransfer.count({ where: { toMemberId: memberId } }),
        tx.settlementTransfer.count({ where: { paidMarkedByMemberId: memberId } }),
        tx.settlementTransfer.count({ where: { completedByMemberId: memberId } }),
        tx.settlement.count({ where: { createdByMemberId: memberId } }),
        tx.itineraryItem.count({ where: { createdByMemberId: memberId } }),
        tx.memberClaim.count({ where: { placeholderMemberId: memberId } }),
        tx.memberClaim.count({ where: { decidedByMemberId: memberId } }),
        tx.bankClaimSnapshot.count({ where: { placeholderMemberId: memberId } }),
      ]);

      const hasReferentialHistory =
        paidExpCount > 0 ||
        createdExpCount > 0 ||
        sharesCount > 0 ||
        itemMembersCount > 0 ||
        transfersFromCount > 0 ||
        transfersToCount > 0 ||
        transfersPaidMarkedCount > 0 ||
        transfersCompletedCount > 0 ||
        createdSettlementsCount > 0 ||
        itineraryCreatedCount > 0 ||
        claimsPlaceholderCount > 0 ||
        claimsDecidedCount > 0 ||
        snapshotsPlaceholderCount > 0;

      // 6.3. Phân định Hard Delete vs Soft Delete
      if (hasReferentialHistory) {
        // Soft delete: Chuyển trạng thái sang LEFT để bảo toàn tính toàn vẹn và lịch sử sổ sách
        const softDeleted = await tx.tripMember.update({
          where: { id: memberId },
          data: {
            status: "LEFT",
            leftAt: new Date(),
          },
          select: {
            id: true,
            displayName: true,
            status: true,
            leftAt: true,
          },
        });

        return {
          type: "SOFT_DELETE" as const,
          member: softDeleted,
        };
      } else {
        // Hard delete: Xóa hoàn toàn bản ghi khỏi database
        try {
          await tx.tripMember.delete({
            where: { id: memberId },
          });

          return {
            type: "HARD_DELETE" as const,
            memberId,
          };
        } catch (dbErr) {
          const err = dbErr as { code?: string; message?: string };
          if (
            err.code === "P2003" ||
            (typeof err.message === "string" && err.message.includes("foreign key"))
          ) {
            throw new ConflictError(
              "Không thể xóa hoàn toàn thành viên do phát sinh liên kết dữ liệu trong hệ thống. Vui lòng thử lại."
            );
          }
          throw dbErr;
        }
      }
    });

    return apiSuccess(
      result,
      {
        message:
          result.type === "SOFT_DELETE"
            ? "Thành viên đã có lịch sử trong chuyến đi. Đã chuyển trạng thái sang Đã rời nhóm."
            : "Đã xóa thành viên khỏi chuyến đi thành công.",
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
