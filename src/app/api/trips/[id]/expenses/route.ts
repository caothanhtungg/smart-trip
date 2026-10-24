import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseQueryParams,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import {
  CreateExpenseApiSchema,
  ExpenseQuerySchema,
} from "@/lib/validation/expense-api";
import {
  computeEqualShares,
  computeItemizedShares,
} from "@/lib/money/split";
import { mapExpenseDatabaseError } from "@/lib/api/expense-db-errors";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * GET /api/trips/[id]/expenses
 * Lấy danh sách toàn bộ các khoản chi của chuyến đi.
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ (401).
 * - Thành viên ACTIVE hoặc LEFT của đúng chuyến đi được phép đọc lịch sử tài chính (403 nếu không thuộc).
 * - Trả 404 nếu tripId không hợp lệ hoặc chuyến đi không tồn tại.
 * - Loại bỏ hoàn toàn các trường nhạy cảm (mật khẩu, userId, bank account ciphertexts, tokens).
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

    // 1. Phân quyền: Người dùng phải là thành viên ACTIVE hoặc LEFT của chuyến đi
    await requireTripMembership(tripId, { allowLeftMember: true });

    // 2. Query parameters (lọc tùy chọn theo category, splitMethod)
    const query = parseQueryParams(req, ExpenseQuerySchema);

    // 3. Truy vấn danh sách Expense với Prisma include an toàn
    const expenses = await prisma.expense.findMany({
      where: {
        tripId,
        ...(query.category ? { category: query.category } : {}),
        ...(query.splitMethod ? { splitMethod: query.splitMethod } : {}),
      },
      include: {
        paidBy: {
          select: {
            id: true,
            displayName: true,
            role: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
        itineraryItem: {
          select: {
            id: true,
            placeName: true,
            dayDate: true,
          },
        },
        shares: {
          include: {
            member: {
              select: {
                id: true,
                displayName: true,
                status: true,
              },
            },
          },
        },
        items: {
          include: {
            members: {
              include: {
                member: {
                  select: {
                    id: true,
                    displayName: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    });

    // 4. Format DTO trả về cho client
    const formattedExpenses = expenses.map((exp) => ({
      id: exp.id,
      tripId: exp.tripId,
      itineraryItemId: exp.itineraryItemId,
      title: exp.title,
      amount: exp.amount,
      surchargeAmount: exp.surchargeAmount,
      category: exp.category,
      paidByMemberId: exp.paidByMemberId,
      paidBy: {
        id: exp.paidBy.id,
        displayName: exp.paidBy.displayName,
        role: exp.paidBy.role,
        status: exp.paidBy.status,
      },
      createdByMemberId: exp.createdByMemberId,
      createdBy: {
        id: exp.createdBy.id,
        displayName: exp.createdBy.displayName,
      },
      splitMethod: exp.splitMethod,
      spentAt: exp.spentAt.toISOString(),
      receiptImageUrl: exp.receiptImageUrl,
      note: exp.note,
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
      itineraryItem: exp.itineraryItem
        ? {
            id: exp.itineraryItem.id,
            placeName: exp.itineraryItem.placeName,
            dayDate: exp.itineraryItem.dayDate.toISOString().split("T")[0],
          }
        : null,
      shares: exp.shares.map((share) => ({
        id: share.id,
        memberId: share.memberId,
        amount: share.amount,
        member: {
          id: share.member.id,
          displayName: share.member.displayName,
          status: share.member.status,
        },
      })),
      items: exp.items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        assignedMembers: item.members.map((m) => ({
          id: m.member.id,
          displayName: m.member.displayName,
          status: m.member.status,
        })),
      })),
    }));

    return apiSuccess(formattedExpenses);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/trips/[id]/expenses
 * Tạo mới một khoản chi tiêu trong chuyến đi (EQUAL hoặc ITEMIZED).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Caller phải là thành viên ACTIVE của chuyến đi.
 * - Chuyến đi bắt buộc phải ở trạng thái ACTIVE (chặn khi SETTLING, COMPLETED, ARCHIVED).
 * - Tuân thủ quy tắc R18:
 *   + MEMBER thường chỉ được khai báo chính mình là người trả (paidByMemberId === currentMember.id).
 *   + HOST được quyền ghi nhận bất kỳ thành viên ACTIVE nào là người trả.
 * - createdByMemberId luôn lấy từ server session membership, không nhận từ client.
 * - Toàn bộ thao tác ghi (Expense, ExpenseShare, ExpenseItem, ExpenseItemMember)
 *   phải nằm trong một transaction nguyên tử; rollback toàn bộ nếu có bất kỳ lỗi nào.
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

    // 1. Phân quyền: Người dùng phải là thành viên ACTIVE của chuyến đi
    const { member, trip } = await requireTripMembership(tripId);

    // 2. Chuyến đi bắt buộc phải ở trạng thái ACTIVE
    if (trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Chỉ có thể tạo khoản chi khi chuyến đi đang ở trạng thái lên kế hoạch."
      );
    }

    // 3. Parse và validate payload đầu vào (strict schema, invariants checked)
    const input = await parseJsonBody(req, CreateExpenseApiSchema);

    // 4. Kiểm tra quy tắc R18 về người trả tiền
    if (member.role !== "HOST" && input.paidByMemberId !== member.id) {
      throw new ForbiddenError(
        "Thành viên chỉ được ghi nhận khoản chi do chính mình thanh toán (Quy tắc R18)."
      );
    }

    // 5. Thực thi toàn bộ thao tác trong một transaction nguyên tử với khóa chia sẻ
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
            "Chỉ có thể tạo khoản chi khi chuyến đi đang ở trạng thái lên kế hoạch."
          );
        }

        // 5.3. Lấy danh sách thành viên ACTIVE của chuyến đi
        const activeMembers = await tx.tripMember.findMany({
          where: { tripId, status: "ACTIVE" },
          select: { id: true, displayName: true, role: true, status: true, joinOrder: true },
        });

        const activeMemberMap = new Map(activeMembers.map((m) => [m.id, m]));

        // 5.4. Xác thực người trả tiền phải là thành viên ACTIVE thuộc chuyến đi
        const payerMember = activeMemberMap.get(input.paidByMemberId);
        if (!payerMember) {
          throw new BadRequestError(
            "Người thanh toán không thuộc danh sách thành viên hoạt động của chuyến đi."
          );
        }

        // 5.5. Nếu có liên kết điểm dừng lịch trình, xác thực thuộc cùng chuyến đi
        if (input.itineraryItemId) {
          const itinItem = await tx.itineraryItem.findFirst({
            where: { id: input.itineraryItemId, tripId },
            select: { id: true, placeName: true, dayDate: true },
          });

          if (!itinItem) {
            throw new BadRequestError(
              "Điểm dừng lịch trình không hợp lệ hoặc không thuộc chuyến đi này."
            );
          }
        }

        // 5.6. Tính toán phân chia chi phí theo phương thức
        let computedShares: Array<{ memberId: string; amount: number }> = [];

        if (input.splitMethod === "EQUAL") {
          // Kiểm tra tất cả người tham gia phải là ACTIVE members của chuyến đi
          for (const pId of input.participantMemberIds) {
            const participant = activeMemberMap.get(pId);
            if (!participant) {
              throw new BadRequestError(
                "Danh sách người chia có thành viên không thuộc chuyến đi hoặc không ở trạng thái hoạt động."
              );
            }
          }

          const participantsWithJoinOrder = input.participantMemberIds.map((pId) => ({
            id: pId,
            joinOrder: activeMemberMap.get(pId)!.joinOrder,
          }));

          const equalShares = computeEqualShares(input.amount, participantsWithJoinOrder);
          computedShares = equalShares.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
          }));
        } else {
          // splitMethod === "ITEMIZED"
          for (const item of input.items) {
            for (const mId of item.assignedMemberIds) {
              const participant = activeMemberMap.get(mId);
              if (!participant) {
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

          const itemInputs = input.items.map((it, idx) => ({
            id: it.id || `item_${idx}`,
            name: it.name,
            amount: it.amount,
            assignedMemberIds: it.assignedMemberIds,
          }));

          const surchargeAmount = input.surchargeAmount ?? 0;
          const itemizedShares = computeItemizedShares(
            input.amount,
            itemInputs,
            { amount: surchargeAmount },
            activeParticipants
          );

          computedShares = itemizedShares.map((s) => ({
            memberId: s.memberId,
            amount: s.totalAmount,
          }));
        }

        // 5.7. Kiểm chứng bất biến tiền tệ tuyệt đối trước khi ghi bản ghi
        const totalSharesAmount = computedShares.reduce((acc, s) => acc + s.amount, 0);
        if (totalSharesAmount !== input.amount) {
          throw new BadRequestError(
            "Lỗi bất biến số học: Tổng phần chia không khớp với số tiền khoản chi."
          );
        }

        // 5.8. Tạo bản ghi Expense
        const createdExpense = await tx.expense.create({
          data: {
            tripId,
            itineraryItemId: input.itineraryItemId ?? null,
            title: input.title,
            amount: input.amount,
            surchargeAmount: input.splitMethod === "ITEMIZED" ? (input.surchargeAmount ?? 0) : 0,
            category: input.category,
            paidByMemberId: input.paidByMemberId,
            createdByMemberId: member.id, // Server enforced, never client input
            splitMethod: input.splitMethod,
            spentAt: input.spentAt ? new Date(input.spentAt) : new Date(),
            receiptImageUrl: input.receiptImageUrl ?? null,
            note: input.note ?? null,
          },
        });

        // 5.9. Tạo các bản ghi ExpenseShare
        await tx.expenseShare.createMany({
          data: computedShares.map((s) => ({
            expenseId: createdExpense.id,
            memberId: s.memberId,
            amount: s.amount,
          })),
        });

        // 5.10. Nếu là ITEMIZED, tạo các bản ghi ExpenseItem và ExpenseItemMember
        const createdItemsResult: Array<{
          id: string;
          name: string;
          amount: number;
          assignedMembers: Array<{ id: string; displayName: string; status: string }>;
        }> = [];

        if (input.splitMethod === "ITEMIZED") {
          for (const item of input.items) {
            const createdItem = await tx.expenseItem.create({
              data: {
                expenseId: createdExpense.id,
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

            createdItemsResult.push({
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

        return {
          createdExpense,
          payerMember,
          computedShares,
          createdItemsResult,
        };
      });

      // 6. Format DTO trả về cho client
      const formattedCreated = {
        id: result.createdExpense.id,
        tripId: result.createdExpense.tripId,
        itineraryItemId: result.createdExpense.itineraryItemId,
        title: result.createdExpense.title,
        amount: result.createdExpense.amount,
        surchargeAmount: result.createdExpense.surchargeAmount,
        category: result.createdExpense.category,
        paidByMemberId: result.createdExpense.paidByMemberId,
        paidBy: {
          id: result.payerMember.id,
          displayName: result.payerMember.displayName,
          role: result.payerMember.role,
          status: result.payerMember.status,
        },
        createdByMemberId: result.createdExpense.createdByMemberId,
        createdBy: {
          id: member.id,
          displayName: member.displayName,
        },
        splitMethod: result.createdExpense.splitMethod,
        spentAt: result.createdExpense.spentAt.toISOString(),
        receiptImageUrl: result.createdExpense.receiptImageUrl,
        note: result.createdExpense.note,
        createdAt: result.createdExpense.createdAt.toISOString(),
        updatedAt: result.createdExpense.updatedAt.toISOString(),
        itineraryItem: null,
        shares: result.computedShares.map((s, idx) => ({
          id: `share-${idx}`,
          memberId: s.memberId,
          amount: s.amount,
        })),
        items: result.createdItemsResult,
      };

      return apiSuccess(formattedCreated, { status: 201 });
    } catch (dbError) {
      const mapped = mapExpenseDatabaseError(dbError);
      if (mapped) throw mapped;
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
