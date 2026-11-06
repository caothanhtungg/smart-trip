import {
  apiSuccess,
  handleApiError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  PayloadTooLargeError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import {
  validateReceiptFile,
  generateReceiptObjectKey,
  getReceiptStorageProvider,
  RECEIPT_STORAGE_BUCKET,
  getMaxReceiptSizeBytes,
} from "@/lib/storage/receipts";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * POST /api/trips/[id]/receipts
 * Tải lên ảnh hóa đơn đính kèm cho chuyến đi (UC32).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * 1. Bắt buộc phiên đăng nhập hợp lệ (401).
 * 2. Người dùng phải là thành viên ACTIVE của chuyến đi (403 nếu không thuộc).
 * 3. Chuyến đi phải ở trạng thái ACTIVE (Đang lên kế hoạch) (400 nếu đã chốt hoặc hoàn tất).
 * 4. Không tin tưởng tên file hoặc MIME type do client gửi; kiểm tra Magic Bytes thực tế.
 * 5. Giới hạn dung lượng theo cấu hình rõ ràng (mặc định 5MB).
 * 6. Sinh Object Key ngẫu nhiên bằng UUID; lưu vào private bucket.
 * 7. Tuyệt đối không log file content, tokens, hoặc private credentials.
 */
export async function POST(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;

    if (!tripId || !isValidUuid(tripId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }

    // 1. Phân quyền: Người dùng phải là thành viên ACTIVE của chuyến đi
    const auth = await requireTripMembership(tripId);

    // 2. Chuyến đi phải ở trạng thái ACTIVE
    if (auth.trip.status !== "ACTIVE") {
      throw new BadRequestError(
        "Không thể tải lên hóa đơn khi chuyến đi không ở trạng thái lên kế hoạch."
      );
    }

    // 3. Lấy dữ liệu multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new BadRequestError(
        "Định dạng yêu cầu phải là multipart/form-data."
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      throw new BadRequestError("Vui lòng đính kèm tập tin ảnh hóa đơn.");
    }

    // Chặn theo metadata multipart trước khi nạp toàn bộ file vào bộ nhớ.
    // Vẫn xác minh lại kích thước thực tế và Magic Bytes sau khi đọc buffer.
    if (file.size > getMaxReceiptSizeBytes()) {
      throw new PayloadTooLargeError();
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Kiểm tra tính hợp lệ của file (dung lượng, MIME, Magic Bytes)
    const validated = validateReceiptFile({
      buffer,
      size: file.size,
      declaredMimeType: file.type,
    });

    // 5. Kiểm tra trạng thái cấu hình của Storage Provider
    const provider = getReceiptStorageProvider();
    if (!provider.isConfigured()) {
      throw new ServiceUnavailableError(
        "Dịch vụ lưu trữ hóa đơn chưa được cấu hình trên hệ thống. Vui lòng liên hệ quản trị viên.",
        "STORAGE_NOT_CONFIGURED"
      );
    }

    // 6. Sinh khóa lưu trữ an toàn (Object Key) ngẫu nhiên
    const { key, fileId } = generateReceiptObjectKey(
      tripId,
      validated.extension
    );

    // 7. Lưu trữ ảnh vào Storage Bucket
    await provider.upload({
      bucket: RECEIPT_STORAGE_BUCKET,
      key,
      buffer: validated.buffer,
      contentType: validated.mimeType,
    });

    // 8. Trả về thông tin tham chiếu bền vững
    // URL là proxy route nội bộ đã được xác thực phía server, bảo vệ quyền riêng tư
    const accessUrl = `/api/trips/${tripId}/receipts/${fileId}`;

    return apiSuccess(
      {
        key,
        fileId,
        url: accessUrl,
        size: validated.size,
        mimeType: validated.mimeType,
      },
      {
        status: 201,
        message: "Tải lên ảnh hóa đơn thành công.",
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
