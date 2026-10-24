import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
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
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    settlement: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    settlementTransfer: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

describe("Settlement API (/api/trips/[id]/settlement)", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const INVALID_UUID = "not-a-valid-uuid";

  const mockUser: AuthUser = {
    id: "usr-host-1",
    email: "host@example.com",
    name: "Trưởng Nhóm",
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

  const mockTripActive = {
    id: VALID_TRIP_ID,
    name: "Chuyến đi Đà Lạt",
    destination: "Đà Lạt",
    startDate: new Date("2026-11-20T00:00:00Z"),
    endDate: new Date("2026-11-25T00:00:00Z"),
    budgetAmount: 10000000,
    status: "ACTIVE" as const,
    inviteCode: "DL2026-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MEMBER_HOST_ID = "bbbbbbbb-1111-4111-8111-111111111111";
  const MEMBER_NORMAL_ID = "cccccccc-2222-4222-8222-222222222222";
  const MEMBER_LEFT_ID = "dddddddd-3333-4333-8333-333333333333";

  const mockMemberHost = {
    id: MEMBER_HOST_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-host-1",
    displayName: "Trưởng Nhóm (Host)",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockMemberNormal = {
    id: MEMBER_NORMAL_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-normal-2",
    displayName: "Thành viên thường",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date("2026-10-02T00:00:00Z"),
    leftAt: null,
  };

  const mockMemberLeft = {
    id: MEMBER_LEFT_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-left-3",
    displayName: "Thành viên đã rời",
    role: "MEMBER" as const,
    status: "LEFT" as const,
    joinOrder: 3,
    joinedAt: new Date("2026-10-03T00:00:00Z"),
    leftAt: new Date("2026-10-10T00:00:00Z"),
  };

  let mockQueryRawInTx: ReturnType<typeof vi.fn>;
  let mockTripFindUniqueInTx: ReturnType<typeof vi.fn>;
  let mockTripUpdateInTx: ReturnType<typeof vi.fn>;
  let mockSettlementFindFirstInTx: ReturnType<typeof vi.fn>;
  let mockSettlementCreateInTx: ReturnType<typeof vi.fn>;
  let mockSettlementTransferCreateManyInTx: ReturnType<typeof vi.fn>;
  let mockSettlementFindUniqueOrThrowInTx: ReturnType<typeof vi.fn>;
  let mockTripMemberFindManyInTx: ReturnType<typeof vi.fn>;
  let mockExpenseFindManyInTx: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryRawInTx = vi.fn().mockResolvedValue([]);
    mockTripFindUniqueInTx = vi.fn().mockResolvedValue(mockTripActive);
    mockTripUpdateInTx = vi.fn().mockResolvedValue({ ...mockTripActive, status: "SETTLING" });
    mockSettlementFindFirstInTx = vi.fn().mockResolvedValue(null);
    mockSettlementCreateInTx = vi.fn().mockResolvedValue({
      id: "settlement-new-1",
      tripId: VALID_TRIP_ID,
      status: "ACTIVE",
      createdByMemberId: MEMBER_HOST_ID,
      createdAt: new Date(),
    });
    mockSettlementTransferCreateManyInTx = vi.fn().mockResolvedValue({ count: 1 });
    mockTripMemberFindManyInTx = vi.fn().mockResolvedValue([
      { ...mockMemberHost, userId: "usr-host-1" },
      { ...mockMemberNormal, userId: "usr-normal-2" },
      { ...mockMemberLeft, userId: "usr-left-3" },
    ]);
    mockExpenseFindManyInTx = vi.fn().mockResolvedValue([
      {
        id: "exp-1",
        amount: 600000,
        paidByMemberId: MEMBER_HOST_ID,
        shares: [
          { id: "share-1", memberId: MEMBER_HOST_ID, amount: 300000 },
          { id: "share-2", memberId: MEMBER_NORMAL_ID, amount: 300000 },
        ],
      },
    ]);
    mockSettlementFindUniqueOrThrowInTx = vi.fn().mockResolvedValue({
      id: "settlement-new-1",
      tripId: VALID_TRIP_ID,
      status: "ACTIVE",
      createdByMemberId: MEMBER_HOST_ID,
      createdByMember: { id: MEMBER_HOST_ID, displayName: "Trưởng Nhóm (Host)" },
      createdAt: new Date("2026-10-21T10:00:00Z"),
      cancelledAt: null,
      transfers: [
        {
          id: "transfer-1",
          settlementId: "settlement-new-1",
          fromMemberId: MEMBER_NORMAL_ID,
          fromMember: {
            id: MEMBER_NORMAL_ID,
            displayName: "Thành viên thường",
            status: "ACTIVE",
            userId: "usr-normal-2",
          },
          toMemberId: MEMBER_HOST_ID,
          toMember: {
            id: MEMBER_HOST_ID,
            displayName: "Trưởng Nhóm (Host)",
            status: "ACTIVE",
            userId: "usr-host-1",
          },
          amount: 300000,
          status: "UNPAID",
          paymentMethod: null,
          paidAt: null,
          paidMarkedByMemberId: null,
          paidMarkedBy: null,
          completedAt: null,
          completedByMemberId: null,
          completedBy: null,
        },
      ],
    });

    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.trip.findUnique).mockResolvedValue(
      mockTripActive as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );

    // Mock $transaction executing callback with mock tx
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        $queryRaw: mockQueryRawInTx,
        trip: {
          findUnique: mockTripFindUniqueInTx,
          update: mockTripUpdateInTx,
        },
        settlement: {
          findFirst: mockSettlementFindFirstInTx,
          create: mockSettlementCreateInTx,
          findUniqueOrThrow: mockSettlementFindUniqueOrThrowInTx,
        },
        settlementTransfer: {
          createMany: mockSettlementTransferCreateManyInTx,
        },
        tripMember: {
          findMany: mockTripMemberFindManyInTx,
        },
        expense: {
          findMany: mockExpenseFindManyInTx,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await callback(mockTx as any);
    });
  });

  // -------------------------------------------------------------
  // POST /api/trips/[id]/settlement (Chốt sổ)
  // -------------------------------------------------------------
  describe("POST /api/trips/[id]/settlement", () => {
    it("1. Host tạo Settlement thành công, sinh đúng transfers và chuyển Trip sang SETTLING", async () => {
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.settlement.status).toBe("ACTIVE");
      expect(json.data.settlement.transfers).toHaveLength(1);
      expect(json.data.settlement.transfers[0].amount).toBe(300000);
      expect(json.data.settlement.transfers[0].fromMemberId).toBe(MEMBER_NORMAL_ID);
      expect(json.data.settlement.transfers[0].toMemberId).toBe(MEMBER_HOST_ID);
      expect(json.data.tripStatus).toBe("SETTLING");

      // Verify PostgreSQL lock was acquired
      expect(mockQueryRawInTx).toHaveBeenCalled();

      // Verify trip status update
      expect(mockTripUpdateInTx).toHaveBeenCalledWith({
        where: { id: VALID_TRIP_ID },
        data: { status: "SETTLING" },
      });
    });

    it("1b. Nếu tất cả thành viên cân bằng (net = 0), chuyển thẳng Trip sang COMPLETED", async () => {
      // Chi tiêu mà mỗi người tự trả phần mình
      mockExpenseFindManyInTx.mockResolvedValue([
        {
          id: "exp-1",
          amount: 600000,
          paidByMemberId: MEMBER_HOST_ID,
          shares: [{ id: "share-1", memberId: MEMBER_HOST_ID, amount: 600000 }],
        },
      ]);
      mockSettlementFindUniqueOrThrowInTx.mockResolvedValue({
        id: "settlement-zero-1",
        tripId: VALID_TRIP_ID,
        status: "ACTIVE",
        createdByMemberId: MEMBER_HOST_ID,
        createdByMember: { id: MEMBER_HOST_ID, displayName: "Host" },
        createdAt: new Date(),
        cancelledAt: null,
        transfers: [],
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.tripStatus).toBe("COMPLETED");
      expect(mockTripUpdateInTx).toHaveBeenCalledWith({
        where: { id: VALID_TRIP_ID },
        data: { status: "COMPLETED" },
      });
    });

    it("2. Thành viên thông thường không thể chốt sổ (403 Forbidden)", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberNormal as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("Trưởng nhóm");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("3. Trip không ở trạng thái ACTIVE thì không thể chốt sổ (409 Conflict)", async () => {
      mockTripFindUniqueInTx.mockResolvedValue({
        ...mockTripActive,
        status: "SETTLING",
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("SETTLING");
    });

    it("4. Tổng net balance khác 0 khiến transaction thất bại (bảo toàn zero-sum)", async () => {
      // Khoản chi bị lệch shares (600.000 vs 500.000)
      mockExpenseFindManyInTx.mockResolvedValue([
        {
          id: "exp-corrupt",
          amount: 600000,
          paidByMemberId: MEMBER_HOST_ID,
          shares: [
            { id: "share-1", memberId: MEMBER_HOST_ID, amount: 200000 },
            { id: "share-2", memberId: MEMBER_NORMAL_ID, amount: 300000 },
          ],
        },
      ]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(mockSettlementCreateInTx).not.toHaveBeenCalled();
    });

    it("5. Lỗi khi tạo Transfer làm rollback toàn bộ transaction (không để lại Settlement dở dang)", async () => {
      mockSettlementTransferCreateManyInTx.mockRejectedValue(
        new Error("Database connection dropped during transfer insert")
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(500);
    });

    it("6. Đã có Settlement ACTIVE thì từ chối chốt sổ (409 Conflict)", async () => {
      mockSettlementFindFirstInTx.mockResolvedValue({
        id: "existing-settlement",
        tripId: VALID_TRIP_ID,
        status: "ACTIVE",
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error.message).toContain("đã có sổ quyết toán");
      expect(mockSettlementCreateInTx).not.toHaveBeenCalled();
    });

    it("7. Trip ID không hợp lệ trả về 404", async () => {
      const req = new Request(`http://localhost/api/trips/${INVALID_UUID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: INVALID_UUID }) });
      expect(res.status).toBe(404);
    });

    it("12. Thành viên LEFT được tính số dư theo lịch sử nhưng không phát sinh lỗi", async () => {
      // Thành viên LEFT có số dư = 0 (đã rời nhóm hợp lệ)
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      const leftBalance = json.data.balances.find((b: { memberId: string }) => b.memberId === MEMBER_LEFT_ID);
      expect(leftBalance).toBeDefined();
      expect(leftBalance.netAmount).toBe(0);
    });

    it("13. Tất cả amount đều là integer VND an toàn và tổng tiền chuyển khớp công nợ", async () => {
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      const transfers = json.data.settlement.transfers;
      for (const t of transfers) {
        expect(Number.isInteger(t.amount)).toBe(true);
        expect(t.amount).toBeGreaterThan(0);
      }
    });

    it("14. Không để lộ thông tin ngân hàng ciphertext hoặc token trong DTO", async () => {
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const jsonText = await res.text();

      expect(jsonText).not.toContain("bank_account_no_ciphertext");
      expect(jsonText).not.toContain("ciphertext");
      expect(jsonText).not.toContain("token");
    });

    it("15. Lấy khóa FOR UPDATE trên Trip trước khi đọc trạng thái và tính snapshot", async () => {
      const callOrder: string[] = [];
      mockQueryRawInTx.mockImplementation(async () => {
        callOrder.push("lock");
        return [];
      });
      mockTripFindUniqueInTx.mockImplementation(async () => {
        callOrder.push("read_trip");
        return mockTripActive;
      });
      mockExpenseFindManyInTx.mockImplementation(async () => {
        callOrder.push("read_expenses");
        return [
          {
            id: "exp-1",
            amount: 600000,
            paidByMemberId: MEMBER_HOST_ID,
            shares: [
              { id: "share-1", memberId: MEMBER_HOST_ID, amount: 300000 },
              { id: "share-2", memberId: MEMBER_NORMAL_ID, amount: 300000 },
            ],
          },
        ];
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`, {
        method: "POST",
      });

      await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(callOrder[0]).toBe("lock");
      expect(callOrder[1]).toBe("read_trip");
      expect(callOrder.indexOf("read_expenses")).toBeGreaterThan(callOrder.indexOf("lock"));
    });
  });

  // -------------------------------------------------------------
  // GET /api/trips/[id]/settlement
  // -------------------------------------------------------------
  describe("GET /api/trips/[id]/settlement", () => {
    it("Thành viên xem được Settlement ACTIVE và bảng số dư", async () => {
      vi.mocked(prisma.settlement.findFirst).mockResolvedValue({
        id: "active-settlement-1",
        tripId: VALID_TRIP_ID,
        status: "ACTIVE",
        createdByMemberId: MEMBER_HOST_ID,
        createdByMember: { id: MEMBER_HOST_ID, displayName: "Host" },
        createdAt: new Date("2026-10-21T08:00:00Z"),
        cancelledAt: null,
        transfers: [],
      } as unknown as Awaited<ReturnType<typeof prisma.settlement.findFirst>>);

      vi.mocked(prisma.tripMember.findMany).mockResolvedValue([
        { ...mockMemberHost, userId: "usr-host-1" },
        { ...mockMemberNormal, userId: "usr-normal-2" },
      ] as unknown as Awaited<ReturnType<typeof prisma.tripMember.findMany>>);

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.settlement.id).toBe("active-settlement-1");
      expect(json.data.balances).toBeDefined();
    });

    it("Hỗ trợ ?history=true để đọc danh sách CANCELLED", async () => {
      vi.mocked(prisma.settlement.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.settlement.findMany).mockResolvedValue([
        {
          id: "cancelled-settlement-1",
          tripId: VALID_TRIP_ID,
          status: "CANCELLED",
          createdByMemberId: MEMBER_HOST_ID,
          createdByMember: { id: MEMBER_HOST_ID, displayName: "Host" },
          createdAt: new Date("2026-10-20T08:00:00Z"),
          cancelledAt: new Date("2026-10-20T09:00:00Z"),
          transfers: [],
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.settlement.findMany>>);
      vi.mocked(prisma.tripMember.findMany).mockResolvedValue([]);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement?history=true`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.settlement).toBeNull();
      expect(json.data.history).toHaveLength(1);
      expect(json.data.history[0].id).toBe("cancelled-settlement-1");
    });

    it("Thành viên đã rời nhóm (LEFT) vẫn được phép xem GET", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberLeft as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );
      vi.mocked(prisma.settlement.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.tripMember.findMany).mockResolvedValue([]);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/settlement`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(200);
    });
  });
});
