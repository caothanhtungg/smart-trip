import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, PATCH } from "./route";
import { requireAuth, UnauthorizedError, type AuthUser, type AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { encryptBankAccount, decryptBankAccount } from "@/lib/crypto/bank-encryption";

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
      update: vi.fn(),
    },
  },
}));

describe("GET /api/me (Current User Profile API)", () => {
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
    email: "lan.nguyen@example.com",
    name: "Lan Nguyễn",
    emailVerified: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    image: "https://example.com/avatar.jpg",
    displayName: "Lan",
    bankBin: "970436",
    bankAccountNo: null,
    bankAccountName: "LAN NGUYEN",
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-123",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  it("returns 401 UNAUTHORIZED when user is not logged in", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Yêu cầu đăng nhập để thực hiện thao tác này.",
      },
    });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns user profile without sensitive internals or encrypted bank account", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    const encryptedBank = encryptBankAccount("0123456789");

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "usr-123",
      name: "Lan Nguyễn",
      displayName: "Lan",
      email: "lan.nguyen@example.com",
      image: "https://example.com/avatar.jpg",
      bankBin: "970436",
      bankAccountName: "LAN NGUYEN",
      bankAccountNo: encryptedBank.encryptedAccountNo,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      id: "usr-123",
      name: "Lan Nguyễn",
      displayName: "Lan",
      email: "lan.nguyen@example.com",
      avatarUrl: "https://example.com/avatar.jpg",
      bankBin: "970436",
      bankAccountName: "LAN NGUYEN",
      bankAccountMasked: "**** **** 6789",
      hasBankAccount: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain(encryptedBank.encryptedAccountNo);
    expect(jsonStr).not.toContain("password");
    expect(jsonStr).not.toContain("accessToken");
    expect(jsonStr).not.toContain("refreshToken");
  });

  it("safely handles user without bank account information", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "usr-123",
      name: "Lan Nguyễn",
      displayName: null,
      email: "lan.nguyen@example.com",
      image: null,
      bankBin: null,
      bankAccountName: null,
      bankAccountNo: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe("Lan Nguyễn");
    expect(body.data.bankAccountMasked).toBeNull();
    expect(body.data.hasBankAccount).toBe(false);
  });
});

describe("PATCH /api/me (Update Current User Profile API)", () => {
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
    email: "lan.nguyen@example.com",
    name: "Lan Nguyễn",
    emailVerified: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    image: "https://example.com/avatar.jpg",
    displayName: "Lan",
    bankBin: "970436",
    bankAccountNo: null,
    bankAccountName: "LAN NGUYEN",
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-1",
    userId: "usr-123",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  it("returns 401 UNAUTHORIZED when user is not logged in", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Lan Mới" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is empty {}", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 and rejects attempts to update another user (arbitrary userId in body)", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Lan Mới",
        userId: "hacker-target-user-id",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when bank fields are incomplete (violating all-or-nothing rule)", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankBin: "970436",
        // missing bankAccountNo & bankAccountName
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("successfully updates displayName only (partial update)", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "usr-123",
      name: "Lan Nguyễn",
      displayName: "Lan Phương",
      email: "lan.nguyen@example.com",
      image: "https://example.com/avatar.jpg",
      bankBin: null,
      bankAccountName: null,
      bankAccountNo: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as unknown as Awaited<ReturnType<typeof prisma.user.update>>);

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Lan Phương" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe("Lan Phương");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "usr-123" },
      data: { displayName: "Lan Phương" },
      select: expect.any(Object),
    });
  });

  it("successfully encrypts bank account with AES-256-GCM before database write", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.update).mockImplementationOnce((args) => {
      const bankAccountNo = (args as { data: { bankAccountNo: string } }).data
        .bankAccountNo;
      return Promise.resolve({
        id: "usr-123",
        name: "Lan Nguyễn",
        displayName: "Lan",
        email: "lan.nguyen@example.com",
        image: "https://example.com/avatar.jpg",
        bankBin: "970436",
        bankAccountName: "NGUYEN PHUONG LAN",
        bankAccountNo,
        bankAccountKeyVersion: 1,
        emailVerified: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      }) as unknown as ReturnType<typeof prisma.user.update>;
    });

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankBin: "970436",
        bankAccountNo: "0123456789",
        bankAccountName: "Nguyễn Phương Lan",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    const savedData = updateCall.data as Record<string, unknown>;

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bankAccountMasked).toBe("**** **** 6789");
    expect(body.data.hasBankAccount).toBe(true);
    expect(body.data.bankAccountName).toBe("NGUYEN PHUONG LAN");

    // BẢO MẬT: Kiểm tra dữ liệu được gửi xuống DB là ciphertext AES-256-GCM
    expect(savedData.bankAccountNo).toBeDefined();
    expect(typeof savedData.bankAccountNo).toBe("string");
    expect(savedData.bankAccountNo).not.toBe("0123456789"); // KHÔNG lưu plaintext

    const encryptedStr = savedData.bankAccountNo as string;
    const parts = encryptedStr.split(":");
    expect(parts.length).toBe(3); // iv:authTag:ciphertext

    // Giải mã kiểm tra lại tính chính xác
    const decrypted = decryptBankAccount(encryptedStr);
    expect(decrypted).toBe("0123456789");

    // BẢO MẬT: Response DTO không rò rỉ ciphertext hay plaintext
    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain("0123456789");
    expect(jsonStr).not.toContain(encryptedStr);
  });

  it("successfully clears bank info when bank fields are all null", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "usr-123",
      name: "Lan Nguyễn",
      displayName: "Lan",
      email: "lan.nguyen@example.com",
      image: "https://example.com/avatar.jpg",
      bankBin: null,
      bankAccountName: null,
      bankAccountNo: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as unknown as Awaited<ReturnType<typeof prisma.user.update>>);

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bankAccountMasked).toBeNull();
    expect(body.data.hasBankAccount).toBe(false);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "usr-123" },
      data: {
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
      },
      select: expect.any(Object),
    });
  });

  it("fails closed with 500 and prevents database write when BANK_ENCRYPTION_KEY is missing", async () => {
    delete process.env.BANK_ENCRYPTION_KEY;

    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankBin: "970436",
        bankAccountNo: "0123456789",
        bankAccountName: "Nguyễn Phương Lan",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");

    // BẢO MẬT: DB update tuyệt đối KHÔNG được gọi khi lỗi crypto
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("handles database update error gracefully", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    vi.mocked(prisma.user.update).mockRejectedValueOnce(new Error("Database connection error"));

    const req = new Request("http://localhost/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Lan Mới" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
