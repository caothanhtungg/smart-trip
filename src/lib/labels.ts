import type {
  TripStatus,
  BalanceType,
  ExpenseCategory,
  SplitMethod,
  TripMemberRole,
  MemberStatus,
} from "@/types/trip";

/**
 * Tập trung hóa toàn bộ thuật ngữ và nhãn giao diện tiếng Việt cho Smart Trip.
 * Khớp chuẩn với ERD (sodothietke/release1-erd.dbml) và tiêu chuẩn kỹ thuật (docs/ENGINEERING_STANDARDS.md).
 */

// 1. Nhãn trạng thái chuyến đi (ERD trip_status)
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  ACTIVE: "Đang lên kế hoạch",
  SETTLING: "Đang thanh toán",
  COMPLETED: "Đã hoàn tất",
  ARCHIVED: "Lưu trữ",
};

export function getTripStatusLabel(status: TripStatus): string {
  return TRIP_STATUS_LABELS[status] || status;
}

// 2. Nhãn loại công nợ (BalanceType)
export const BALANCE_TYPE_LABELS: Record<BalanceType, string> = {
  RECEIVE: "Được nhận",
  PAY: "Cần trả",
  SETTLED: "Đã xong",
};

export function getBalanceTypeLabel(type: BalanceType): string {
  return BALANCE_TYPE_LABELS[type] || type;
}

// 3. Nhãn danh mục chi tiêu (ERD expense_category)
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FOOD: "Ăn uống",
  TRANSPORT: "Di chuyển",
  LODGING: "Lưu trú",
  TICKET: "Vé tham quan",
  SHOPPING: "Mua sắm",
  OTHER: "Khác",
};

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_LABELS[category] || "Khác";
}

// Bảng ánh xạ danh mục chi tiêu sang class token màu thương hiệu Smart Trip (thay thế mã hex)
export interface CategoryColorClasses {
  bg: string;
  text: string;
  border?: string;
}

export const EXPENSE_CATEGORY_COLOR_CLASSES: Record<ExpenseCategory, CategoryColorClasses> = {
  FOOD: {
    bg: "bg-functional-warning-bg",
    text: "text-functional-warning",
    border: "border-functional-warning/30",
  },
  TRANSPORT: {
    bg: "bg-cerulean/15",
    text: "text-cerulean",
    border: "border-cerulean/30",
  },
  LODGING: {
    bg: "bg-yale-blue/10",
    text: "text-yale-blue",
    border: "border-yale-blue/30",
  },
  TICKET: {
    bg: "bg-tropical-teal/15",
    text: "text-tropical-teal",
    border: "border-tropical-teal/30",
  },
  SHOPPING: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-300",
  },
  OTHER: {
    bg: "bg-surface-container",
    text: "text-ocean-mist",
    border: "border-ocean-mist/30",
  },
};

export function getExpenseCategoryColorClasses(category: ExpenseCategory): CategoryColorClasses {
  return EXPENSE_CATEGORY_COLOR_CLASSES[category] || EXPENSE_CATEGORY_COLOR_CLASSES.OTHER;
}

// 4. Nhãn phương thức chia tiền (ERD split_method)
export const SPLIT_METHOD_LABELS: Record<SplitMethod, string> = {
  EQUAL: "Chia đều",
  ITEMIZED: "Theo món",
};

export function getSplitMethodLabel(method: SplitMethod): string {
  return SPLIT_METHOD_LABELS[method] || method;
}

// 5. Nhãn vai trò thành viên (ERD member_role)
export const MEMBER_ROLE_LABELS: Record<TripMemberRole, string> = {
  HOST: "Trưởng nhóm",
  MEMBER: "Thành viên",
};

export function getMemberRoleLabel(role: TripMemberRole): string {
  return MEMBER_ROLE_LABELS[role] || "Thành viên";
}

// 6. Nhãn trạng thái thành viên (ERD member_status)
export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Đang tham gia",
  LEFT: "Đã rời nhóm",
};

export function getMemberStatusLabel(status: MemberStatus): string {
  return MEMBER_STATUS_LABELS[status] || status;
}

// 7. Các nhãn đặc thù trên giao diện
export const SPECIAL_LABELS = {
  NO_ACCOUNT: "Chưa có tài khoản",
  NO_ACCOUNT_SHORT: "Chưa có TK",
  CURRENT_USER: "Bạn",
  INVITE_CODE: "Mã mời chuyến đi",
  UPCOMING: "Sắp có",
} as const;

// 8. Nhãn cho giao diện chia theo món (Giai đoạn 2D.2)
export const ITEM_SPLIT_LABELS = {
  TITLE: "Chia tiền theo từng món (Itemized Split)",
  SUBTITLE: "Đánh dấu ai dùng món nào để hệ thống tự động tính toán chính xác tới từng đồng.",
  RECEIPT_CARD_TITLE: "Ảnh hóa đơn đính kèm",
  ZOOM_RECEIPT: "Phóng to hóa đơn",
  TOTAL_BILL: "Tổng hóa đơn",
  ITEMS_MATCHED: "Khớp toàn bộ mục chi tiêu",
  CHANGE_IMAGE: "Đổi ảnh",
  ORIGINAL_RECEIPT: "Hóa đơn gốc",
  MATRIX_TITLE: "Danh sách món & Người dùng",
  MATRIX_SUBTITLE: "Tích chọn người tham gia ăn từng món để chia đều",
  ADD_ITEM: "+ Thêm món",
  ADD_SURCHARGE: "+ Thêm thuế & phí dịch vụ",
  SURCHARGE_DEFAULT_NAME: "Thuế & phí dịch vụ",
  SURCHARGE_HINT: "VAT & phục vụ (chia đều người tham gia hóa đơn)",
  SURCHARGE_LIMITATION_HINT: "Người ăn ít vẫn chịu phụ phí bằng người ăn nhiều do phân bổ chia đều của hóa đơn.",
  SUMMARY_TITLE: "Tạm tính mỗi người cần trả",
  FORMULA_HINT: "• Công thức: Giá món chia số người tick + Thuế/Phí chia đều những người tham gia hóa đơn.",
  CANCEL_BACK: "Hủy & Quay lại",
  SAVE_DONE: "Xong",
} as const;

// 9. Nhãn cho giao diện công nợ và quyết toán (Giai đoạn 2D.3)
export const SETTLEMENT_LABELS = {
  TITLE: "Công nợ & Quyết toán",
  SUBTITLE: "Bảng tính toán bù trừ nợ và thanh toán thông minh.",
  ACTIVE_PREVIEW_BADGE: "Công nợ tạm tính",
  ACTIVE_PREVIEW_HINT: "Số liệu phản ánh các khoản chi hiện có. Bấm 'Chốt sổ công nợ' để bắt đầu quyết toán chính thức.",
  LOCK_SETTLEMENT: "Chốt sổ công nợ",
  REOPEN_SETTLEMENT: "Mở lại sổ công nợ",
  CONFIRM_LOCK_TITLE: "Xác nhận chốt sổ chi tiêu",
  CONFIRM_LOCK_DESC: "Sau khi chốt sổ, toàn bộ chức năng thêm, sửa, xóa khoản chi tiêu sẽ bị khóa lại theo quy tắc R7. Bạn có chắc chắn muốn chốt sổ?",
  CONFIRM_REOPEN_TITLE: "Xác nhận mở lại sổ công nợ",
  CONFIRM_REOPEN_DESC: "Toàn bộ đề xuất thanh toán chưa trả sẽ bị hủy và chuyến đi quay về trạng thái mở để tiếp tục chỉnh sửa khoản chi.",
  GRAPH_MODAL_TITLE: "Sơ đồ bù trừ nợ thông minh",
  GRAPH_MODAL_SUBTITLE: "Hệ thống tự động bù trừ đa chiều giúp các thành viên thanh toán dứt điểm nhanh nhất.",
  PAYMENT_MODAL_TITLE: "Thanh toán nợ chuyến đi",
  PAYMENT_MODAL_DEMO_HINT: "Ảnh mã QR mô phỏng cho mục đích trình diễn giao diện — Vui lòng kiểm tra lại STK khi chuyển khoản ngoài ứng dụng.",
  NO_BANK_WARNING: "Người nhận chưa cập nhật số tài khoản. Vui lòng thanh toán bằng tiền mặt hoặc nhắc họ cập nhật hồ sơ cá nhân.",
  MARK_PAID: "Tôi đã chuyển",
  MARK_PAID_CASH: "Tôi đã trả tiền mặt",
  MARK_PAID_PROXY: "Đánh dấu đã thanh toán (Trả hộ)",
  CONFIRM_RECEIVED: "Xác nhận đã nhận",
  CONFIRM_RECEIVED_PROXY: "Xác nhận đã nhận tiền (Nhận hộ)",
  REMIND_DEBT: "Nhắc nợ",
  REMINDER_MODAL_TITLE: "Nhắc nợ thân thiện",
  ALL_SETTLED_TITLE: "Không ai nợ ai",
  ALL_SETTLED_DESC: "Tuyệt vời! Toàn bộ chi phí chuyến đi đã được chia đều hoàn hảo, không ai còn khoản nợ nào.",
  SETTLEMENT_COMPLETED_TITLE: "Đã quyết toán hoàn tất 100%",
  SETTLEMENT_COMPLETED_DESC: "Mọi giao dịch thanh toán đã được xác nhận thành công. Chuyến đi đã hoàn thành quyết toán.",
} as const;

export const TRANSFER_STATUS_LABELS = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán (Chờ xác nhận)",
  COMPLETED: "Đã hoàn tất",
} as const;

// 10. Đối tượng tổng hợp tiện lợi cho components
export const LABELS = {
  TRIP_STATUS: TRIP_STATUS_LABELS,
  BALANCE_TYPE: BALANCE_TYPE_LABELS,
  EXPENSE_CATEGORY: EXPENSE_CATEGORY_LABELS,
  SPLIT_METHOD: SPLIT_METHOD_LABELS,
  ROLE: {
    HOST: "Trưởng nhóm",
    MEMBER: "Thành viên",
  },
  MEMBER: {
    NO_ACCOUNT: "Chưa có tài khoản",
    NO_ACCOUNT_SHORT: "Chưa có TK",
    CURRENT_USER: "Bạn",
  },
  BALANCE: {
    YOU_RECEIVE: "Bạn đang được nhận: ",
    YOU_PAY: "Bạn cần trả: ",
    SETTLED: "Đã xong",
  },
  ITEM_SPLIT: ITEM_SPLIT_LABELS,
  SETTLEMENT: SETTLEMENT_LABELS,
  TRANSFER_STATUS: TRANSFER_STATUS_LABELS,
  SPECIAL: SPECIAL_LABELS,
} as const;
