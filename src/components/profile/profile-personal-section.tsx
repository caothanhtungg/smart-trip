"use client";

import * as React from "react";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  Save,
  Camera,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";
import { useToast } from "@/components/ui/toast";
import { ProfileValidationErrors } from "@/types/user";

export function ProfilePersonalSection() {
  const { profile, updateProfile, updateAvatar, isLoading } = useUserProfile();
  const { toast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  const [editedDisplayName, setEditedDisplayName] = React.useState<string | null>(null);
  const currentDisplayName = editedDisplayName ?? (profile.displayName || profile.fullName || "");

  const formData = React.useMemo(() => ({
    displayName: currentDisplayName,
  }), [currentDisplayName]);

  const [errors, setErrors] = React.useState<ProfileValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const initials = React.useMemo(() => {
    const name = formData.displayName || profile.fullName || "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [formData.displayName, profile.fullName]);

  const handleReset = () => {
    setEditedDisplayName(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrors({});

    const res = await updateProfile({
      fullName: profile.fullName || formData.displayName,
      displayName: formData.displayName,
    });

    setIsSubmitting(false);

    if (res.success) {
      setEditedDisplayName(null);
      toast("Đã lưu thông tin cá nhân thành công!", "success");
    } else if (res.errors) {
      setErrors(res.errors);
      toast("Vui lòng kiểm tra lại các trường thông tin chưa hợp lệ.", "error");
    } else if (res.message) {
      toast(res.message, "error");
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so selecting the same file triggers change
    e.target.value = "";

    // 1. Kiểm tra dung lượng tối đa 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast("Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.", "error");
      return;
    }

    // 2. Kiểm tra định dạng hợp lệ
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast("Định dạng không được hỗ trợ. Vui lòng chọn JPG, PNG hoặc WEBP.", "error");
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Đọc file sang Base64 Data URL để lưu vào profile
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);

      const base64Data = await base64Promise;
      const res = await updateAvatar(base64Data);

      if (res.success) {
        toast("Đã cập nhật ảnh đại diện thành công!", "success");
      } else {
        toast(res.message || "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.", "error");
      }
    } catch {
      toast("Lỗi xử lý tệp ảnh. Vui lòng thử lại.", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile.avatarUrl) return;

    const res = await updateAvatar(null);

    if (res.success) {
      toast("Đã xóa ảnh đại diện, chuyển về tên viết tắt.", "success");
    } else {
      toast(res.message || "Không thể xóa ảnh đại diện.", "error");
    }
  };

  if (isLoading) {
    return (
      <section
        className="bg-surface-card rounded-[20px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-6"
        id="thong-tin-ca-nhan"
      >
        <div className="flex items-center justify-between pb-4 border-b border-divider-border">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-cerulean" />
            <div>
              <div className="h-6 w-44 bg-hover-row dark:bg-[#1E293B] rounded-md animate-pulse mb-1.5" />
              <div className="h-4 w-64 bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Avatar skeleton */}
        <div className="p-4 sm:p-5 rounded-2xl bg-hover-row/40 dark:bg-[#1E293B]/40 border border-divider-border/80 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-hover-row dark:bg-[#1E293B] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="h-4 w-40 bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
            <div className="h-3 w-60 bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
          </div>
        </div>

        {/* Inputs skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
            <div className="h-11 w-full bg-hover-row dark:bg-[#1E293B] rounded-xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
            <div className="h-11 w-full bg-hover-row dark:bg-[#1E293B] rounded-xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-surface-card rounded-[20px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-6"
      id="thong-tin-ca-nhan"
    >
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Section Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-divider-border">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-cerulean" />
          <h2 className="text-xl sm:text-2xl font-bold text-yale-blue">
            Thông tin cá nhân
          </h2>
        </div>
        <p className="text-sm text-text-muted">
          Cập nhật ảnh đại diện và tên hiển thị của bạn trên Smart Trip
        </p>
      </div>

      {/* Avatar Modification Row */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-hover-row/70 rounded-2xl border border-divider-border/60">
        <div className="relative">
          {profile.avatarUrl ? (
            // Avatar URLs can be user-provided or authenticated; do not route them through Next's optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.displayName || profile.fullName}
              className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-cerulean/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-light-green flex items-center justify-center text-2xl font-bold text-yale-blue shadow-sm select-none border-2 border-white">
              {initials}
            </div>
          )}

          <button
            type="button"
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Tải ảnh mới"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cerulean text-white flex items-center justify-center hover:bg-baltic-blue shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-mist disabled:opacity-60"
            title="Tải ảnh đại diện mới"
          >
            {isUploadingAvatar ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
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
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-xl bg-surface-card text-cerulean font-semibold text-sm shadow-xs border border-divider-border hover:bg-hover-row transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isUploadingAvatar ? "Đang xử lý..." : "Thay đổi ảnh"}</span>
            </button>

            <button
              type="button"
              disabled={isUploadingAvatar || !profile.avatarUrl}
              onClick={handleRemoveAvatar}
              className="h-10 px-3 text-text-muted hover:text-functional-negative transition-colors rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              title={profile.avatarUrl ? "Xóa ảnh đại diện" : "Đang dùng ảnh đại diện mặc định"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Field: Group Display Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="displayName"
            className="text-xs font-semibold text-yale-blue flex items-center justify-between"
          >
            <span>Tên hiển thị</span>
            <span className="text-functional-negative text-xs">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => {
                setEditedDisplayName(e.target.value);
                if (errors.displayName) setErrors((p) => ({ ...p, displayName: undefined }));
              }}
              placeholder="Nhập tên gọi trong nhóm"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm font-medium text-yale-blue bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.displayName
                  ? "border-functional-negative focus:ring-functional-negative/20"
                  : "border-divider-border focus:border-cerulean focus:ring-ocean-mist/30"
              }`}
            />
          </div>
          {errors.displayName ? (
            <p className="text-xs text-functional-negative mt-0.5">{errors.displayName}</p>
          ) : (
            <span className="text-[11px] text-text-muted">
              Tên gọi hiển thị trong các chuyến đi và bảng phân chia chi phí.
            </span>
          )}
        </div>

        {/* Field: Readonly Email */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-yale-blue"
            >
              Địa chỉ Email
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-functional-positive bg-lime-cream/60 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              <span>Đã xác thực</span>
            </span>
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="email"
              type="email"
              readOnly
              disabled
              value={profile.email}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-divider-border bg-surface-container-low text-text-muted text-sm font-medium cursor-not-allowed select-all"
            />
            <Lock className="w-4 h-4 text-text-muted/60 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <span className="text-[11px] text-text-muted">
            Email tài khoản liên kết Google Auth (chế độ chỉ đọc).
          </span>
        </div>

        {/* Form Actions Footer */}
        <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-divider-border/60">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || editedDisplayName === null}
            className="h-10 px-5 text-sm font-semibold text-text-muted hover:text-yale-blue transition-colors rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting || editedDisplayName === null}
            className="h-10 px-6 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
