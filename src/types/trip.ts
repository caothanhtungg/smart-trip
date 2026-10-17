export type TripStatus = "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";

export type TripMemberRole = "HOST" | "MEMBER";

export interface TripMember {
  id: string;
  name: string;
  role: TripMemberRole;
  avatarUrl?: string | null;
  isNoAccount?: boolean;
}

export type BalanceType = "RECEIVE" | "PAY" | "SETTLED";

export interface UserTripBalance {
  type: BalanceType;
  amount: number; // Integer VND
  label: "Được nhận" | "Cần trả" | "Đã xong";
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string; // ISO date string YYYY-MM-DD
  durationText: string; // e.g. "3 ngày 2 đêm"
  status: TripStatus;
  inviteCode: string; // 10-12 alphanumeric characters + max 1 hyphen (10-13 chars total, matching ERD varchar(13))
  updatedAt: string; // ISO timestamp string for "Cập nhật gần nhất" sorting
  members: TripMember[];
  totalMembers: number;
  userBalance: UserTripBalance;
  coverGradient: {
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

export interface TripRecentExpense {
  id: string;
  title: string;
  category: "FOOD" | "TRANSPORT" | "LODGING" | "TICKET" | "SHOPPING" | "OTHER";
  categoryLabel: string;
  paidByName: string;
  spentAtFormatted: string; // e.g. "20/11 - 19:30"
  splitMethodText: string; // e.g. "Chia đều 5 người" | "Chia theo món"
  totalAmount: number; // Integer VND
  userAmount: number; // Integer VND
}

export interface TripExpenseCategoryAllocation {
  category: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface TripMemberDetail extends TripMember {
  spentAmount: number; // Integer VND that this member has spent/paid
  isCurrentUser?: boolean;
}

export interface TripDetailData extends Omit<Trip, "members"> {
  members: TripMemberDetail[];
  plannedBudget: number; // Integer VND
  totalSpent: number; // Integer VND
  userSpent: number; // Integer VND paid by current user
  expenseCount: number;
  paidActivitiesCount: number;
  nextDestination?: {
    title: string;
    label: string;
    imageUrl?: string;
  };
  recentExpenses: TripRecentExpense[];
  categoryAllocations: TripExpenseCategoryAllocation[];
  weatherInfo?: {
    locationName: string;
    temperature: string;
    description: string;
  };
}

