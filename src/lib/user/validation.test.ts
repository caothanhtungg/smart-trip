import { describe, it, expect } from "vitest";
import {
  normalizeAccountHolderName,
  validateProfileForm,
  validateBankForm,
} from "./validation";

describe("normalizeAccountHolderName (Rule R9)", () => {
  it("converts lowercase accented names to uppercase unaccented", () => {
    expect(normalizeAccountHolderName("Nguyễn Phương Lan")).toBe("NGUYEN PHUONG LAN");
    expect(normalizeAccountHolderName("trần tuấn huy")).toBe("TRAN TUAN HUY");
    expect(normalizeAccountHolderName("Lê Quang Minh")).toBe("LE QUANG MINH");
  });

  it("handles Vietnamese letter 'đ' and 'Đ' correctly", () => {
    expect(normalizeAccountHolderName("Đặng Thị Đoan")).toBe("DANG THI DOAN");
    expect(normalizeAccountHolderName("đoàn văn hậu")).toBe("DOAN VAN HAU");
  });

  it("removes special characters and collapses excess whitespace", () => {
    expect(normalizeAccountHolderName("  Nguyễn   Văn -- A  ")).toBe("NGUYEN VAN A");
    expect(normalizeAccountHolderName("Lê @Hà!#")).toBe("LE HA");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeAccountHolderName("")).toBe("");
    expect(normalizeAccountHolderName("   ")).toBe("");
  });
});

describe("validateProfileForm", () => {
  const validData = {
    fullName: "Nguyễn Phương Lan",
    displayName: "Lan",
    phoneNumber: "0912345678",
  };

  it("passes for valid profile data", () => {
    const res = validateProfileForm(validData);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it("passes without optional phone number", () => {
    const res = validateProfileForm({
      fullName: "Nguyễn Phương Lan",
      displayName: "Lan",
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it("fails when full name is empty or whitespace only", () => {
    const res = validateProfileForm({ ...validData, fullName: "   " });
    expect(res.isValid).toBe(false);
    expect(res.errors.fullName).toBeDefined();
  });

  it("fails when full name is less than 2 characters", () => {
    const res = validateProfileForm({ ...validData, fullName: "A" });
    expect(res.isValid).toBe(false);
    expect(res.errors.fullName).toContain("2 ký tự");
  });

  it("fails when full name exceeds 100 characters", () => {
    const longName = "A".repeat(101);
    const res = validateProfileForm({ ...validData, fullName: longName });
    expect(res.isValid).toBe(false);
    expect(res.errors.fullName).toBeDefined();
  });

  it("fails when display name is empty", () => {
    const res = validateProfileForm({ ...validData, displayName: "" });
    expect(res.isValid).toBe(false);
    expect(res.errors.displayName).toBeDefined();
  });

  it("fails when display name is less than 2 characters", () => {
    const res = validateProfileForm({ ...validData, displayName: "L" });
    expect(res.isValid).toBe(false);
    expect(res.errors.displayName).toBeDefined();
  });

  it("validates Vietnamese phone numbers correctly", () => {
    // Valid cases (with spaces/dots should be accepted after cleaning)
    expect(validateProfileForm({ ...validData, phoneNumber: "0912 345 678" }).isValid).toBe(true);
    expect(validateProfileForm({ ...validData, phoneNumber: "038.123.4567" }).isValid).toBe(true);
    expect(validateProfileForm({ ...validData, phoneNumber: "0771234567" }).isValid).toBe(true);

    // Invalid cases
    expect(validateProfileForm({ ...validData, phoneNumber: "1234567890" }).isValid).toBe(false);
    expect(validateProfileForm({ ...validData, phoneNumber: "091234567" }).isValid).toBe(false);
    expect(validateProfileForm({ ...validData, phoneNumber: "09123456789" }).isValid).toBe(false);
    expect(validateProfileForm({ ...validData, phoneNumber: "0912abc678" }).isValid).toBe(false);
  });
});

describe("validateBankForm", () => {
  const validBank = {
    bankBin: "970436", // Vietcombank
    bankName: "Vietcombank",
    accountNumber: "0071001234567",
    accountHolder: "NGUYEN PHUONG LAN",
    branch: "Chi nhánh Ba Đình",
  };

  it("passes for valid bank data", () => {
    const res = validateBankForm(validBank);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it("fails when bankBin is invalid or empty", () => {
    const res1 = validateBankForm({ ...validBank, bankBin: "" });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.bankBin).toBeDefined();

    const res2 = validateBankForm({ ...validBank, bankBin: "999999" });
    expect(res2.isValid).toBe(false);
    expect(res2.errors.bankBin).toBeDefined();
  });

  it("fails when account number is empty, too short, or has invalid characters", () => {
    expect(validateBankForm({ ...validBank, accountNumber: "" }).isValid).toBe(false);
    expect(validateBankForm({ ...validBank, accountNumber: "12345" }).isValid).toBe(false);
    expect(validateBankForm({ ...validBank, accountNumber: "123 456 789" }).isValid).toBe(false);
    expect(validateBankForm({ ...validBank, accountNumber: "12345-6789" }).isValid).toBe(false);
  });

  it("fails when account holder is empty or too short", () => {
    expect(validateBankForm({ ...validBank, accountHolder: "" }).isValid).toBe(false);
    expect(validateBankForm({ ...validBank, accountHolder: "A" }).isValid).toBe(false);
  });

  it("fails when branch name exceeds 100 characters", () => {
    const longBranch = "B".repeat(101);
    expect(validateBankForm({ ...validBank, branch: longBranch }).isValid).toBe(false);
  });
});
