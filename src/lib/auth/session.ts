import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthUser = NonNullable<SessionResult>["user"];
export type AuthSession = NonNullable<SessionResult>["session"];

export class UnauthorizedError extends Error {
  constructor(message = "Yêu cầu đăng nhập để thực hiện thao tác này.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Lấy phiên đăng nhập và thông tin người dùng hiện tại từ Request Headers phía server.
 * BẢO MẬT: Tuyệt đối không nhận userId từ request body, query param hay client context.
 * Danh tính luôn được xác minh thông qua cookie/session token trong headers.
 */
export async function getServerSession(
  customHeaders?: Headers
): Promise<SessionResult | null> {
  try {
    const requestHeaders = customHeaders ?? (await headers());
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });
    return session;
  } catch {
    return null;
  }
}

/**
 * Bắt buộc người dùng phải đăng nhập. Ném UnauthorizedError nếu không có phiên hợp lệ.
 * Trả về { user, session } đã được xác thực an toàn.
 */
export async function requireAuth(customHeaders?: Headers): Promise<{
  user: AuthUser;
  session: AuthSession;
}> {
  const result = await getServerSession(customHeaders);
  if (!result || !result.user || !result.session) {
    throw new UnauthorizedError();
  }

  return {
    user: result.user,
    session: result.session,
  };
}
