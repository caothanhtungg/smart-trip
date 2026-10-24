import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import {
  requireAuth,
  type AuthUser,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/auth/session", () => ({
  requireAuth: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Yêu cầu đăng nhập để thực hiện thao tác này.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tripMember: {
      findFirst: vi.fn(),
    },
    settlement: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

describe("Settlement Reopen API (/api/trips/[id]/settlement/reopen)", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const INVALID_UUID = "not-a-valid-uuid";

  const mockUserHost: AuthUser = {
    id: "usr-host-1",
    email: "host@example.com",
    name: "Host",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "Host",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-host-1",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const mockMemberHost = {
    id: "member-host-1",
    tripId: VALID_TRIP_ID,
    userId: "usr-host-1",
    displayName: "Trưởng Nhóm",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockMemberNormal = {
    id: "member-normal-2",
    tripId: VALID_TRIP_ID,
    userId: "usr-normal-2",
    displayName: "Thành viên thường",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockTripSettling = {
    id: VALID_TRIP_ID,
    name: "Trip Quyết Toán",
    destination: "Nha Trang",
    startDate: new Date("2026-11-20T00:00:00Z"),
    endDate: new Date("2026-11-25T00:00:00Z"),
    budgetAmount: 10000000,
    status: "SETTLING" as const,
    inviteCode: "NT2026-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockQueryRawInTx: ReturnType<typeof vi.fn>;
  let mockTripFindUniqueInTx: ReturnType<typeof vi.fn>;
  let mockTripUpdateInTx: ReturnType<typeof vi.fn>;
  let mockSettlementFindFirstInTx: ReturnType<typeof vi.fn>;
  let mockSettlementUpdateInTx: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryRawInTx = vi.fn().mockResolvedValue([]);
    mockTripFindUniqueInTx = vi.fn().mockResolvedValue(mockTripSettling);
    mockTripUpdateInTx = vi.fn().mockResolvedValue({ ...mockTripSettling, status: "ACTIVE" });
    mockSettlementFindFirstInTx = vi.fn().mockResolvedValue({
      id: "settlement-to-reopen",
      tripId: VALID_TRIP_ID,
      status: "ACTIVE",
      transfers: [
        { id: "tx-1", status: "UNPAID" },
        { id: "tx-2", status: "UNPAID" },
      ],
    });
    mockSettlementUpdateInTx = vi.fn().mockResolvedValue({
      id: "settlement-to-reopen",
      status: "CANCELLED",
      cancelledAt: new Date(),
    });

    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUserHost,
      session: mockSession,
    });

    vi.mocked(prisma.trip.findUnique).mockResolvedValue(
      mockTripSettling as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        $queryRaw: mockQueryRawInTx,
        trip: {
          findUnique: mockTripFindUniqueInTx,
          update: mockTripUpdateInTx,
        },
        settlement: {
          findFirst: mockSettlementFindFirstInTx,
          update: mockSettlementUpdateInTx,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await callback(mockTx as any);
    });
  });

  it("10. Host mở lại sổ thành công khi mọi Transfer đều là UNPAID -> Trip trở về ACTIVE và Settlement chuyển sang CANCELLED", async () => {
    const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.settlementId).toBe("settlement-to-reopen");
    expect(json.data.reopenedAt).toBeDefined();

    // Verify locking
    expect(mockQueryRawInTx).toHaveBeenCalled();

    // Verify Trip status back to ACTIVE
    expect(mockTripUpdateInTx).toHaveBeenCalledWith({
      where: { id: VALID_TRIP_ID },
      data: { status: "ACTIVE" },
    });

    // Verify Settlement status CANCELLED with cancelledAt
    expect(mockSettlementUpdateInTx).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "settlement-to-reopen" },
        data: expect.objectContaining({
          status: "CANCELLED",
        }),
      })
    );
  });

  it("9. Từ chối mở lại sổ khi có Transfer đã PAID (409 Conflict)", async () => {
    mockSettlementFindFirstInTx.mockResolvedValue({
      id: "settlement-with-paid",
      tripId: VALID_TRIP_ID,
      status: "ACTIVE",
      transfers: [
        { id: "tx-1", status: "UNPAID" },
        { id: "tx-2", status: "PAID" },
      ],
    });

    const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("đã có giao dịch được thanh toán");

    // Must NOT cancel settlement or activate trip
    expect(mockSettlementUpdateInTx).not.toHaveBeenCalled();
    expect(mockTripUpdateInTx).not.toHaveBeenCalled();
  });

  it("9b. Từ chối mở lại sổ khi có Transfer đã COMPLETED (409 Conflict)", async () => {
    mockSettlementFindFirstInTx.mockResolvedValue({
      id: "settlement-with-completed",
      tripId: VALID_TRIP_ID,
      status: "ACTIVE",
      transfers: [
        { id: "tx-1", status: "COMPLETED" },
      ],
    });

    const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(mockSettlementUpdateInTx).not.toHaveBeenCalled();
  });

  it("Thành viên thường không thể mở lại sổ (403 Forbidden)", async () => {
    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMemberNormal as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );

    const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.message).toContain("Trưởng nhóm");
  });

  it("Trip đang ở ACTIVE không thể mở lại sổ (409 Conflict)", async () => {
    mockTripFindUniqueInTx.mockResolvedValue({
      ...mockTripSettling,
      status: "ACTIVE",
    });

    const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.message).toContain("ACTIVE");
  });

  it("Không có Settlement ACTIVE thì trả về 404", async () => {
    mockSettlementFindFirstInTx.mockResolvedValue(null);

    const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.message).toContain("Không tìm thấy sổ quyết toán");
  });

  it("Trip ID không hợp lệ trả về 404", async () => {
    const req = new Request(`http://localhost/api/trips/${INVALID_UUID}/settlement/reopen`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: INVALID_UUID }) });
    expect(res.status).toBe(404);
  });
});
