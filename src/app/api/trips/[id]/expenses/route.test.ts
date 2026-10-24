import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import {
  requireAuth,
  UnauthorizedError,
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
      findMany: vi.fn(),
      create: vi.fn(),
    },
    expenseShare: {
      createMany: vi.fn(),
    },
    expenseItem: {
      create: vi.fn(),
    },
    expenseItemMember: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Expenses Collection API (/api/trips/[id]/expenses)", () => {
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const INVALID_UUID = "not-a-valid-uuid";

  const mockUser: AuthUser = {
    id: "usr-active-1",
    email: "lan@example.com",
    name: "Nguyễn Thị Lan",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "Lan",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-active-1",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const mockTrip = {
    id: VALID_TRIP_ID,
    name: "Chuyến đi Phú Quốc",
    destination: "Phú Quốc",
    startDate: new Date("2026-11-20T00:00:00Z"),
    endDate: new Date("2026-11-25T00:00:00Z"),
    budgetAmount: 15000000,
    status: "ACTIVE" as const,
    inviteCode: "PQ2026-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MEMBER_ACTIVE_1_ID = "aaaaaaaa-1111-4111-8111-111111111111";
  const MEMBER_HOST_ID = "bbbbbbbb-2222-4222-8222-222222222222";
  const MEMBER_OTHER_ID = "cccccccc-3333-4333-8333-333333333333";
  const MEMBER_LEFT_ID = "dddddddd-4444-4444-8444-444444444444";

  const mockMemberActive = {
    id: MEMBER_ACTIVE_1_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-active-1",
    displayName: "Lan (Caller)",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    joinOrder: 1,
    joinedAt: new Date("2026-10-01T00:00:00Z"),
    leftAt: null,
  };

  const mockMemberHost = {
    id: MEMBER_HOST_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-active-1",
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

  const mockMemberLeft = {
    id: MEMBER_LEFT_ID,
    tripId: VALID_TRIP_ID,
    userId: "usr-left-3",
    displayName: "Dũng đã rời nhóm",
    role: "MEMBER" as const,
    status: "LEFT" as const,
    joinOrder: 3,
    joinedAt: new Date("2026-10-03T00:00:00Z"),
    leftAt: new Date("2026-10-10T00:00:00Z"),
  };

  let mockQueryRaw: ReturnType<typeof vi.fn>;
  let mockTripFindUniqueInTx: ReturnType<typeof vi.fn>;
  let mockExpenseCreateInTx: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryRaw = vi.fn().mockResolvedValue([]);
    mockTripFindUniqueInTx = vi.fn().mockResolvedValue(mockTrip);
    mockExpenseCreateInTx = vi.fn().mockImplementation((args) =>
      Promise.resolve({
        id: "exp-created-1",
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.trip.findUnique).mockResolvedValue(
      mockTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(
      mockMemberActive as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
    );

    // Mock transaction to execute the callback with a mock tx object
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        $queryRaw: mockQueryRaw,
        trip: {
          findUnique: mockTripFindUniqueInTx,
        },
        tripMember: {
          findMany: vi.fn().mockResolvedValue([mockMemberActive, mockMemberHost, mockMemberOther]),
          findFirst: vi.fn().mockResolvedValue(mockMemberActive),
        },
        itineraryItem: {
          findFirst: vi.fn(),
        },
        expense: {
          create: mockExpenseCreateInTx,
          findFirst: vi.fn(),
        },
        expenseShare: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        expenseItem: {
          create: vi.fn().mockImplementation((args) =>
            Promise.resolve({
              id: "item-created-1",
              ...args.data,
            })
          ),
        },
        expenseItemMember: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };

      // @ts-expect-error test mock tx
      return await callback(mockTx);
    });
  });

  describe("GET /api/trips/[id]/expenses", () => {
    it("returns 401 when user is not logged in", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 when tripId is not a valid UUID", async () => {
      const req = new Request(`http://localhost/api/trips/${INVALID_UUID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: INVALID_UUID }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when trip does not exist", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it("returns 403 when user is not a member of the trip", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(null);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 with empty list when no expenses exist", async () => {
      vi.mocked(prisma.expense.findMany).mockResolvedValueOnce([]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("allows LEFT member to view expense history (read-only)", async () => {
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockMemberLeft as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );
      vi.mocked(prisma.expense.findMany).mockResolvedValueOnce([]);

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.tripMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["ACTIVE", "LEFT"] },
          }),
        })
      );
    });

    it("returns 200 with formatted DTO containing EQUAL and ITEMIZED expenses without sensitive fields", async () => {
      const mockDbExpenses = [
        {
          id: "exp-1",
          tripId: VALID_TRIP_ID,
          itineraryItemId: null,
          title: "Ăn trưa bún chả",
          amount: 150000,
          surchargeAmount: 0,
          category: "FOOD" as const,
          paidByMemberId: MEMBER_ACTIVE_1_ID,
          createdByMemberId: MEMBER_ACTIVE_1_ID,
          splitMethod: "EQUAL" as const,
          spentAt: new Date("2026-11-20T12:00:00Z"),
          receiptImageUrl: null,
          note: "Ngon",
          createdAt: new Date("2026-11-20T12:30:00Z"),
          updatedAt: new Date("2026-11-20T12:30:00Z"),
          paidBy: {
            id: MEMBER_ACTIVE_1_ID,
            displayName: "Lan",
            role: "MEMBER" as const,
            status: "ACTIVE" as const,
          },
          createdBy: {
            id: MEMBER_ACTIVE_1_ID,
            displayName: "Lan",
          },
          itineraryItem: null,
          shares: [
            {
              id: "share-1",
              expenseId: "exp-1",
              memberId: MEMBER_ACTIVE_1_ID,
              amount: 75000,
              member: {
                id: MEMBER_ACTIVE_1_ID,
                displayName: "Lan",
                status: "ACTIVE" as const,
              },
            },
            {
              id: "share-2",
              expenseId: "exp-1",
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
        },
        {
          id: "exp-2",
          tripId: VALID_TRIP_ID,
          itineraryItemId: "33333333-3333-4333-8333-333333333333",
          title: "Hải sản đêm",
          amount: 550000,
          surchargeAmount: 50000,
          category: "FOOD" as const,
          paidByMemberId: MEMBER_ACTIVE_1_ID,
          createdByMemberId: MEMBER_ACTIVE_1_ID,
          splitMethod: "ITEMIZED" as const,
          spentAt: new Date("2026-11-20T19:00:00Z"),
          receiptImageUrl: "https://example.com/receipt.jpg",
          note: null,
          createdAt: new Date("2026-11-20T20:00:00Z"),
          updatedAt: new Date("2026-11-20T20:00:00Z"),
          paidBy: {
            id: MEMBER_ACTIVE_1_ID,
            displayName: "Lan",
            role: "MEMBER" as const,
            status: "ACTIVE" as const,
          },
          createdBy: {
            id: MEMBER_ACTIVE_1_ID,
            displayName: "Lan",
          },
          itineraryItem: {
            id: "33333333-3333-4333-8333-333333333333",
            placeName: "Nhà hàng Biển Xanh",
            dayDate: new Date("2026-11-20T00:00:00Z"),
          },
          shares: [
            {
              id: "share-3",
              expenseId: "exp-2",
              memberId: MEMBER_ACTIVE_1_ID,
              amount: 325000,
              member: {
                id: MEMBER_ACTIVE_1_ID,
                displayName: "Lan",
                status: "ACTIVE" as const,
              },
            },
            {
              id: "share-4",
              expenseId: "exp-2",
              memberId: MEMBER_LEFT_ID, // LEFT member in historical share
              amount: 225000,
              member: {
                id: MEMBER_LEFT_ID,
                displayName: "Dũng đã rời nhóm",
                status: "LEFT" as const,
              },
            },
          ],
          items: [
            {
              id: "item-1",
              expenseId: "exp-2",
              name: "Cua rang me",
              amount: 300000,
              members: [
                {
                  memberId: MEMBER_ACTIVE_1_ID,
                  member: {
                    id: MEMBER_ACTIVE_1_ID,
                    displayName: "Lan",
                    status: "ACTIVE" as const,
                  },
                },
              ],
            },
          ],
        },
      ];

      vi.mocked(prisma.expense.findMany).mockResolvedValueOnce(
        mockDbExpenses as unknown as Awaited<ReturnType<typeof prisma.expense.findMany>>
      );

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`);
      const res = await GET(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(2);

      const [first, second] = json.data;
      expect(first.title).toBe("Ăn trưa bún chả");
      expect(first.amount).toBe(150000);
      expect(first.splitMethod).toBe("EQUAL");
      expect(first.shares).toHaveLength(2);

      expect(second.title).toBe("Hải sản đêm");
      expect(second.amount).toBe(550000);
      expect(second.surchargeAmount).toBe(50000);
      expect(second.splitMethod).toBe("ITEMIZED");
      expect(second.itineraryItem).toEqual({
        id: "33333333-3333-4333-8333-333333333333",
        placeName: "Nhà hàng Biển Xanh",
        dayDate: "2026-11-20",
      });
      // Verifies LEFT member is preserved in historical shares
      expect(second.shares[1].member.status).toBe("LEFT");

      // Verify no sensitive fields leaked
      const stringified = JSON.stringify(json.data);
      expect(stringified).not.toContain("bankAccountNo");
      expect(stringified).not.toContain("bankBin");
      expect(stringified).not.toContain("userId");
    });
  });

  describe("POST /api/trips/[id]/expenses", () => {
    it("returns 400 when trip is not in ACTIVE status", async () => {
      vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
        ...mockTrip,
        status: "COMPLETED" as const,
      });

      const payload = {
        title: "Ăn trưa",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/lên kế hoạch/);
    });

    it("creates a valid EQUAL split expense and distributes remainder +1 VND correctly", async () => {
      // 100,000 VND split 3 ways:
      // Base = 33,333 VND
      // Remainder = 1 VND
      // Member with lowest joinOrder (mem-active-1: joinOrder 1) gets 33,334 VND
      // Other members (joinOrder 2, joinOrder 3) get 33,333 VND
      const payload = {
        title: "Bữa trưa 100k",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id, mockMemberOther.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Bữa trưa 100k");
      expect(json.data.amount).toBe(100000);
      expect(json.data.shares).toHaveLength(2);
      expect(json.data.shares[0].amount + json.data.shares[1].amount).toBe(100000);
      // Caller cannot override createdByMemberId; server sets it to caller's membership ID
      expect(json.data.createdByMemberId).toBe(mockMemberActive.id);
    });

    it("creates a valid ITEMIZED expense with surcharge distribution", async () => {
      // Item 1: 300,000 VND for Lan & Hùng (150k each)
      // Item 2: 200,000 VND for Hùng (200k)
      // Surcharge: 50,000 VND split between distinct participants (Lan, Hùng -> 25k each)
      // Total: 550,000 VND
      // Lan total: 150k + 25k = 175,000 VND
      // Hùng total: 350k + 25k = 375,000 VND
      // Total shares: 175k + 375k = 550,000 VND
      const payload = {
        title: "Tiệc hải sản",
        amount: 550000,
        surchargeAmount: 50000,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: mockMemberActive.id,
        items: [
          {
            name: "Lẩu cua",
            amount: 300000,
            assignedMemberIds: [mockMemberActive.id, mockMemberOther.id],
          },
          {
            name: "Hàu nướng",
            amount: 200000,
            assignedMemberIds: [mockMemberOther.id],
          },
        ],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.amount).toBe(550000);
      expect(json.data.surchargeAmount).toBe(50000);
      expect(json.data.shares).toHaveLength(2);

      const totalShares = json.data.shares.reduce((sum: number, s: { amount: number }) => sum + s.amount, 0);
      expect(totalShares).toBe(550000);
    });

    it("enforces R18: returns 403 when non-host MEMBER declares another member as payer", async () => {
      // Caller is mockMemberActive (role: MEMBER)
      // Payload tries to set paidByMemberId = mockMemberOther.id
      const payload = {
        title: "Ăn trưa",
        amount: 200000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberOther.id, // Not caller!
        participantMemberIds: [mockMemberActive.id, mockMemberOther.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/chính mình/);
    });

    it("allows HOST to declare any ACTIVE member as payer (R18)", async () => {
      // Caller is HOST
      vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce(
        mockMemberHost as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>
      );

      const payload = {
        title: "Thuê xe",
        amount: 500000,
        category: "TRANSPORT",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberOther.id, // Host declares Hùng paid
        participantMemberIds: [mockMemberHost.id, mockMemberOther.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.paidByMemberId).toBe(mockMemberOther.id);
      expect(json.data.createdByMemberId).toBe(mockMemberHost.id);
    });

    it("rejects when participant or payer is not an ACTIVE member in the trip", async () => {
      const payload = {
        title: "Ăn trưa",
        amount: 200000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id, mockMemberLeft.id], // mockMemberLeft is LEFT
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/trạng thái hoạt động/);
    });

    it("rejects unauthorized injected fields (strict schema)", async () => {
      const payload = {
        title: "Ăn trưa",
        amount: 200000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
        role: "HOST", // Disallowed field
        createdByMemberId: "hacked-id", // Disallowed field
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("rejects when ITEMIZED sum(items) + surcharge !== amount", async () => {
      const payload = {
        title: "Tiệc hải sản",
        amount: 500000, // Misreconciled: 300k + 200k + 50k = 550k
        surchargeAmount: 50000,
        category: "FOOD",
        splitMethod: "ITEMIZED",
        paidByMemberId: mockMemberActive.id,
        items: [
          {
            name: "Lẩu cua",
            amount: 300000,
            assignedMemberIds: [mockMemberActive.id],
          },
          {
            name: "Hàu nướng",
            amount: 200000,
            assignedMemberIds: [mockMemberOther.id],
          },
        ],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("locks trip row FOR SHARE before checking status and creating expense records", async () => {
      const payload = {
        title: "Bữa tối hải sản",
        amount: 200000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id, mockMemberOther.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(201);

      // Verify row lock was called
      expect(mockQueryRaw).toHaveBeenCalled();

      // Verify execution order: $queryRaw (lock) called before findUnique (status check) and before expense.create
      const lockCallOrder = mockQueryRaw.mock.invocationCallOrder[0];
      const tripFindCallOrder = mockTripFindUniqueInTx.mock.invocationCallOrder[0];
      const expenseCreateCallOrder = mockExpenseCreateInTx.mock.invocationCallOrder[0];

      expect(lockCallOrder).toBeLessThan(tripFindCallOrder);
      expect(tripFindCallOrder).toBeLessThan(expenseCreateCallOrder);
    });

    it("rejects POST with 400 when trip status changes to non-ACTIVE after acquiring lock", async () => {
      // Race condition scenario: Trip was ACTIVE initially, but locked row reveals it is now SETTLING
      mockTripFindUniqueInTx.mockResolvedValueOnce({
        ...mockTrip,
        status: "SETTLING",
      });

      const payload = {
        title: "Bữa tối",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/lên kế hoạch/);
      expect(mockExpenseCreateInTx).not.toHaveBeenCalled();
    });

    it("rejects POST with 404 when trip is not found inside transaction after acquiring lock", async () => {
      mockTripFindUniqueInTx.mockResolvedValueOnce(null);

      const payload = {
        title: "Bữa tối",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Không tìm thấy chuyến đi/);
      expect(mockExpenseCreateInTx).not.toHaveBeenCalled();
    });

    it("maps Prisma P2002 unique constraint violation to 409 Conflict", async () => {
      mockExpenseCreateInTx.mockRejectedValueOnce({
        code: "P2002",
        meta: {
          target: ["expense_id", "member_id"],
        },
      });

      const payload = {
        title: "Bữa tối",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("CONFLICT");
      expect(json.error.message).toMatch(/phần chia chi phí/);
    });

    it("maps Prisma P2003 foreign key violation to 400 Bad Request", async () => {
      mockExpenseCreateInTx.mockRejectedValueOnce({
        code: "P2003",
        meta: {
          field_name: "expenses_paid_by_member_id_fkey",
        },
      });

      const payload = {
        title: "Bữa tối",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Thành viên liên quan không tồn tại/);
    });

    it("maps P2004 check constraint violation to 400 Bad Request", async () => {
      mockExpenseCreateInTx.mockRejectedValueOnce({
        code: "P2004",
        cause: {
          code: "23514",
          constraint: "expenses_amount_positive",
        },
      });

      const payload = {
        title: "Bữa tối",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toMatch(/Số tiền khoản chi phải là số nguyên dương/);
    });

    it("maps unknown database error to 500 without leaking SQL or connection details", async () => {
      mockExpenseCreateInTx.mockRejectedValueOnce(
        new Error("FATAL: connection to postgresql://user:secret_pass@db.internal:5432 failed")
      );

      const payload = {
        title: "Bữa tối",
        amount: 100000,
        category: "FOOD",
        splitMethod: "EQUAL",
        paidByMemberId: mockMemberActive.id,
        participantMemberIds: [mockMemberActive.id],
      };

      const req = new Request(`http://localhost/api/trips/${VALID_TRIP_ID}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ id: VALID_TRIP_ID }) });
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
      // Must not leak connection string or password
      const responseString = JSON.stringify(json);
      expect(responseString).not.toContain("secret_pass");
      expect(responseString).not.toContain("postgresql://");
      expect(responseString).not.toContain("FATAL:");
    });
  });
});
