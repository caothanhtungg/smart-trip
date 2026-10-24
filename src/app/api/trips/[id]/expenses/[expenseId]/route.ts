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
import { UpdateExpenseApiSchema } from "@/lib/validation/expense-api";
import {
  computeEqualShares,
  computeItemizedShares,
} from "@/lib/money/split";
import { mapExpenseDatabaseError } from "@/lib/api/expense-db-errors";

interface ItemRouteContext {
  params: Promise<{ id: string; expenseId: string }> | { id: string; expenseId: string };
}

/**
 * PATCH /api/trips/[id]/expenses/[expenseId]
 * Cập nhật thông tin khoản chi tiêu (metadata, người trả, hoặc cấu trúc chia tiền).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Chỉ Trưởng nhóm (HOST) HOẶC chính người trả tiền ban đầu (paidByMemberId === currentMember.id) mới có quyền sửa.
 * - Chuyến đi bắt buộc phải ở trạng thái ACTIVE (chặn khi SETTLING, COMPLETED, ARCHIVED).
 * - Khoản chi phải tồn tại và thuộc đúng chuyến đi (tripId); nếu không trả 404 chống IDOR.
 * - Tuân thủ quy tắc R18: Member thường không được đổi người trả tiền sang thành viên khác.
 * - Khi thay đổi cấu trúc chia tiền hoặc số tiền:
 *   + Xóa và tái tạo toàn bộ shares/items/member links trong cùng một transaction.
 *   + Bảo toàn các bất biến tài chính nghiêm ngặt.
 */
export async function PATCH(
  req: Request,
  context: ItemRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, expenseId } = params;

    if (!tripId || !isValidUuid(tripId) || !expenseId || !isValidUuid(expenseId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc khoản chi.");
    }

    // 1. Phân quyền: Người dùng phải là thành viên ACTIVE của chuyến đi
    const { member, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi bắt buộc phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể chỉnh sửa khoản chi khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Parse và validate payload đầu vào (strict schema)
    const input = await parseJsonBody(req, UpdateExpenseApiSchema);

    // 4. Kiểm tra quy tắc R18 nếu payload cập nhật paidByMemberId
    if (
      input.paidByMemberId !== undefined &&
      member.role !== "HOST" &&
      input.paidByMemberId !== member.id
    ) {
      throw new ForbiddenError(
        "Thành viên chỉ được ghi nhận khoản chi do chính mình thanh toán (Quy tắc R18)."
      );
    }

    // 5. Thực thi cập nhật trong transaction nguyên tử với khóa chia sẻ
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 5.1. Khóa chia sẻ dòng Trip trước tiên để bảo vệ khỏi việc chốt sổ đồng thời
        await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR SHARE`;

        // 5.2. Đọc lại trạng thái Trip sau khi đã có khóa
        const currentTrip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { status: true },
        });

        if (!currentTrip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (currentTrip.status !== "ACTIVE") {
          throw new BadRequestError(
            "Chỉ có thể chỉnh sửa khoản chi khi chuyến đi đang ở trạng thái lên kế hoạch."
          );
        }

        // 5.3. Tìm khoản chi mục tiêu và đảm bảo thuộc đúng tripId (IDOR protection)
        const existingExpense = await tx.expense.findFirst({
          where: { id: expenseId, tripId },
          include: {
            shares: true,
            items: {
              include: {
                members: true,
              },
            },
          },
        });

        if (!existingExpense) {
          throw new NotFoundError("Không tìm thấy khoản chi trong chuyến đi.");
        }

        // 5.4. Kiểm tra quyền sửa: HOST hoặc chính người thanh toán ban đầu
        if (member.role !== "HOST" && existingExpense.paidByMemberId !== member.id) {
          throw new ForbiddenError(
            "Chỉ Trưởng nhóm hoặc người thanh toán mới có quyền chỉnh sửa khoản chi."
          );
        }

        // 5.5. Lấy danh sách thành viên ACTIVE của chuyến đi
        const activeMembers = await tx.tripMember.findMany({
          where: { tripId, status: "ACTIVE" },
          select: { id: true, displayName: true, role: true, status: true, joinOrder: true },
        });

        const activeMemberMap = new Map(activeMembers.map((m) => [m.id, m]));

        // 5.6. Nếu có thay đổi người thanh toán, kiểm tra phải là ACTIVE member
        const effectivePaidByMemberId = input.paidByMemberId ?? existingExpense.paidByMemberId;
        const payerMember = activeMemberMap.get(effectivePaidByMemberId);
        if (!payerMember) {
          throw new BadRequestError(
            "Người thanh toán không thuộc danh sách thành viên hoạt động của chuyến đi."
          );
        }

        // 5.7. Nếu có liên kết địa điểm lịch trình mới, kiểm tra tồn tại
        if (input.itineraryItemId !== undefined && input.itineraryItemId !== null) {
          const itinItem = await tx.itineraryItem.findFirst({
            where: { id: input.itineraryItemId, tripId },
            select: { id: true },
          });

          if (!itinItem) {
            throw new BadRequestError(
              "Điểm dừng lịch trình không hợp lệ hoặc không thuộc chuyến đi này."
            );
          }
        }

        // 5.8. Hợp nhất (merge) dữ liệu cũ và payload mới
        const mergedTitle = input.title ?? existingExpense.title;
        const mergedAmount = input.amount ?? existingExpense.amount;
        const mergedCategory = input.category ?? existingExpense.category;
        const mergedSpentAt = input.spentAt ? new Date(input.spentAt) : existingExpense.spentAt;
        const mergedReceiptImageUrl =
          input.receiptImageUrl !== undefined
            ? input.receiptImageUrl
            : existingExpense.receiptImageUrl;
        const mergedNote = input.note !== undefined ? input.note : existingExpense.note;
        const mergedItineraryItemId =
          input.itineraryItemId !== undefined
            ? input.itineraryItemId
            : existingExpense.itineraryItemId;
        const mergedSplitMethod = input.splitMethod ?? existingExpense.splitMethod;
        const mergedSurchargeAmount =
          input.surchargeAmount !== undefined
            ? input.surchargeAmount
            : mergedSplitMethod === "ITEMIZED"
            ? existingExpense.surchargeAmount
            : 0;

        // 5.9. Kiểm tra xem có cần tính toán lại phân chia chi phí hay không
        const isSplitStructureChanged =
          input.splitMethod !== undefined ||
          input.amount !== undefined ||
          input.participantMemberIds !== undefined ||
          input.items !== undefined ||
          input.surchargeAmount !== undefined;

        let computedShares: Array<{ memberId: string; amount: number }> = [];
        const updatedItemsResult: Array<{
          id: string;
          name: string;
          amount: number;
          assignedMembers: Array<{ id: string; displayName: string; status: string }>;
        }> = [];

        if (isSplitStructureChanged) {
          if (mergedSplitMethod === "EQUAL") {
            const participantIds =
              input.participantMemberIds ?? existingExpense.shares.map((s) => s.memberId);

            if (!participantIds || participantIds.length === 0) {
              throw new BadRequestError("Vui lòng chọn ít nhất 1 thành viên tham gia chia tiền.");
            }

            for (const pId of participantIds) {
              if (!activeMemberMap.has(pId)) {
                throw new BadRequestError(
                  "Danh sách người chia có thành viên không thuộc chuyến đi hoặc không ở trạng thái hoạt động."
                );
              }
            }

            const participantsWithJoinOrder = participantIds.map((pId) => ({
              id: pId,
              joinOrder: activeMemberMap.get(pId)!.joinOrder,
            }));

            const equalShares = computeEqualShares(mergedAmount, participantsWithJoinOrder);
            computedShares = equalShares.map((s) => ({
              memberId: s.memberId,
              amount: s.amount,
            }));
          } else {
            // mergedSplitMethod === "ITEMIZED"
            const rawItems = (
              input.items ??
              existingExpense.items.map((it) => ({
                id: it.id,
                name: it.name,
                amount: it.amount,
                assignedMemberIds: it.members.map((m) => m.memberId),
              }))
            ).map((it, idx) => ({
              id: it.id || `item_${idx}`,
              name: it.name,
              amount: it.amount,
              assignedMemberIds: it.assignedMemberIds,
            }));

            if (!rawItems || rawItems.length === 0) {
              throw new BadRequestError("Vui lòng nhập ít nhất một món ăn.");
            }

            // Kiểm tra bất biến tổng món + phụ phí == mergedAmount
            const sumItems = rawItems.reduce((acc, it) => acc + it.amount, 0);
            if (sumItems + mergedSurchargeAmount !== mergedAmount) {
              throw new BadRequestError(
                "Tổng các món và phụ phí không khớp với số tiền của khoản chi."
              );
            }

            for (const item of rawItems) {
              for (const mId of item.assignedMemberIds) {
                if (!activeMemberMap.has(mId)) {
                  throw new BadRequestError(
                    "Danh sách người chia món có thành viên không thuộc chuyến đi hoặc không ở trạng thái hoạt động."
                  );
                }
              }
            }

            const activeParticipants = activeMembers.map((m) => ({
              id: m.id,
              joinOrder: m.joinOrder,
            }));

            const itemizedShares = computeItemizedShares(
              mergedAmount,
              rawItems,
              { amount: mergedSurchargeAmount },
              activeParticipants
            );

            computedShares = itemizedShares.map((s) => ({
              memberId: s.memberId,
              amount: s.totalAmount,
            }));
          }

          // Kiểm tra bất biến số học cuối cùng
          const totalSharesAmount = computedShares.reduce((acc, s) => acc + s.amount, 0);
          if (totalSharesAmount !== mergedAmount) {
            throw new BadRequestError(
              "Lỗi bất biến số học: Tổng phần chia không khớp với số tiền khoản chi."
            );
          }

          // Xóa các liên kết con cũ
          await tx.expenseShare.deleteMany({ where: { expenseId } });
          await tx.expenseItem.deleteMany({ where: { expenseId } });

          // Tạo lại ExpenseShare mới
          await tx.expenseShare.createMany({
            data: computedShares.map((s) => ({
              expenseId,
              memberId: s.memberId,
              amount: s.amount,
            })),
          });

          // Nếu ITEMIZED, tạo lại ExpenseItem và ExpenseItemMember mới
          if (mergedSplitMethod === "ITEMIZED") {
            const rawItems =
              input.items ??
              existingExpense.items.map((it) => ({
                name: it.name,
                amount: it.amount,
                assignedMemberIds: it.members.map((m) => m.memberId),
              }));

            for (const item of rawItems) {
              const createdItem = await tx.expenseItem.create({
                data: {
                  expenseId,
                  name: item.name,
                  amount: item.amount,
                },
              });

              await tx.expenseItemMember.createMany({
                data: item.assignedMemberIds.map((mId) => ({
                  itemId: createdItem.id,
                  memberId: mId,
                })),
              });

              updatedItemsResult.push({
                id: createdItem.id,
                name: item.name,
                amount: item.amount,
                assignedMembers: item.assignedMemberIds.map((mId) => {
                  const mem = activeMemberMap.get(mId)!;
                  return {
                    id: mem.id,
                    displayName: mem.displayName,
                    status: mem.status,
                  };
                }),
              });
            }
          }
        } else {
          // Giữ nguyên shares và items hiện có
          computedShares = existingExpense.shares.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
          }));
        }

        // 5.10. Cập nhật bảng Expense
        const updatedExpense = await tx.expense.update({
          where: { id: expenseId },
          data: {
            title: mergedTitle,
            amount: mergedAmount,
            surchargeAmount: mergedSurchargeAmount,
            category: mergedCategory,
            paidByMemberId: effectivePaidByMemberId,
            splitMethod: mergedSplitMethod,
            spentAt: mergedSpentAt,
            receiptImageUrl: mergedReceiptImageUrl,
            note: mergedNote,
            itineraryItemId: mergedItineraryItemId,
          },
        });

        return {
          updatedExpense,
          payerMember,
          computedShares,
          updatedItemsResult,
        };
      });

      // 6. Format DTO trả về cho client
      const formattedUpdated = {
        id: result.updatedExpense.id,
        tripId: result.updatedExpense.tripId,
        itineraryItemId: result.updatedExpense.itineraryItemId,
        title: result.updatedExpense.title,
        amount: result.updatedExpense.amount,
        surchargeAmount: result.updatedExpense.surchargeAmount,
        category: result.updatedExpense.category,
        paidByMemberId: result.updatedExpense.paidByMemberId,
        paidBy: {
          id: result.payerMember.id,
          displayName: result.payerMember.displayName,
          role: result.payerMember.role,
          status: result.payerMember.status,
        },
        createdByMemberId: result.updatedExpense.createdByMemberId,
        createdBy: {
          id: member.id,
          displayName: member.displayName,
        },
        splitMethod: result.updatedExpense.splitMethod,
        spentAt: result.updatedExpense.spentAt.toISOString(),
        receiptImageUrl: result.updatedExpense.receiptImageUrl,
        note: result.updatedExpense.note,
        createdAt: result.updatedExpense.createdAt.toISOString(),
        updatedAt: result.updatedExpense.updatedAt.toISOString(),
        itineraryItem: null,
        shares: result.computedShares.map((s, idx) => ({
          id: `share-${idx}`,
          memberId: s.memberId,
          amount: s.amount,
        })),
        items: result.updatedItemsResult,
      };

      return apiSuccess(formattedUpdated);
    } catch (dbError) {
      const mapped = mapExpenseDatabaseError(dbError);
      if (mapped) throw mapped;
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/trips/[id]/expenses/[expenseId]
 * Xóa một khoản chi tiêu khỏi chuyến đi.
 *
 * PHÂN QUYỀN & TOÀN VẸN:
 * - Chỉ Trưởng nhóm (HOST) HOẶC người trả tiền ban đầu mới có quyền xóa.
 * - Chuyến đi bắt buộc phải ở trạng thái ACTIVE.
 * - Khoản chi phải thuộc đúng tripId (IDOR protection).
 * - Bảng liên quan: ExpenseShare và ExpenseItem tự động CASCADE xóa tại DB.
 * - Điểm dừng lịch trình (ItineraryItem) và thành viên (TripMember) KHÔNG bị ảnh hưởng.
 */
export async function DELETE(
  _req: Request,
  context: ItemRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, expenseId } = params;

    if (!tripId || !isValidUuid(tripId) || !expenseId || !isValidUuid(expenseId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc khoản chi.");
    }

    // 1. Phân quyền: Caller phải là thành viên ACTIVE
    const { member, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi bắt buộc phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể xóa khoản chi khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Thực thi xóa trong transaction với khóa chia sẻ
    try {
      await prisma.$transaction(async (tx) => {
        // 3.1. Khóa chia sẻ dòng Trip trước tiên
        await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR SHARE`;

        // 3.2. Đọc lại trạng thái Trip sau khi đã có khóa
        const currentTrip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { status: true },
        });

        if (!currentTrip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (currentTrip.status !== "ACTIVE") {
          throw new BadRequestError(
            "Chỉ có thể xóa khoản chi khi chuyến đi đang ở trạng thái lên kế hoạch."
          );
        }

        const existingExpense = await tx.expense.findFirst({
          where: { id: expenseId, tripId },
        });

        if (!existingExpense) {
          throw new NotFoundError("Không tìm thấy khoản chi trong chuyến đi.");
        }

        // Kiểm tra quyền: Chỉ HOST hoặc chính người thanh toán ban đầu mới được xóa
        if (member.role !== "HOST" && existingExpense.paidByMemberId !== member.id) {
          throw new ForbiddenError(
            "Chỉ Trưởng nhóm hoặc người thanh toán mới có quyền xóa khoản chi."
          );
        }

        await tx.expense.delete({
          where: { id: expenseId },
        });
      });

      return apiSuccess(
        { id: expenseId },
        { message: "Đã xóa khoản chi thành công." }
      );
    } catch (dbError) {
      const mapped = mapExpenseDatabaseError(dbError);
      if (mapped) throw mapped;
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
