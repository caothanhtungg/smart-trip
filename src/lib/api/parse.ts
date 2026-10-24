import { ZodType, ZodTypeDef } from "zod";
import { ValidationError } from "./errors";

/**
 * Trích xuất và xác thực JSON body từ Request bằng Zod schema.
 * Ném ValidationError nếu cú pháp JSON bị lỗi hoặc ZodError nếu vi phạm schema.
 */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T, ZodTypeDef, unknown>
): Promise<T> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    throw new ValidationError("Dữ liệu JSON gửi lên không hợp lệ hoặc rỗng.");
  }

  const result = schema.safeParse(rawBody);
  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

/**
 * Trích xuất và xác thực query parameters từ Request hoặc URL bằng Zod schema.
 */
export function parseQueryParams<T>(
  reqOrUrl: Request | URL | string,
  schema: ZodType<T>
): T {
  let url: URL;
  if (typeof reqOrUrl === "string") {
    url = new URL(reqOrUrl, "http://localhost");
  } else if (reqOrUrl instanceof Request) {
    url = new URL(reqOrUrl.url);
  } else {
    url = reqOrUrl;
  }

  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    queryObj[key] = val;
  });

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

/**
 * Xác thực route params (hỗ trợ cả params dạng Promise của Next.js 15+ và object thông thường).
 */
export async function parseRouteParams<T>(
  params: unknown | Promise<unknown>,
  schema: ZodType<T>
): Promise<T> {
  const resolved = params instanceof Promise ? await params : params;
  const result = schema.safeParse(resolved);
  if (!result.success) {
    throw result.error;
  }

  return result.data;
}
