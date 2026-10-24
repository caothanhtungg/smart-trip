import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";
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
    },
    tripMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    itineraryItem: {
      findFirst: vi.fn(),
    },
    expense: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expenseShare: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    expenseItem: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    expenseItemMember: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Individual Expense API (/api/trips/[id]/expenses/[expenseId])", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const VALID_EXPENSE_ID = "77777777-7777-4777-8777-777777777777";
  const INVALID_UUID = "not-a-valid-uuid";

  const MEMBER_CALLER_ID = "aaaaaaaa-1111-4111-8111-111111111111";
  const MEMBER_OTHER_ID = "bbbbbbbb-2222-4222-8222-222222222222";
  const MEMBER_HOST_ID = "cccccccc-3333-4333-8333-333333333333";

  const mockUser: AuthUser = {
    id: "usr-caller-1",
    email: "caller@example.com",
    name: "User Caller",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "Caller",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-caller-1",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const mockTrip = {
    id: VALID_TRIP_ID,
    name: "Chuyến đi Nha Trang",
    destination: "Nha Trang",
    startDate: new Date("2026-11-20T00:00:00Z"),
    endDate: new Date("2026-11-25T00:00:00Z"),
    budgetAmount: 20000000,
    status: "ACTIVE" as const,
    inviteCode: "NT2026-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMemberCaller = {
    id: MEMBER_CALLER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-caller-1",
    displayName: "Caller",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockMemberHost = {
    id: MEMBER_HOST_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-caller-1",
    displayName: "Trưởng nhóm",
    role: "HOST" as const,
    status: "ACTIVE" as const,
    joinOrder: 0,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockMemberOther = {
    id: MEMBER_OTHER_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-other-2",
    displayName: "Hùng",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 2,
    joinedAt: new Date("2026-10-02T00:00:00Z"),
    leftAt: null,
  };

  const mockExistingExpense = {
    id: VALID_EXPENSE_ID,
    tripId: VALID_TRIP_ID,
    itineraryItemId: null,
    title: "Ăn trưa bún chả",
    amount: 150000,
    surchargeAmount: 0,
    category: "FOOD" as const,
    paidByMemberId: MEMBER_CALLER_ID,
    createdByMemberId: MEMBER_CALLER_ID,
    splitMethod: "EQUAL" as const,
    spentAt: new Date("2026-11-20T12:00:00Z"),
    receiptImageUrl: null,
    note: "Ngon",
    createdAt: new Date("2026-11-20T12:30:00Z"),
    updatedAt: new Date("2026-11-20T12:30:00Z"),
    paidBy: {
      id: MEMBER_CALLER_ID,
      displayName: "Caller",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
    },
    createdBy: {
      id: MEMBER_CALLER_ID,
      displayName: "Caller",
    },
    itineraryItem: null,
    shares: [
      {
        id: "share-1",
        expenseId: VALID_EXPENSE_ID,
        memberId: MEMBER_CALLER_ID,
        amount: 75000,
        member: {
          id: MEMBER_CALLER_ID,
          displayName: "Caller",
          status: "ACTIVE" as const,
        },
      },
      {
        id: "share-2",
        expenseId: VALID_EXPENSE_ID,
        memberId: MEMBER_OTHER_ID,
        amount: 75000,
        member: {
          id: MEMBER_OTHER_ID,
          displayName: "Hùng",
          status: "ACTIVE" as const,
        },
      },
    ],
    items: [],
  };

  let mockQueryRaw: ReturnType<typeof vi.fn>;
  let mockTripFindUniqueInTx: ReturnType<typeof vi.fn>;
  let mockExpenseFindFirstInTx: ReturnType<typeof vi.fn>;
  let mockExpenseUpdateInTx: ReturnType<typeof vi.fn>;
  let mockExpenseDeleteInTx: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryRaw = vi.fn().mockResolvedValue([]);
    mockTripFindUniqueInTx = vi.fn().mockResolvedValue(mockTrip);
    mockExpenseFindFirstInTx = vi.fn().mockResolvedValue(mockExistingExpense);
    mockExpenseUpdateInTx = vi.fn().mockImplementation((args) =>
      Promise.resolve({
        ...mockExistingExpense,
        ...args.data,
        updatedAt: new Date(),
      })
    );
    mockExpenseDeleteInTx = vi.fn().mockResolvedValue(mockExistingExpense);

    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.trip.findUnique).mockResolvedValue(
      mockTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMemberCaller as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        $queryRaw: mockQueryRaw,
        trip: {
          findUnique: mockTripFindUniqueInTx,
        },
        tripMember: {
          findMany: vi.fn().mockResolvedValue([mockMemberCaller, mockMemberHost, mockMemberOther]),
          findFirst: vi.fn().mockResolvedValue(mockMemberCaller),
        },
        itineraryItem: {
          findFirst: vi.fn(),
        },
        expense: {
          findFirst: mockExpenseFindFirstInTx,
          update: mockExpenseUpdateInTx,
          delete: mockExpenseDeleteInTx,
        },
        expenseShare: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        expenseItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockImplementation((args) =>
            Promise.resolve({
              id: "item-new-1",
              ...args.data,
            })
          ),
        },
        expenseItemMember: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };

      // @ts-expect-error test mock tx
      return await callback(mockTx);
    });
  });

  describe("PATCH /api/trips/[id]/expenses/[expenseId]", () => {
    it("returns 404 when tripId or expenseId is not a valid UUID", async () => {
      const req = new Request(`http://localhost/api/trips/${INVALID_UUID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "New title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: INVALID_UUID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when expense does not exist or belongs to another trip (IDOR protection)", async () => {
      // Mock findFirst returning null (e.g. cross-trip IDOR)
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $queryRaw: mockQueryRaw,
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          expense: { findFirst: vi.fn().mockResolvedValue(null) },
        };
        // @ts-expect-error test mock
        return await callback(mockTx);
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 400 when trip is not in ACTIVE status", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
        ...mockTrip,
        status: "COMPLETED" as const,
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 403 when non-host MEMBER is not the original payer", async () => {
      // Existing expense paid by mockMemberOther, caller is mockMemberCaller
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $queryRaw: mockQueryRaw,
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          expense: {
            findFirst: vi.fn().mockResolvedValue({
              ...mockExistingExpense,
              paidByMemberId: MEMBER_OTHER_ID, // Paid by other!
            }),
          },
        };
        // @ts-expect-error test mock
        return await callback(mockTx);
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/quyền chỉnh sửa/);
    });

    it("allows HOST to edit any expense (even if paid by another member)", async () => {
      // Caller is HOST
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $queryRaw: mockQueryRaw,
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          expense: {
            findFirst: vi.fn().mockResolvedValue({
              ...mockExistingExpense,
              paidByMemberId: MEMBER_OTHER_ID, // Paid by other!
            }),
            update: vi.fn().mockResolvedValue({
              ...mockExistingExpense,
              title: "Host updated title",
            }),
          },
          tripMember: {
            findMany: vi.fn().mockResolvedValue([mockMemberCaller, mockMemberHost, mockMemberOther]),
          },
        };
        // @ts-expect-error test mock
        return await callback(mockTx);
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Host updated title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Host updated title");
    });

    it("successfully updates metadata (title, note, category) without altering shares", async () => {
      const payload = {
        title: "Bún chả Hương Liên (Cập nhật)",
        note: "Đã có hóa đơn đỏ",
        category: "FOOD" as const,
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Bún chả Hương Liên (Cập nhật)");
      expect(json.data.note).toBe("Đã có hóa đơn đỏ");
    });

    it("recalculates shares and items when switching from EQUAL to ITEMIZED", async () => {
      const payload = {
        splitMethod: "ITEMIZED" as const,
        amount: 250000,
        surchargeAmount: 50000,
        items: [
          {
            name: "Lẩu cua",
            amount: 200000,
            assignedMemberIds: [MEMBER_CALLER_ID, MEMBER_OTHER_ID],
          },
        ],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.splitMethod).toBe("ITEMIZED");
      expect(json.data.amount).toBe(250000);
      expect(json.data.surchargeAmount).toBe(50000);
    });

    it("rejects when merged state breaks financial invariant (sum items !== amount)", async () => {
      const payload = {
        amount: 300000, // Broken: items only sum to 200k + 50k = 250k
        items: [
          {
            name: "Lẩu cua",
            amount: 200000,
            assignedMemberIds: [MEMBER_CALLER_ID],
          },
        ],
        surchargeAmount: 50000,
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("locks trip row FOR SHARE before checking status and updating expense", async () => {
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      expect(mockQueryRaw).toHaveBeenCalled();

      // Check order: $queryRaw (lock) before findUnique (status check) before expense.update
      const lockCallOrder = mockQueryRaw.mock.invocationCallOrder[0];
      const tripFindCallOrder = mockTripFindUniqueInTx.mock.invocationCallOrder[0];
      const expenseUpdateCallOrder = mockExpenseUpdateInTx.mock.invocationCallOrder[0];

      expect(lockCallOrder).toBeLessThan(tripFindCallOrder);
      expect(tripFindCallOrder).toBeLessThan(expenseUpdateCallOrder);
    });

    it("rejects PATCH with 400 when trip status changes to non-ACTIVE after acquiring lock", async () => {
      mockTripFindUniqueInTx.mockResolvedValueOnce({
        ...mockTrip,
        status: "SETTLING",
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/lên kế hoạch/);
      expect(mockExpenseUpdateInTx).not.toHaveBeenCalled();
    });

    it("rejects PATCH with 404 when trip is not found inside transaction after acquiring lock", async () => {
      mockTripFindUniqueInTx.mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Không tìm thấy chuyến đi/);
      expect(mockExpenseUpdateInTx).not.toHaveBeenCalled();
    });

    it("maps Prisma P2002 unique constraint violation to 409 Conflict in PATCH", async () => {
      mockExpenseUpdateInTx.mockRejectedValueOnce({
        code: "P2002",
        meta: {
          target: ["expense_id", "member_id"],
        },
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("CONFLICT");
      expect(json.error.message).toMatch(/phần chia chi phí/);
    });

    it("maps Prisma P2003 foreign key violation to 400 Bad Request in PATCH", async () => {
      mockExpenseUpdateInTx.mockRejectedValueOnce({
        code: "P2003",
        meta: {
          field_name: "expenses_paid_by_member_id_fkey",
        },
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Thành viên liên quan không tồn tại/);
    });

    it("maps Prisma P2004 check constraint violation to 400 Bad Request in PATCH", async () => {
      mockExpenseUpdateInTx.mockRejectedValueOnce({
        code: "P2004",
        cause: {
          code: "23514",
          constraint: "expenses_amount_positive",
        },
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Số tiền khoản chi phải là số nguyên dương/);
    });

    it("maps unknown database error in PATCH to 500 without leaking details", async () => {
      mockExpenseUpdateInTx.mockRejectedValueOnce(
        new Error("FATAL: relation \"trips\" connection leaked secret_token=abc")
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      });
      const res = await PATCH(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
      const responseString = JSON.stringify(json);
      expect(responseString).not.toContain("secret_token");
      expect(responseString).not.toContain("FATAL:");
    });
  });

  describe("DELETE /api/trips/[id]/expenses/[expenseId]", () => {
    it("returns 404 when tripId or expenseId is not a valid UUID", async () => {
      const req = new Request(`http://localhost/api/trips/${INVALID_UUID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: INVALID_UUID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 404 when expense does not belong to trip (IDOR protection)", async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $queryRaw: mockQueryRaw,
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          expense: { findFirst: vi.fn().mockResolvedValue(null) },
        };
        // @ts-expect-error test mock
        return await callback(mockTx);
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 400 when trip is not in ACTIVE status", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
        ...mockTrip,
        status: "SETTLING" as const,
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 403 when non-host MEMBER is not the original payer", async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $queryRaw: mockQueryRaw,
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          expense: {
            findFirst: vi.fn().mockResolvedValue({
              ...mockExistingExpense,
              paidByMemberId: MEMBER_OTHER_ID, // Paid by other!
            }),
          },
        };
        // @ts-expect-error test mock
        return await callback(mockTx);
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/quyền xóa/);
    });

    it("deletes expense successfully when caller is the original payer", async () => {
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(VALID_EXPENSE_ID);
    });

    it("deletes expense successfully when caller is HOST", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          $queryRaw: mockQueryRaw,
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          expense: {
            findFirst: vi.fn().mockResolvedValue({
              ...mockExistingExpense,
              paidByMemberId: MEMBER_OTHER_ID, // Paid by other
            }),
            delete: vi.fn().mockResolvedValue(mockExistingExpense),
          },
        };
        // @ts-expect-error test mock
        return await callback(mockTx);
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(VALID_EXPENSE_ID);
    });

    it("locks trip row FOR SHARE before checking status and deleting expense", async () => {
      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(200);
      expect(mockQueryRaw).toHaveBeenCalled();

      // Check order: $queryRaw (lock) before findUnique (status check) before expense.delete
      const lockCallOrder = mockQueryRaw.mock.invocationCallOrder[0];
      const tripFindCallOrder = mockTripFindUniqueInTx.mock.invocationCallOrder[0];
      const expenseDeleteCallOrder = mockExpenseDeleteInTx.mock.invocationCallOrder[0];

      expect(lockCallOrder).toBeLessThan(tripFindCallOrder);
      expect(tripFindCallOrder).toBeLessThan(expenseDeleteCallOrder);
    });

    it("rejects DELETE with 400 when trip status changes to non-ACTIVE after acquiring lock", async () => {
      mockTripFindUniqueInTx.mockResolvedValueOnce({
        ...mockTrip,
        status: "SETTLING",
      });

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/lên kế hoạch/);
      expect(mockExpenseDeleteInTx).not.toHaveBeenCalled();
    });

    it("rejects DELETE with 404 when trip is not found inside transaction after acquiring lock", async () => {
      mockTripFindUniqueInTx.mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Không tìm thấy chuyến đi/);
      expect(mockExpenseDeleteInTx).not.toHaveBeenCalled();
    });

    it("maps unknown database error in DELETE to 500 without leaking details", async () => {
      mockExpenseDeleteInTx.mockRejectedValueOnce(
        new Error("FATAL: deadlock detected on DELETE expenses")
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses/${VALID_EXPENSE_ID}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ id: VALID_TRIP_ID, expenseId: VALID_EXPENSE_ID }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
      const responseString = JSON.stringify(json);
      expect(responseString).not.toContain("deadlock detected");
      expect(responseString).not.toContain("FATAL:");
    });
  });
});
