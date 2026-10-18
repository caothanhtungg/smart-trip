export type TripStatus = "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";

export type TripMemberRole = "HOST" | "MEMBER";

export type MemberStatus = "ACTIVE" | "LEFT";

export interface TripMember {
  id: string;
  tripId?: string;
  userId?: string | null;
  name: string;
  role: TripMemberRole;
  status: MemberStatus;
  joinOrder: number;
  avatarUrl?: string | null;
  isNoAccount?: boolean;
  isCurrentUser?: boolean;
  isHost?: boolean;
}

export type BalanceType = "RECEIVE" | "PAY" | "SETTLED";

export interface UserTripBalance {
  type: BalanceType;
  amount: number; // Integer VND
}

/**
 * Domain entity: Trip (khớp ERD trips)
 */
export interface Trip {
  id: string;
  name: string; // Khớp ERD trips.name (thay thế title)
  destination?: string | null;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string; // ISO date string YYYY-MM-DD
  budgetAmount?: number | null; // Integer VND
  status: TripStatus;
  inviteCode: string; // 10-12 alphanumeric characters + max 1 hyphen (varchar(13))
  updatedAt: string; // ISO timestamp
  createdAt?: string;
  members: TripMember[];
  userBalance: UserTripBalance;
}

/**
 * View model: TripCardView (dùng để render thẻ chuyến đi trên trang /trips)
 * Tách biệt dữ liệu gốc ERD khỏi các trường dẫn xuất hiển thị.
 */
export interface TripCardView {
  id: string;
  name: string;
  destination?: string | null;
  startDate: string;
  endDate: string;
  durationText: string; // Tính toán từ startDate, endDate
  status: TripStatus;
  inviteCode: string;
  updatedAt: string;
  members: TripMember[];
  memberCount: number; // Tính toán từ members.filter(m => m.status === 'ACTIVE').length
  userBalance: UserTripBalance; // Nhãn lấy từ labels.ts
  cover: {
    from: string;
    via?: string;
    to: string;
  };
}

export type TripFilterTab = "all" | "active" | "completed";

export type TripSortOption = "latest" | "departure" | "name";

export interface OverallBalanceSummary {
  toReceive: number;
  toPay: number;
  net: number;
}

export interface InviteCodeValidationResult {
  isValid: boolean;
  error?: string;
  normalizedCode?: string;
}

export interface CreateTripFormData {
  name: string;
  destination: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string; // ISO date string YYYY-MM-DD
  budgetAmount: number | null; // Integer VND or null if unset
}

export interface CreateTripValidationErrors {
  name?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budgetAmount?: string;
}

export interface CreateTripValidationResult {
  isValid: boolean;
  errors: CreateTripValidationErrors;
}

export interface TripMemberDetail extends TripMember {
  spentAmount: number; // Integer VND that this member has spent/paid
}

export type ExpenseCategory = "FOOD" | "TRANSPORT" | "LODGING" | "TICKET" | "SHOPPING" | "OTHER";

export type SplitMethod = "EQUAL" | "ITEMIZED";

/**
 * Domain entity: ExpenseShare (khớp ERD expense_shares)
 */
export interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  amount: number; // Integer VND
  hasRemainderExtra?: boolean; // True nếu được phân bổ +1 VND phần dư theo R4
}

/**
 * Domain entity: TripExpense (khớp ERD expenses)
 * Chỉ giữ MỘT tên chuẩn cho mỗi thuộc tính, loại bỏ hoàn toàn các trường alias và trường view-model.
 */
export interface TripExpense {
  id: string;
  tripId: string;
  title: string;
  amount: number; // Integer VND (bỏ totalAmount)
  category: ExpenseCategory;
  paidByMemberId: string;
  splitMethod: SplitMethod;
  spentAt: string; // ISO datetime string YYYY-MM-DDTHH:mm:ss.sssZ (bỏ spentDate, spentAtDate)
  receiptImageUrl?: string; // Bỏ receiptUrl
  note?: string; // Bỏ notes
  locationName?: string; // Bỏ location
  shares: ExpenseShare[]; // Bỏ participants
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseFilterCategory = "ALL" | ExpenseCategory;

/**
 * Biểu mẫu tạo khoản chi
 * Mỗi dữ liệu có MỘT tên chuẩn; ngày từ ô nhập là "YYYY-MM-DD", chuyển đổi bằng hàm duy nhất.
 */
export interface CreateExpenseFormData {
  title: string;
  amount: number | null; // Integer VND
  category: ExpenseCategory;
  paidByMemberId: string;
  participantMemberIds: string[]; // member IDs theo joinOrder
  spentAtDate: string; // "YYYY-MM-DD"
  spentAtTime?: string; // "HH:mm"
  splitMethod: SplitMethod;
  note?: string;
  locationName?: string;
  receiptImageUrl?: string;
}

export interface ExpenseValidationErrors {
  title?: string;
  amount?: string;
  category?: string;
  paidByMemberId?: string;
  participants?: string;
  spentAtDate?: string;
}

export interface ExpenseValidationResult {
  isValid: boolean;
  errors: ExpenseValidationErrors;
}

export interface TripExpenseCategoryAllocation {
  category: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface TripRecentExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  categoryLabel: string;
  paidByName: string;
  spentAtFormatted: string; // e.g. "20/11 - 19:30"
  splitMethodText: string; // e.g. "Chia đều (5 người)"
  totalAmount: number; // Integer VND (used by recent expenses summary widget)
  userAmount: number; // Integer VND
}

export interface TripDetailData {
  id: string;
  name: string; // Khớp ERD trips.name
  destination?: string | null;
  startDate: string;
  endDate: string;
  budgetAmount?: number | null;
  status: TripStatus;
  inviteCode: string;
  updatedAt: string;
  createdAt?: string;
  members: TripMemberDetail[];
  currentMemberId: string; // ID của trip_members ứng với user hiện tại
  plannedBudget: number; // Integer VND
  totalSpent: number; // Integer VND
  hasBudget?: boolean;
  remainingBudget?: number;
  isOverBudget?: boolean;
  overBudgetAmount?: number;
  avgSpentPerPerson?: number;
  userSpent: number; // Integer VND paid by current user
  userBalance?: {
    type: BalanceType;
    amount: number;
  };
  expenseCount: number;
  paidActivitiesCount: number;
  recentExpenses: TripRecentExpense[];
  expenses?: TripExpense[];
  categoryAllocations: TripExpenseCategoryAllocation[];
  nextDestination?: {
    title: string;
    label: string;
  };
  weatherInfo?: {
    locationName: string;
    temperature: string;
    description: string;
  };
}
