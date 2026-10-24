import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, type ApiErrorDetail } from "./errors";
import { UnauthorizedError } from "@/lib/auth/session";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Trả về HTTP Response thành công có định dạng chuẩn { success: true, data, message? }
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    message?: string;
    headers?: HeadersInit;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const status = options?.status ?? 200;
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: options?.headers,
  });
}

/**
 * Trả về HTTP Error Response có định dạng chuẩn { success: false, error: { code, message, details? } }
 */
export function apiError(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: ApiErrorDetail[];
    headers?: HeadersInit;
  }
): NextResponse<ApiErrorResponse> {
  const status = options?.status ?? 400;
  const code = options?.code ?? "BAD_REQUEST";
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(options?.details && options.details.length > 0
        ? { details: options.details }
        : {}),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: options?.headers,
  });
}

/**
 * Bắt và chuyển đổi mọi ngoại lệ thành safe HTTP response.
 * Tuyệt đối không trả về stack trace, thông tin cơ sở dữ liệu hay secrets ra client.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // 1. AppError (ValidationError, ForbiddenError, NotFoundError, ConflictError...)
  if (error instanceof AppError) {
    return apiError(error.message, {
      status: error.statusCode,
      code: error.code,
      details: error.details,
    });
  }

  // 2. UnauthorizedError từ Better Auth / session helper (HTTP 401)
  if (
    error instanceof UnauthorizedError ||
    (error instanceof Error && error.name === "UnauthorizedError")
  ) {
    return apiError(error.message || "Yêu cầu đăng nhập để thực hiện thao tác này.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  // 3. Zod validation error (HTTP 400)
  if (error instanceof ZodError) {
    const details: ApiErrorDetail[] = error.issues.map((issue) => ({
      field: issue.path.join(".") || undefined,
      message: issue.message,
      code: issue.code,
    }));

    return apiError("Dữ liệu đầu vào không hợp lệ.", {
      status: 400,
      code: "VALIDATION_ERROR",
      details,
    });
  }

  // 4. Lỗi hệ thống không mong đợi (HTTP 500)
  // Chỉ ghi log an toàn tại server, không lộ stack trace hay secrets ra client
  if (process.env.NODE_ENV !== "test") {
    console.error("[API Error]", error instanceof Error ? error.message : "Unexpected error");
  }

  return apiError("Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.", {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
  });
}
