export type TripStatus = "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";

export type TripMemberRole = "HOST" | "MEMBER";

export interface TripMember {
  id: string;
  name: string;
  role: TripMemberRole;
  avatarUrl?: string | null;
  isNoAccount?: boolean;
  isHost?: boolean;
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

export type ExpenseCategory = "FOOD" | "TRANSPORT" | "LODGING" | "TICKET" | "SHOPPING" | "OTHER";

export type SplitMethod = "EQUAL" | "ITEMIZED";

export interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  amount: number; // Integer VND
  hasRemainderExtra?: boolean; // True if this member received +1 VND remainder due to R4
}

export interface TripExpense {
  id: string;
  tripId: string;
  title: string;
  amount: number; // Integer VND
  totalAmount?: number; // Integer VND alias
  category: ExpenseCategory;
  categoryLabel: string;
  paidByMemberId: string;
  paidByName: string;
  splitMethod: SplitMethod;
  splitMethodText: string;
  spentAt?: string; // ISO datetime string YYYY-MM-DDTHH:mm:ss
  spentAtFormatted: string; // e.g. "20/11 - 12:45"
  spentDate?: string; // ISO date string YYYY-MM-DD
  spentAtDate?: string; // Formatted date string
  receiptImageUrl?: string;
  receiptUrl?: string; // Alias for receiptImageUrl
  note?: string;
  notes?: string; // Alias for note
  locationName?: string;
  location?: string; // Alias for locationName
  shares: ExpenseShare[];
  participants?: ExpenseShare[]; // Alias for shares
  isNewInSession?: boolean;
  createdAt?: string;
}

export type ExpenseFilterCategory = "ALL" | ExpenseCategory;

export interface CreateExpenseFormData {
  title: string;
  amount: number | null; // Integer VND
  category: ExpenseCategory;
  paidByMemberId: string;
  participantMemberIds: string[]; // member IDs in join order
  spentAtDate: string; // YYYY-MM-DD or DD/MM/YYYY
  spentAtTime?: string; // HH:mm
  splitMethod?: SplitMethod;
  note?: string;
  notes?: string;
  locationName?: string;
  location?: string;
  receiptImageUrl?: string;
  receiptUrl?: string;
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

export interface TripDetailData extends Omit<Trip, "members"> {
  members: TripMemberDetail[];
  plannedBudget: number; // Integer VND
  budget?: number; // Alias for plannedBudget
  budgetFormatted?: string;
  totalSpent: number; // Integer VND
  remainingBudget?: number;
  isOverBudget?: boolean;
  overBudgetAmount?: number;
  avgSpentPerPerson?: number;
  userSpent: number; // Integer VND paid by current user
  expenseCount: number;
  paidActivitiesCount: number;
  nextDestination?: {
    title: string;
    label: string;
    imageUrl?: string;
  };
  recentExpenses: TripRecentExpense[];
  expenses?: TripExpense[];
  categoryAllocations: TripExpenseCategoryAllocation[];
  weatherInfo?: {
    locationName: string;
    temperature: string;
    description: string;
  };
}

