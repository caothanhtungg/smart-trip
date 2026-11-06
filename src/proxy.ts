import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";
export const BETTER_AUTH_SECURE_SESSION_COOKIE = "__Secure-better-auth.session_token";

/**
 * Kiểm tra xem một URL có phải là đường dẫn nội bộ an toàn hay không.
 * Phòng chống lỗ hổng Open Redirect:
 * - Bắt buộc bắt đầu bằng ký tự "/"
 * - Không cho phép "//" hoặc "/\" (protocol-relative URLs hoặc Windows backslash tricks)
 * - Không cho phép chứa URL scheme (như http:, https:, javascript:, data:)
 */
export function isSafeCallbackUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//") || url.startsWith("/\\")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return false;
  return true;
}

/**
 * Kiểm tra xem pathname có thuộc diện trang riêng tư cần bảo vệ hay không.
 * Các trang được bảo vệ: /trips, /trips/*, /profile, /profile/*
 */
export function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/trips" ||
    pathname.startsWith("/trips/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/")
  );
}

/**
 * Server-side route guard (Next.js 16 Proxy).
 *
 * QUY TẮC BẢO MẬT & ĐIỀU HƯỚNG:
 * 1. Chặn người dùng chưa đăng nhập truy cập các trang riêng tư (/trips, /profile)
 *    và điều hướng sớm về /login trước khi render React tree.
 * 2. Bảo toàn URL đích nội bộ qua tham số callbackUrl; chống Open Redirect ra tên miền ngoài.
 * 3. Tuyệt đối KHÔNG áp dụng redirect HTML cho API Route Handlers (/api/*); API giữ nguyên mã 401/403.
 * 4. Không chặn landing page (/), login (/login), xem trước mời (/join/*), hay tài nguyên tĩnh.
 * 5. LƯU Ý BẢO MẬT: Kiểm tra sự tồn tại của session cookie tại Proxy là kiểm tra lạc quan (optimistic check)
 *    nhằm tối ưu UX và ngăn render sớm. Toàn bộ API và Server Actions vẫn thực hiện xác thực session
 *    hoàn chỉnh qua requireAuth() và phân quyền độc lập tại từng điểm cuối.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Bắt buộc HTTPS ở production. Chỉ tin x-forwarded-proto do reverse proxy/CDN
  // ghi đè khi origin không được public trực tiếp.
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  if (
    process.env.NODE_ENV === "production" &&
    forwardedProtocol !== "https" &&
    request.nextUrl.protocol !== "https:"
  ) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return NextResponse.redirect(secureUrl, 308);
  }

  // 1. API Route Handlers: pass-through, không redirect sang trang HTML
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. Public pages và static assets: pass-through
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // 3. Kiểm tra sự hiện diện của Better Auth session cookie
  const sessionToken =
    request.cookies.get(BETTER_AUTH_SESSION_COOKIE)?.value ||
    request.cookies.get(BETTER_AUTH_SECURE_SESSION_COOKIE)?.value;

  if (sessionToken && sessionToken.trim() !== "") {
    return NextResponse.next();
  }

  // 4. Chưa có session: redirect về /login kèm callbackUrl an toàn
  const fullDestination = `${pathname}${search}`;
  const redirectUrl = new URL("/login", request.url);

  if (isSafeCallbackUrl(fullDestination)) {
    redirectUrl.searchParams.set("callbackUrl", fullDestination);
  }

  return NextResponse.redirect(redirectUrl);
}

/**
 * Next.js 16 Proxy configuration matcher.
 * Chỉ áp dụng cho các route cần được bảo vệ.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
