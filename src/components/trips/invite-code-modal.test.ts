import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateInviteCode } from "@/lib/trips/invite-code";
import {
  parseInvitePreviewResponse,
  buildLoginRedirectUrl,
  type ApiInvitePreviewData,
} from "./invite/trip-join-view";
import { handleJoinApiResponse } from "./invite/trip-claim-identity-modal";

describe("InviteCodeModal & Backend Lookup Flow (Phase 3ZU-JOIN)", () => {
  const sampleTripId = "trip-sapa-123456";
  const validInviteCode = "KGDSPB-CY9U2A";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Mã đúng định dạng và tồn tại
  it("1. Mã đúng định dạng và tồn tại: chuẩn hóa mã, gọi API tra cứu thành công và trích xuất preview tối thiểu", () => {
    // Chuẩn hóa input có khoảng trắng thừa và chữ thường
    const rawInput = "  kgdspb-cy9u2a  ";
    const validation = validateInviteCode(rawInput);

    expect(validation.isValid).toBe(true);
    expect(validation.normalizedCode).toBe("KGDSPB-CY9U2A");

    // Giả lập response từ GET /api/invites/KGDSPB-CY9U2A
    const apiResponse = {
      success: true,
      data: {
        id: sampleTripId,
        name: "sapa",
        destination: "Sa Pa, Lào Cai",
        startDate: "2026-10-25T00:00:00.000Z",
        endDate: "2026-10-28T00:00:00.000Z",
        durationText: "4 ngày 3 đêm",
        hostName: "Cao Thanh Tùng",
        hostAvatarUrl: "https://example.com/tung.jpg",
        members: [
          {
            id: "m1",
            displayName: "Cao Thanh Tùng",
            role: "HOST",
          },
        ],
        memberCount: 1,
        status: "ACTIVE",
        inviteCode: "KGDSPB-CY9U2A",
        isJoinable: true,
        claimablePlaceholders: [],
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 200 },
      apiResponse,
      validation.normalizedCode!
    );

    expect(parsed.status).toBe("VALID");
    expect(parsed.isJoinable).toBe(true);
    expect(parsed.errorMessage).toBeNull();
    expect(parsed.previewData).toBeDefined();

    const preview = parsed.previewData as ApiInvitePreviewData;
    expect(preview.id).toBe(sampleTripId);
    expect(preview.name).toBe("sapa");
    expect(preview.destination).toBe("Sa Pa, Lào Cai");
    expect(preview.hostName).toBe("Cao Thanh Tùng");
    expect(preview.memberCount).toBe(1);
    expect(preview.inviteCode).toBe("KGDSPB-CY9U2A");
  });

  // 2. Mã đúng định dạng nhưng không tồn tại
  it("2. Mã đúng định dạng nhưng không tồn tại: trả về 404 NOT_FOUND, hiển thị thông báo lỗi phù hợp và không có preview", () => {
    const nonExistentCode = "KGDSPB-CY9U99";
    const validation = validateInviteCode(nonExistentCode);
    expect(validation.isValid).toBe(true);

    const notFoundResponse = {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Mã mời không tồn tại hoặc đã bị thu hồi.",
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 404 },
      notFoundResponse,
      nonExistentCode
    );

    expect(parsed.status).toBe("NOT_FOUND");
    expect(parsed.previewData).toBeNull();
    expect(parsed.isJoinable).toBe(false);
    expect(parsed.errorMessage).toBe("Mã mời không tồn tại hoặc đã bị thu hồi.");
  });

  // 3. Mã sai định dạng
  it("3. Mã sai định dạng: kiểm tra client-side chặn ngay trên form trước khi gọi backend API", () => {
    // Mã quá ngắn
    const shortCode = "ABC";
    const resShort = validateInviteCode(shortCode);
    expect(resShort.isValid).toBe(false);
    expect(resShort.error).toBeDefined();

    // Mã chứa ký tự đặc biệt không hợp lệ
    const specialChars = "KGDSPB@CY9U2A";
    const resSpecial = validateInviteCode(specialChars);
    expect(resSpecial.isValid).toBe(false);
    expect(resSpecial.error).toBeDefined();

    // Mã chứa quá nhiều dấu gạch nối
    const multiHyphen = "KG-DSPB-CY9U";
    const resHyphen = validateInviteCode(multiHyphen);
    expect(resHyphen.isValid).toBe(false);
    expect(resHyphen.error).toBeDefined();

    // Mã quá dài
    const tooLong = "KGDSPB-CY9U2A-EXTRA";
    const resTooLong = validateInviteCode(tooLong);
    expect(resTooLong.isValid).toBe(false);
    expect(resTooLong.error).toBeDefined();
  });

  // 4. Mã đã bị rotate hoặc hết hiệu lực
  it("4. Mã đã bị rotate hoặc hết hiệu lực: mã cũ trả về 404 hoặc 410 GONE, không cho phép tham gia", () => {
    // Trường hợp Trưởng nhóm xoay mã (rotate): mã cũ bị thu hồi trong DB, trả về 404
    const rotatedOldCode = "OLD999-CY9U2A";
    const rotatedResponse = {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Mã mời « ${rotatedOldCode} » không tồn tại hoặc đã bị thu hồi.`,
      },
    };
    const parsedRotated = parseInvitePreviewResponse(
      { status: 404 },
      rotatedResponse,
      rotatedOldCode
    );
    expect(parsedRotated.status).toBe("NOT_FOUND");
    expect(parsedRotated.previewData).toBeNull();
    expect(parsedRotated.isJoinable).toBe(false);

    // Trường hợp chuyến đi bị lưu trữ (ARCHIVED): trả về 410 GONE
    const archivedResponse = {
      success: false,
      error: {
        code: "GONE",
        message: "Chuyến đi này đã được lưu trữ hoặc đóng tham gia.",
      },
    };
    const parsedArchived = parseInvitePreviewResponse(
      { status: 410 },
      archivedResponse,
      validInviteCode
    );
    expect(parsedArchived.status).toBe("ARCHIVED");
    expect(parsedArchived.previewData).toBeNull();
    expect(parsedArchived.isJoinable).toBe(false);
    expect(parsedArchived.errorMessage).toContain("đã được lưu trữ hoặc đóng tham gia");

    // Trường hợp chuyến đi đang SETTLING: trả về 200 nhưng isJoinable = false
    const settlingResponse = {
      success: true,
      data: {
        id: sampleTripId,
        name: "sapa chốt sổ",
        startDate: "2026-10-25T00:00:00.000Z",
        endDate: "2026-10-28T00:00:00.000Z",
        durationText: "4 ngày",
        hostName: "Cao Thanh Tùng",
        members: [],
        memberCount: 2,
        status: "SETTLING",
        inviteCode: validInviteCode,
        isJoinable: false,
        claimablePlaceholders: [],
      },
    };
    const parsedSettling = parseInvitePreviewResponse(
      { status: 200 },
      settlingResponse,
      validInviteCode
    );
    expect(parsedSettling.status).toBe("VALID");
    expect(parsedSettling.isJoinable).toBe(false);
  });

  // 5. Người chưa đăng nhập truy cập luồng tham gia
  it("5. Người chưa đăng nhập truy cập luồng tham gia: nhận 401 UNAUTHORIZED và chuyển hướng an toàn tới login có callbackUrl", () => {
    const unauthResponse = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Yêu cầu đăng nhập để tham gia chuyến đi.",
      },
    };

    const joinResult = handleJoinApiResponse(
      { status: 401 },
      unauthResponse,
      sampleTripId,
      validInviteCode
    );

    expect(joinResult.type).toBe("UNAUTHORIZED");
    if (joinResult.type === "UNAUTHORIZED") {
      expect(joinResult.redirectUrl).toBe(
        "/login?callbackUrl=%2Fjoin%2FKGDSPB-CY9U2A"
      );
      expect(joinResult.message).toContain("Yêu cầu đăng nhập");
    }

    // Kiểm tra hàm buildLoginRedirectUrl độc lập
    const redirectUrl = buildLoginRedirectUrl("kgdspb-cy9u2a");
    expect(redirectUrl).toBe("/login?callbackUrl=%2Fjoin%2FKGDSPB-CY9U2A");
  });

  // 6. Người dùng đã là thành viên
  it("6. Người dùng đã là thành viên: nhận diện HTTP 409 ALREADY_MEMBER, trả về tripId để điều hướng mà không tạo bản ghi mới", () => {
    const alreadyMemberResponse = {
      success: false,
      error: {
        code: "ALREADY_MEMBER",
        message: "Bạn đã là thành viên của chuyến đi này.",
      },
    };

    const joinResult = handleJoinApiResponse(
      { status: 409 },
      alreadyMemberResponse,
      sampleTripId,
      validInviteCode
    );

    expect(joinResult.type).toBe("ALREADY_MEMBER");
    if (joinResult.type === "ALREADY_MEMBER") {
      expect(joinResult.tripId).toBe(sampleTripId);
      expect(joinResult.message).toBe("Bạn đã là thành viên của chuyến đi này.");
    }
  });

  // 7. Tham gia thành công
  it("7. Tham gia thành công: phân loại chính xác SUCCESS_NEW (201) và SUCCESS_REJOIN (200), cung cấp tripId để điều hướng", () => {
    // Người mới hoàn toàn (201 Created)
    const newMemberResponse = {
      success: true,
      data: {
        memberId: "member-acc-2",
        tripId: sampleTripId,
        displayName: "Acc 2",
        role: "MEMBER",
        status: "ACTIVE",
        isRejoined: false,
      },
      message: "Tham gia chuyến đi thành công!",
    };

    const newResult = handleJoinApiResponse(
      { status: 201 },
      newMemberResponse,
      sampleTripId,
      validInviteCode
    );

    expect(newResult.type).toBe("SUCCESS_NEW");
    if (newResult.type === "SUCCESS_NEW") {
      expect(newResult.tripId).toBe(sampleTripId);
      expect(newResult.message).toBe("Tham gia chuyến đi thành công!");
    }

    // Người cũ từng rời nhóm nay quay lại (200 OK)
    const rejoinResponse = {
      success: true,
      data: {
        memberId: "member-acc-2",
        tripId: sampleTripId,
        displayName: "Acc 2",
        role: "MEMBER",
        status: "ACTIVE",
        isRejoined: true,
      },
      message: "Chào mừng bạn quay trở lại chuyến đi!",
    };

    const rejoinResult = handleJoinApiResponse(
      { status: 200 },
      rejoinResponse,
      sampleTripId,
      validInviteCode
    );

    expect(rejoinResult.type).toBe("SUCCESS_REJOIN");
    if (rejoinResult.type === "SUCCESS_REJOIN") {
      expect(rejoinResult.tripId).toBe(sampleTripId);
      expect(rejoinResult.message).toBe("Chào mừng bạn quay trở lại chuyến đi!");
    }
  });

  // 8. Người ngoài không thể đọc dữ liệu chuyến đi riêng tư (Rule R19)
  it("8. Tuân thủ Rule R19: Dữ liệu chi tiêu, lịch trình chi tiết, thông tin ngân hàng và số dư không bao giờ xuất hiện trong preview", () => {
    const payloadWithPrivateFields = {
      success: true,
      data: {
        id: sampleTripId,
        name: "sapa",
        destination: "Sa Pa",
        startDate: "2026-10-25T00:00:00.000Z",
        endDate: "2026-10-28T00:00:00.000Z",
        durationText: "4 ngày",
        hostName: "Cao Thanh Tùng",
        members: [
          {
            id: "m1",
            displayName: "Cao Thanh Tùng",
            role: "HOST",
            bankAccountNo: "999988887777",
            netBalance: 1500000,
          },
        ],
        memberCount: 1,
        status: "ACTIVE",
        inviteCode: validInviteCode,
        isJoinable: true,
        claimablePlaceholders: [],
        // Các trường riêng tư bị cấm lộ
        expenses: [{ id: "e1", description: "Khách sạn Sapa", amount: 2000000 }],
        settlements: [{ id: "s1", status: "PENDING" }],
        budgetTarget: 10000000,
        totalSpent: 4500000,
        transfers: [],
      },
    };

    const parsed = parseInvitePreviewResponse(
      { status: 200 },
      payloadWithPrivateFields,
      validInviteCode
    );

    expect(parsed.status).toBe("VALID");
    const preview = parsed.previewData as unknown as Record<string, unknown>;

    // Khẳng định các trường nhạy cảm không có trong previewData
    expect(preview.expenses).toBeUndefined();
    expect(preview.settlements).toBeUndefined();
    expect(preview.budgetTarget).toBeUndefined();
    expect(preview.totalSpent).toBeUndefined();
    expect(preview.transfers).toBeUndefined();

    // Khẳng định thông tin tài khoản thành viên bị loại bỏ
    const hostMember = (preview.members as Record<string, unknown>[])[0];
    expect(hostMember.bankAccountNo).toBeUndefined();
    expect(hostMember.netBalance).toBeUndefined();
  });

  // 9. Không tạo membership trùng lặp
  it("9. Không tạo membership trùng lặp: các lỗi 409 khác không phải ALREADY_MEMBER được phân loại thành ERROR để chặn tạo trùng", () => {
    const conflictResponse = {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Xung đột khi tạo thành viên. Vui lòng thử lại.",
      },
    };

    const joinResult = handleJoinApiResponse(
      { status: 409 },
      conflictResponse,
      sampleTripId,
      validInviteCode
    );

    expect(joinResult.type).toBe("ERROR");
    expect(joinResult.type).not.toBe("ALREADY_MEMBER");
    if (joinResult.type === "ERROR") {
      expect(joinResult.message).toContain("Xung đột khi tạo thành viên");
    }
  });

  // 10. API lỗi hoặc timeout không làm giao diện báo thành công giả
  it("10. API lỗi hoặc timeout không làm giao diện báo thành công giả: phân loại SERVER_ERROR và giữ người dùng ở form", () => {
    // Lỗi 500
    const error500 = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
      },
    };

    const parsed500 = parseInvitePreviewResponse(
      { status: 500 },
      error500,
      validInviteCode
    );

    expect(parsed500.status).toBe("SERVER_ERROR");
    expect(parsed500.previewData).toBeNull();
    expect(parsed500.isJoinable).toBe(false);
    expect(parsed500.errorMessage).toBe(
      "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
    );

    // Lỗi 504 Gateway Timeout
    const parsed504 = parseInvitePreviewResponse(
      { status: 504 },
      null,
      validInviteCode
    );

    expect(parsed504.status).toBe("SERVER_ERROR");
    expect(parsed504.previewData).toBeNull();
    expect(parsed504.isJoinable).toBe(false);
  });
});
