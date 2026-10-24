import { requireAuth, type AuthUser, type AuthSession } from "@/lib/auth/session";
import { ForbiddenError, NotFoundError } from "./errors";
import { prisma } from "@/lib/db/prisma";
import type { PrismaClient, Trip, TripMember } from "@/generated/prisma/client";
import type { MemberRole } from "@/generated/prisma/enums";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export interface TripMembershipAuth {
  user: AuthUser;
  session: AuthSession;
  member: TripMember;
  trip: Trip;
}

export interface RequireTripMembershipOptions {
  requiredRole?: MemberRole;
  customHeaders?: Headers;
  prismaClient?: PrismaClient;
  allowLeftMember?: boolean;
}

/**
 * Helper phân quyền theo membership của chuyến đi:
 * 1. Bắt buộc người dùng đã đăng nhập (throw UnauthorizedError nếu chưa, map thành 401).
 * 2. Xác thực tính hợp lệ của tripId và sự tồn tại của Trip trong database (throw NotFoundError nếu không tìm thấy, map thành 404).
 * 3. Kiểm tra tư cách thành viên ACTIVE của user trong chuyến đi (throw ForbiddenError nếu không thuộc chuyến đi, map thành 403).
 *    Nếu allowLeftMember = true, cho phép cả thành viên có status = 'LEFT' (dành cho các thao tác chỉ đọc như xem lịch sử tài chính).
 * 4. Kiểm tra vai trò yêu cầu (ví dụ: requiredRole = 'HOST') nếu có (throw ForbiddenError nếu không đủ quyền, map thành 403).
 *
 * BẢO MẬT: Tuyệt đối KHÔNG tin userId, memberId hay role từ client.
 * Toàn bộ thông tin đều được xác thực từ Session ID bảo mật phía server và truy vấn trực tiếp từ database.
 */
export async function requireTripMembership(
  tripId: string,
  options?: RequireTripMembershipOptions
): Promise<TripMembershipAuth> {
  const { user, session } = await requireAuth(options?.customHeaders);

  if (!tripId || !isValidUuid(tripId)) {
    throw new NotFoundError("Không tìm thấy chuyến đi.");
  }

  const db = options?.prismaClient ?? prisma;

  const trip = await db.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new NotFoundError("Không tìm thấy chuyến đi.");
  }

  const member = await db.tripMember.findFirst({
    where: {
      tripId,
      userId: user.id,
      ...(options?.allowLeftMember
        ? { status: { in: ["ACTIVE", "LEFT"] } }
        : { status: "ACTIVE" }),
    },
  });

  if (!member) {
    throw new ForbiddenError("Bạn không phải là thành viên của chuyến đi này.");
  }

  if (options?.requiredRole && member.role !== options.requiredRole) {
    if (options.requiredRole === "HOST") {
      throw new ForbiddenError("Thao tác này chỉ dành cho Trưởng nhóm.");
    }
    throw new ForbiddenError("Bạn không có quyền hạn yêu cầu trong chuyến đi này.");
  }

  return {
    user,
    session,
    member,
    trip,
  };
}
