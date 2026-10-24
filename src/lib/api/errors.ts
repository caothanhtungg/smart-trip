export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: string;
      details?: ApiErrorDetail[];
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? 400;
    this.code = options.code ?? "BAD_REQUEST";
    this.details = options.details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Yêu cầu không hợp lệ.", details?: ApiErrorDetail[]) {
    super(message, { statusCode: 400, code: "BAD_REQUEST", details });
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dữ liệu đầu vào không hợp lệ.", details?: ApiErrorDetail[]) {
    super(message, { statusCode: 400, code: "VALIDATION_ERROR", details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bạn không có quyền thực hiện thao tác này.") {
    super(message, { statusCode: 403, code: "FORBIDDEN" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy dữ liệu yêu cầu.") {
    super(message, { statusCode: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "Thao tác xung đột với trạng thái hiện tại của dữ liệu.",
    options?: { code?: string; details?: ApiErrorDetail[] }
  ) {
    super(message, {
      statusCode: 409,
      code: options?.code ?? "CONFLICT",
      details: options?.details,
    });
  }
}

export class AlreadyMemberError extends ConflictError {
  constructor(message = "Bạn đã là thành viên của chuyến đi này.") {
    super(message, { code: "ALREADY_MEMBER" });
  }
}

export class GoneError extends AppError {
  constructor(message = "Tài nguyên không còn tồn tại hoặc đã bị lưu trữ.") {
    super(message, { statusCode: 410, code: "GONE" });
  }
}

export class TooManyRequestsError extends AppError {
  public readonly retryAfter?: number;
  public readonly resetAt?: Date;

  constructor(
    message = "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.",
    options?: { retryAfter?: number; resetAt?: Date; details?: ApiErrorDetail[] }
  ) {
    super(message, { statusCode: 429, code: "TOO_MANY_REQUESTS", details: options?.details });
    this.retryAfter = options?.retryAfter;
    this.resetAt = options?.resetAt;
  }
}

export class InviteCodeCollisionError extends AppError {
  constructor(
    message = "Không thể tạo mã mời duy nhất cho chuyến đi sau nhiều lần thử. Vui lòng thử lại sau."
  ) {
    super(message, { statusCode: 409, code: "INVITE_CODE_COLLISION" });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Kích thước tập tin vượt quá giới hạn cho phép.") {
    super(message, { statusCode: 413, code: "PAYLOAD_TOO_LARGE" });
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Định dạng tập tin không được hỗ trợ.") {
    super(message, { statusCode: 415, code: "UNSUPPORTED_MEDIA_TYPE" });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Dịch vụ tạm thời không khả dụng.", code = "SERVICE_UNAVAILABLE") {
    super(message, { statusCode: 503, code });
  }
}
