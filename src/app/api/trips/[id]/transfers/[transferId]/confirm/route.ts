import {
  apiSuccess,
  handleApiError,
  NotFoundError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { mapSettlementDatabaseError } from "@/lib/api/settlement-db-errors";
import { updateTransferStatus } from "../route";

interface RouteContext {
  params:
    | Promise<{ id: string; transferId: string }>
    | { id: string; transferId: string };
}

/**
 * POST /api/trips/[id]/transfers/[transferId]/confirm
 * Convenience action endpoint to confirm receipt of a transfer (transition to COMPLETED).
 */
export async function POST(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, transferId } = params;

    if (!tripId || !isValidUuid(tripId) || !transferId || !isValidUuid(transferId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc giao dịch.");
    }

    const { member: callerMember } = await requireTripMembership(tripId);

    try {
      const dto = await updateTransferStatus(
        tripId,
        transferId,
        { action: "CONFIRM_COMPLETED" },
        callerMember
      );

      return apiSuccess(
        { transfer: dto },
        { message: "Đã xác nhận nhận tiền thành công! Giao dịch hoàn tất." }
      );
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
