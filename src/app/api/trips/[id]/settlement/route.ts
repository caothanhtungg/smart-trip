import {
  apiSuccess,
  handleApiError,
  parseQueryParams,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { SettlementQuerySchema } from "@/lib/validation/settlement-api";
import { calculateMemberBalances } from "@/lib/money/settlement";
import { simplify } from "@/lib/money/simplify";
import { mapSettlementDatabaseError } from "@/lib/api/settlement-db-errors";
import type { TripMember, TripExpense } from "@/types/trip";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * Format settlement entity into a safe client DTO.
 * Excludes sensitive fields (bank ciphertext, private tokens, passwords, user IDs).
 */
function formatSettlementDto(settlement: {
  id: string;
  tripId: string;
  status: "ACTIVE" | "CANCELLED";
  createdByMemberId: string;
  createdByMember: {
    id: string;
    displayName: string;
  };
  createdAt: Date;
  cancelledAt: Date | null;
  transfers: Array<{
    id: string;
    settlementId: string;
    fromMemberId: string;
    fromMember: {
      id: string;
      displayName: string;
      status: string;
      userId: string | null;
    };
    toMemberId: string;
    toMember: {
      id: string;
      displayName: string;
      status: string;
      userId: string | null;
    };
    amount: number;
    status: "UNPAID" | "PAID" | "COMPLETED";
    paymentMethod: "BANK_TRANSFER" | "CASH" | null;
    paidAt: Date | null;
    paidMarkedByMemberId: string | null;
    paidMarkedBy: {
      id: string;
      displayName: string;
    } | null;
    completedAt: Date | null;
    completedByMemberId: string | null;
    completedBy: {
      id: string;
      displayName: string;
    } | null;
  }>;
}) {
  return {
    id: settlement.id,
    tripId: settlement.tripId,
    status: settlement.status,
    createdByMemberId: settlement.createdByMemberId,
    createdByMember: {
      id: settlement.createdByMember.id,
      displayName: settlement.createdByMember.displayName,
    },
    createdAt: settlement.createdAt.toISOString(),
    cancelledAt: settlement.cancelledAt ? settlement.cancelledAt.toISOString() : null,
    transfers: settlement.transfers.map((t) => ({
      id: t.id,
      settlementId: t.settlementId,
      fromMemberId: t.fromMemberId,
      fromMember: {
        id: t.fromMember.id,
        displayName: t.fromMember.displayName,
        status: t.fromMember.status,
        isNoAccount: t.fromMember.userId === null,
      },
      toMemberId: t.toMemberId,
      toMember: {
        id: t.toMember.id,
        displayName: t.toMember.displayName,
        status: t.toMember.status,
        isNoAccount: t.toMember.userId === null,
      },
      amount: t.amount,
      status: t.status,
      paymentMethod: t.paymentMethod,
      paidAt: t.paidAt ? t.paidAt.toISOString() : null,
      paidMarkedByMemberId: t.paidMarkedByMemberId,
      paidMarkedBy: t.paidMarkedBy
        ? {
            id: t.paidMarkedBy.id,
            displayName: t.paidMarkedBy.displayName,
          }
        : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      completedByMemberId: t.completedByMemberId,
      completedBy: t.completedBy
        ? {
            id: t.completedBy.id,
            displayName: t.completedBy.displayName,
          }
        : null,
    })),
  };
}

/**
 * GET /api/trips/[id]/settlement
 * Lấy sổ quyết toán hiện hành (ACTIVE) của chuyến đi kèm danh sách chuyển khoản và số dư.
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ (401).
 * - Thành viên ACTIVE hoặc LEFT của đúng chuyến đi được phép xem (403 nếu không thuộc).
 * - Không lộ thông tin ngân hàng ciphertext hay token nhạy cảm.
 * - Hỗ trợ query ?history=true để xem cả các sổ quyết toán CANCELLED trước đây.
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

    // 1. Phân quyền: Người dùng phải là thành viên (ACTIVE hoặc LEFT)
    await requireTripMembership(tripId, { allowLeftMember: true });

    // 2. Query parameters
    const query = parseQueryParams(req, SettlementQuerySchema);

    // 3. Lấy Settlement ACTIVE hiện tại của chuyến đi
    const activeSettlement = await prisma.settlement.findFirst({
      where: { tripId, status: "ACTIVE" },
      include: {
        createdByMember: {
          select: { id: true, displayName: true },
        },
        transfers: {
          include: {
            fromMember: {
              select: { id: true, displayName: true, status: true, userId: true },
            },
            toMember: {
              select: { id: true, displayName: true, status: true, userId: true },
            },
            paidMarkedBy: {
              select: { id: true, displayName: true },
            },
            completedBy: {
              select: { id: true, displayName: true },
            },
          },
          orderBy: [{ status: "asc" }, { amount: "desc" }],
        },
      },
    });

    // 4. Nếu có yêu cầu history, lấy thêm danh sách CANCELLED
    const showHistory = query.history === "true";
    let historySettlements: ReturnType<typeof formatSettlementDto>[] = [];
    if (showHistory) {
      const cancelled = await prisma.settlement.findMany({
        where: { tripId, status: "CANCELLED" },
        include: {
          createdByMember: {
            select: { id: true, displayName: true },
          },
          transfers: {
            include: {
              fromMember: {
                select: { id: true, displayName: true, status: true, userId: true },
              },
              toMember: {
                select: { id: true, displayName: true, status: true, userId: true },
              },
              paidMarkedBy: {
                select: { id: true, displayName: true },
              },
              completedBy: {
                select: { id: true, displayName: true },
              },
            },
            orderBy: [{ status: "asc" }, { amount: "desc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      });
      historySettlements = cancelled.map(formatSettlementDto);
    }

    // 5. Tính toán bảng số dư hiện tại của chuyến đi (bao gồm cả lịch sử của thành viên LEFT)
    const members = await prisma.tripMember.findMany({
      where: { tripId },
      select: {
        id: true,
        displayName: true,
        role: true,
        status: true,
        joinOrder: true,
        userId: true,
      },
      orderBy: { joinOrder: "asc" },
    });

    const expenses = await prisma.expense.findMany({
      where: { tripId },
      select: {
        id: true,
        amount: true,
        paidByMemberId: true,
        shares: {
          select: {
            id: true,
            memberId: true,
            amount: true,
          },
        },
      },
    });

    const domainMembers: TripMember[] = members.map((m) => ({
      id: m.id,
      name: m.displayName,
      role: m.role,
      status: m.status,
      joinOrder: m.joinOrder,
      isNoAccount: m.userId === null,
      isHost: m.role === "HOST",
    }));

    const domainExpenses: TripExpense[] = expenses.map((e) => ({
      id: e.id,
      tripId,
      title: "",
      amount: e.amount,
      category: "OTHER",
      paidByMemberId: e.paidByMemberId,
      splitMethod: "EQUAL",
      spentAt: new Date().toISOString(),
      shares: e.shares.map((s) => ({
        id: s.id,
        expenseId: e.id,
        memberId: s.memberId,
        amount: s.amount,
      })),
    }));

    const balanceResult = calculateMemberBalances(
      domainMembers,
      domainExpenses,
      undefined,
      { includeLeftMembers: true }
    );

    return apiSuccess({
      settlement: activeSettlement ? formatSettlementDto(activeSettlement) : null,
      balances: balanceResult.balances,
      totalSpent: balanceResult.totalPaid,
      ...(showHistory ? { history: historySettlements } : {}),
    });
  } catch (error) {
    const mapped = mapSettlementDatabaseError(error);
    return handleApiError(mapped || error);
  }
}

/**
 * POST /api/trips/[id]/settlement
 * Chốt sổ công nợ (Tạo Settlement & sinh danh sách SettlementTransfers rút gọn).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ (401).
 * - Chỉ Trưởng nhóm (HOST) mới có quyền chốt sổ (403 nếu không phải Host).
 * - Chuyến đi phải ở trạng thái ACTIVE (409 nếu không phải ACTIVE).
 * - Sử dụng khóa độc quyền PostgreSQL `SELECT ... FOR UPDATE` trên hàng Trip.
 * - Đọc lại trạng thái sau khi có khóa độc quyền để ngăn chặn hoàn toàn race condition.
 * - Kiểm chứng bất biến Zero-Sum SUM(net) === 0 và số nguyên an toàn VND.
 * - Tự động sinh danh sách transfers tối ưu theo thuật toán simplify(netMap).
 * - Cập nhật trạng thái chuyến đi sang SETTLING (hoặc COMPLETED nếu không ai nợ ai).
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
    const { member } = await requireTripMembership(tripId, {
      requiredRole: "HOST",
    });

    // 2. Thực thi toàn bộ thao tác trong một transaction nguyên tử với khóa độc quyền FOR UPDATE
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 2.1. Khóa hàng Trip bằng FOR UPDATE độc quyền trước khi đọc bất kỳ dữ liệu nào
        await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR UPDATE`;

        // 2.2. Đọc lại trạng thái Trip sau khi đã có khóa độc quyền
        const currentTrip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { id: true, status: true, name: true },
        });

        if (!currentTrip) {
          throw new NotFoundError("Không tìm thấy chuyến đi.");
        }

        if (currentTrip.status !== "ACTIVE") {
          throw new ConflictError(
            `Không thể chốt sổ khi chuyến đi đang ở trạng thái "${currentTrip.status}". Chỉ chuyến đi ACTIVE mới có thể chốt sổ.`
          );
        }

        // 2.3. Kiểm tra xem chuyến đi đã có Settlement ACTIVE nào chưa
        const existingActiveSettlement = await tx.settlement.findFirst({
          where: { tripId, status: "ACTIVE" },
        });

        if (existingActiveSettlement) {
          throw new ConflictError(
            "Chuyến đi đã có sổ quyết toán đang hoạt động."
          );
        }

        // 2.4. Đọc danh sách toàn bộ thành viên và các khoản chi đã lưu
        const members = await tx.tripMember.findMany({
          where: { tripId },
          select: {
            id: true,
            displayName: true,
            role: true,
            status: true,
            joinOrder: true,
            userId: true,
          },
          orderBy: { joinOrder: "asc" },
        });

        const expenses = await tx.expense.findMany({
          where: { tripId },
          select: {
            id: true,
            amount: true,
            paidByMemberId: true,
            shares: {
              select: {
                id: true,
                memberId: true,
                amount: true,
              },
            },
          },
        });

        // 2.5. Xây dựng domain entities và tính toán số dư ròng
        const domainMembers: TripMember[] = members.map((m) => ({
          id: m.id,
          name: m.displayName,
          role: m.role,
          status: m.status,
          joinOrder: m.joinOrder,
          isNoAccount: m.userId === null,
          isHost: m.role === "HOST",
        }));

        const domainExpenses: TripExpense[] = expenses.map((e) => ({
          id: e.id,
          tripId,
          title: "",
          amount: e.amount,
          category: "OTHER",
          paidByMemberId: e.paidByMemberId,
          splitMethod: "EQUAL",
          spentAt: new Date().toISOString(),
          shares: e.shares.map((s) => ({
            id: s.id,
            expenseId: e.id,
            memberId: s.memberId,
            amount: s.amount,
          })),
        }));

        const balanceResult = calculateMemberBalances(
          domainMembers,
          domainExpenses,
          undefined,
          { includeLeftMembers: true }
        );

        // 2.6. Xác nhận bất biến Zero-Sum và safe integer
        const netMap: Record<string, number> = {};
        for (const b of balanceResult.balances) {
          if (!Number.isSafeInteger(b.netAmount)) {
            throw new BadRequestError(
              `Số dư ròng của thành viên ${b.memberName} không phải là số nguyên an toàn: ${b.netAmount}`
            );
          }
          netMap[b.memberId] = b.netAmount;
        }

        // 2.7. Rút gọn nợ bằng thuật toán simplify
        const simplifiedTransfers = simplify(netMap);

        // 2.8. Tạo bản ghi Settlement
        const createdSettlement = await tx.settlement.create({
          data: {
            tripId,
            status: "ACTIVE",
            createdByMemberId: member.id, // Server enforced Host ID
          },
        });

        // 2.9. Nếu có giao dịch cần chuyển, tạo các SettlementTransfers
        if (simplifiedTransfers.length > 0) {
          await tx.settlementTransfer.createMany({
            data: simplifiedTransfers.map((txItem) => ({
              settlementId: createdSettlement.id,
              fromMemberId: txItem.from,
              toMemberId: txItem.to,
              amount: txItem.amount,
              status: "UNPAID",
            })),
          });

          // Chuyển trạng thái chuyến đi sang SETTLING
          await tx.trip.update({
            where: { id: tripId },
            data: { status: "SETTLING" },
          });
        } else {
          // Không ai nợ ai (mọi người đều net = 0 hoặc chưa có chi tiêu)
          // Chuyển thẳng chuyến đi sang COMPLETED theo SD2
          await tx.trip.update({
            where: { id: tripId },
            data: { status: "COMPLETED" },
          });
        }

        // 2.10. Đọc lại Settlement hoàn chỉnh kèm transfers để trả về DTO
        const fullSettlement = await tx.settlement.findUniqueOrThrow({
          where: { id: createdSettlement.id },
          include: {
            createdByMember: {
              select: { id: true, displayName: true },
            },
            transfers: {
              include: {
                fromMember: {
                  select: { id: true, displayName: true, status: true, userId: true },
                },
                toMember: {
                  select: { id: true, displayName: true, status: true, userId: true },
                },
                paidMarkedBy: {
                  select: { id: true, displayName: true },
                },
                completedBy: {
                  select: { id: true, displayName: true },
                },
              },
              orderBy: [{ status: "asc" }, { amount: "desc" }],
            },
          },
        });

        return {
          settlement: formatSettlementDto(fullSettlement),
          balances: balanceResult.balances,
          tripStatus: simplifiedTransfers.length > 0 ? "SETTLING" : "COMPLETED",
        };
      });

      return apiSuccess(result, {
        status: 201,
        message:
          result.tripStatus === "COMPLETED"
            ? "Tất cả thành viên đã tự cân bằng chi phí. Chuyến đi đã hoàn tất!"
            : "Đã chốt sổ công nợ thành công! Chuyến đi chuyển sang trạng thái Quyết toán.",
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
