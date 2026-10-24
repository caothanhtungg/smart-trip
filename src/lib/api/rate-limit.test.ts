import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkPostgresRateLimit,
  getClientIp,
  isValidIp,
  ALLOWED_TRUSTED_IP_HEADERS,
} from "./rate-limit";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "./errors";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe("PostgreSQL Rate Limiting Module", () => {
  const originalEnv = process.env.TRUSTED_CLIENT_IP_HEADER;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TRUSTED_CLIENT_IP_HEADER = originalEnv;
    } else {
      delete process.env.TRUSTED_CLIENT_IP_HEADER;
    }
  });

  describe("isValidIp", () => {
    it("validates standard IPv4 addresses", () => {
      expect(isValidIp("192.168.1.1")).toBe(true);
      expect(isValidIp("127.0.0.1")).toBe(true);
      expect(isValidIp("10.0.0.254")).toBe(true);
      expect(isValidIp("8.8.8.8")).toBe(true);
    });

    it("rejects invalid IPv4 addresses", () => {
      expect(isValidIp("256.0.0.1")).toBe(false);
      expect(isValidIp("192.168.1")).toBe(false);
      expect(isValidIp("192.168.1.1.1")).toBe(false);
      expect(isValidIp("01.02.03.04")).toBe(false); // leading zero
      expect(isValidIp("abc.def.ghi.jkl")).toBe(false);
      expect(isValidIp("")).toBe(false);
      expect(isValidIp(null)).toBe(false);
      expect(isValidIp(undefined)).toBe(false);
    });

    it("validates standard IPv6 addresses", () => {
      expect(isValidIp("::1")).toBe(true);
      expect(isValidIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
      expect(isValidIp("fe80::1ff:fe23:4567:890a")).toBe(true);
    });
  });

  describe("getClientIp & Trusted Proxy Header Policy", () => {
    it("ALLOWED_TRUSTED_IP_HEADERS contains exactly allowed whitelist headers", () => {
      expect(ALLOWED_TRUSTED_IP_HEADERS).toEqual([
        "cf-connecting-ip",
        "x-real-ip",
        "x-forwarded-for",
      ]);
    });

    it("when no trusted header is configured, ignores all client-sent IP headers and returns fallback 127.0.0.1", () => {
      const req = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "203.0.113.1",
          "x-real-ip": "198.51.100.1",
          "x-forwarded-for": "192.0.2.1, 10.0.0.1",
        },
      });

      // No env and no options configured -> fail-closed, does not allow client to spoof new keys
      expect(getClientIp(req)).toBe("127.0.0.1");
    });

    it("when trusted header is cf-connecting-ip, extracts IP solely from cf-connecting-ip", () => {
      const req = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "203.0.113.195",
          "x-real-ip": "198.51.100.1",
          "x-forwarded-for": "192.0.2.1",
        },
      });

      expect(getClientIp(req, { trustedHeader: "cf-connecting-ip" })).toBe("203.0.113.195");
    });

    it("when trusted cf-connecting-ip is missing or invalid, falls back to 127.0.0.1 and does NOT fallback to other headers", () => {
      const req = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "invalid-ip-string",
          "x-real-ip": "198.51.100.1", // Client might attempt to spoof fallback
        },
      });

      expect(getClientIp(req, { trustedHeader: "cf-connecting-ip" })).toBe("127.0.0.1");

      const reqMissing = new Request("http://localhost", {
        headers: {
          "x-real-ip": "198.51.100.1",
        },
      });

      expect(getClientIp(reqMissing, { trustedHeader: "cf-connecting-ip" })).toBe("127.0.0.1");
    });

    it("when trusted header is x-real-ip, extracts IP solely from x-real-ip", () => {
      const req = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "203.0.113.1",
          "x-real-ip": "198.51.100.50",
          "x-forwarded-for": "192.0.2.1",
        },
      });

      expect(getClientIp(req, { trustedHeader: "x-real-ip" })).toBe("198.51.100.50");
    });

    it("when trusted x-real-ip is missing or invalid, falls back to 127.0.0.1 and does NOT fallback to other headers", () => {
      const req = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "203.0.113.1",
          "x-real-ip": "not-an-ip",
        },
      });

      expect(getClientIp(req, { trustedHeader: "x-real-ip" })).toBe("127.0.0.1");
    });

    it("when trusted header is x-forwarded-for with multiple entries, selects the LAST entry appended by trusted proxy (rejecting client-spoofed prefix)", () => {
      const req = new Request("http://localhost", {
        headers: {
          // Client sends spoofed IP "1.2.3.4", trusted reverse proxy appends real client IP "203.0.113.195"
          "x-forwarded-for": "1.2.3.4, 203.0.113.195",
        },
      });

      // Must NOT take the first spoofed IP ("1.2.3.4"); must take the last trusted IP ("203.0.113.195")
      expect(getClientIp(req, { trustedHeader: "x-forwarded-for" })).toBe("203.0.113.195");
    });

    it("when trusted header is x-forwarded-for with single entry, uses that entry if valid", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "198.51.100.77",
        },
      });

      expect(getClientIp(req, { trustedHeader: "x-forwarded-for" })).toBe("198.51.100.77");
    });

    it("when trusted header is x-forwarded-for and the last entry is invalid, returns 127.0.0.1", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "1.2.3.4, invalid-ip",
        },
      });

      expect(getClientIp(req, { trustedHeader: "x-forwarded-for" })).toBe("127.0.0.1");
    });

    it("rejects unwhitelisted header configuration and returns fallback 127.0.0.1", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-custom-ip": "1.2.3.4",
        },
      });

      expect(getClientIp(req, { trustedHeader: "x-custom-ip" })).toBe("127.0.0.1");
    });

    it("reads configuration from process.env.TRUSTED_CLIENT_IP_HEADER when options are not provided", () => {
      process.env.TRUSTED_CLIENT_IP_HEADER = "x-real-ip";

      const req = new Request("http://localhost", {
        headers: {
          "x-real-ip": "198.51.100.88",
          "cf-connecting-ip": "203.0.113.1",
        },
      });

      expect(getClientIp(req)).toBe("198.51.100.88");
    });
  });

  describe("checkPostgresRateLimit", () => {
    it("validates input parameters and rejects invalid key or negative limits", async () => {
      await expect(
        checkPostgresRateLimit({ key: "", limit: 10, windowSeconds: 60 })
      ).rejects.toThrow(AppError);

      await expect(
        checkPostgresRateLimit({ key: "invite:1.2.3.4", limit: 0, windowSeconds: 60 })
      ).rejects.toThrow(AppError);

      await expect(
        checkPostgresRateLimit({ key: "invite:1.2.3.4", limit: 10, windowSeconds: -1 })
      ).rejects.toThrow(AppError);
    });

    it("returns allowed = true with remaining count when count <= limit", async () => {
      const mockResetAt = new Date(Date.now() + 45000);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        {
          count: 3,
          reset_at: mockResetAt,
        },
      ]);

      const result = await checkPostgresRateLimit({
        key: "invite:192.168.1.1",
        limit: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(true);
      expect(result.count).toBe(3);
      expect(result.remaining).toBe(7);
      expect(result.resetAt.toISOString()).toBe(mockResetAt.toISOString());
      expect(result.limit).toBe(10);
    });

    it("returns allowed = true at exactly the limit (remaining = 0)", async () => {
      const mockResetAt = new Date(Date.now() + 20000);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        {
          count: 10,
          reset_at: mockResetAt,
        },
      ]);

      const result = await checkPostgresRateLimit({
        key: "invite:192.168.1.1",
        limit: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(true);
      expect(result.count).toBe(10);
      expect(result.remaining).toBe(0);
    });

    it("returns allowed = false when count exceeds limit", async () => {
      const mockResetAt = new Date(Date.now() + 15000);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        {
          count: 11,
          reset_at: mockResetAt,
        },
      ]);

      const result = await checkPostgresRateLimit({
        key: "invite:192.168.1.1",
        limit: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(false);
      expect(result.count).toBe(11);
      expect(result.remaining).toBe(0);
    });

    it("fails safely and throws AppError when DB returns empty result", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

      await expect(
        checkPostgresRateLimit({
          key: "invite:192.168.1.1",
          limit: 10,
          windowSeconds: 60,
        })
      ).rejects.toThrow("Không nhận được kết quả rate limit hợp lệ từ cơ sở dữ liệu.");
    });

    it("fails safely and throws AppError when DB throws connection error", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("PostgreSQL connection timeout"));

      await expect(
        checkPostgresRateLimit({
          key: "invite:192.168.1.1",
          limit: 10,
          windowSeconds: 60,
        })
      ).rejects.toThrow("Không thể xác thực giới hạn tần suất truy cập. Vui lòng thử lại sau.");
    });
  });
});
