export interface UserBankInfo {
  bankBin: string; // Mã BIN ngân hàng VietQR (ví dụ: 970436 cho VCB)
  bankName: string; // Tên ngân hàng hiển thị (ví dụ: Vietcombank (VCB))
  accountNumber: string; // Số tài khoản ngân hàng
  accountHolder: string; // Tên chủ tài khoản (viết HOA không dấu theo R9)
  branch?: string; // Chi nhánh (tùy chọn)
}

export interface UserProfile {
  id: string;
  fullName: string; // Tên thật dùng đối chiếu ngân hàng (ví dụ: Lan Nguyễn)
  displayName: string; // Tên hiển thị trong nhóm (ví dụ: Lan)
  email: string; // Email (chế độ chỉ đọc từ Google Auth)
  phoneNumber?: string; // Số điện thoại
  avatarUrl?: string | null;
  bankInfo?: UserBankInfo | null;
}

export interface UpdateProfileFormData {
  fullName: string;
  displayName: string;
  phoneNumber?: string;
}

export interface UpdateBankFormData {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
}

export interface ProfileValidationErrors {
  fullName?: string;
  displayName?: string;
  phoneNumber?: string;
}

export interface BankValidationErrors {
  bankBin?: string;
  accountNumber?: string;
  accountHolder?: string;
  branch?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  type: "CLAIM" | "PAYMENT" | "SETTLEMENT" | "INFO";
  linkUrl?: string;
}
