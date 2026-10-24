import { describe, it, expect } from "vitest";
import {
  parseInvitePreviewResponse,
  buildLoginRedirectUrl,
  type ApiInvitePreviewData,
} from "./trip-join-view";
import {
  handleJoinApiResponse,
  validateClaimChoice,
} from "./trip-claim-identity-modal";

describe("Trip Join Flow & UI Integration (Phase 3.2C-1B)", () => {
  const sampleTripId = "c8b872ef-507c-4861-a548-df2914102928";
  const sampleInviteCode = "DL3N2D-TRIP99";

  // 1. Preview thành công
  it("1. Preview thành công: chuẩn hóa đúng cấu trúc dữ liệu xem trước khi API trả về 200 OK", () => {
    const rawApiPayload = {
      success: true,
      data: {
        id: sampleTripId,
        name: "Đà Lạt 3N2Đ",
        destination: "Đà Lạt, Lâm Đồng",
        startDate: "2026-11-20T00:00:00.000Z",
        endDate: "2026-11-22T00:00:00.000Z",
        durationText: "3 ngày 2 đêm",
        hostName: "Lan Nguyễn",
        hostAvatarUrl: "https://example.com/lan.jpg",
        members: [
          {
            id: "m1",
            displayName: "Lan Nguyễn",
            avatarUrl: "https://example.com/lan.jpg",
            role: "HOST",
          },
          {
            id: "m2",
            displayName: "Bình An",
            avatarUrl: null,
            role: "MEMBER",
          },
        ],
        memberCount: 2,
        status: "ACTIVE",
        inviteCode: sampleInviteCode,
        isJoinable: true,
        claimablePlaceholders: [
          {
            id: "m3",
            displayName: "Thu Hà",
          },
        ],
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 200 },
      rawApiPayload,
      sampleInviteCode
    );

    expect(parsed.status).toBe("VALID");
    expect(parsed.isJoinable).toBe(true);
    expect(parsed.errorMessage).toBeNull();
    expect(parsed.previewData).toBeDefined();

    const data = parsed.previewData as ApiInvitePreviewData;
    expect(data.id).toBe(sampleTripId);
    expect(data.name).toBe("Đà Lạt 3N2Đ");
    expect(data.hostName).toBe("Lan Nguyễn");
    expect(data.members).toHaveLength(2);
    expect(data.members[0].displayName).toBe("Lan Nguyễn");
    expect(data.members[0].name).toBe("Lan Nguyễn");
    expect(data.claimablePlaceholders).toHaveLength(1);
    expect(data.claimablePlaceholders[0].displayName).toBe("Thu Hà");
  });

  // 2. Loading và lỗi mạng
  it("2. Lỗi mạng / 500: xử lý an toàn khi API trả về 500 hoặc payload lỗi không hợp lệ", () => {
    const serverErrorPayload = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 500 },
      serverErrorPayload,
      sampleInviteCode
    );

    expect(parsed.status).toBe("SERVER_ERROR");
    expect(parsed.previewData).toBeNull();
    expect(parsed.isJoinable).toBe(false);
    expect(parsed.errorMessage).toContain("Đã có lỗi hệ thống");
  });

  // 3. Mã sai hoặc không tồn tại (400, 404)
  it("3. Mã sai hoặc không tồn tại: phân loại đúng INVALID_CODE (400) và NOT_FOUND (404)", () => {
    // 400 Bad Request
    const badRequestPayload = {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Mã mời chuyến đi không đúng định dạng.",
      },
    };
    const parsed400 = parseInvitePreviewResponse(
      { status: 400 },
      badRequestPayload,
      "INVALID!"
    );
    expect(parsed400.status).toBe("INVALID_CODE");
    expect(parsed400.previewData).toBeNull();
    expect(parsed400.errorMessage).toBe("Mã mời chuyến đi không đúng định dạng.");

    // 404 Not Found
    const notFoundPayload = {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Mã mời không tồn tại hoặc đã bị thu hồi.",
      },
    };
    const parsed404 = parseInvitePreviewResponse(
      { status: 404 },
      notFoundPayload,
      "NOTFND-999999"
    );
    expect(parsed404.status).toBe("NOT_FOUND");
    expect(parsed404.previewData).toBeNull();
    expect(parsed404.errorMessage).toBe("Mã mời không tồn tại hoặc đã bị thu hồi.");
  });

  // 4. Trip ARCHIVED (410)
  it("4. Trip ARCHIVED: xử lý HTTP 410 GONE và chuyển trạng thái ARCHIVED", () => {
    const gonePayload = {
      success: false,
      error: {
        code: "GONE",
        message: "Chuyến đi này đã được lưu trữ hoặc đóng tham gia.",
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 410 },
      gonePayload,
      sampleInviteCode
    );

    expect(parsed.status).toBe("ARCHIVED");
    expect(parsed.previewData).toBeNull();
    expect(parsed.isJoinable).toBe(false);
    expect(parsed.errorMessage).toContain("đã được lưu trữ hoặc đóng tham gia");
  });

  // 5. Trip SETTLING / COMPLETED không cho tham gia
  it("5. Trip SETTLING/COMPLETED: hiển thị xem trước nhưng đánh dấu isJoinable = false", () => {
    // Chuyến đi SETTLING
    const settlingPayload = {
      success: true,
      data: {
        id: sampleTripId,
        name: "Hà Giang Chốt Sổ",
        startDate: "2026-10-01T00:00:00.000Z",
        endDate: "2026-10-04T00:00:00.000Z",
        durationText: "4 ngày",
        hostName: "Minh",
        members: [],
        memberCount: 3,
        status: "SETTLING",
        inviteCode: sampleInviteCode,
        isJoinable: false,
        claimablePlaceholders: [],
      },
    };

    const parsedSettling = parseInvitePreviewResponse(
      { status: 200 },
      settlingPayload,
      sampleInviteCode
    );
    expect(parsedSettling.status).toBe("VALID");
    expect(parsedSettling.isJoinable).toBe(false);
    expect(parsedSettling.previewData?.status).toBe("SETTLING");

    // Chuyến đi COMPLETED
    const completedPayload = {
      success: true,
      data: {
        ...settlingPayload.data,
        name: "Phú Quốc Hoàn Tất",
        status: "COMPLETED",
        isJoinable: false,
      },
    };

    const parsedCompleted = parseInvitePreviewResponse(
      { status: 200 },
      completedPayload,
      sampleInviteCode
    );
    expect(parsedCompleted.status).toBe("VALID");
    expect(parsedCompleted.isJoinable).toBe(false);
    expect(parsedCompleted.previewData?.status).toBe("COMPLETED");
  });

  // 6. Rate limit (429)
  it("6. Rate limit (429): nhận diện RATE_LIMITED và giữ thông báo giới hạn tra cứu thân thiện", () => {
    const rateLimitPayload = {
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message:
          "Bạn đã vượt quá giới hạn tra cứu mã mời (tối đa 10 lần/phút). Vui lòng thử lại sau.",
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 429 },
      rateLimitPayload,
      sampleInviteCode
    );

    expect(parsed.status).toBe("RATE_LIMITED");
    expect(parsed.previewData).toBeNull();
    expect(parsed.isJoinable).toBe(false);
    expect(parsed.errorMessage).toContain("tối đa 10 lần/phút");
  });

  // 7. Người chưa đăng nhập được chuyển đến login với callback đúng
  it("7. Điều hướng đăng nhập: tạo đúng URL /login kèm callbackUrl an toàn", () => {
    const loginUrl = buildLoginRedirectUrl("dl3n2d-trip99");
    expect(loginUrl).toBe("/login?callbackUrl=%2Fjoin%2FDL3N2D-TRIP99");
  });

  // 8. Tham gia mới (201 Created)
  it("8. Tham gia mới (201): phân loại đúng SUCCESS_NEW và trả về tripId để điều hướng", () => {
    const joinResponse = {
      success: true,
      data: {
        memberId: "mem-new-123",
        tripId: sampleTripId,
        displayName: "Người Dùng Mới",
        role: "MEMBER",
        status: "ACTIVE",
        isRejoined: false,
      },
      message: "Tham gia chuyến đi thành công!",
    };

    const result = handleJoinApiResponse(
      { status: 201 },
      joinResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result.type).toBe("SUCCESS_NEW");
    if (result.type === "SUCCESS_NEW") {
      expect(result.tripId).toBe(sampleTripId);
      expect(result.message).toBe("Tham gia chuyến đi thành công!");
    }
  });

  // 9. Tham gia lại (200 OK, isRejoined = true)
  it("9. Tái gia nhập (200): phân loại đúng SUCCESS_REJOIN và trả về thông điệp chào mừng", () => {
    const rejoinResponse = {
      success: true,
      data: {
        memberId: "mem-old-456",
        tripId: sampleTripId,
        displayName: "Người Cũ Trở Lại",
        role: "MEMBER",
        status: "ACTIVE",
        isRejoined: true,
      },
      message: "Chào mừng bạn quay trở lại chuyến đi!",
    };

    const result = handleJoinApiResponse(
      { status: 200 },
      rejoinResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result.type).toBe("SUCCESS_REJOIN");
    if (result.type === "SUCCESS_REJOIN") {
      expect(result.tripId).toBe(sampleTripId);
      expect(result.message).toBe("Chào mừng bạn quay trở lại chuyến đi!");
    }
  });

  // 10. Đã là thành viên (409 Conflict với code ALREADY_MEMBER)
  it("10. Đã là thành viên (409 với code ALREADY_MEMBER): nhận diện ALREADY_MEMBER và dùng previewTripId để điều hướng", () => {
    const alreadyMemberResponse = {
      success: false,
      error: {
        code: "ALREADY_MEMBER",
        message: "Bạn đã là thành viên của chuyến đi này.",
      },
    };

    const result = handleJoinApiResponse(
      { status: 409 },
      alreadyMemberResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result.type).toBe("ALREADY_MEMBER");
    if (result.type === "ALREADY_MEMBER") {
      expect(result.tripId).toBe(sampleTripId);
      expect(result.message).toBe("Bạn đã là thành viên của chuyến đi này.");
    }
  });

  it("10b. 409 do trùng tên: trả về ERROR, hiển thị lỗi, KHÔNG phân loại ALREADY_MEMBER và không điều hướng", () => {
    const duplicateNameResponse = {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Tên hiển thị này đã được sử dụng trong chuyến đi. Vui lòng thử lại.",
      },
    };

    const result = handleJoinApiResponse(
      { status: 409 },
      duplicateNameResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result.type).toBe("ERROR");
    expect(result.type).not.toBe("ALREADY_MEMBER");
    if (result.type === "ERROR") {
      expect(result.message).toContain("Tên hiển thị này đã được sử dụng");
    }
  });

  it("10c. 409 do xung đột joinOrder: trả về ERROR, hiển thị lỗi, KHÔNG phân loại ALREADY_MEMBER và không điều hướng", () => {
    const joinOrderConflictResponse = {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Không thể tham gia do xung đột thứ tự tham gia. Vui lòng thử lại.",
      },
    };

    const result = handleJoinApiResponse(
      { status: 409 },
      joinOrderConflictResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result.type).toBe("ERROR");
    expect(result.type).not.toBe("ALREADY_MEMBER");
    if (result.type === "ERROR") {
      expect(result.message).toContain("xung đột thứ tự tham gia");
    }
  });

  it("10d. Lỗi 409 không có mã ALREADY_MEMBER: không phân loại thành đã là thành viên dù message giống", () => {
    const missingCodeResponse = {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Bạn đã là thành viên của chuyến đi này.",
      },
    };

    const result = handleJoinApiResponse(
      { status: 409 },
      missingCodeResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result.type).toBe("ERROR");
    expect(result.type).not.toBe("ALREADY_MEMBER");
  });

  // 11. API join trả lỗi không khiến UI hiển thị thành công giả
  it("11. Lỗi API join (400, 500): phân loại đúng ERROR và bảo toàn thông báo lỗi để cho phép thử lại", () => {
    // 400 Lỗi nghiệp vụ
    const badRequestResponse = {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Chỉ có thể tham gia khi chuyến đi đang ở trạng thái lên kế hoạch.",
      },
    };

    const result400 = handleJoinApiResponse(
      { status: 400 },
      badRequestResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result400.type).toBe("ERROR");
    if (result400.type === "ERROR") {
      expect(result400.message).toContain("Chỉ có thể tham gia");
    }

    // 401 Hết phiên
    const unauthResponse = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Yêu cầu đăng nhập để thực hiện thao tác này.",
      },
    };

    const result401 = handleJoinApiResponse(
      { status: 401 },
      unauthResponse,
      sampleTripId,
      sampleInviteCode
    );

    expect(result401.type).toBe("UNAUTHORIZED");
    if (result401.type === "UNAUTHORIZED") {
      expect(result401.redirectUrl).toBe("/login?callbackUrl=%2Fjoin%2FDL3N2D-TRIP99");
    }
  });

  // 12. Placeholder chưa thể claim và không phát sinh request giả
  it("12. Placeholder validation: chặn gửi request khi chọn placeholder và hiển thị giải thích", () => {
    // Chọn thành viên ảo chưa có tài khoản
    const placeholderValidation = validateClaimChoice("placeholder-1", "Thu Hà");
    expect(placeholderValidation.canProceed).toBe(false);
    expect(placeholderValidation.errorMessage).toContain(
      "Tính năng liên kết với vị trí « Thu Hà » chưa khả dụng ở giai đoạn này"
    );
    expect(placeholderValidation.errorMessage).toContain("Tôi là người mới");

    // Chọn "Tôi là người mới"
    const newMemberValidation = validateClaimChoice("new_member");
    expect(newMemberValidation.canProceed).toBe(true);
    expect(newMemberValidation.errorMessage).toBeUndefined();
  });

  // 13. Response UI không hiển thị dữ liệu nhạy cảm ngoài phạm vi cho phép (Rule R19)
  it("13. Tuân thủ Rule R19: Tuyệt đối không để lộ dữ liệu nhạy cảm trong dữ liệu preview được parse", () => {
    // Giả định backend hoặc payload chứa các trường tài chính ngoài ý muốn
    const payloadWithPotentialLeaks = {
      success: true,
      data: {
        id: sampleTripId,
        name: "Đà Lạt R19 Check",
        startDate: "2026-11-20T00:00:00.000Z",
        endDate: "2026-11-22T00:00:00.000Z",
        durationText: "3 ngày",
        hostName: "Lan Nguyễn",
        members: [
          {
            id: "m1",
            displayName: "Lan Nguyễn",
            role: "HOST",
            bankAccountNo: "1234567890", // Rò rỉ STK
            netBalance: 500000,          // Rò rỉ số dư
            spentAmount: 1200000,        // Rò rỉ chi tiêu
          },
        ],
        expenses: [{ id: "exp1", amount: 500000 }], // Rò rỉ danh sách chi
        shares: [{ id: "sh1", amount: 250000 }],     // Rò rỉ phần chia
        transfers: [{ id: "tr1", amount: 250000 }],  // Rò rỉ chuyển khoản
        budgetTarget: 5000000,                       // Rò rỉ ngân sách
        totalSpent: 3000000,                         // Rò rỉ tổng chi
        status: "ACTIVE",
        inviteCode: sampleInviteCode,
        isJoinable: true,
        claimablePlaceholders: [],
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 200 },
      payloadWithPotentialLeaks,
      sampleInviteCode
    );

    expect(parsed.status).toBe("VALID");
    const preview = parsed.previewData as unknown as Record<string, unknown>;

    // Khẳng định các trường tài chính không hề xuất hiện trên đối tượng previewData
    expect(preview.expenses).toBeUndefined();
    expect(preview.shares).toBeUndefined();
    expect(preview.transfers).toBeUndefined();
    expect(preview.budgetTarget).toBeUndefined();
    expect(preview.totalSpent).toBeUndefined();
    expect(preview.netBalance).toBeUndefined();

    // Khẳng định trong members cũng không có thông tin tài chính
    const firstMember = (preview.members as Record<string, unknown>[])[0];
    expect(firstMember.bankAccountNo).toBeUndefined();
    expect(firstMember.netBalance).toBeUndefined();
    expect(firstMember.spentAmount).toBeUndefined();
  });
});
