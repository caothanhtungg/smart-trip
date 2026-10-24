import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getServerSession,
  requireAuth,
  UnauthorizedError,
  type SessionResult,
  type AuthUser,
  type AuthSession,
} from "./session";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

function createMockUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: "usr-1",
    email: "test@example.com",
    name: "Test User",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    displayName: null,
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
    ...overrides,
  };
}

function createMockSession(overrides?: Partial<AuthSession>): AuthSession {
  return {
    id: "sess-1",
    userId: "usr-1",
    token: "tok-1",
    expiresAt: new Date(Date.now() + 3600 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
    ...overrides,
  };
}

describe("Auth Session Helper (src/lib/auth/session)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UnauthorizedError", () => {
    it("has default message and correct name", () => {
      const err = new UnauthorizedError();
      expect(err.name).toBe("UnauthorizedError");
      expect(err.message).toBe("Yêu cầu đăng nhập để thực hiện thao tác này.");
    });

    it("accepts custom message", () => {
      const err = new UnauthorizedError("Phiên đã hết hạn");
      expect(err.message).toBe("Phiên đã hết hạn");
    });
  });

  describe("getServerSession", () => {
    it("returns session and user when valid session exists", async () => {
      const mockResult: SessionResult = {
        session: createMockSession(),
        user: createMockUser(),
      };
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockResult);

      const customHeaders = new Headers({ cookie: "better-auth.session_token=valid" });
      const result = await getServerSession(customHeaders);

      expect(auth.api.getSession).toHaveBeenCalledWith({ headers: customHeaders });
      expect(result).toEqual(mockResult);
    });

    it("returns null when no session is found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const result = await getServerSession(new Headers());
      expect(result).toBeNull();
    });

    it("returns null when getSession throws an error", async () => {
      vi.mocked(auth.api.getSession).mockRejectedValueOnce(new Error("Network error"));

      const result = await getServerSession(new Headers());
      expect(result).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("returns user and session when authenticated", async () => {
      const mockUser = createMockUser({ id: "usr-1", email: "user@test.com", name: "User" });
      const mockSession = createMockSession({ id: "sess-1", userId: "usr-1", token: "tok-1" });

      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });

      const res = await requireAuth(new Headers());
      expect(res.user).toEqual(mockUser);
      expect(res.session).toEqual(mockSession);
    });

    it("throws UnauthorizedError when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      await expect(requireAuth(new Headers())).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when user is missing from session result", async () => {
      const mockSession = createMockSession({ id: "sess-1" });

      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        session: mockSession,
        user: null,
      } as unknown as SessionResult);

      await expect(requireAuth(new Headers())).rejects.toThrow(UnauthorizedError);
    });
  });
});
