import {
  handleApiError,
  apiSuccess,
  ValidationError,
  NotFoundError,
  ConflictError,
} from "@/lib/api";
import { parseJsonBody } from "@/lib/api/parse";
import { requireTripMembership } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { DecideClaimSchema } from "@/lib/validation/claim-api";
import { mapClaimDatabaseError } from "@/lib/api/claim-db-errors";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

interface RouteParams {
  params: Promise<{ id: string; claimId: string }>;
}

/**
 * Xử lý quyết định phê duyệt hoặc từ chối yêu cầu nhận diện thành viên (UC30).
 * Hỗ trợ cả method PATCH và POST.
 */
async function handleClaimDecision(req: Request, { params }: RouteParams) {
  try {
    const { id: tripId, claimId } = await params;

    if (!isValidUuid(tripId)) {
      throw new ValidationError("ID chuyến đi không hợp lệ (phải là định dạng UUID).");
    }
    if (!isValidUuid(claimId)) {
      throw new ValidationError("ID yêu cầu nhận diện không hợp lệ (phải là định dạng UUID).");
    }

    // 1. Phân quyền: Chỉ Trưởng nhóm (role = HOST) mới có quyền duyệt/từ chối (UC30, Rule R13, R20)
    const { member: hostMember, trip } = await requireTripMembership(tripId, {
      requiredRole: "HOST",
    });

    // 2. Kiểm tra trạng thái chuyến đi: chỉ được xử lý khi chuyến đi đang lên kế hoạch (ACTIVE)
    if (trip.status !== "ACTIVE") {
      throw new ValidationError(
        "Chỉ có thể duyệt hoặc từ chối yêu cầu khi chuyến đi đang lên kế hoạch (ACTIVE)."
      );
    }

    // 3. Parse và validate quyết định (APPROVE hoặc REJECT)
    const { decision } = await parseJsonBody(req, DecideClaimSchema);

    // 4. Xử lý trong transaction với khóa điều kiện lạc quan chống race condition
    const result = await prisma.$transaction(async (tx) => {
      // Tìm claim thuộc đúng tripId
      const claim = await tx.memberClaim.findFirst({
        where: { id: claimId, tripId },
        include: {
          placeholderMember: true,
          user: { select: { id: true, name: true, displayName: true, email: true } },
        },
      });

      if (!claim) {
        throw new NotFoundError("Không tìm thấy yêu cầu nhận diện danh tính trong chuyến đi.");
      }

      if (claim.status !== "PENDING") {
        throw new ConflictError("Yêu cầu nhận diện này đã được xử lý trước đó.");
      }

      const now = new Date();

      // Trường hợp 1: Trưởng nhóm TỪ CHỐI (REJECT)
      if (decision === "REJECT") {
        const updateResult = await tx.memberClaim.updateMany({
          where: { id: claimId, status: "PENDING" },
          data: {
            status: "REJECTED",
            decidedAt: now,
            decidedByMemberId: hostMember.id,
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictError("Yêu cầu nhận diện này đã được xử lý bởi một phiên làm việc khác.");
        }

        return {
          id: claimId,
          status: "REJECTED" as const,
          tripId,
          placeholderMemberId: claim.placeholderMemberId,
          userId: claim.userId,
          message: `Đã từ chối yêu cầu nhận diện của "${claim.user.displayName || claim.user.name || claim.user.email}".`,
        };
      }

      // Trường hợp 2: Trưởng nhóm PHÊ DUYỆT (APPROVE)
      const placeholder = claim.placeholderMember;
      if (!placeholder || placeholder.status !== "ACTIVE") {
        throw new ConflictError("Vị trí thành viên này không còn hoạt động trong chuyến đi.");
      }

      if (placeholder.userId !== null) {
        throw new ConflictError("Vị trí thành viên này đã được liên kết với một tài khoản khác.");
      }

      // Kiểm tra người được duyệt chưa phải là thành viên ACTIVE trong chuyến đi
      const existingActive = await tx.tripMember.findFirst({
        where: { tripId, userId: claim.userId, status: "ACTIVE" },
        select: { id: true },
      });
      if (existingActive) {
        throw new ConflictError("Người dùng này hiện đã là thành viên trong chuyến đi.");
      }

      // Xử lý bản ghi thành viên cũ nếu người dùng từng tham gia và đã rời nhóm (status = LEFT)
      // Giải phóng userId khỏi bản ghi cũ để tránh vi phạm unique constraint (trip_id, user_id)
      const existingLeftMember = await tx.tripMember.findFirst({
        where: { tripId, userId: claim.userId, status: "LEFT" },
        select: { id: true },
      });
      if (existingLeftMember) {
        await tx.tripMember.update({
          where: { id: existingLeftMember.id },
          data: { userId: null },
        });
      }

      // Khóa lạc quan 1: Chuyển claim sang APPROVED nếu vẫn còn PENDING
      const claimUpdate = await tx.memberClaim.updateMany({
        where: { id: claimId, status: "PENDING" },
        data: {
          status: "APPROVED",
          decidedAt: now,
          decidedByMemberId: hostMember.id,
        },
      });

      if (claimUpdate.count === 0) {
        throw new ConflictError("Yêu cầu nhận diện này đã được xử lý bởi một phiên làm việc khác.");
      }

      // Khóa lạc quan 2: Cập nhật dòng trip_members tương ứng (gán userId, xóa bank_* tạm theo Rule R13)
      const memberUpdate = await tx.tripMember.updateMany({
        where: { id: placeholder.id, userId: null },
        data: {
          userId: claim.userId,
          bankBin: null,
          bankAccountNo: null,
          bankAccountName: null,
        },
      });

      if (memberUpdate.count === 0) {
        throw new ConflictError("Vị trí thành viên này vừa được liên kết bởi một yêu cầu khác.");
      }

      // Rule R20: Tự động từ chối tất cả các yêu cầu PENDING khác của cùng vị trí placeholder
      await tx.memberClaim.updateMany({
        where: {
          tripId,
          placeholderMemberId: placeholder.id,
          status: "PENDING",
          id: { not: claimId },
        },
        data: {
          status: "REJECTED",
          decidedAt: now,
          decidedByMemberId: hostMember.id,
        },
      });

      // Rule R20: Tự động từ chối các yêu cầu PENDING khác của cùng người dùng trong chuyến đi này
      await tx.memberClaim.updateMany({
        where: {
          tripId,
          userId: claim.userId,
          status: "PENDING",
          id: { not: claimId },
        },
        data: {
          status: "REJECTED",
          decidedAt: now,
          decidedByMemberId: hostMember.id,
        },
      });

      return {
        id: claimId,
        status: "APPROVED" as const,
        tripId,
        placeholderMemberId: placeholder.id,
        userId: claim.userId,
        message: `Đã phê duyệt liên kết tài khoản cho "${claim.user.displayName || claim.user.name || claim.user.email}" với vị trí "${placeholder.displayName}" thành công.`,
      };
    });

    return apiSuccess(result, { message: result.message });
  } catch (err) {
    const mapped = mapClaimDatabaseError(err);
    if (mapped) {
      return handleApiError(mapped);
    }
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  return handleClaimDecision(req, context);
}

export async function POST(req: Request, context: RouteParams) {
  return handleClaimDecision(req, context);
}
