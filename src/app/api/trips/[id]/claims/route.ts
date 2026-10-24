import {
  handleApiError,
  apiSuccess,
  ValidationError,
  NotFoundError,
  ConflictError,
} from "@/lib/api";
import { parseJsonBody } from "@/lib/api/parse";
import { requireAuth } from "@/lib/auth/session";
import { requireTripMembership } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { CreateClaimSchema } from "@/lib/validation/claim-api";
import { mapClaimDatabaseError } from "@/lib/api/claim-db-errors";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/trips/[id]/claims
 * UC33: Người dùng gửi yêu cầu nhận diện mình là một thành viên chưa có tài khoản trong chuyến đi.
 *
 * YÊU CẦU BẢO MẬT & NGHIỆP VỤ:
 * 1. Xác thực session server-side qua requireAuth(req). Danh tính lấy trực tiếp từ session, không tin client.
 * 2. Chuyến đi phải tồn tại và đang ở trạng thái ACTIVE (đang lên kế hoạch).
 * 3. Vị trí placeholder phải thuộc trip, đang ACTIVE và chưa có tài khoản (userId IS NULL).
 * 4. Người dùng gửi yêu cầu không được là thành viên ACTIVE hiện tại của chuyến đi.
 * 5. Rule R20: Mỗi tài khoản chỉ được có tối đa 1 yêu cầu PENDING trong một chuyến đi.
 * 6. Tạo BankClaimSnapshot nếu người dùng đã thiết lập tài khoản ngân hàng trong hồ sơ cá nhân.
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { user } = await requireAuth(req.headers);

    const { id: tripId } = await params;
    if (!isValidUuid(tripId)) {
      throw new ValidationError("ID chuyến đi không hợp lệ (phải là định dạng UUID).");
    }

    const { placeholderMemberId } = await parseJsonBody(req, CreateClaimSchema);

    // Kiểm tra trạng thái chuyến đi
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true },
    });
    if (!trip) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }
    if (trip.status !== "ACTIVE") {
      throw new ValidationError(
        "Chuyến đi không còn ở trạng thái cho phép nhận diện danh tính (chỉ áp dụng khi đang lên kế hoạch)."
      );
    }

    // Kiểm tra vị trí thành viên chưa có tài khoản (placeholder)
    const placeholder = await prisma.tripMember.findFirst({
      where: { id: placeholderMemberId, tripId },
      select: { id: true, status: true, userId: true, displayName: true },
    });
    if (!placeholder) {
      throw new NotFoundError("Không tìm thấy vị trí thành viên tương ứng trong chuyến đi.");
    }
    if (placeholder.status !== "ACTIVE") {
      throw new ConflictError("Vị trí thành viên này không còn hoạt động trong chuyến đi.");
    }
    if (placeholder.userId !== null) {
      throw new ConflictError("Vị trí thành viên này đã được liên kết với một tài khoản khác.");
    }

    // Kiểm tra người gửi yêu cầu chưa phải là thành viên ACTIVE của chuyến đi
    const existingMembership = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (existingMembership) {
      throw new ConflictError("Bạn đã là thành viên của chuyến đi này.");
    }

    // Rule R20: Tối đa 1 yêu cầu PENDING mỗi người dùng / chuyến đi
    const existingPendingClaim = await prisma.memberClaim.findFirst({
      where: { tripId, userId: user.id, status: "PENDING" },
      select: { id: true },
    });
    if (existingPendingClaim) {
      throw new ConflictError(
        "Bạn đã có một yêu cầu nhận diện đang chờ duyệt trong chuyến đi này (Rule R20)."
      );
    }

    // Tạo claim và snapshot ngân hàng trong transaction
    const newClaim = await prisma.$transaction(async (tx) => {
      // Lấy thông tin ngân hàng của user (nếu có)
      const fullUser = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          bankBin: true,
          bankAccountNo: true,
          bankAccountName: true,
          bankAccountKeyVersion: true,
        },
      });

      const claim = await tx.memberClaim.create({
        data: {
          tripId,
          placeholderMemberId,
          userId: user.id,
          status: "PENDING",
        },
        select: {
          id: true,
          tripId: true,
          placeholderMemberId: true,
          status: true,
          createdAt: true,
        },
      });

      // Tạo snapshot ngân hàng nếu user đã cấu hình STK
      if (fullUser?.bankAccountNo) {
        await tx.bankClaimSnapshot.create({
          data: {
            claimId: claim.id,
            placeholderMemberId,
            userId: user.id,
            bankBin: fullUser.bankBin,
            bankAccountNoCiphertext: fullUser.bankAccountNo,
            bankAccountName: fullUser.bankAccountName,
            keyVersion: fullUser.bankAccountKeyVersion || 1,
          },
        });
      }

      return claim;
    });

    return apiSuccess(newClaim, {
      status: 201,
      message:
        "Đã gửi yêu cầu nhận diện thành viên thành công. Vui lòng chờ Trưởng nhóm phê duyệt.",
    });
  } catch (err) {
    const mappedDbError = mapClaimDatabaseError(err);
    if (mappedDbError) {
      return handleApiError(mappedDbError);
    }
    return handleApiError(err);
  }
}

/**
 * GET /api/trips/[id]/claims
 * UC30 (Host review): Lấy danh sách yêu cầu nhận diện thành viên trong chuyến đi.
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * 1. Chỉ Trưởng nhóm (role = HOST) mới có quyền truy cập danh sách claims (Rule R1).
 * 2. Thành viên thông thường (MEMBER) hoặc người ngoài sẽ bị từ chối 403 Forbidden.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: tripId } = await params;
    if (!isValidUuid(tripId)) {
      throw new ValidationError("ID chuyến đi không hợp lệ (phải là định dạng UUID).");
    }

    // Chỉ HOST mới được xem danh sách claims
    await requireTripMembership(tripId, { requiredRole: "HOST" });

    const claims = await prisma.memberClaim.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
      include: {
        placeholderMember: {
          select: { id: true, displayName: true },
        },
        user: {
          select: { id: true, name: true, displayName: true, email: true, image: true },
        },
      },
    });

    const data = claims.map((c) => ({
      id: c.id,
      tripId: c.tripId,
      placeholderMemberId: c.placeholderMemberId,
      placeholderMemberName: c.placeholderMember.displayName,
      userId: c.userId,
      userName: c.user.displayName || c.user.name || "Người dùng",
      userEmail: c.user.email,
      userAvatarUrl: c.user.image,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      decidedAt: c.decidedAt ? c.decidedAt.toISOString() : null,
      decidedByMemberId: c.decidedByMemberId,
    }));

    return apiSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
