"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  Save,
  Camera,
  Upload,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";
import { useToast } from "@/components/ui/toast";
import { ProfileValidationErrors } from "@/types/user";

export function ProfilePersonalSection() {
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();

  const [formData, setFormData] = React.useState({
    fullName: profile.fullName || "",
    displayName: profile.displayName || "",
    phoneNumber: profile.phoneNumber || "",
  });

  const [errors, setErrors] = React.useState<ProfileValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const initials = React.useMemo(() => {
    const name = formData.displayName || formData.fullName || "L";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [formData.displayName, formData.fullName]);

  const handleReset = () => {
    setFormData({
      fullName: profile.fullName || "",
      displayName: profile.displayName || "",
      phoneNumber: profile.phoneNumber || "",
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const res = await updateProfile({
      fullName: formData.fullName,
      displayName: formData.displayName,
      phoneNumber: formData.phoneNumber || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      toast("Đã lưu thông tin cá nhân thành công!", "success");
    } else if (res.errors) {
      setErrors(res.errors);
      toast("Vui lòng kiểm tra lại các trường thông tin chưa hợp lệ.", "error");
    }
  };

  return (
    <section
      className="bg-surface-card rounded-[20px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-6"
      id="thong-tin-ca-nhan"
    >
      {/* Section Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-divider-border">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-cerulean" />
          <h2 className="text-xl sm:text-2xl font-bold text-yale-blue">
            Thông tin cá nhân
          </h2>
        </div>
        <p className="text-sm text-text-muted">
          Cập nhật ảnh đại diện và chi tiết liên hệ của bạn trên Smart Trip
        </p>
      </div>

      {/* Avatar Modification Row */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-hover-row/70 rounded-2xl border border-divider-border/60">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-light-green flex items-center justify-center text-2xl font-bold text-yale-blue shadow-sm select-none">
            {initials}
          </div>
          <button
            type="button"
            onClick={() => toast("Tính năng tải ảnh đại diện thuộc Release sau (demo).", "info")}
            aria-label="Tải ảnh mới"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cerulean text-on-primary flex items-center justify-center hover:bg-baltic-blue shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-mist"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="font-semibold text-yale-blue text-sm sm:text-base">
              Ảnh đại diện thành viên
            </h3>
            <p className="text-xs text-text-muted">
              Hỗ trợ JPG, PNG hoặc WEBP tối đa 5MB. Khuyến nghị tỉ lệ 1:1.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => toast("Tính năng tải ảnh đại diện thuộc Release sau (demo).", "info")}
              className="h-10 px-4 rounded-xl bg-surface-card text-cerulean font-semibold text-sm shadow-xs border border-divider-border hover:bg-hover-row transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Thay đổi ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => toast("Ảnh đại diện đã đặt về mặc định theo tên viết tắt.", "info")}
              className="h-10 px-3 text-text-muted hover:text-functional-negative transition-colors rounded-xl text-xs font-semibold cursor-pointer"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Field 1: Full name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="fullName"
            className="text-xs font-semibold text-yale-blue flex items-center justify-between"
          >
            <span>Họ và tên</span>
            <span className="text-functional-negative text-xs">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => {
                setFormData((p) => ({ ...p, fullName: e.target.value }));
                if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
              }}
              placeholder="Nhập họ và tên đầy đủ"
              className={`w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card text-on-surface text-sm border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist ${
                errors.fullName ? "border-functional-negative" : "border-divider-border"
              }`}
            />
          </div>
          {errors.fullName ? (
            <span className="text-xs text-functional-negative font-medium">{errors.fullName}</span>
          ) : (
            <span className="text-[11px] text-text-muted">
              Tên thật dùng để đối chiếu khi chuyển khoản qua ngân hàng.
            </span>
          )}
        </div>

        {/* Field 2: Group Display Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="displayName"
            className="text-xs font-semibold text-yale-blue flex items-center justify-between"
          >
            <span>Tên hiển thị trong nhóm</span>
            <span className="text-functional-negative text-xs">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => {
                setFormData((p) => ({ ...p, displayName: e.target.value }));
                if (errors.displayName) setErrors((p) => ({ ...p, displayName: undefined }));
              }}
              placeholder="Ví dụ: Lan, Hương Lan, Lan Mèo"
              className={`w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card text-on-surface text-sm border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist ${
                errors.displayName ? "border-functional-negative" : "border-divider-border"
              }`}
            />
          </div>
          {errors.displayName ? (
            <span className="text-xs text-functional-negative font-medium">{errors.displayName}</span>
          ) : (
            <span className="text-[11px] text-text-muted">
              Tên gọi ngắn gọn xuất hiện trong bảng phân chia hóa đơn.
            </span>
          )}
        </div>

        {/* Field 3: Email */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="text-xs font-semibold text-yale-blue">
              Địa chỉ Email
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-functional-positive bg-lime-cream/60 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Đã xác thực
            </span>
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="email"
              type="email"
              readOnly
              value={profile.email}
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-hover-row/50 text-text-muted text-sm border border-divider-border cursor-not-allowed select-none"
            />
            <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <span className="text-[11px] text-text-muted">
            Dùng để nhận thông báo thanh toán và sao kê nhóm du lịch.
          </span>
        </div>

        {/* Field 4: Phone */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="phoneNumber"
            className="text-xs font-semibold text-yale-blue flex items-center justify-between"
          >
            <span>Số điện thoại</span>
            <span className="text-text-muted text-xs">(Tùy chọn)</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => {
                setFormData((p) => ({ ...p, phoneNumber: e.target.value }));
                if (errors.phoneNumber) setErrors((p) => ({ ...p, phoneNumber: undefined }));
              }}
              placeholder="Nhập số điện thoại (VD: 0912 345 678)"
              className={`w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card text-on-surface text-sm border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist ${
                errors.phoneNumber ? "border-functional-negative" : "border-divider-border"
              }`}
            />
          </div>
          {errors.phoneNumber ? (
            <span className="text-xs text-functional-negative font-medium">{errors.phoneNumber}</span>
          ) : (
            <span className="text-[11px] text-text-muted">
              Nhận mã SMS OTP xác nhận giao dịch chuyển tiền tự động.
            </span>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-divider-border mt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto h-11 px-5 rounded-xl text-text-muted font-semibold text-sm hover:bg-hover-row transition-colors cursor-pointer order-2 sm:order-1"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-cerulean text-on-primary font-semibold text-sm hover:bg-baltic-blue shadow-[0_4px_16px_rgba(26,117,159,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 focus:outline-none focus:ring-2 focus:ring-ocean-mist disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </section>
  );
}
