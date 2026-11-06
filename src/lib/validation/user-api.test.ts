import { describe, it, expect } from "vitest";
import { UpdateCurrentUserProfileSchema } from "./user-api";

describe("UpdateCurrentUserProfileSchema", () => {
  it("accepts valid partial displayName update", () => {
    const input = { displayName: "Phương Lan" };
    const result = UpdateCurrentUserProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Phương Lan");
    }
  });

  it("accepts valid avatarUrl string or null to remove avatar", () => {
    const inputWithAvatar = { avatarUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" };
    const res1 = UpdateCurrentUserProfileSchema.safeParse(inputWithAvatar);
    expect(res1.success).toBe(true);
    if (res1.success) {
      expect(res1.data.avatarUrl).toBe("data:image/jpeg;base64,/9j/4AAQSkZJRg==");
    }

    const inputNullAvatar = { avatarUrl: null };
    const res2 = UpdateCurrentUserProfileSchema.safeParse(inputNullAvatar);
    expect(res2.success).toBe(true);
    if (res2.success) {
      expect(res2.data.avatarUrl).toBeNull();
    }
  });

  it("accepts valid full bank update and normalizes bankAccountName", () => {
    const input = {
      bankBin: "970436",
      bankAccountNo: "1234567890",
      bankAccountName: "Nguyễn Phương Lan",
    };
    const result = UpdateCurrentUserProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bankAccountName).toBe("NGUYEN PHUONG LAN");
      expect(result.data.bankBin).toBe("970436");
      expect(result.data.bankAccountNo).toBe("1234567890");
    }
  });

  it("accepts clearing bank info when all bank fields are null", () => {
    const input = {
      bankBin: null,
      bankAccountNo: null,
      bankAccountName: null,
    };
    const result = UpdateCurrentUserProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bankBin).toBeNull();
      expect(result.data.bankAccountNo).toBeNull();
      expect(result.data.bankAccountName).toBeNull();
    }
  });

  it("rejects empty payload {}", () => {
    const result = UpdateCurrentUserProfileSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("ít nhất một trường");
    }
  });

  it("rejects unknown fields like userId or role (strict security)", () => {
    const input = {
      displayName: "Lan",
      userId: "some-arbitrary-uuid",
    };
    const result = UpdateCurrentUserProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("không được phép");
    }
  });

  it("rejects incomplete bank fields when one or two are missing", () => {
    const input1 = {
      displayName: "Lan",
      bankBin: "970436",
      // missing bankAccountNo, bankAccountName
    };
    const result1 = UpdateCurrentUserProfileSchema.safeParse(input1);
    expect(result1.success).toBe(false);

    const input2 = {
      bankBin: "970436",
      bankAccountNo: "1234567890",
      bankAccountName: null, // mixed null and string
    };
    const result2 = UpdateCurrentUserProfileSchema.safeParse(input2);
    expect(result2.success).toBe(false);
  });

  it("rejects invalid bankBin not in POPULAR_BANKS", () => {
    const input = {
      bankBin: "999999",
      bankAccountNo: "1234567890",
      bankAccountName: "NGUYEN VAN A",
    };
    const result = UpdateCurrentUserProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid bankAccountNo with spaces or special characters", () => {
    const input = {
      bankBin: "970436",
      bankAccountNo: "1234 5678 90",
      bankAccountName: "NGUYEN VAN A",
    };
    const result = UpdateCurrentUserProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
