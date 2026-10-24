import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import { parseJsonBody, parseQueryParams, parseRouteParams } from "./parse";
import { ValidationError } from "./errors";

describe("API Request Parsing Helpers (src/lib/api/parse)", () => {
  const UserSchema = z.object({
    displayName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự"),
    age: z.number().optional(),
  });

  describe("parseJsonBody", () => {
    it("successfully parses valid JSON matching schema", async () => {
      const req = new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Thanh Tung", age: 25 }),
      });

      const data = await parseJsonBody(req, UserSchema);
      expect(data).toEqual({ displayName: "Thanh Tung", age: 25 });
    });

    it("throws ValidationError when JSON syntax is malformed", async () => {
      const req = new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ broken json: ",
      });

      await expect(parseJsonBody(req, UserSchema)).rejects.toThrow(ValidationError);
      await expect(parseJsonBody(req, UserSchema)).rejects.toThrow(
        /Dữ liệu JSON gửi lên không hợp lệ/
      );
    });

    it("throws ZodError when body fails schema validation", async () => {
      const req = new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "A" }), // quá ngắn
      });

      await expect(parseJsonBody(req, UserSchema)).rejects.toThrow(ZodError);
    });
  });

  describe("parseQueryParams", () => {
    const QuerySchema = z.object({
      status: z.enum(["ACTIVE", "SETTLING", "COMPLETED"]).optional(),
      page: z.coerce.number().int().positive().default(1),
    });

    it("parses query params from Request object", () => {
      const req = new Request("http://localhost:3000/api/trips?status=ACTIVE&page=2");
      const parsed = parseQueryParams(req, QuerySchema);
      expect(parsed).toEqual({ status: "ACTIVE", page: 2 });
    });

    it("parses query params from string URL and applies defaults", () => {
      const parsed = parseQueryParams("http://localhost:3000/api/trips", QuerySchema);
      expect(parsed).toEqual({ page: 1 });
    });

    it("throws ZodError when query param is invalid", () => {
      const req = new Request("http://localhost:3000/api/trips?status=INVALID_STATUS");
      expect(() => parseQueryParams(req, QuerySchema)).toThrow(ZodError);
    });
  });

  describe("parseRouteParams", () => {
    const RouteSchema = z.object({
      tripId: z.string().uuid("Trip ID phải là UUID"),
    });

    it("parses route params from plain object", async () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const parsed = await parseRouteParams({ tripId: validUuid }, RouteSchema);
      expect(parsed).toEqual({ tripId: validUuid });
    });

    it("parses route params from Promise (Next.js 15+ convention)", async () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const paramsPromise = Promise.resolve({ tripId: validUuid });
      const parsed = await parseRouteParams(paramsPromise, RouteSchema);
      expect(parsed).toEqual({ tripId: validUuid });
    });

    it("throws ZodError when route param fails validation", async () => {
      await expect(parseRouteParams({ tripId: "not-a-uuid" }, RouteSchema)).rejects.toThrow(
        ZodError
      );
    });
  });
});
