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
  email?: string | null;
  note?: string | null;
  bankBin?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  isNoAccount?: boolean;
  isCurrentUser?: boolean;
  isHost?: boolean;
  spentAmount?: number;
}

export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Domain entity: MemberClaim (khớp ERD member_claims)
 * Yêu cầu nhận diện thành viên chưa có tài khoản (UC33, UC30, Rule R13, R20)
 */
export interface MemberClaim {
  id: string;
  tripId: string;
  placeholderMemberId: string; // ID của thành viên chưa có tài khoản trong trip_members
  placeholderMemberName: string; // Tên của thành viên chưa có tài khoản
  userId: string; // ID người gửi yêu cầu (người dùng thật)
  userName: string; // Tên người gửi yêu cầu
  userEmail: string; // Email người gửi yêu cầu
  userAvatarUrl?: string | null;
  status: ClaimStatus;
  createdAt: string; // ISO timestamp
  decidedAt?: string | null;
  decidedByMemberId?: string | null; // ID của Trưởng nhóm đã duyệt/từ chối
}

export interface CreateGuestMemberFormData {
  displayName: string;
  note?: string;
}

export interface EditGuestMemberFormData {
  displayName: string;
  note?: string;
}

export interface GuestMemberValidationErrors {
  displayName?: string;
  note?: string;
}

export interface GuestMemberValidationResult {
  isValid: boolean;
  errors: GuestMemberValidationErrors;
}

/**
 * Thẻ xem trước lời mời tham gia chuyến đi (tuân thủ Rule R19)
 * Tuyệt đối không chứa lịch trình, chi tiêu, công nợ hay tài khoản ngân hàng.
 */
export interface TripInvitePreviewData {
  id: string;
  name: string;
  destination?: string | null;
  startDate: string;
  endDate: string;
  durationText: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  members: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
    role: TripMemberRole;
  }>;
  memberCount: number;
  status: TripStatus;
  inviteCode: string;
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
  itineraryItemId?: string | null; // ID điểm lịch trình liên kết (nếu có)
  shares: ExpenseShare[]; // Bỏ participants
  items?: ExpenseItemData[]; // Món ăn khi splitMethod = ITEMIZED
  surcharge?: ExpenseSurchargeData | null; // Phụ phí VAT/dịch vụ khi splitMethod = ITEMIZED
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseFilterCategory = "ALL" | ExpenseCategory;

/**
 * Chi tiết một món ăn trong khoản chi chia theo món (khớp ERD expense_items & expense_item_members)
 */
export interface ExpenseItemData {
  id: string;
  name: string;
  amount: number; // Integer VND > 0
  assignedMemberIds: string[]; // Danh sách trip_members.id được gán món này
}

/**
 * Dòng phụ phí VAT / Phí dịch vụ đi kèm hóa đơn chia theo món
 */
export interface ExpenseSurchargeData {
  name: string;
  amount: number; // Integer VND >= 0
}

/**
 * Kết quả phân bổ tiền cho từng thành viên trong chia theo món
 */
export interface ItemizedMemberShareDetail {
  memberId: string;
  itemsAmount: number; // Tổng tiền các món thành viên tham gia
  surchargeAmount: number; // Phần phụ phí VAT/dịch vụ phải chịu
  totalAmount: number; // itemsAmount + surchargeAmount
  assignedItemCount: number; // Số món thành viên tham gia
}

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
  items?: ExpenseItemData[]; // Danh sách món khi splitMethod = ITEMIZED
  surcharge?: ExpenseSurchargeData | null; // Phụ phí khi splitMethod = ITEMIZED
  note?: string;
  locationName?: string;
  receiptImageUrl?: string;
  itineraryItemId?: string | null;
}

export interface ItemizedExpenseValidationErrors {
  title?: string;
  amount?: string;
  items?: string;
  itemsList?: Record<string, { name?: string; amount?: string; members?: string }>;
  surcharge?: string;
  reconciliation?: string;
}

export interface ItemizedExpenseValidationResult {
  isValid: boolean;
  errors: ItemizedExpenseValidationErrors;
  difference: number; // Số tiền chênh lệch giữa tổng các món + surcharge và totalAmount
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
  currentRole?: "HOST" | "MEMBER"; // Vai trò của người dùng hiện tại (HOST hoặc MEMBER)
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
  itineraryItems?: ItineraryItem[];
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

/**
 * Domain entity: ItineraryItem (khớp ERD itinerary_items)
 */
export interface ItineraryItem {
  id: string;
  tripId: string;
  dayDate: string; // ISO date string "YYYY-MM-DD"
  sortOrder: number; // Thứ tự sắp xếp trong ngày
  placeName: string; // Tên địa điểm (khớp ERD itinerary_items.place_name)
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isLocked?: boolean;
  startTime?: string | null; // Định dạng "HH:mm"
  endTime?: string | null; // Định dạng "HH:mm"
  note?: string | null;
  createdByMemberId: string;
  expenseId?: string | null; // ID khoản chi tiêu gắn kèm (nếu có)
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItineraryItemFormData {
  dayDate: string; // "YYYY-MM-DD"
  placeName: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  isLocked?: boolean;
  startTime: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  note?: string;
}

export interface ItineraryValidationErrors {
  dayDate?: string;
  placeName?: string;
  startTime?: string;
  endTime?: string;
}

export interface ItineraryValidationResult {
  isValid: boolean;
  errors: ItineraryValidationErrors;
}

export interface TimeConflictInfo {
  hasConflict: boolean;
  conflictingPlaceName?: string;
  overlapMinutes?: number;
  message?: string;
}

export interface DayItineraryGroup {
  dayIndex: number; // 1, 2, 3...
  dayDate: string; // "YYYY-MM-DD"
  dayLabel: string; // "Ngày 1"
  dayOfWeekText: string; // "Thứ Sáu, 20/11"
  items: ItineraryItem[];
  totalExpensesAmount: number;
}

