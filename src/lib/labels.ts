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

// 8. Đối tượng tổng hợp tiện lợi cho components
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
  SPECIAL: SPECIAL_LABELS,
} as const;
