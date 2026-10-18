import type {
  Trip,
  OverallBalanceSummary,
  TripFilterTab,
  TripSortOption,
  InviteCodeValidationResult,
  TripDetailData,
  TripExpense,
} from "../types/trip";

/**
 * Mock current authenticated user profile for UI demonstration.
 * In later backend stages, this will be provided by Auth.js session.
 */
export const MOCK_CURRENT_USER = {
  id: "usr-current",
  name: "Lan",
  fullName: "Lan Nguyễn",
  email: "lan.nguyen@gmail.com",
  avatarUrl: null, // Will use tactical initial avatar LN
};

/**
 * Standard mock trips data aligned with Stitch screen 'chuy_n_i_c_a_t_i'
 * - Trip 1: Đà Lạt 3N2Đ (ACTIVE)
 * - Trip 2: Phú Quốc cùng team (SETTLING)
 * - Trip 3: Sa Pa mùa lúa chín (COMPLETED, 10/10/2026 - 13/10/2026)
 * - All invite codes follow 10-12 alphanumeric characters standard (e.g. DL3N2D-TRIP99).
 */
export const MOCK_TRIPS: readonly Trip[] = Object.freeze([
  {
    id: "trip-dalat-3n2d",
    title: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    durationText: "3 ngày 2 đêm",
    status: "ACTIVE", // "Đang lên kế hoạch"
    inviteCode: "DL3N2D-TRIP99",
    updatedAt: "2026-10-16T10:00:00Z",
    members: [
      { id: "m1", name: "Lan Nguyễn", role: "HOST" },
      { id: "m2", name: "Tuấn Huy", role: "MEMBER" },
      { id: "m3", name: "Quang Minh", role: "MEMBER" },
      { id: "m4", name: "Thanh Quang", role: "MEMBER" },
      { id: "m5", name: "Thu Hà", role: "MEMBER" },
    ],
    totalMembers: 5,
    userBalance: {
      type: "RECEIVE",
      amount: 350000,
      label: "Được nhận",
    },
    coverGradient: {
      from: "#D9ED92",
      via: "#52B69A",
      to: "#184E77",
    },
  },
  {
    id: "trip-phuquoc-team",
    title: "Phú Quốc cùng team",
    destination: "Phú Quốc, Kiên Giang",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    durationText: "4 ngày 3 đêm",
    status: "SETTLING", // "Đang thanh toán"
    inviteCode: "PQ2026-TEAM01",
    updatedAt: "2026-10-17T09:30:00Z",
    members: [
      { id: "m6", name: "Hoàng Anh", role: "HOST" },
      { id: "m7", name: "Bảo Minh", role: "MEMBER" },
      { id: "m8", name: "Khánh Duy", role: "MEMBER" },
      { id: "m9", name: "Lan Nguyễn", role: "MEMBER" },
      { id: "m10", name: "Phương Linh", role: "MEMBER" },
      { id: "m11", name: "Văn An", role: "MEMBER", isNoAccount: true },
    ],
    totalMembers: 6,
    userBalance: {
      type: "PAY",
      amount: 120000,
      label: "Cần trả",
    },
    coverGradient: {
      from: "#34A0A4",
      via: "#168AAD",
      to: "#184E77",
    },
  },
  {
    id: "trip-sapa-harvest",
    title: "Sa Pa mùa lúa chín",
    destination: "Sa Pa, Lào Cai",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    durationText: "4 ngày 3 đêm",
    status: "COMPLETED", // "Đã hoàn tất"
    inviteCode: "SP2026-LUA99",
    updatedAt: "2026-10-13T16:00:00Z",
    members: [
      { id: "m12", name: "Phương Linh", role: "HOST" },
      { id: "m13", name: "Việt Anh", role: "MEMBER" },
      { id: "m14", name: "Tiến Đạt", role: "MEMBER" },
      { id: "m15", name: "Lan Nguyễn", role: "MEMBER" },
    ],
    totalMembers: 4,
    userBalance: {
      type: "SETTLED",
      amount: 0,
      label: "Đã xong",
    },
    coverGradient: {
      from: "#99D98C",
      via: "#52B69A",
      to: "#1E6091",
    },
  },
]);

/**
 * Validates invite code format according to project specifications:
 * - 10-12 alphanumeric characters excluding hyphens
 * - Rejects 6-character codes
 * - Normalizes leading/trailing whitespace and uppercase
 * - Validates hyphen formatting (cannot start/end with hyphen, no consecutive hyphens)
 * - Returns structured validation result
 */
export function validateInviteCode(rawCode: string | null | undefined): InviteCodeValidationResult {
  if (!rawCode) {
    return {
      isValid: false,
      error: "Vui lòng nhập mã mời.",
    };
  }

  // 1. Normalize whitespace & uppercase
  const normalized = rawCode.trim().toUpperCase();

  if (!normalized) {
    return {
      isValid: false,
      error: "Vui lòng nhập mã mời.",
    };
  }

  // 2. Validate allowed characters: only alphanumeric [A-Z0-9] and hyphen [-]
  if (!/^[A-Z0-9-]+$/.test(normalized)) {
    return {
      isValid: false,
      error: "Mã mời chỉ được chứa chữ cái (A-Z), số (0-9) và dấu gạch nối (-).",
    };
  }

  // 3. Validate hyphen formatting & count limit (at most 1 hyphen allowed, e.g. DL3N2D-TRIP99)
  const hyphenCount = (normalized.match(/-/g) || []).length;
  if (hyphenCount > 1) {
    return {
      isValid: false,
      error: "Mã mời chỉ được chứa tối đa 1 dấu gạch nối phân đoạn.",
    };
  }

  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    return {
      isValid: false,
      error: "Dấu gạch nối không đúng định dạng (không được ở đầu hoặc cuối mã mời).",
    };
  }

  // 4. Count alphanumeric characters (excluding hyphens)
  const alnumOnly = normalized.replace(/-/g, "");

  if (alnumOnly.length < 10) {
    return {
      isValid: false,
      error: "Mã mời quá ngắn (phải có từ 10 đến 12 ký tự chữ/số, không tính dấu gạch nối).",
    };
  }

  if (alnumOnly.length > 12) {
    return {
      isValid: false,
      error: "Mã mời quá dài (tối đa 12 ký tự chữ/số, không tính dấu gạch nối).",
    };
  }

  // 5. Total raw string length must not exceed 13 characters (matching ERD varchar(13))
  if (normalized.length > 13) {
    return {
      isValid: false,
      error: "Độ dài mã mời không được vượt quá 13 ký tự.",
    };
  }

  return {
    isValid: true,
    normalizedCode: normalized,
  };
}

/**
 * Calculates overall summary of balances across all trips for the current user.
 */
export function getOverallBalance(trips: readonly Trip[] = MOCK_TRIPS): OverallBalanceSummary {
  let toReceive = 0;
  let toPay = 0;

  for (const trip of trips) {
    if (trip.userBalance.type === "RECEIVE") {
      toReceive += trip.userBalance.amount;
    } else if (trip.userBalance.type === "PAY") {
      toPay += trip.userBalance.amount;
    }
  }

  return {
    toReceive,
    toPay,
    net: toReceive - toPay,
  };
}

/**
 * Filters trips based on the active tab:
 * - 'all': All trips
 * - 'active': 'ACTIVE' (Đang lên kế hoạch) or 'SETTLING' (Đang thanh toán)
 * - 'completed': 'COMPLETED' (Đã hoàn tất)
 * Guaranteed not to mutate input array.
 */
export function filterTrips(trips: readonly Trip[], tab: TripFilterTab): Trip[] {
  const copy = [...trips];
  if (tab === "active") {
    return copy.filter((t) => t.status === "ACTIVE" || t.status === "SETTLING");
  }
  if (tab === "completed") {
    return copy.filter((t) => t.status === "COMPLETED");
  }
  return copy;
}

/**
 * Sorts trips based on selected option:
 * - 'latest': Most recently updated first (updatedAt descending)
 * - 'departure': Earliest start date first (startDate ascending)
 * - 'name': Alphabetical by title (A-Z)
 * Guaranteed not to mutate input array.
 */
export function sortTrips(trips: readonly Trip[], sortBy: TripSortOption): Trip[] {
  const copy = [...trips];

  switch (sortBy) {
    case "latest":
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case "departure":
      return copy.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    case "name":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    default:
      return copy;
  }
}

/**
 * Detailed mock data for individual trips, keyed by trip ID.
 * Follows approved terminology:
 * - "Trưởng nhóm" (for HOST role)
 * - "Chưa có tài khoản" (for isNoAccount: true)
 * - "Mã mời" (for invite code)
 */
export const MOCK_TRIP_DETAILS: Record<string, TripDetailData> = Object.freeze({
  "trip-dalat-3n2d": {
    id: "trip-dalat-3n2d",
    title: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    durationText: "3 ngày 2 đêm",
    status: "ACTIVE", // Đang lên kế hoạch
    inviteCode: "DL3N2D-TRIP99",
    updatedAt: "2026-10-16T10:00:00Z",
    totalMembers: 5,
    userBalance: {
      type: "RECEIVE",
      amount: 350000,
      label: "Được nhận",
    },
    coverGradient: {
      from: "#D9ED92",
      via: "#52B69A",
      to: "#184E77",
    },
    plannedBudget: 10000000,
    totalSpent: 8450000,
    userSpent: 2350000,
    expenseCount: 14,
    paidActivitiesCount: 4,
    members: [
      { id: "m1", name: "Lan Nguyễn", role: "HOST", spentAmount: 2350000, isCurrentUser: true },
      { id: "m2", name: "Tuấn Huy", role: "MEMBER", spentAmount: 3100000 },
      { id: "m3", name: "Quang Minh", role: "MEMBER", spentAmount: 1800000 },
      { id: "m4", name: "Thanh Quang", role: "MEMBER", spentAmount: 1200000 },
      { id: "m5", name: "Thu Hà", role: "MEMBER", spentAmount: 0, isNoAccount: true },
    ],
    recentExpenses: [
      {
        id: "exp-1",
        title: "Ăn tối quán Lẩu Bò Ba Toa",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Lan",
        spentAtFormatted: "20/11 - 19:30",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 1060000,
        userAmount: 212000,
      },
      {
        id: "exp-2",
        title: "Vé cáp treo Đồi Robin",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Huy",
        spentAtFormatted: "21/11 - 09:15",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 750000,
        userAmount: 150000,
      },
      {
        id: "exp-3",
        title: "Thuê xe máy 3 ngày",
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByName: "Minh",
        spentAtFormatted: "20/11 - 08:00",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 1200000,
        userAmount: 240000,
      },
      {
        id: "exp-4",
        title: "Cafe Cheo Veooo hoàng hôn",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Quang",
        spentAtFormatted: "21/11 - 16:45",
        splitMethodText: "Chia theo món",
        totalAmount: 480000,
        userAmount: 95000,
      },
    ],
    expenses: [
      {
        id: "exp-dl-01",
        tripId: "trip-dalat-3n2d",
        title: "Lẩu bò Ba Toa quán gỗ",
        amount: 1060000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m1",
        paidByName: "Lan Nguyễn",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-20T12:45:00Z",
        spentAtFormatted: "20/11 - 12:45",
        spentDate: "2026-11-20",
        locationName: "Quán Gỗ Ba Toa",
        receiptImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        note: "Bàn 5 người gồm 1 lẩu lớn + rau thêm",
        shares: [
          { id: "s1", expenseId: "exp-dl-01", memberId: "m1", amount: 212000, hasRemainderExtra: false },
          { id: "s2", expenseId: "exp-dl-01", memberId: "m2", amount: 212000, hasRemainderExtra: false },
          { id: "s3", expenseId: "exp-dl-01", memberId: "m3", amount: 212000, hasRemainderExtra: false },
          { id: "s4", expenseId: "exp-dl-01", memberId: "m4", amount: 212000, hasRemainderExtra: false },
          { id: "s5", expenseId: "exp-dl-01", memberId: "m5", amount: 212000, hasRemainderExtra: false },
        ],
      },
      {
        id: "exp-dl-02",
        tripId: "trip-dalat-3n2d",
        title: "Thuê xe máy 3 ngày",
        amount: 1200000,
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByMemberId: "m3",
        paidByName: "Quang Minh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-20T08:30:00Z",
        spentAtFormatted: "20/11 - 08:30",
        spentDate: "2026-11-20",
        locationName: "Cửa hàng Cho thuê xe Minh Phát",
        shares: [
          { id: "s6", expenseId: "exp-dl-02", memberId: "m1", amount: 240000 },
          { id: "s7", expenseId: "exp-dl-02", memberId: "m2", amount: 240000 },
          { id: "s8", expenseId: "exp-dl-02", memberId: "m3", amount: 240000 },
          { id: "s9", expenseId: "exp-dl-02", memberId: "m4", amount: 240000 },
          { id: "s10", expenseId: "exp-dl-02", memberId: "m5", amount: 240000 },
        ],
      },
      {
        id: "exp-dl-03",
        tripId: "trip-dalat-3n2d",
        title: "Cà phê Tùng khu Hòa Bình",
        amount: 410000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m2",
        paidByName: "Tuấn Huy",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-20T15:00:00Z",
        spentAtFormatted: "20/11 - 15:00",
        spentDate: "2026-11-20",
        locationName: "Cafe Tùng Đà Lạt",
        shares: [
          { id: "s11", expenseId: "exp-dl-03", memberId: "m1", amount: 82000 },
          { id: "s12", expenseId: "exp-dl-03", memberId: "m2", amount: 82000 },
          { id: "s13", expenseId: "exp-dl-03", memberId: "m3", amount: 82000 },
          { id: "s14", expenseId: "exp-dl-03", memberId: "m4", amount: 82000 },
          { id: "s15", expenseId: "exp-dl-03", memberId: "m5", amount: 82000 },
        ],
      },
      {
        id: "exp-dl-04",
        tripId: "trip-dalat-3n2d",
        title: "Khách sạn Colline tiền cọc",
        amount: 750000,
        category: "LODGING",
        categoryLabel: "Lưu trú",
        paidByMemberId: "m1",
        paidByName: "Lan Nguyễn",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-20T14:00:00Z",
        spentAtFormatted: "20/11 - 14:00",
        spentDate: "2026-11-20",
        locationName: "Hôtel Colline Đà Lạt",
        shares: [
          { id: "s16", expenseId: "exp-dl-04", memberId: "m1", amount: 150000 },
          { id: "s17", expenseId: "exp-dl-04", memberId: "m2", amount: 150000 },
          { id: "s18", expenseId: "exp-dl-04", memberId: "m3", amount: 150000 },
          { id: "s19", expenseId: "exp-dl-04", memberId: "m4", amount: 150000 },
          { id: "s20", expenseId: "exp-dl-04", memberId: "m5", amount: 150000 },
        ],
      },
      {
        id: "exp-dl-05",
        tripId: "trip-dalat-3n2d",
        title: "Vé cáp treo Đồi Robin",
        amount: 750000,
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByMemberId: "m2",
        paidByName: "Tuấn Huy",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-21T09:15:00Z",
        spentAtFormatted: "21/11 - 09:15",
        spentDate: "2026-11-21",
        locationName: "Cáp treo Đồi Robin",
        shares: [
          { id: "s21", expenseId: "exp-dl-05", memberId: "m1", amount: 150000 },
          { id: "s22", expenseId: "exp-dl-05", memberId: "m2", amount: 150000 },
          { id: "s23", expenseId: "exp-dl-05", memberId: "m3", amount: 150000 },
          { id: "s24", expenseId: "exp-dl-05", memberId: "m4", amount: 150000 },
          { id: "s25", expenseId: "exp-dl-05", memberId: "m5", amount: 150000 },
        ],
      },
      {
        id: "exp-dl-06",
        tripId: "trip-dalat-3n2d",
        title: "Dâu tây hái tại vườn",
        amount: 410000,
        category: "SHOPPING",
        categoryLabel: "Mua sắm",
        paidByMemberId: "m4",
        paidByName: "Thanh Quang",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-21T10:45:00Z",
        spentAtFormatted: "21/11 - 10:45",
        spentDate: "2026-11-21",
        locationName: "Vườn dâu Hiệp Lực",
        shares: [
          { id: "s26", expenseId: "exp-dl-06", memberId: "m1", amount: 82000 },
          { id: "s27", expenseId: "exp-dl-06", memberId: "m2", amount: 82000 },
          { id: "s28", expenseId: "exp-dl-06", memberId: "m3", amount: 82000 },
          { id: "s29", expenseId: "exp-dl-06", memberId: "m4", amount: 82000 },
          { id: "s30", expenseId: "exp-dl-06", memberId: "m5", amount: 82000 },
        ],
      },
      {
        id: "exp-dl-07",
        tripId: "trip-dalat-3n2d",
        title: "Bánh tráng nướng Dì Đinh",
        amount: 110000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m1",
        paidByName: "Lan Nguyễn",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-21T17:30:00Z",
        spentAtFormatted: "21/11 - 17:30",
        spentDate: "2026-11-21",
        locationName: "Chợ đêm Đà Lạt",
        shares: [
          { id: "s31", expenseId: "exp-dl-07", memberId: "m1", amount: 22000 },
          { id: "s32", expenseId: "exp-dl-07", memberId: "m2", amount: 22000 },
          { id: "s33", expenseId: "exp-dl-07", memberId: "m3", amount: 22000 },
          { id: "s34", expenseId: "exp-dl-07", memberId: "m4", amount: 22000 },
          { id: "s35", expenseId: "exp-dl-07", memberId: "m5", amount: 22000 },
        ],
      },
      {
        id: "exp-dl-08",
        tripId: "trip-dalat-3n2d",
        title: "Cafe Cheo Veooo hoàng hôn",
        amount: 480000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m4",
        paidByName: "Thanh Quang",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-21T16:45:00Z",
        spentAtFormatted: "21/11 - 16:45",
        spentDate: "2026-11-21",
        locationName: "Tiệm cà phê Cheo Veooo",
        receiptImageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
        shares: [
          { id: "s36", expenseId: "exp-dl-08", memberId: "m1", amount: 96000 },
          { id: "s37", expenseId: "exp-dl-08", memberId: "m2", amount: 96000 },
          { id: "s38", expenseId: "exp-dl-08", memberId: "m3", amount: 96000 },
          { id: "s39", expenseId: "exp-dl-08", memberId: "m4", amount: 96000 },
          { id: "s40", expenseId: "exp-dl-08", memberId: "m5", amount: 96000 },
        ],
      },
      {
        id: "exp-dl-09",
        tripId: "trip-dalat-3n2d",
        title: "Cơm niêu Như Ngọc trưa",
        amount: 1850000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m2",
        paidByName: "Tuấn Huy",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-22T12:00:00Z",
        spentAtFormatted: "22/11 - 12:00",
        spentDate: "2026-11-22",
        locationName: "Cơm Niêu Như Ngọc",
        shares: [
          { id: "s41", expenseId: "exp-dl-09", memberId: "m1", amount: 370000 },
          { id: "s42", expenseId: "exp-dl-09", memberId: "m2", amount: 370000 },
          { id: "s43", expenseId: "exp-dl-09", memberId: "m3", amount: 370000 },
          { id: "s44", expenseId: "exp-dl-09", memberId: "m4", amount: 370000 },
          { id: "s45", expenseId: "exp-dl-09", memberId: "m5", amount: 370000 },
        ],
      },
      {
        id: "exp-dl-10",
        tripId: "trip-dalat-3n2d",
        title: "Taxi ra sân bay Liên Khương",
        amount: 430000,
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByMemberId: "m1",
        paidByName: "Lan Nguyễn",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-22T15:30:00Z",
        spentAtFormatted: "22/11 - 15:30",
        spentDate: "2026-11-22",
        locationName: "Sân bay Liên Khương",
        shares: [
          { id: "s46", expenseId: "exp-dl-10", memberId: "m1", amount: 86000 },
          { id: "s47", expenseId: "exp-dl-10", memberId: "m2", amount: 86000 },
          { id: "s48", expenseId: "exp-dl-10", memberId: "m3", amount: 86000 },
          { id: "s49", expenseId: "exp-dl-10", memberId: "m4", amount: 86000 },
          { id: "s50", expenseId: "exp-dl-10", memberId: "m5", amount: 86000 },
        ],
      },
      {
        id: "exp-dl-11",
        tripId: "trip-dalat-3n2d",
        title: "Mua đặc sản mứt Atiso",
        amount: 1000000,
        category: "SHOPPING",
        categoryLabel: "Mua sắm",
        paidByMemberId: "m3",
        paidByName: "Quang Minh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 5 người",
        spentAt: "2026-11-22T14:00:00Z",
        spentAtFormatted: "22/11 - 14:00",
        spentDate: "2026-11-22",
        locationName: "L'angfarm Store Chợ Đà Lạt",
        shares: [
          { id: "s51", expenseId: "exp-dl-11", memberId: "m1", amount: 200000 },
          { id: "s52", expenseId: "exp-dl-11", memberId: "m2", amount: 200000 },
          { id: "s53", expenseId: "exp-dl-11", memberId: "m3", amount: 200000 },
          { id: "s54", expenseId: "exp-dl-11", memberId: "m4", amount: 200000 },
          { id: "s55", expenseId: "exp-dl-11", memberId: "m5", amount: 200000 },
        ],
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 45, amount: 3800000, color: "#34A0A4" },
      { category: "Di chuyển", percentage: 30, amount: 2535000, color: "#1A759F" },
      { category: "Tham quan", percentage: 15, amount: 1267500, color: "#76C893" },
      { category: "Khác", percentage: 10, amount: 847500, color: "#D9ED92" },
    ],
    nextDestination: {
      title: "Đồi chè Cầu Đất & Cà phê sương sớm",
      label: "Điểm đến tiếp theo",
    },
    weatherInfo: {
      locationName: "Đà Lạt",
      temperature: "18°C",
      description: "Se se lạnh, có sương mai (Minh họa)",
    },
  },

  "trip-phuquoc-team": {
    id: "trip-phuquoc-team",
    title: "Phú Quốc cùng team",
    destination: "Phú Quốc, Kiên Giang",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    durationText: "4 ngày 3 đêm",
    status: "SETTLING", // Đang thanh toán
    inviteCode: "PQ2026-TEAM01",
    updatedAt: "2026-10-17T09:30:00Z",
    totalMembers: 6,
    userBalance: {
      type: "PAY",
      amount: 120000,
      label: "Cần trả",
    },
    coverGradient: {
      from: "#34A0A4",
      via: "#168AAD",
      to: "#184E77",
    },
    plannedBudget: 20000000,
    totalSpent: 18500000,
    userSpent: 1200000,
    expenseCount: 8,
    paidActivitiesCount: 2,
    members: [
      { id: "m6", name: "Hoàng Anh", role: "HOST", spentAmount: 8500000 },
      { id: "m7", name: "Bảo Minh", role: "MEMBER", spentAmount: 4200000 },
      { id: "m8", name: "Khánh Duy", role: "MEMBER", spentAmount: 3600000 },
      { id: "m9", name: "Lan Nguyễn", role: "MEMBER", spentAmount: 1200000, isCurrentUser: true },
      { id: "m10", name: "Phương Linh", role: "MEMBER", spentAmount: 1000000 },
      { id: "m11", name: "Văn An", role: "MEMBER", spentAmount: 0, isNoAccount: true },
    ],
    recentExpenses: [
      {
        id: "exp-5",
        title: "Hải sản Làng chài Hàm Ninh",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Hoàng Anh",
        spentAtFormatted: "12/12 - 19:00",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 3600000,
        userAmount: 600000,
      },
      {
        id: "exp-6",
        title: "Cano tham quan 4 đảo & lặn ngắm san hô",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Bảo Minh",
        spentAtFormatted: "13/12 - 08:30",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 4800000,
        userAmount: 800000,
      },
      {
        id: "exp-7",
        title: "Thuê xe 7 chỗ đón sân bay & di chuyển",
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByName: "Lan",
        spentAtFormatted: "12/12 - 14:00",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 1200000,
        userAmount: 200000,
      },
    ],
    expenses: [
      {
        id: "exp-pq-01",
        tripId: "trip-phuquoc-team",
        title: "Hải sản Làng chài Hàm Ninh",
        amount: 3600000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m6",
        paidByName: "Hoàng Anh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-12T19:00:00Z",
        spentAtFormatted: "12/12 - 19:00",
        spentDate: "2026-12-12",
        locationName: "Làng chài Hàm Ninh",
        shares: [
          { id: "spq-1", expenseId: "exp-pq-01", memberId: "m6", amount: 600000 },
          { id: "spq-2", expenseId: "exp-pq-01", memberId: "m7", amount: 600000 },
          { id: "spq-3", expenseId: "exp-pq-01", memberId: "m8", amount: 600000 },
          { id: "spq-4", expenseId: "exp-pq-01", memberId: "m9", amount: 600000 },
          { id: "spq-5", expenseId: "exp-pq-01", memberId: "m10", amount: 600000 },
          { id: "spq-6", expenseId: "exp-pq-01", memberId: "m11", amount: 600000 },
        ],
      },
      {
        id: "exp-pq-02",
        tripId: "trip-phuquoc-team",
        title: "Cano tham quan 4 đảo & lặn ngắm san hô",
        amount: 4800000,
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByMemberId: "m7",
        paidByName: "Bảo Minh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-13T08:30:00Z",
        spentAtFormatted: "13/12 - 08:30",
        spentDate: "2026-12-13",
        locationName: "Cảng An Thới",
        shares: [
          { id: "spq-7", expenseId: "exp-pq-02", memberId: "m6", amount: 800000 },
          { id: "spq-8", expenseId: "exp-pq-02", memberId: "m7", amount: 800000 },
          { id: "spq-9", expenseId: "exp-pq-02", memberId: "m8", amount: 800000 },
          { id: "spq-10", expenseId: "exp-pq-02", memberId: "m9", amount: 800000 },
          { id: "spq-11", expenseId: "exp-pq-02", memberId: "m10", amount: 800000 },
          { id: "spq-12", expenseId: "exp-pq-02", memberId: "m11", amount: 800000 },
        ],
      },
      {
        id: "exp-pq-03",
        tripId: "trip-phuquoc-team",
        title: "Thuê xe 7 chỗ đón sân bay & di chuyển",
        amount: 1200000,
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByMemberId: "m9",
        paidByName: "Lan Nguyễn",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-12T14:00:00Z",
        spentAtFormatted: "12/12 - 14:00",
        spentDate: "2026-12-12",
        locationName: "Sân bay Phú Quốc",
        shares: [
          { id: "spq-13", expenseId: "exp-pq-03", memberId: "m6", amount: 200000 },
          { id: "spq-14", expenseId: "exp-pq-03", memberId: "m7", amount: 200000 },
          { id: "spq-15", expenseId: "exp-pq-03", memberId: "m8", amount: 200000 },
          { id: "spq-16", expenseId: "exp-pq-03", memberId: "m9", amount: 200000 },
          { id: "spq-17", expenseId: "exp-pq-03", memberId: "m10", amount: 200000 },
          { id: "spq-18", expenseId: "exp-pq-03", memberId: "m11", amount: 200000 },
        ],
      },
      {
        id: "exp-pq-04",
        tripId: "trip-phuquoc-team",
        title: "Resort Novotel Phú Quốc tiền phòng",
        amount: 4500000,
        category: "LODGING",
        categoryLabel: "Lưu trú",
        paidByMemberId: "m6",
        paidByName: "Hoàng Anh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-12T12:00:00Z",
        spentAtFormatted: "12/12 - 12:00",
        spentDate: "2026-12-12",
        locationName: "Novotel Phu Quoc Resort",
        shares: [
          { id: "spq-19", expenseId: "exp-pq-04", memberId: "m6", amount: 750000 },
          { id: "spq-20", expenseId: "exp-pq-04", memberId: "m7", amount: 750000 },
          { id: "spq-21", expenseId: "exp-pq-04", memberId: "m8", amount: 750000 },
          { id: "spq-22", expenseId: "exp-pq-04", memberId: "m9", amount: 750000 },
          { id: "spq-23", expenseId: "exp-pq-04", memberId: "m10", amount: 750000 },
          { id: "spq-24", expenseId: "exp-pq-04", memberId: "m11", amount: 750000 },
        ],
      },
      {
        id: "exp-pq-05",
        tripId: "trip-phuquoc-team",
        title: "Bún quậy Kiến Xây bữa sáng",
        amount: 600000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m8",
        paidByName: "Khánh Duy",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-13T07:30:00Z",
        spentAtFormatted: "13/12 - 07:30",
        spentDate: "2026-12-13",
        locationName: "Bún Quậy Kiến Xây",
        shares: [
          { id: "spq-25", expenseId: "exp-pq-05", memberId: "m6", amount: 100000 },
          { id: "spq-26", expenseId: "exp-pq-05", memberId: "m7", amount: 100000 },
          { id: "spq-27", expenseId: "exp-pq-05", memberId: "m8", amount: 100000 },
          { id: "spq-28", expenseId: "exp-pq-05", memberId: "m9", amount: 100000 },
          { id: "spq-29", expenseId: "exp-pq-05", memberId: "m10", amount: 100000 },
          { id: "spq-30", expenseId: "exp-pq-05", memberId: "m11", amount: 100000 },
        ],
      },
      {
        id: "exp-pq-06",
        tripId: "trip-phuquoc-team",
        title: "Vé VinWonders & Safari Phú Quốc",
        amount: 2200000,
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByMemberId: "m10",
        paidByName: "Phương Linh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-14T09:00:00Z",
        spentAtFormatted: "14/12 - 09:00",
        spentDate: "2026-12-14",
        locationName: "VinWonders Phú Quốc",
        shares: [
          { id: "spq-31", expenseId: "exp-pq-06", memberId: "m6", amount: 366667, hasRemainderExtra: true },
          { id: "spq-32", expenseId: "exp-pq-06", memberId: "m7", amount: 366667, hasRemainderExtra: true },
          { id: "spq-33", expenseId: "exp-pq-06", memberId: "m8", amount: 366667, hasRemainderExtra: true },
          { id: "spq-34", expenseId: "exp-pq-06", memberId: "m9", amount: 366667, hasRemainderExtra: true },
          { id: "spq-35", expenseId: "exp-pq-06", memberId: "m10", amount: 366666 },
          { id: "spq-36", expenseId: "exp-pq-06", memberId: "m11", amount: 366666 },
        ],
      },
      {
        id: "exp-pq-07",
        tripId: "trip-phuquoc-team",
        title: "Nước mắm Khải Hoàn đặc sản quà biếu",
        amount: 800000,
        category: "SHOPPING",
        categoryLabel: "Mua sắm",
        paidByMemberId: "m8",
        paidByName: "Khánh Duy",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-14T16:00:00Z",
        spentAtFormatted: "14/12 - 16:00",
        spentDate: "2026-12-14",
        locationName: "Nhà thùng nước mắm Khải Hoàn",
        shares: [
          { id: "spq-37", expenseId: "exp-pq-07", memberId: "m6", amount: 133334, hasRemainderExtra: true },
          { id: "spq-38", expenseId: "exp-pq-07", memberId: "m7", amount: 133334, hasRemainderExtra: true },
          { id: "spq-39", expenseId: "exp-pq-07", memberId: "m8", amount: 133333 },
          { id: "spq-40", expenseId: "exp-pq-07", memberId: "m9", amount: 133333 },
          { id: "spq-41", expenseId: "exp-pq-07", memberId: "m10", amount: 133333 },
          { id: "spq-42", expenseId: "exp-pq-07", memberId: "m11", amount: 133333 },
        ],
      },
      {
        id: "exp-pq-08",
        tripId: "trip-phuquoc-team",
        title: "Bar Sunset Sanato ngắm hoàng hôn",
        amount: 800000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m7",
        paidByName: "Bảo Minh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 6 người",
        spentAt: "2026-12-14T18:00:00Z",
        spentAtFormatted: "14/12 - 18:00",
        spentDate: "2026-12-14",
        locationName: "Sunset Sanato Beach Club",
        shares: [
          { id: "spq-43", expenseId: "exp-pq-08", memberId: "m6", amount: 133334, hasRemainderExtra: true },
          { id: "spq-44", expenseId: "exp-pq-08", memberId: "m7", amount: 133334, hasRemainderExtra: true },
          { id: "spq-45", expenseId: "exp-pq-08", memberId: "m8", amount: 133333 },
          { id: "spq-46", expenseId: "exp-pq-08", memberId: "m9", amount: 133333 },
          { id: "spq-47", expenseId: "exp-pq-08", memberId: "m10", amount: 133333 },
          { id: "spq-48", expenseId: "exp-pq-08", memberId: "m11", amount: 133333 },
        ],
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 40, amount: 7400000, color: "#34A0A4" },
      { category: "Tham quan", percentage: 35, amount: 6475000, color: "#1A759F" },
      { category: "Di chuyển", percentage: 20, amount: 3700000, color: "#76C893" },
      { category: "Khác", percentage: 5, amount: 925000, color: "#D9ED92" },
    ],
    nextDestination: {
      title: "Ngắm hoàng hôn Bãi Sao & Sunset Sanato",
      label: "Điểm đến tiếp theo",
    },
    weatherInfo: {
      locationName: "Phú Quốc",
      temperature: "29°C",
      description: "Nắng ráo, biển êm dịu (Minh họa)",
    },
  },

  "trip-sapa-harvest": {
    id: "trip-sapa-harvest",
    title: "Sa Pa mùa lúa chín",
    destination: "Sa Pa, Lào Cai",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    durationText: "4 ngày 3 đêm",
    status: "COMPLETED", // Đã hoàn tất
    inviteCode: "SP2026-LUA99",
    updatedAt: "2026-10-13T16:00:00Z",
    totalMembers: 4,
    userBalance: {
      type: "SETTLED",
      amount: 0,
      label: "Đã xong",
    },
    coverGradient: {
      from: "#99D98C",
      via: "#52B69A",
      to: "#1E6091",
    },
    plannedBudget: 12000000,
    totalSpent: 11200000,
    userSpent: 3000000,
    expenseCount: 6,
    paidActivitiesCount: 2,
    members: [
      { id: "m12", name: "Phương Linh", role: "HOST", spentAmount: 4500000 },
      { id: "m13", name: "Việt Anh", role: "MEMBER", spentAmount: 2200000 },
      { id: "m14", name: "Tiến Đạt", role: "MEMBER", spentAmount: 1500000 },
      { id: "m15", name: "Lan Nguyễn", role: "MEMBER", spentAmount: 3000000, isCurrentUser: true },
    ],
    recentExpenses: [
      {
        id: "exp-8",
        title: "Lẩu cá tầm Sapa ấm cúng",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Phương Linh",
        spentAtFormatted: "10/10 - 19:30",
        splitMethodText: "Chia đều 4 người",
        totalAmount: 1800000,
        userAmount: 450000,
      },
      {
        id: "exp-9",
        title: "Vé cáp treo Fansipan nóc nhà Đông Dương",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Lan",
        spentAtFormatted: "11/10 - 08:30",
        splitMethodText: "Chia đều 4 người",
        totalAmount: 3000000,
        userAmount: 750000,
      },
    ],
    expenses: [
      {
        id: "exp-sp-01",
        tripId: "trip-sapa-harvest",
        title: "Lẩu cá tầm Sapa ấm cúng",
        amount: 1800000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m12",
        paidByName: "Phương Linh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 4 người",
        spentAt: "2026-10-10T19:30:00Z",
        spentAtFormatted: "10/10 - 19:30",
        spentDate: "2026-10-10",
        locationName: "Nhà hàng Cá Hồi Sapa",
        shares: [
          { id: "ssp-1", expenseId: "exp-sp-01", memberId: "m12", amount: 450000 },
          { id: "ssp-2", expenseId: "exp-sp-01", memberId: "m13", amount: 450000 },
          { id: "ssp-3", expenseId: "exp-sp-01", memberId: "m14", amount: 450000 },
          { id: "ssp-4", expenseId: "exp-sp-01", memberId: "m15", amount: 450000 },
        ],
      },
      {
        id: "exp-sp-02",
        tripId: "trip-sapa-harvest",
        title: "Vé cáp treo Fansipan nóc nhà Đông Dương",
        amount: 3000000,
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByMemberId: "m15",
        paidByName: "Lan Nguyễn",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 4 người",
        spentAt: "2026-10-11T08:30:00Z",
        spentAtFormatted: "11/10 - 08:30",
        spentDate: "2026-10-11",
        locationName: "Sun World Fansipan Legend",
        shares: [
          { id: "ssp-5", expenseId: "exp-sp-02", memberId: "m12", amount: 750000 },
          { id: "ssp-6", expenseId: "exp-sp-02", memberId: "m13", amount: 750000 },
          { id: "ssp-7", expenseId: "exp-sp-02", memberId: "m14", amount: 750000 },
          { id: "ssp-8", expenseId: "exp-sp-02", memberId: "m15", amount: 750000 },
        ],
      },
      {
        id: "exp-sp-03",
        tripId: "trip-sapa-harvest",
        title: "Homestay Bản Cát Cát ngắm thung lũng",
        amount: 2400000,
        category: "LODGING",
        categoryLabel: "Lưu trú",
        paidByMemberId: "m12",
        paidByName: "Phương Linh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 4 người",
        spentAt: "2026-10-10T14:00:00Z",
        spentAtFormatted: "10/10 - 14:00",
        spentDate: "2026-10-10",
        locationName: "Catcat Hills Homestay",
        shares: [
          { id: "ssp-9", expenseId: "exp-sp-03", memberId: "m12", amount: 600000 },
          { id: "ssp-10", expenseId: "exp-sp-03", memberId: "m13", amount: 600000 },
          { id: "ssp-11", expenseId: "exp-sp-03", memberId: "m14", amount: 600000 },
          { id: "ssp-12", expenseId: "exp-sp-03", memberId: "m15", amount: 600000 },
        ],
      },
      {
        id: "exp-sp-04",
        tripId: "trip-sapa-harvest",
        title: "Thuê xe máy leo đèo Ô Quy Hồ",
        amount: 1200000,
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByMemberId: "m13",
        paidByName: "Việt Anh",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 4 người",
        spentAt: "2026-10-11T13:00:00Z",
        spentAtFormatted: "11/10 - 13:00",
        spentDate: "2026-10-11",
        locationName: "Đèo Ô Quy Hồ",
        shares: [
          { id: "ssp-13", expenseId: "exp-sp-04", memberId: "m12", amount: 300000 },
          { id: "ssp-14", expenseId: "exp-sp-04", memberId: "m13", amount: 300000 },
          { id: "ssp-15", expenseId: "exp-sp-04", memberId: "m14", amount: 300000 },
          { id: "ssp-16", expenseId: "exp-sp-04", memberId: "m15", amount: 300000 },
        ],
      },
      {
        id: "exp-sp-05",
        tripId: "trip-sapa-harvest",
        title: "Thịt trâu gác bếp & rượu mận Tây Bắc",
        amount: 1600000,
        category: "SHOPPING",
        categoryLabel: "Mua sắm",
        paidByMemberId: "m14",
        paidByName: "Tiến Đạt",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 4 người",
        spentAt: "2026-10-12T15:00:00Z",
        spentAtFormatted: "12/10 - 15:00",
        spentDate: "2026-10-12",
        locationName: "Chợ phiên Sa Pa",
        shares: [
          { id: "ssp-17", expenseId: "exp-sp-05", memberId: "m12", amount: 400000 },
          { id: "ssp-18", expenseId: "exp-sp-05", memberId: "m13", amount: 400000 },
          { id: "ssp-19", expenseId: "exp-sp-05", memberId: "m14", amount: 400000 },
          { id: "ssp-20", expenseId: "exp-sp-05", memberId: "m15", amount: 400000 },
        ],
      },
      {
        id: "exp-sp-06",
        tripId: "trip-sapa-harvest",
        title: "Cafe Sailing Sapa ngắm mây",
        amount: 1200000,
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByMemberId: "m14",
        paidByName: "Tiến Đạt",
        splitMethod: "EQUAL",
        splitMethodText: "Chia đều 4 người",
        spentAt: "2026-10-12T17:30:00Z",
        spentAtFormatted: "12/10 - 17:30",
        spentDate: "2026-10-12",
        locationName: "Sailing Sapa Cafe",
        shares: [
          { id: "ssp-21", expenseId: "exp-sp-06", memberId: "m12", amount: 300000 },
          { id: "ssp-22", expenseId: "exp-sp-06", memberId: "m13", amount: 300000 },
          { id: "ssp-23", expenseId: "exp-sp-06", memberId: "m14", amount: 300000 },
          { id: "ssp-24", expenseId: "exp-sp-06", memberId: "m15", amount: 300000 },
        ],
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 35, amount: 3920000, color: "#34A0A4" },
      { category: "Tham quan", percentage: 35, amount: 3920000, color: "#1A759F" },
      { category: "Di chuyển", percentage: 20, amount: 2240000, color: "#76C893" },
      { category: "Khác", percentage: 10, amount: 1120000, color: "#D9ED92" },
    ],
    nextDestination: {
      title: "Đỉnh Fansipan nóc nhà Đông Dương",
      label: "Điểm đến đã hoàn thành",
    },
    weatherInfo: {
      locationName: "Sa Pa",
      temperature: "15°C",
      description: "Se lạnh, sương mù nhẹ (Minh họa)",
    },
  },
});

/**
 * Retrieves detailed trip data for a given trip ID.
 * Returns null if trip ID does not exist in mock details.
 * Guaranteed pure function that does not mutate mock objects.
 */
export function getTripDetailById(id: string | null | undefined): TripDetailData | null {
  if (!id) return null;
  const detail = MOCK_TRIP_DETAILS[id];
  return detail ? { ...detail } : null;
}

/**
 * Retrieves the full expenses list for a given trip ID.
 * Returns an empty array if trip ID does not exist or has no expenses.
 * Returns a cloned array to prevent inadvertent in-place mutation.
 */
export function getTripExpenses(tripId: string | null | undefined): TripExpense[] {
  if (!tripId) return [];
  const detail = MOCK_TRIP_DETAILS[tripId];
  return detail?.expenses ? detail.expenses.map((exp) => ({ ...exp, shares: [...exp.shares] })) : [];
}
