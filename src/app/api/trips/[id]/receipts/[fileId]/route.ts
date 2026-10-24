import {
  handleApiError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import {
  getReceiptStorageProvider,
  RECEIPT_STORAGE_BUCKET,
} from "@/lib/storage/receipts";

interface RouteContext {
  params:
    | Promise<{ id: string; fileId: string }>
    | { id: string; fileId: string };
}

const COMMON_IMAGE_EXTENSIONS = [".jpg", ".png", ".webp", ".jpeg"];

/**
 * GET /api/trips/[id]/receipts/[fileId]
 * Truy cập xem/tải ảnh hóa đơn an toàn (UC32).
 *
 * PHÂN QUYỀN & BẢO MẬT:
 * 1. Bắt buộc phiên đăng nhập hợp lệ (401).
 * 2. Phải là thành viên của chuyến đi (ACTIVE hoặc LEFT - để đối soát chi phí quá khứ).
 * 3. Người ngoài hoặc không đăng nhập tuyệt đối bị từ chối (401 / 403).
 * 4. Không dùng bucket public; luồng truy cập qua proxy có xác thực kiểm soát quyền chặt chẽ.
 * 5. Thiết lập Cache-Control private để trình duyệt cache an toàn theo người dùng.
 */
export async function GET(
  _req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;
    const fileId = params.fileId;

    if (!tripId || !isValidUuid(tripId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi.");
    }

    if (!fileId || !isValidUuid(fileId)) {
      throw new NotFoundError("Mã ảnh hóa đơn không hợp lệ.");
    }

    // 1. Phân quyền: Kiểm tra tư cách thành viên chuyến đi
    await requireTripMembership(tripId, { allowLeftMember: true });

    // 2. Kiểm tra cấu hình storage provider
    const provider = getReceiptStorageProvider();
    if (!provider.isConfigured()) {
      throw new ServiceUnavailableError(
        "Dịch vụ lưu trữ hóa đơn chưa được cấu hình trên hệ thống.",
        "STORAGE_NOT_CONFIGURED"
      );
    }

    // 3. Tìm tập tin trong bucket
    let foundFile: { buffer: Buffer; contentType: string } | null = null;
    for (const ext of COMMON_IMAGE_EXTENSIONS) {
      const key = `receipts/${tripId}/${fileId}${ext}`;
      const downloaded = await provider.download({
        bucket: RECEIPT_STORAGE_BUCKET,
        key,
      });
      if (downloaded) {
        foundFile = downloaded;
        break;
      }
    }

    if (!foundFile) {
      throw new NotFoundError("Không tìm thấy ảnh hóa đơn.");
    }

    // 4. Trả về stream ảnh nhị phân với header an toàn
    return new Response(new Uint8Array(foundFile.buffer), {
      status: 200,
      headers: {
        "Content-Type": foundFile.contentType,
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
