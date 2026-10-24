import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  proxy,
  isSafeCallbackUrl,
  isProtectedPath,
  BETTER_AUTH_SESSION_COOKIE,
  BETTER_AUTH_SECURE_SESSION_COOKIE,
} from "./proxy";

describe("Route Guard Proxy (proxy.ts)", () => {
  describe("isSafeCallbackUrl", () => {
    it("accepts valid internal paths", () => {
      expect(isSafeCallbackUrl("/trips")).toBe(true);
      expect(isSafeCallbackUrl("/trips/trip-123")).toBe(true);
      expect(isSafeCallbackUrl("/profile?tab=bank")).toBe(true);
      expect(isSafeCallbackUrl("/trips/create?from=landing")).toBe(true);
    });

    it("rejects open-redirect attack vectors", () => {
      expect(isSafeCallbackUrl("https://evil.com")).toBe(false);
      expect(isSafeCallbackUrl("http://evil.com/trips")).toBe(false);
      expect(isSafeCallbackUrl("//evil.com")).toBe(false);
      expect(isSafeCallbackUrl("//evil.com/trips")).toBe(false);
      expect(isSafeCallbackUrl("/\\evil.com")).toBe(false);
      expect(isSafeCallbackUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeCallbackUrl("data:text/html,<html>")).toBe(false);
    });

    it("rejects empty or non-string inputs", () => {
      expect(isSafeCallbackUrl("")).toBe(false);
      expect(isSafeCallbackUrl(null)).toBe(false);
      expect(isSafeCallbackUrl(undefined)).toBe(false);
    });
  });

  describe("isProtectedPath", () => {
    it("identifies private app paths", () => {
      expect(isProtectedPath("/trips")).toBe(true);
      expect(isProtectedPath("/trips/new")).toBe(true);
      expect(isProtectedPath("/trips/550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isProtectedPath("/profile")).toBe(true);
      expect(isProtectedPath("/profile/edit")).toBe(true);
    });

    it("identifies public paths and assets as not protected", () => {
      expect(isProtectedPath("/")).toBe(false);
      expect(isProtectedPath("/login")).toBe(false);
      expect(isProtectedPath("/join/DL3N2D-TRIP99")).toBe(false);
      expect(isProtectedPath("/api/me")).toBe(false);
      expect(isProtectedPath("/favicon.ico")).toBe(false);
      expect(isProtectedPath("/_next/static/chunks/main.js")).toBe(false);
    });
  });

  describe("proxy handler execution", () => {
    it("redirects unauthenticated user accessing /trips to /login with callbackUrl", () => {
      const req = new NextRequest("http://localhost:3000/trips");
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBeDefined();
      const redirectUrl = new URL(location!);
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/trips");
    });

    it("preserves query params in callbackUrl when redirecting to /login", () => {
      const req = new NextRequest("http://localhost:3000/profile?section=bank&focus=stk");
      const res = proxy(req);

      expect(res.status).toBe(307);
      const redirectUrl = new URL(res.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/profile?section=bank&focus=stk");
    });

    it("allows access to protected route when better-auth.session_token cookie is present", () => {
      const req = new NextRequest("http://localhost:3000/trips", {
        headers: {
          cookie: `${BETTER_AUTH_SESSION_COOKIE}=valid-session-token-xyz`,
        },
      });
      const res = proxy(req);

      // NextResponse.next() returns a 200 with x-middleware-next header
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows access when HTTPS __Secure-better-auth.session_token cookie is present", () => {
      const req = new NextRequest("https://example.com/profile", {
        headers: {
          cookie: `${BETTER_AUTH_SECURE_SESSION_COOKIE}=secure-session-token-abc`,
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("redirects if session cookie is empty or whitespace only", () => {
      const req = new NextRequest("http://localhost:3000/trips", {
        headers: {
          cookie: `${BETTER_AUTH_SESSION_COOKIE}=   `,
        },
      });
      const res = proxy(req);

      expect(res.status).toBe(307);
      const redirectUrl = new URL(res.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/login");
    });

    it("passes through API requests without HTML redirect even if unauthenticated", () => {
      const req = new NextRequest("http://localhost:3000/api/trips");
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("passes through public pages like landing page and login", () => {
      const reqLanding = new NextRequest("http://localhost:3000/");
      expect(proxy(reqLanding).status).toBe(200);

      const reqLogin = new NextRequest("http://localhost:3000/login");
      expect(proxy(reqLogin).status).toBe(200);

      const reqJoin = new NextRequest("http://localhost:3000/join/DL3N2D-TRIP99");
      expect(proxy(reqJoin).status).toBe(200);
    });
  });
});
