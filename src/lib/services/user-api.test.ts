import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchMyProfileApi,
  updateMyProfileApi,
  UserApiError,
} from "./user-api";

describe("User Profile API Client (user-api.ts)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchMyProfileApi", () => {
    it("returns profile data on success", async () => {
      const mockData = {
        id: "usr-1",
        name: "Lan Nguyễn",
        displayName: "Lan",
        email: "lan@example.com",
        avatarUrl: null,
        bankBin: "970436",
        bankAccountName: "LAN NGUYEN",
        bankAccountMasked: "**** **** 6789",
        hasBankAccount: true,
        createdAt: "2026-01-01T00:00:00Z",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: mockData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await fetchMyProfileApi();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/me", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    });

    it("throws UserApiError with 401 when unauthenticated", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Yêu cầu đăng nhập để thực hiện thao tác này.",
            },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      );

      await expect(fetchMyProfileApi()).rejects.toThrow(UserApiError);
      try {
        await fetchMyProfileApi();
      } catch (err) {
        if (err instanceof UserApiError) {
          expect(err.status).toBe(401);
          expect(err.code).toBe("UNAUTHORIZED");
        }
      }
    });
  });

  describe("updateMyProfileApi", () => {
    it("sends PATCH request and returns updated data", async () => {
      const updatedData = {
        id: "usr-1",
        name: "Lan Nguyễn",
        displayName: "Lan Mới",
        email: "lan@example.com",
        avatarUrl: null,
        bankBin: "970436",
        bankAccountName: "NGUYEN PHUONG LAN",
        bankAccountMasked: "**** **** 6789",
        hasBankAccount: true,
        createdAt: "2026-01-01T00:00:00Z",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: updatedData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await updateMyProfileApi({
        displayName: "Lan Mới",
        bankBin: "970436",
        bankAccountNo: "0123456789",
        bankAccountName: "Nguyễn Phương Lan",
      });

      expect(result).toEqual(updatedData);
      expect(global.fetch).toHaveBeenCalledWith("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          displayName: "Lan Mới",
          bankBin: "970436",
          bankAccountNo: "0123456789",
          bankAccountName: "Nguyễn Phương Lan",
        }),
      });
    });

    it("throws UserApiError on 400 validation error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Dữ liệu không hợp lệ.",
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      );

      await expect(
        updateMyProfileApi({ displayName: "" })
      ).rejects.toThrow(UserApiError);
    });
  });
});
