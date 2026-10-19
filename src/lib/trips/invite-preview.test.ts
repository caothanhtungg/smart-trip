import { describe, it, expect } from "vitest";
import { lookupInvitePreview } from "./invite-preview";

describe("lookupInvitePreview - Rule R19 Privacy and Validation", () => {
  it("trả về trạng thái VALID và previewData đã được chuẩn hóa với mã mời hợp lệ", () => {
    const result = lookupInvitePreview("DL3N2D-TRIP99");

    expect(result.status).toBe("VALID");
    expect(result.previewData).toBeDefined();
    expect(result.previewData?.name).toBe("Đà Lạt 3N2Đ");
    expect(result.previewData?.destination).toBe("Đà Lạt, Lâm Đồng");
    expect(result.previewData?.hostName).toBe("Lan Nguyễn");
    expect(result.previewData?.memberCount).toBeGreaterThanOrEqual(4);
    expect(result.claimablePlaceholders.length).toBeGreaterThanOrEqual(1);

    // Thành viên chưa có tài khoản trong chuyến mẫu Đà Lạt là Thu Hà
    const thuHa = result.claimablePlaceholders.find((p) => p.name === "Thu Hà");
    expect(thuHa).toBeDefined();
  });

  it("chuẩn hóa mã mời chữ thường và khoảng trắng", () => {
    const result = lookupInvitePreview("  dl3n2d-trip99  ");

    expect(result.status).toBe("VALID");
    expect(result.previewData?.id).toBe("trip-dalat-3n2d");
  });

  it("tuân thủ nghiêm ngặt Rule R19: tuyệt đối không chứa chi tiêu, công nợ, số dư hay số tài khoản ngân hàng trong previewData", () => {
    const result = lookupInvitePreview("DL3N2D-TRIP99");
    expect(result.status).toBe("VALID");

    const preview = result.previewData as unknown as Record<string, unknown>;

    // Kiểm tra không có các trường nhạy cảm tài chính
    expect(preview.expenses).toBeUndefined();
    expect(preview.shares).toBeUndefined();
    expect(preview.transfers).toBeUndefined();
    expect(preview.settlement).toBeUndefined();
    expect(preview.bankAccountNo).toBeUndefined();
    expect(preview.bankBin).toBeUndefined();
    expect(preview.bankAccountName).toBeUndefined();
    expect(preview.budgetTarget).toBeUndefined();
    expect(preview.totalSpent).toBeUndefined();
    expect(preview.netBalance).toBeUndefined();

    // Kiểm tra danh sách members trong preview cũng chỉ có id, name, avatarUrl, role
    if (result.previewData?.members) {
      for (const m of result.previewData.members) {
        const memberRecord = m as Record<string, unknown>;
        expect(memberRecord.bankAccountNo).toBeUndefined();
        expect(memberRecord.netBalance).toBeUndefined();
        expect(memberRecord.spentAmount).toBeUndefined();
      }
    }
  });

  it("trả về INVALID_CODE với mã mời sai định dạng", () => {
    const result = lookupInvitePreview("ABC");

    expect(result.status).toBe("INVALID_CODE");
    expect(result.previewData).toBeUndefined();
    expect(result.errorMessage).toBeDefined();
  });

  it("trả về NOT_FOUND với mã mời hợp lệ về cú pháp nhưng không tồn tại trong hệ thống", () => {
    const result = lookupInvitePreview("NOTFOUND-1234");

    expect(result.status).toBe("NOT_FOUND");
    expect(result.previewData).toBeUndefined();
    expect(result.errorMessage).toContain("Không tìm thấy chuyến đi");
  });
});
