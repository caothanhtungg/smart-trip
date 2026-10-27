import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import { requireAuth, UnauthorizedError, type AuthUser, type AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { encryptBankAccount } from "@/lib/crypto/bank-encryption";

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
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("GET /api/me/qr (Current User VietQR API)", () => {
  const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const originalEnv = process.env.BANK_ENCRYPTION_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BANK_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.BANK_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.BANK_ENCRYPTION_KEY;
    }
  });

  const mockUser: AuthUser = {
    id: "usr-123",
    email: "tung@example.com",
    name: "Cao Thanh Tùng",
    emailVerified: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    image: null,
    displayName: "Tùng",
    bankBin: "970407",
    bankAccountNo: null,
    bankAccountName: "CAOTHANHTUNG",
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-123",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when user is not found in database", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 when user has not configured bank account", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "usr-123",
      name: "Cao Thanh Tùng",
      displayName: "Tùng",
      bankBin: null,
      bankAccountName: null,
      bankAccountNo: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

    const res = await GET();
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 200 with valid real scannable VietQR payload and data URL", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    const plainAccount = "19036542890011";
    const encryptedBank = encryptBankAccount(plainAccount);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "usr-123",
      name: "Cao Thanh Tùng",
      displayName: "Tùng",
      bankBin: "970407", // Techcombank
      bankAccountName: "CAOTHANHTUNG",
      bankAccountNo: encryptedBank.encryptedAccountNo,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bankBin).toBe("970407");
    expect(body.data.bankName).toBe("Techcombank");
    expect(body.data.accountHolder).toBe("CAOTHANHTUNG");
    expect(body.data.bankAccountMasked).toBe("**** **** 0011");
    expect(body.data.qrPayload).toContain("000201010211"); // EMVCo static
    expect(body.data.qrPayload).toContain("970407");
    expect(body.data.qrPayload).toContain(plainAccount);
    expect(body.data.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    // Security invariant: plaintext account number must NEVER leak directly in JSON attributes
    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain(encryptedBank.encryptedAccountNo);
  });
});
