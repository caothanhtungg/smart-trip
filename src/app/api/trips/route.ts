import { requireAuth } from "@/lib/auth/session";
import {
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseQueryParams,
  InviteCodeCollisionError,
} from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { CreateTripSchema, TripsQuerySchema } from "@/lib/validation/trip";
import {
  generateInviteCode,
  isInviteCodeUniqueViolation,
  MAX_INVITE_CODE_ATTEMPTS,
} from "@/lib/trips/invite-code";
import type { TripStatus } from "@/generated/prisma/enums";

/**
 * GET /api/trips
 * Lấy danh sách các chuyến đi mà người dùng hiện tại có quyền truy cập.
 *
 * BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ; trả 401 nếu chưa đăng nhập.
 * - Chỉ lấy các chuyến đi mà người dùng là thành viên ACTIVE (where: { members: { some: { userId, status: "ACTIVE" } } }).
 * - Tuyệt đối không chấp nhận userId từ client để xác định quyền.
 * - Lọc theo tab ('all', 'active', 'completed') và sắp xếp theo ('latest', 'departure', 'name') chuẩn nghiệp vụ.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const { user } = await requireAuth();
    const query = parseQueryParams(req, TripsQuerySchema);

    // Xác định bộ lọc trạng thái chuyến đi
    const statusFilter =
      query.tab === "active"
        ? { in: ["ACTIVE", "SETTLING"] as TripStatus[] }
        : query.tab === "completed"
          ? { in: ["COMPLETED"] as TripStatus[] }
          : undefined;

    // Xác định thứ tự sắp xếp
    const orderBy =
      query.sortBy === "departure"
        ? { startDate: "asc" as const }
        : query.sortBy === "name"
          ? { name: "asc" as const }
          : { updatedAt: "desc" as const };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const trips = await prisma.trip.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            status: "ACTIVE",
          },
        },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        members: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            userId: true,
            displayName: true,
            role: true,
            status: true,
            joinOrder: true,
            user: {
              select: {
                image: true,
              },
            },
          },
          orderBy: {
            joinOrder: "asc",
          },
        },
      },
      orderBy,
      skip,
      take,
    });

    // Chuẩn hóa dữ liệu trả về cho client
    const data = trips.map((trip) => {
      const myMember = trip.members.find((m) => m.userId === user.id);
      const myRole = myMember?.role ?? "MEMBER";

      return {
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate.toISOString().split("T")[0],
        endDate: trip.endDate.toISOString().split("T")[0],
        budgetAmount: trip.budgetAmount,
        status: trip.status,
        inviteCode: trip.inviteCode,
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
        memberCount: trip.members.length,
        myRole,
        members: trip.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.displayName,
          displayName: m.displayName,
          role: m.role,
          avatarUrl: m.user?.image ?? null,
          isCurrentUser: m.userId === user.id,
          isHost: m.role === "HOST",
          joinOrder: m.joinOrder,
        })),
        userBalance: {
          type: "SETTLED" as const,
          amount: 0,
        },
      };
    });

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/trips
 * Tạo mới chuyến đi và tự động gán người tạo làm Trưởng nhóm (Host).
 *
 * BẢO MẬT & TOÀN VẸN:
 * - Yêu cầu phiên đăng nhập hợp lệ; trả 401 nếu chưa đăng nhập.
 * - Validate request body nghiêm ngặt bằng Zod (CreateTripSchema).
 * - Sinh mã mời crypto 13 ký tự Base31 (XXXXXX-XXXXXX) với giới hạn tối đa 5 lần thử.
 * - Thực thi trong một Database Transaction duy nhất ($transaction):
 *   + Tạo bản ghi trips (status: ACTIVE)
 *   + Tạo bản ghi trip_members cho Trưởng nhóm (role: HOST, join_order: 1, status: ACTIVE)
 *   + Kế thừa thông tin tài khoản ngân hàng từ User profile sang TripMember
 * - Nếu xảy ra race condition trùng mã khi insert, chỉ thử lại khi xác định đúng lỗi unique constraint của invite code.
 * - Các lỗi database khác không bị nhầm thành collision và được chuyển lên error handler an toàn.
 * - Nếu bất kỳ bước nào thất bại, transaction tự động rollback 100%, không sinh dữ liệu dở dang.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const { user } = await requireAuth();
    const input = await parseJsonBody(req, CreateTripSchema);

    let attempts = 0;
    let result: {
      trip: {
        id: string;
        name: string;
        destination: string | null;
        startDate: Date;
        endDate: Date;
        budgetAmount: number | null;
        status: string;
        inviteCode: string;
        createdAt: Date;
        updatedAt: Date;
      };
      hostMember: {
        id: string;
        displayName: string;
        role: string;
      };
    } | null = null;

    while (attempts < MAX_INVITE_CODE_ATTEMPTS) {
      attempts++;
      try {
        result = await prisma.$transaction(async (tx) => {
          // 1. Sinh mã mời duy nhất (tối đa MAX_INVITE_CODE_ATTEMPTS lần thử)
          let inviteCode: string | null = null;
          for (let check = 0; check < MAX_INVITE_CODE_ATTEMPTS; check++) {
            const candidate = generateInviteCode();
            const existingTrip = await tx.trip.findUnique({ where: { inviteCode: candidate } });
            if (!existingTrip) {
              inviteCode = candidate;
              break;
            }
          }

          if (!inviteCode) {
            throw new InviteCodeCollisionError();
          }

          // 2. Lấy thông tin user hiện tại từ database
          const dbUser = await tx.user.findUnique({
            where: { id: user.id },
          });

          if (!dbUser) {
            throw new Error("Người dùng không tồn tại trong hệ thống.");
          }

          // 3. Tạo chuyến đi
          const trip = await tx.trip.create({
            data: {
              name: input.name,
              destination: input.destination || null,
              startDate: new Date(input.startDate),
              endDate: new Date(input.endDate),
              budgetAmount: input.budgetAmount ?? null,
              status: "ACTIVE",
              inviteCode,
            },
          });

          // 4. Tạo thành viên Trưởng nhóm (Host, joinOrder = 1)
          const hostMember = await tx.tripMember.create({
            data: {
              tripId: trip.id,
              userId: user.id,
              displayName: dbUser.displayName || dbUser.name,
              role: "HOST",
              status: "ACTIVE",
              joinOrder: 1,
              bankBin: dbUser.bankBin || null,
              bankAccountNo: dbUser.bankAccountNo || null,
              bankAccountName: dbUser.bankAccountName || null,
              bankAccountKeyVersion: dbUser.bankAccountKeyVersion || 1,
            },
          });

          return { trip, hostMember };
        });

        // Transaction hoàn tất thành công, thoát vòng lặp
        break;
      } catch (error) {
        // Chỉ retry khi xác định đúng lỗi unique constraint của invite code do race condition
        if (isInviteCodeUniqueViolation(error)) {
          if (attempts < MAX_INVITE_CODE_ATTEMPTS) {
            continue;
          }
          throw new InviteCodeCollisionError();
        }

        // Mọi lỗi khác (hoặc InviteCodeCollisionError từ bước findUnique) ném trực tiếp ra ngoài
        throw error;
      }
    }

    if (!result) {
      throw new InviteCodeCollisionError();
    }

    const responseData = {
      id: result.trip.id,
      name: result.trip.name,
      destination: result.trip.destination,
      startDate: result.trip.startDate.toISOString().split("T")[0],
      endDate: result.trip.endDate.toISOString().split("T")[0],
      budgetAmount: result.trip.budgetAmount,
      status: result.trip.status,
      inviteCode: result.trip.inviteCode,
      createdAt: result.trip.createdAt.toISOString(),
      updatedAt: result.trip.updatedAt.toISOString(),
      host: {
        memberId: result.hostMember.id,
        userId: user.id,
        displayName: result.hostMember.displayName,
        role: result.hostMember.role,
      },
    };

    return apiSuccess(responseData, {
      status: 201,
      message: "Tạo chuyến đi thành công.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
