import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { POST as PostMarkPaid } from "./mark-paid/route";
import { POST as PostConfirm } from "./confirm/route";
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
    settlementTransfer: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

describe("Settlement Transfers API (/api/trips/[id]/transfers/[transferId])", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const OTHER_TRIP_ID = "99999999-9999-4999-8999-999999999999";
  const VALID_TRANSFER_ID = "22222222-3333-4444-8555-666666666666";
  const INVALID_UUID = "not-a-valid-uuid";

  const DEBTOR_MEMBER_ID = "aaaa1111-1111-4111-8111-111111111111";
  const CREDITOR_MEMBER_ID = "bbbb2222-2222-4222-8222-222222222222";
  const HOST_MEMBER_ID = "cccc3333-3333-4333-8333-333333333333";
  const OTHER_MEMBER_ID = "dddd4444-4444-4444-8444-444444444444";
  const UNLINKED_DEBTOR_ID = "eeee5555-5555-4555-8555-555555555555";

  const mockUserDebtor: AuthUser = {
    id: "usr-debtor-1",
    email: "debtor@example.com",
    name: "Debtor Member",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "Debtor",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockUserCreditor: AuthUser = {
    id: "usr-creditor-2",
    email: "creditor@example.com",
    name: "Creditor Member",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "Creditor",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockUserHost: AuthUser = {
    id: "usr-host-3",
    email: "host@example.com",
    name: "Host User",
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
    userId: "usr-debtor-1",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const mockMemberDebtor = {
    id: DEBTOR_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-debtor-1",
    displayName: "Debtor Member",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockMemberCreditor = {
    id: CREDITOR_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-creditor-2",
    displayName: "Creditor Member",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockMemberHost = {
    id: HOST_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-host-3",
    displayName: "Trưởng Nhóm",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 0,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockMemberOther = {
    id: OTHER_MEMBER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-other-4",
    displayName: "Người ngoài",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 4,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockMemberUnlinkedDebtor = {
    id: UNLINKED_DEBTOR_ID,
    tripId: VALID_TRIP_ID,
    userId: null,
    displayName: "Thành viên chưa có nick",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 5,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockTripSettling = {
    id: VALID_TRIP_ID,
    name: "Chuyến đi Hà Giang",
    destination: "Hà Giang",
    status: "SETTLING" as const,
    startDate: new Date(),
    endDate: new Date(),
    budgetAmount: 5000000,
    inviteCode: "HG2026-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransferUnpaid = {
    id: VALID_TRANSFER_ID,
    settlementId: "settlement-active-1",
    settlement: {
      id: "settlement-active-1",
      tripId: VALID_TRIP_ID,
      status: "ACTIVE" as const,
    },
    fromMemberId: DEBTOR_MEMBER_ID,
    fromMember: {
      id: DEBTOR_MEMBER_ID,
      displayName: "Debtor Member",
      status: "ACTIVE",
      userId: "usr-debtor-1",
      role: "MEMBER",
    },
    toMemberId: CREDITOR_MEMBER_ID,
    toMember: {
      id: CREDITOR_MEMBER_ID,
      displayName: "Creditor Member",
      status: "ACTIVE",
      userId: "usr-creditor-2",
      role: "MEMBER",
    },
    amount: 500000,
    status: "UNPAID" as const,
    paymentMethod: null,
    paidAt: null,
    paidMarkedByMemberId: null,
    paidMarkedBy: null,
    completedAt: null,
    completedByMemberId: null,
    completedBy: null,
  };

  let mockQueryRawInTx: ReturnType<typeof vi.fn>;
  let mockTripFindUniqueInTx: ReturnType<typeof vi.fn>;
  let mockTransferFindUniqueInTx: ReturnType<typeof vi.fn>;
  let mockTransferUpdateInTx: ReturnType<typeof vi.fn>;
  let mockTransferCountInTx: ReturnType<typeof vi.fn>;
  let mockTripUpdateInTx: ReturnType<typeof vi.fn>;
  let mockTransferFindUniqueOrThrowInTx: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryRawInTx = vi.fn().mockResolvedValue([]);
    mockTripFindUniqueInTx = vi.fn().mockResolvedValue(mockTripSettling);
    mockTransferFindUniqueInTx = vi.fn().mockResolvedValue(mockTransferUnpaid);
    mockTransferUpdateInTx = vi.fn().mockResolvedValue(mockTransferUnpaid);
    mockTransferCountInTx = vi.fn().mockResolvedValue(1); // 1 remaining uncompleted
    mockTripUpdateInTx = vi.fn().mockResolvedValue(mockTripSettling);
    mockTransferFindUniqueOrThrowInTx = vi.fn().mockResolvedValue({
      ...mockTransferUnpaid,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      paidAt: new Date("2026-10-21T11:00:00Z"),
      paidMarkedByMemberId: DEBTOR_MEMBER_ID,
      paidMarkedBy: { id: DEBTOR_MEMBER_ID, displayName: "Debtor Member" },
    });

    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUserDebtor,
      session: mockSession,
    });

    vi.mocked(prisma.trip.findUnique).mockResolvedValue(
      mockTripSettling as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMemberDebtor as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        $queryRaw: mockQueryRawInTx,
        trip: {
          findUnique: mockTripFindUniqueInTx,
          update: mockTripUpdateInTx,
        },
        settlementTransfer: {
          findUnique: mockTransferFindUniqueInTx,
          update: mockTransferUpdateInTx,
          count: mockTransferCountInTx,
          findUniqueOrThrow: mockTransferFindUniqueOrThrowInTx,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await callback(mockTx as any);
    });
  });

  // -------------------------------------------------------------
  // MEDIUM-01 Regression Tests: Trip status validation under lock
  // -------------------------------------------------------------
  describe("MEDIUM-01 Hardening: Trip.status check under lock", () => {
    it("Từ chối khi chuyến đi đang ở trạng thái ACTIVE (409 Conflict)", async () => {
      mockTripFindUniqueInTx.mockResolvedValue({
        ...mockTripSettling,
        status: "ACTIVE",
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("ACTIVE");
      expect(mockTransferUpdateInTx).not.toHaveBeenCalled();
    });

    it("Từ chối khi chuyến đi đã COMPLETED (409 Conflict)", async () => {
      mockTripFindUniqueInTx.mockResolvedValue({
        ...mockTripSettling,
        status: "COMPLETED",
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("COMPLETED");
      expect(mockTransferUpdateInTx).not.toHaveBeenCalled();
    });

    it("Từ chối khi chuyến đi đã ARCHIVED (409 Conflict)", async () => {
      mockTripFindUniqueInTx.mockResolvedValue({
        ...mockTripSettling,
        status: "ARCHIVED",
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("ARCHIVED");
      expect(mockTransferUpdateInTx).not.toHaveBeenCalled();
    });

    it("Chấp nhận khi chuyến đi đang ở trạng thái SETTLING", async () => {
      mockTripFindUniqueInTx.mockResolvedValue(mockTripSettling); // status: SETTLING

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------
  // MARK_PAID Tests
  // -------------------------------------------------------------
  describe("MARK_PAID (UNPAID -> PAID)", () => {
    it("Người nợ (debtor) đánh dấu PAID thành công và sinh đúng metadata", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID", paymentMethod: "BANK_TRANSFER" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.transfer.status).toBe("PAID");

      // Verify update called with metadata satisfying CHECK constraint
      expect(mockTransferUpdateInTx).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_TRANSFER_ID },
          data: expect.objectContaining({
            status: "PAID",
            paymentMethod: "BANK_TRANSFER",
            paidMarkedByMemberId: DEBTOR_MEMBER_ID,
          }),
        })
      );
    });

    it("Người nhận (creditor) không thể tự đánh dấu MARK_PAID thay người nợ có tài khoản (403)", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserCreditor,
        session: { ...mockSession, userId: "usr-creditor-2" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberCreditor as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.message).toContain("Chỉ người nợ");
    });

    it("Host có thể đánh dấu MARK_PAID thay cho thành viên chưa có tài khoản (userId = null)", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserHost,
        session: { ...mockSession, userId: "usr-host-3" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      // Transfer where debtor has no account
      mockTransferFindUniqueInTx.mockResolvedValue({
        ...mockTransferUnpaid,
        fromMemberId: UNLINKED_DEBTOR_ID,
        fromMember: mockMemberUnlinkedDebtor,
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID", paymentMethod: "CASH" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockTransferUpdateInTx).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PAID",
            paymentMethod: "CASH",
            paidMarkedByMemberId: HOST_MEMBER_ID,
          }),
        })
      );
    });

    it("Host KHÔNG thể đánh dấu MARK_PAID cho thành viên ĐÃ CÓ tài khoản (403)", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserHost,
        session: { ...mockSession, userId: "usr-host-3" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.message).toContain("Chỉ người nợ");
    });

    it("Từ chối đánh dấu PAID khi giao dịch đã là PAID (409 Conflict)", async () => {
      mockTransferFindUniqueInTx.mockResolvedValue({
        ...mockTransferUnpaid,
        status: "PAID",
        paidAt: new Date(),
        paidMarkedByMemberId: DEBTOR_MEMBER_ID,
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error.message).toContain("đã được đánh dấu thanh toán");
    });
  });

  // -------------------------------------------------------------
  // CONFIRM_COMPLETED Tests
  // -------------------------------------------------------------
  describe("CONFIRM_COMPLETED (PAID -> COMPLETED)", () => {
    const mockTransferPaid = {
      ...mockTransferUnpaid,
      status: "PAID" as const,
      paymentMethod: "BANK_TRANSFER" as const,
      paidAt: new Date("2026-10-21T10:00:00Z"),
      paidMarkedByMemberId: DEBTOR_MEMBER_ID,
      paidMarkedBy: { id: DEBTOR_MEMBER_ID, displayName: "Debtor" },
    };

    beforeEach(() => {
      mockTransferFindUniqueInTx.mockResolvedValue(mockTransferPaid);
      mockTransferFindUniqueOrThrowInTx.mockResolvedValue({
        ...mockTransferPaid,
        status: "COMPLETED",
        completedAt: new Date("2026-10-21T11:00:00Z"),
        completedByMemberId: CREDITOR_MEMBER_ID,
        completedBy: { id: CREDITOR_MEMBER_ID, displayName: "Creditor" },
      });
    });

    it("Người nhận (creditor) xác nhận COMPLETED thành công và sinh đúng metadata", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserCreditor,
        session: { ...mockSession, userId: "usr-creditor-2" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberCreditor as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM_COMPLETED" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.transfer.status).toBe("COMPLETED");

      // Verify update called with completedByMemberId and completedAt
      expect(mockTransferUpdateInTx).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_TRANSFER_ID },
          data: expect.objectContaining({
            status: "COMPLETED",
            completedByMemberId: CREDITOR_MEMBER_ID,
          }),
        })
      );
    });

    it("Không thể nhảy trạng thái từ UNPAID thẳng lên COMPLETED (409 Conflict)", async () => {
      mockTransferFindUniqueInTx.mockResolvedValue(mockTransferUnpaid); // status: UNPAID

      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserCreditor,
        session: { ...mockSession, userId: "usr-creditor-2" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberCreditor as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM_COMPLETED" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error.message).toContain("chưa được đánh dấu thanh toán (UNPAID)");
    });

    it("Người nợ (debtor) không thể tự xác nhận nhận tiền CONFIRM_COMPLETED (403)", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM_COMPLETED" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.message).toContain("Chỉ người nhận tiền");
    });

    it("Khi giao dịch cuối cùng được xác nhận COMPLETED, tự động chuyển Trip sang COMPLETED", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserCreditor,
        session: { ...mockSession, userId: "usr-creditor-2" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberCreditor as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      // Remaining uncompleted transfers = 0
      mockTransferCountInTx.mockResolvedValue(0);

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM_COMPLETED" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      expect(res.status).toBe(200);

      expect(mockTripUpdateInTx).toHaveBeenCalledWith({
        where: { id: VALID_TRIP_ID },
        data: { status: "COMPLETED" },
      });
    });
  });

  // -------------------------------------------------------------
  // IDOR & Scope Protection Tests
  // -------------------------------------------------------------
  describe("Security & Guard Protections", () => {
    it("7. Transfer thuộc Trip khác bị chặn với 404 (IDOR protection)", async () => {
      // Transfer belongs to OTHER_TRIP_ID
      mockTransferFindUniqueInTx.mockResolvedValue({
        ...mockTransferUnpaid,
        settlement: {
          id: "other-settlement",
          tripId: OTHER_TRIP_ID,
          status: "ACTIVE",
        },
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      expect(res.status).toBe(404);
    });

    it("Giao dịch thuộc Settlement đã CANCELLED bị chặn với 409", async () => {
      mockTransferFindUniqueInTx.mockResolvedValue({
        ...mockTransferUnpaid,
        settlement: {
          id: "cancelled-settlement",
          tripId: VALID_TRIP_ID,
          status: "CANCELLED",
        },
      });

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      expect(res.status).toBe(409);
    });

    it("UUID chuyến đi hoặc transfer không hợp lệ trả về 404", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${INVALID_UUID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: INVALID_UUID }),
      });
      expect(res.status).toBe(404);
    });

    it("Thành viên không liên quan (neither debtor, nor creditor, nor Host) bị 403", async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        user: { ...mockUserDebtor, id: "usr-other-4" },
        session: { ...mockSession, userId: "usr-other-4" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberOther as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PAID" }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------
  // GET /api/trips/[id]/transfers/[transferId]
  // -------------------------------------------------------------
  describe("GET /api/trips/[id]/transfers/[transferId]", () => {
    it("Thành viên trip đọc được transfer an toàn", async () => {
      vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue(
        mockTransferUnpaid as unknown as Awaited<ReturnType<typeof prisma.settlementTransfer.findUnique>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}`
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.transfer.id).toBe(VALID_TRANSFER_ID);
      expect(json.data.transfer.amount).toBe(500000);
    });
  });

  // -------------------------------------------------------------
  // Convenience endpoints: /mark-paid and /confirm
  // -------------------------------------------------------------
  describe("Convenience POST endpoints", () => {
    it("POST /mark-paid đánh dấu chuyển tiền thành công", async () => {
      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: "CASH" }),
        }
      );

      const res = await PostMarkPaid(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it("POST /confirm xác nhận nhận tiền thành công", async () => {
      mockTransferFindUniqueInTx.mockResolvedValue({
        ...mockTransferUnpaid,
        status: "PAID",
        paymentMethod: "BANK_TRANSFER",
        paidAt: new Date(),
        paidMarkedByMemberId: DEBTOR_MEMBER_ID,
      });

      vi.mocked(requireAuth).mockResolvedValue({
        user: mockUserCreditor,
        session: { ...mockSession, userId: "usr-creditor-2" },
      });
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
        mockMemberCreditor as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const req = new Request(
        `http://localhost/api/trips/${VALID_TRIP_ID}/transfers/${VALID_TRANSFER_ID}/confirm`,
        {
          method: "POST",
        }
      );

      const res = await PostConfirm(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
