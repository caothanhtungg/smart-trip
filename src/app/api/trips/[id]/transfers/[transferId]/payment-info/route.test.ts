import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import {
  requireAuth,
  type AuthUser,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { encryptBankAccount } from "@/lib/crypto/bank-encryption";

const TEST_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

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
    },
    settlementTransfer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

type TripMemberFindResult = Awaited<ReturnType<typeof prisma.tripMember.findFirst>>;
type TripFindResult = Awaited<ReturnType<typeof prisma.trip.findUnique>>;
type TransferFindResult = Awaited<ReturnType<typeof prisma.settlementTransfer.findUnique>>;

describe("GET /api/trips/[id]/transfers/[transferId]/payment-info (UC18)", () => {
  const originalEnvKey = process.env.BANK_ENCRYPTION_KEY;

  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";
  const OTHER_TRIP_ID = "99999999-9999-4999-8999-999999999999";
  const VALID_TRANSFER_ID = "22222222-3333-4444-8555-666666666666";
  const INVALID_UUID = "not-a-valid-uuid";

  const DEBTOR_MEMBER_ID = "aaaa1111-1111-4111-8111-111111111111";
  const CREDITOR_MEMBER_ID = "bbbb2222-2222-4222-8222-222222222222";
  const HOST_MEMBER_ID = "cccc3333-3333-4333-8333-333333333333";
  const UNRELATED_MEMBER_ID = "dddd4444-4444-4444-8444-444444444444";

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
    bankBin: "970407", // Techcombank
    bankAccountNo: null, // Will set encrypted in test
    bankAccountName: "NGUYEN VAN CREDITOR",
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

  const mockUserUnrelated: AuthUser = {
    id: "usr-unrelated-4",
    email: "unrelated@example.com",
    name: "Unrelated Member",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: "Unrelated",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: mockUserDebtor.id,
    token: "token-1",
    expiresAt: new Date(Date.now() + 86400000),
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BANK_ENCRYPTION_KEY = TEST_KEY_HEX;
  });

  afterEach(() => {
    process.env.BANK_ENCRYPTION_KEY = originalEnvKey;
  });

  function setupAuth(user: AuthUser) {
    vi.mocked(requireAuth).mockResolvedValue({
      user,
      session: { ...mockSession, userId: user.id },
    });
  }

  function setupTripMembership(
    memberId: string,
    userId: string,
    role: "HOST" | "MEMBER" = "MEMBER",
    status: "ACTIVE" | "LEFT" = "ACTIVE"
  ) {
    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue({
      id: memberId,
      tripId: VALID_TRIP_ID,
      userId,
      displayName: role === "HOST" ? "Trưởng nhóm" : "Thành viên",
      role,
      status,
      joinOrder: 1,
      joinedAt: new Date(),
      leftAt: null,
      bankBin: null,
      bankAccountNo: null,
      bankAccountName: null,
      bankAccountKeyVersion: 1,
    } as unknown as TripMemberFindResult);

    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: VALID_TRIP_ID,
      name: "Chuyến đi Đà Lạt 3N2Đ",
      destination: "Đà Lạt",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-03"),
      budgetAmount: 10000000,
      status: "SETTLING",
      inviteCode: "DL3N2D-TRIP99",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as TripFindResult);
  }

  it("returns 401 Unauthorized if no active session", async () => {
    const { UnauthorizedError } = await import("@/lib/auth/session");
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 404 for invalid tripId or transferId UUID", async () => {
    setupAuth(mockUserDebtor);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: INVALID_UUID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 if caller is not a member of the trip", async () => {
    setupAuth(mockUserDebtor);
    vi.mocked(prisma.tripMember.findFirst).mockResolvedValue(null);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 if transfer does not exist or belongs to another trip (IDOR prevention)", async () => {
    setupAuth(mockUserDebtor);
    setupTripMembership(DEBTOR_MEMBER_ID, mockUserDebtor.id, "MEMBER");

    // Case 1: Transfer null
    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    let res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });
    expect(res.status).toBe(404);

    // Case 2: Transfer belongs to OTHER_TRIP_ID
    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 200000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: OTHER_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: { id: CREDITOR_MEMBER_ID, displayName: "Creditor", status: "ACTIVE", userId: mockUserCreditor.id, role: "MEMBER" },
    } as unknown as TransferFindResult);

    res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 Conflict if settlement status is not ACTIVE", async () => {
    setupAuth(mockUserDebtor);
    setupTripMembership(DEBTOR_MEMBER_ID, mockUserDebtor.id, "MEMBER");

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 200000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "CANCELLED" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: { id: CREDITOR_MEMBER_ID, displayName: "Creditor", status: "ACTIVE", userId: mockUserCreditor.id, role: "MEMBER" },
    } as unknown as TransferFindResult);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.message).toContain("không còn hoạt động");
  });

  it("returns 409 Conflict if transfer is already PAID or COMPLETED", async () => {
    setupAuth(mockUserDebtor);
    setupTripMembership(DEBTOR_MEMBER_ID, mockUserDebtor.id, "MEMBER");

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 200000,
      status: "PAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: { id: CREDITOR_MEMBER_ID, displayName: "Creditor", status: "ACTIVE", userId: mockUserCreditor.id, role: "MEMBER" },
    } as unknown as TransferFindResult);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.message).toContain("đã được đánh dấu thanh toán");
  });

  it("returns 403 Forbidden if caller is an unrelated MEMBER of the trip", async () => {
    setupAuth(mockUserUnrelated);
    setupTripMembership(UNRELATED_MEMBER_ID, mockUserUnrelated.id, "MEMBER");

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 200000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: { id: CREDITOR_MEMBER_ID, displayName: "Creditor", status: "ACTIVE", userId: mockUserCreditor.id, role: "MEMBER" },
    } as unknown as TransferFindResult);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toContain("không có quyền truy cập");
  });

  it("returns 400 Bad Request if recipient has not set up bank info", async () => {
    setupAuth(mockUserDebtor);
    setupTripMembership(DEBTOR_MEMBER_ID, mockUserDebtor.id, "MEMBER");

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 200000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: {
        id: CREDITOR_MEMBER_ID,
        displayName: "Creditor",
        status: "ACTIVE",
        userId: mockUserCreditor.id,
        role: "MEMBER",
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
        user: {
          id: mockUserCreditor.id,
          name: "Creditor",
          displayName: "Creditor",
          bankBin: null,
          bankAccountNo: null,
          bankAccountName: null,
        },
      },
    } as unknown as TransferFindResult);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("RECIPIENT_BANK_INFO_MISSING");
  });

  it("returns 500 fail-closed if encryption key is missing or decryption fails", async () => {
    setupAuth(mockUserDebtor);
    setupTripMembership(DEBTOR_MEMBER_ID, mockUserDebtor.id, "MEMBER");

    const enc = encryptBankAccount("19036789123456", { key: TEST_KEY_HEX });

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 200000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: {
        id: CREDITOR_MEMBER_ID,
        displayName: "Creditor",
        status: "ACTIVE",
        userId: mockUserCreditor.id,
        role: "MEMBER",
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
        user: {
          id: mockUserCreditor.id,
          name: "Creditor",
          displayName: "Creditor",
          bankBin: "970407",
          bankAccountNo: enc.encryptedAccountNo,
          bankAccountName: "NGUYEN VAN CREDITOR",
        },
      },
    } as unknown as TransferFindResult);

    // Corrupt the encryption key
    delete process.env.BANK_ENCRYPTION_KEY;

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    // Must NOT leak plaintext or sensitive info in error
    expect(JSON.stringify(body)).not.toContain("19036789123456");
  });

  it("successfully returns payment info and VietQR to Debtor without exposing plaintext or ciphertext account", async () => {
    setupAuth(mockUserDebtor);
    setupTripMembership(DEBTOR_MEMBER_ID, mockUserDebtor.id, "MEMBER");

    const enc = encryptBankAccount("19036789123456", { key: TEST_KEY_HEX });

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 350000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Debtor", status: "ACTIVE", userId: mockUserDebtor.id, role: "MEMBER" },
      toMember: {
        id: CREDITOR_MEMBER_ID,
        displayName: "Creditor",
        status: "ACTIVE",
        userId: mockUserCreditor.id,
        role: "MEMBER",
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
        user: {
          id: mockUserCreditor.id,
          name: "Creditor",
          displayName: "Creditor",
          bankBin: "970407",
          bankAccountNo: enc.encryptedAccountNo,
          bankAccountName: "NGUYEN VAN CREDITOR",
        },
      },
    } as unknown as TransferFindResult);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const data = body.data;
    expect(data.transferId).toBe(VALID_TRANSFER_ID);
    expect(data.tripId).toBe(VALID_TRIP_ID);
    expect(data.amount).toBe(350000);
    expect(data.bankBin).toBe("970407");
    expect(data.bankName).toBe("Techcombank");
    // Masked account only!
    expect(data.bankAccountMasked).toBe("**** **** 3456");
    expect(data.recipientName).toBe("NGUYEN VAN CREDITOR");
    expect(data.transferMemo).toBe("ST CHUYEN DI DA DEBTOR");

    // Must have QR data URL and QR payload
    expect(data.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(data.qrPayload).toContain("000201");
    expect(data.qrPayload).toContain("970407");
    expect(data.qrPayload).toContain("350000");

    // Critical security assertion: Plaintext account number and ciphertext NOT exposed as separate properties
    expect(data.bankAccountNo).toBeUndefined();
    expect(data.bankAccountNoCiphertext).toBeUndefined();
    expect(data.ciphertext).toBeUndefined();

    // Verify DB was NOT updated (viewing QR does NOT mark transfer as paid)
    expect(prisma.settlementTransfer.update).not.toHaveBeenCalled();
  });

  it("successfully allows HOST to view payment info for a member transfer", async () => {
    setupAuth(mockUserHost);
    setupTripMembership(HOST_MEMBER_ID, mockUserHost.id, "HOST");

    const enc = encryptBankAccount("9876543210", { key: TEST_KEY_HEX });

    vi.mocked(prisma.settlementTransfer.findUnique).mockResolvedValue({
      id: VALID_TRANSFER_ID,
      settlementId: "settle-1",
      amount: 150000,
      status: "UNPAID",
      settlement: { id: "settle-1", tripId: VALID_TRIP_ID, status: "ACTIVE" },
      fromMember: { id: DEBTOR_MEMBER_ID, displayName: "Guest Payer", status: "ACTIVE", userId: null, role: "MEMBER" },
      toMember: {
        id: CREDITOR_MEMBER_ID,
        displayName: "Guest Receiver",
        status: "ACTIVE",
        userId: null,
        role: "MEMBER",
        bankBin: "970436", // VCB
        bankAccountNo: enc.encryptedAccountNo,
        bankAccountName: "GUEST RECEIVER",
        user: null,
      },
    } as unknown as TransferFindResult);

    const req = new Request("http://localhost/api/trips/1/transfers/2/payment-info");
    const res = await GET(req, {
      params: Promise.resolve({ id: VALID_TRIP_ID, transferId: VALID_TRANSFER_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bankName).toBe("Vietcombank");
    expect(body.data.bankAccountMasked).toBe("**** **** 3210");
    expect(body.data.amount).toBe(150000);
  });
});
