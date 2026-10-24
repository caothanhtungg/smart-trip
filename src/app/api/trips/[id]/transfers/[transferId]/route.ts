import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import {
  UpdateTransferInputSchema,
  type UpdateTransferInput,
} from "@/lib/validation/settlement-api";
import { mapSettlementDatabaseError } from "@/lib/api/settlement-db-errors";

interface TransferRouteContext {
  params:
    | Promise<{ id: string; transferId: string }>
    | { id: string; transferId: string };
}

/**
 * Format transfer entity into a safe client DTO.
 * Excludes sensitive fields (bank ciphertext, private tokens, passwords, user IDs).
 */
export function formatTransferDto(t: {
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
}) {
  return {
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
  };
}

/**
 * Core business transaction to update transfer status with strict state machine and locking.
 */
export async function updateTransferStatus(
  tripId: string,
  transferId: string,
  input: UpdateTransferInput,
  callerMember: { id: string; role: string; userId: string | null }
) {
  const isMarkPaid =
    ("action" in input && input.action === "MARK_PAID") ||
    ("status" in input && input.status === "PAID");
  const isConfirmCompleted =
    ("action" in input && input.action === "CONFIRM_COMPLETED") ||
    ("status" in input && input.status === "COMPLETED");

  if (!isMarkPaid && !isConfirmCompleted) {
    throw new BadRequestError("Hành động không hợp lệ.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Lock Trip row FOR UPDATE to coordinate with settlement reopen / trip status updates
    await tx.$queryRaw`SELECT id FROM trips WHERE id = ${tripId}::uuid FOR UPDATE`;

    // 2. Lock Transfer row FOR UPDATE
    await tx.$queryRaw`SELECT id FROM settlement_transfers WHERE id = ${transferId}::uuid FOR UPDATE`;

    // 2.1. Đọc lại trạng thái Trip sau khi có khóa (Fix MEDIUM-01)
    const currentTrip = await tx.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true },
    });

    if (!currentTrip) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }

    if (currentTrip.status !== "SETTLING") {
      throw new ConflictError(
        `Không thể cập nhật giao dịch khi chuyến đi đang ở trạng thái "${currentTrip.status}". Chỉ có thể cập nhật khi chuyến đi đang quyết toán (SETTLING).`
      );
    }

    // 3. Read transfer with settlement & member relations
    const transfer = await tx.settlementTransfer.findUnique({
      where: { id: transferId },
      include: {
        settlement: {
          select: { id: true, tripId: true, status: true },
        },
        fromMember: {
          select: { id: true, displayName: true, status: true, userId: true, role: true },
        },
        toMember: {
          select: { id: true, displayName: true, status: true, userId: true, role: true },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundError("Không tìm thấy giao dịch chuyển tiền.");
    }

    // 4. Trip boundary check (IDOR prevention: do not leak existence of transfer in other trips)
    if (transfer.settlement.tripId !== tripId) {
      throw new NotFoundError("Không tìm thấy giao dịch chuyển tiền trong chuyến đi này.");
    }

    // 5. Settlement must be ACTIVE
    if (transfer.settlement.status !== "ACTIVE") {
      throw new ConflictError("Sổ quyết toán chứa giao dịch này không còn hoạt động.");
    }

    const now = new Date();

    if (isMarkPaid) {
      // Current status must be UNPAID
      if (transfer.status === "PAID") {
        throw new ConflictError("Giao dịch này đã được đánh dấu thanh toán trước đó.");
      }
      if (transfer.status === "COMPLETED") {
        throw new ConflictError("Giao dịch này đã hoàn tất, không thể đánh dấu thanh toán lại.");
      }
      if (transfer.status !== "UNPAID") {
        throw new ConflictError(`Không thể đánh dấu thanh toán từ trạng thái "${transfer.status}".`);
      }

      // Authorization for MARK_PAID:
      // - Debtor (fromMemberId) can mark paid.
      // - Host can mark paid IF debtor has no account (userId === null).
      const isDebtor = callerMember.id === transfer.fromMemberId;
      const isHostForNoAccountDebtor =
        callerMember.role === "HOST" && transfer.fromMember.userId === null;

      if (!isDebtor && !isHostForNoAccountDebtor) {
        throw new ForbiddenError(
          "Chỉ người nợ (hoặc Trưởng nhóm thay mặt thành viên chưa có tài khoản) mới có quyền đánh dấu đã thanh toán."
        );
      }

      const paymentMethod =
        "paymentMethod" in input && input.paymentMethod
          ? input.paymentMethod
          : "BANK_TRANSFER";

      await tx.settlementTransfer.update({
        where: { id: transferId },
        data: {
          status: "PAID",
          paymentMethod,
          paidAt: now,
          paidMarkedByMemberId: callerMember.id,
        },
      });
    } else if (isConfirmCompleted) {
      // Current status must be PAID
      if (transfer.status === "UNPAID") {
        throw new ConflictError(
          "Giao dịch chưa được đánh dấu thanh toán (UNPAID). Người nợ cần đánh dấu đã thanh toán trước khi xác nhận hoàn tất."
        );
      }
      if (transfer.status === "COMPLETED") {
        throw new ConflictError("Giao dịch này đã được xác nhận hoàn tất trước đó.");
      }
      if (transfer.status !== "PAID") {
        throw new ConflictError(`Không thể xác nhận hoàn tất từ trạng thái "${transfer.status}".`);
      }

      // Authorization for CONFIRM_COMPLETED:
      // - Creditor (toMemberId) can confirm received.
      // - Host can confirm received IF creditor has no account (userId === null).
      const isCreditor = callerMember.id === transfer.toMemberId;
      const isHostForNoAccountCreditor =
        callerMember.role === "HOST" && transfer.toMember.userId === null;

      if (!isCreditor && !isHostForNoAccountCreditor) {
        throw new ForbiddenError(
          "Chỉ người nhận tiền (hoặc Trưởng nhóm thay mặt thành viên chưa có tài khoản) mới có quyền xác nhận đã nhận tiền."
        );
      }

      await tx.settlementTransfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          completedAt: now,
          completedByMemberId: callerMember.id,
        },
      });

      // Check if ALL transfers for this settlement are now COMPLETED
      const remainingUncompleted = await tx.settlementTransfer.count({
        where: {
          settlementId: transfer.settlementId,
          id: { not: transferId },
          status: { not: "COMPLETED" },
        },
      });

      if (remainingUncompleted === 0) {
        // Entire settlement is completed! Transition Trip to COMPLETED
        await tx.trip.update({
          where: { id: tripId },
          data: { status: "COMPLETED" },
        });
      }
    }

    // Read updated transfer with relations
    return await tx.settlementTransfer.findUniqueOrThrow({
      where: { id: transferId },
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
    });
  });

  return formatTransferDto(result);
}

/**
 * GET /api/trips/[id]/transfers/[transferId]
 * Xem chi tiết an toàn của một giao dịch chuyển tiền.
 */
export async function GET(
  req: Request,
  context: TransferRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, transferId } = params;

    if (!tripId || !isValidUuid(tripId) || !transferId || !isValidUuid(transferId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc giao dịch.");
    }

    // Phân quyền: Thành viên ACTIVE hoặc LEFT của trip
    await requireTripMembership(tripId, { allowLeftMember: true });

    const transfer = await prisma.settlementTransfer.findUnique({
      where: { id: transferId },
      include: {
        settlement: {
          select: { id: true, tripId: true, status: true },
        },
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
    });

    if (!transfer || transfer.settlement.tripId !== tripId) {
      throw new NotFoundError("Không tìm thấy giao dịch chuyển tiền.");
    }

    return apiSuccess({
      transfer: formatTransferDto(transfer),
    });
  } catch (error) {
    const mapped = mapSettlementDatabaseError(error);
    return handleApiError(mapped || error);
  }
}

/**
 * PATCH /api/trips/[id]/transfers/[transferId]
 * Cập nhật trạng thái giao dịch chuyển tiền (MARK_PAID hoặc CONFIRM_COMPLETED).
 */
export async function PATCH(
  req: Request,
  context: TransferRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, transferId } = params;

    if (!tripId || !isValidUuid(tripId) || !transferId || !isValidUuid(transferId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc giao dịch.");
    }

    // Phân quyền: Chỉ thành viên ACTIVE mới được thực hiện thay đổi
    const { member: callerMember } = await requireTripMembership(tripId);

    // Parse input
    const input = await parseJsonBody(req, UpdateTransferInputSchema);

    try {
      const dto = await updateTransferStatus(
        tripId,
        transferId,
        input,
        callerMember
      );

      const message =
        dto.status === "PAID"
          ? "Đã đánh dấu chuyển tiền thành công! Đang chờ người nhận xác nhận."
          : "Đã xác nhận nhận tiền thành công! Giao dịch hoàn tất.";

      return apiSuccess({ transfer: dto }, { message });
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
