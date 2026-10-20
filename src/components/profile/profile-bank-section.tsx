"use client";

import * as React from "react";
import {
  Landmark,
  CheckCircle,
  Info,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
  Save,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";
import { useToast } from "@/components/ui/toast";
import { POPULAR_BANKS, findBankByBin } from "@/lib/mock/banks";
import { normalizeAccountHolderName } from "@/lib/user/validation";
import { BankValidationErrors } from "@/types/user";
import { ProfileVietQrCard } from "./profile-vietqr-card";

export function ProfileBankSection() {
  const { profile, updateBankInfo, removeBankInfo } = useUserProfile();
  const { toast } = useToast();

  const [formData, setFormData] = React.useState({
    bankBin: profile.bankInfo?.bankBin || "970407",
    accountNumber: profile.bankInfo?.accountNumber || "",
    accountHolder: profile.bankInfo?.accountHolder || normalizeAccountHolderName(profile.fullName),
  });

  const [errors, setErrors] = React.useState<BankValidationErrors>({});
  const [copied, setCopied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCopyAccount = () => {
    if (formData.accountNumber && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formData.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleHolderNameChange = (val: string) => {
    // Automatically uppercase and unaccent name
    const normalized = normalizeAccountHolderName(val);
    setFormData((p) => ({ ...p, accountHolder: normalized }));
    if (errors.accountHolder) setErrors((p) => ({ ...p, accountHolder: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const selectedBank = findBankByBin(formData.bankBin);
    const bankName = selectedBank ? selectedBank.shortName : "Ngân hàng";

    const res = await updateBankInfo({
      bankBin: formData.bankBin,
      bankName,
      accountNumber: formData.accountNumber,
      accountHolder: formData.accountHolder,
    });

    setIsSubmitting(false);

    if (res.success) {
      toast("Đã cập nhật thông tin ngân hàng VietQR thành công!", "success");
    } else if (res.errors) {
      setErrors(res.errors);
      toast("Vui lòng kiểm tra lại thông tin ngân hàng.", "error");
    }
  };

  const handleRemove = () => {
    removeBankInfo();
    setFormData({
      bankBin: "970407",
      accountNumber: "",
      accountHolder: normalizeAccountHolderName(profile.fullName),
    });
    setErrors({});
    toast("Đã gỡ bỏ thông tin tài khoản ngân hàng.", "info");
  };

  const currentPreviewBankInfo = React.useMemo(() => {
    if (!formData.accountNumber) return profile.bankInfo;
    const selectedBank = findBankByBin(formData.bankBin);
    return {
      bankBin: formData.bankBin,
      bankName: selectedBank ? selectedBank.shortName : "Ngân hàng",
      accountNumber: formData.accountNumber,
      accountHolder: formData.accountHolder || normalizeAccountHolderName(profile.fullName),
    };
  }, [formData, profile.fullName, profile.bankInfo]);

  return (
    <section
      className="bg-surface-card rounded-[20px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-6"
      id="tai-khoan-nhan-tien"
    >
      {/* Section Title with Default Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-divider-border">
        <div className="flex items-center gap-2">
          <Landmark className="w-6 h-6 text-cerulean" />
          <h2 className="text-xl sm:text-2xl font-bold text-yale-blue">
            Tài khoản nhận tiền
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-cream text-yale-blue font-semibold text-xs rounded-full self-start sm:self-auto shadow-xs">
          <CheckCircle className="w-3.5 h-3.5 text-functional-positive" />
          Mặc định nhận tiền chuyến đi
        </span>
      </div>

      {/* Helpful Disclaimer Alert Box */}
      <div className="bg-surface-container-low rounded-2xl p-4 flex items-start gap-3 border border-divider-border/80">
        <Info className="w-5 h-5 text-cerulean shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-yale-blue leading-relaxed">
          <strong className="font-semibold text-yale-blue">Bảo vệ riêng tư tài chính:</strong>{" "}
          Chỉ hiển thị cho người cần chuyển tiền cho bạn khi quyết toán chi phí chuyến đi. Smart
          Trip tự động tạo mã VietQR Napas 24/7 chính xác từng đồng để bạn nhận tiền mà
          không cần nhập số tài khoản thủ công. (Dữ liệu thử nghiệm minh họa).
        </div>
      </div>

      {/* Main Layout: Form + VietQR Card Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Bank Configuration Form (7 columns) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4">
          {/* Beneficiary Bank Select */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bankBin"
              className="text-xs font-semibold text-yale-blue flex items-center justify-between"
            >
              <span>Ngân hàng thụ hưởng</span>
              <span className="text-functional-negative text-xs">*</span>
            </label>
            <div className="relative">
              <select
                id="bankBin"
                value={formData.bankBin}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, bankBin: e.target.value }));
                  if (errors.bankBin) setErrors((p) => ({ ...p, bankBin: undefined }));
                }}
                className={`w-full h-11 px-3.5 rounded-xl bg-surface-card text-on-surface text-sm border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist cursor-pointer ${
                  errors.bankBin ? "border-functional-negative" : "border-divider-border"
                }`}
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.bin} value={b.bin}>
                    {b.shortName} ({b.code}) — {b.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.bankBin && (
              <span className="text-xs text-functional-negative font-medium">{errors.bankBin}</span>
            )}
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="accountNumber"
              className="text-xs font-semibold text-yale-blue flex items-center justify-between"
            >
              <span>Số tài khoản</span>
              <span className="text-functional-negative text-xs">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, accountNumber: e.target.value.replace(/\s+/g, "") }));
                  if (errors.accountNumber) setErrors((p) => ({ ...p, accountNumber: undefined }));
                }}
                placeholder="Nhập số tài khoản ngân hàng"
                className={`w-full h-11 pl-4 pr-24 rounded-xl bg-surface-card text-yale-blue font-semibold text-sm tracking-wide border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist ${
                  errors.accountNumber ? "border-functional-negative" : "border-divider-border"
                }`}
              />
              {formData.accountNumber && (
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  title="Sao chép số tài khoản"
                  className="absolute right-1.5 h-8 px-2.5 rounded-lg bg-hover-row text-cerulean font-semibold text-xs hover:bg-lime-cream transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-functional-positive" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </button>
              )}
            </div>
            {errors.accountNumber ? (
              <span className="text-xs text-functional-negative font-medium">
                {errors.accountNumber}
              </span>
            ) : (
              <span className="text-[11px] text-text-muted">
                Số tài khoản chính xác theo ứng dụng ngân hàng của bạn.
              </span>
            )}
          </div>

          {/* Account Holder Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="accountHolder" className="text-xs font-semibold text-yale-blue">
                Tên chủ tài khoản (Viết HOA không dấu)
              </label>
            </div>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-functional-positive absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="accountHolder"
                type="text"
                value={formData.accountHolder}
                onChange={(e) => handleHolderNameChange(e.target.value)}
                placeholder="VD: NGUYEN PHUONG LAN"
                className={`w-full h-11 pl-10 pr-4 rounded-xl bg-hover-row/40 text-yale-blue font-bold text-sm uppercase tracking-wider border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist ${
                  errors.accountHolder ? "border-functional-negative" : "border-divider-border"
                }`}
              />
            </div>
            {errors.accountHolder ? (
              <span className="text-xs text-functional-negative font-medium">
                {errors.accountHolder}
              </span>
            ) : (
              <span className="text-[11px] text-functional-positive flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" />
                Tên chủ tài khoản tự động chuẩn hóa chữ in hoa không dấu.
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 border-t border-divider-border mt-2">
            {profile.bankInfo && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-full sm:w-auto h-11 px-4 rounded-xl text-functional-negative font-semibold text-xs hover:bg-functional-warning-bg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Gỡ thông tin STK</span>
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 h-11 px-6 rounded-xl bg-cerulean text-on-primary font-semibold text-sm hover:bg-baltic-blue shadow-[0_4px_16px_rgba(26,117,159,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-mist disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Cập nhật tài khoản</span>
            </button>
          </div>
        </form>

        {/* Right: VietQR Card Preview (5 columns) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <ProfileVietQrCard bankInfo={currentPreviewBankInfo} />
        </div>
      </div>
    </section>
  );
}
