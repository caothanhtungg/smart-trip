import {
  apiSuccess,
  handleApiError,
  NotFoundError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { PaymentMethodSchema } from "@/lib/validation/settlement-api";
import { mapSettlementDatabaseError } from "@/lib/api/settlement-db-errors";
import { updateTransferStatus } from "../route";
import { z } from "zod";

interface RouteContext {
  params:
    | Promise<{ id: string; transferId: string }>
    | { id: string; transferId: string };
}

const MarkPaidBodySchema = z
  .object({
    paymentMethod: PaymentMethodSchema.default("BANK_TRANSFER"),
  })
  .optional()
  .default({ paymentMethod: "BANK_TRANSFER" });

/**
 * POST /api/trips/[id]/transfers/[transferId]/mark-paid
 * Convenience action endpoint to mark a transfer as PAID.
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

    let paymentMethod: "BANK_TRANSFER" | "CASH" = "BANK_TRANSFER";
    try {
      const body = await req.json();
      const parsed = MarkPaidBodySchema.safeParse(body);
      if (parsed.success && parsed.data?.paymentMethod) {
        paymentMethod = parsed.data.paymentMethod;
      }
    } catch {
      // Body can be empty for simple POST
    }

    try {
      const dto = await updateTransferStatus(
        tripId,
        transferId,
        { action: "MARK_PAID", paymentMethod },
        callerMember
      );

      return apiSuccess(
        { transfer: dto },
        { message: "Đã đánh dấu chuyển tiền thành công! Đang chờ người nhận xác nhận." }
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
