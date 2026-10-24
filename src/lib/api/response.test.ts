import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import { apiSuccess, apiError, handleApiError } from "./response";
import {
  BadRequestError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "./errors";
import { UnauthorizedError } from "@/lib/auth/session";

describe("API Response and Error Handling (src/lib/api/response)", () => {
  describe("apiSuccess", () => {
    it("returns default HTTP 200 with formatted success envelope", async () => {
      const res = apiSuccess({ id: "123", name: "Đà Lạt" });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({
        success: true,
        data: { id: "123", name: "Đà Lạt" },
      });
    });

    it("supports custom HTTP status and optional message", async () => {
      const res = apiSuccess(
        { id: "trip-1" },
        { status: 201, message: "Tạo chuyến đi thành công." }
      );
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body).toEqual({
        success: true,
        data: { id: "trip-1" },
        message: "Tạo chuyến đi thành công.",
      });
    });
  });

  describe("apiError", () => {
    it("returns default HTTP 400 with formatted error envelope", async () => {
      const res = apiError("Yêu cầu không hợp lệ.");
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Yêu cầu không hợp lệ.",
        },
      });
    });

    it("supports custom code, status and details array", async () => {
      const details = [{ field: "name", message: "Tên không được để trống" }];
      const res = apiError("Dữ liệu không hợp lệ", {
        status: 422,
        code: "UNPROCESSABLE",
        details,
      });
      expect(res.status).toBe(422);

      const body = await res.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "UNPROCESSABLE",
          message: "Dữ liệu không hợp lệ",
          details,
        },
      });
    });
  });

  describe("handleApiError", () => {
    it("converts AppError subclasses to corresponding HTTP status and code", async () => {
      const badReq = handleApiError(new BadRequestError("Tham số sai"));
      expect(badReq.status).toBe(400);
      expect(await badReq.json()).toEqual({
        success: false,
        error: { code: "BAD_REQUEST", message: "Tham số sai" },
      });

      const valErr = handleApiError(
        new ValidationError("Lỗi dữ liệu", [{ field: "amount", message: "Số tiền > 0" }])
      );
      expect(valErr.status).toBe(400);
      expect(await valErr.json()).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Lỗi dữ liệu",
          details: [{ field: "amount", message: "Số tiền > 0" }],
        },
      });

      const forbidden = handleApiError(new ForbiddenError());
      expect(forbidden.status).toBe(403);
      expect(await forbidden.json()).toEqual({
        success: false,
        error: { code: "FORBIDDEN", message: "Bạn không có quyền thực hiện thao tác này." },
      });

      const notFound = handleApiError(new NotFoundError("Không tìm thấy chuyến đi."));
      expect(notFound.status).toBe(404);
      expect(await notFound.json()).toEqual({
        success: false,
        error: { code: "NOT_FOUND", message: "Không tìm thấy chuyến đi." },
      });

      const conflict = handleApiError(
        new ConflictError("Chuyến đi đã chốt sổ, không thể sửa.")
      );
      expect(conflict.status).toBe(409);
      expect(await conflict.json()).toEqual({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Chuyến đi đã chốt sổ, không thể sửa.",
        },
      });
    });

    it("converts UnauthorizedError to HTTP 401 UNAUTHORIZED", async () => {
      const unauth = handleApiError(new UnauthorizedError());
      expect(unauth.status).toBe(401);

      const body = await unauth.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Yêu cầu đăng nhập để thực hiện thao tác này.",
        },
      });
    });

    it("converts ZodError to HTTP 400 VALIDATION_ERROR with field details", async () => {
      const testSchema = z.object({
        name: z.string().min(1, "Tên bắt buộc"),
        budget: z.number().int().positive("Ngân sách phải dương"),
      });

      let zodErr: ZodError | null = null;
      try {
        testSchema.parse({ name: "", budget: -5000 });
      } catch (e) {
        if (e instanceof ZodError) zodErr = e;
      }

      expect(zodErr).toBeInstanceOf(ZodError);
      const res = handleApiError(zodErr);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Dữ liệu đầu vào không hợp lệ.");
      expect(body.error.details).toHaveLength(2);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "name", message: "Tên bắt buộc" }),
          expect.objectContaining({ field: "budget", message: "Ngân sách phải dương" }),
        ])
      );
    });

    it("converts unexpected errors to HTTP 500 without leaking stack traces or sensitive internals", async () => {
      const sensitiveError = new Error(
        "postgres://user:super_secret_password@db.supabase.com:5432/db connection lost at src/internal/db.ts:123"
      );

      const res = handleApiError(sensitiveError);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
        },
      });

      // BẢO MẬT: Kiểm tra tuyệt đối không có trường stack, thông tin db hay secret trong response
      const jsonString = JSON.stringify(body);
      expect(jsonString).not.toContain("super_secret_password");
      expect(jsonString).not.toContain("stack");
      expect(jsonString).not.toContain("postgres://");
    });

    it("safely handles non-Error thrown objects (e.g. string or null)", async () => {
      const res = handleApiError("Critical failure string");
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
        },
      });
    });
  });
});
