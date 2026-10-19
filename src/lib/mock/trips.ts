import type {
  Trip,
  TripDetailData,
} from "@/types/trip";

/**
 * Mock current authenticated user profile for UI demonstration.
 */
export const MOCK_CURRENT_USER = {
  id: "usr-current",
  name: "Lan",
  fullName: "Lan Nguyễn",
  email: "lan.nguyen@gmail.com",
  avatarUrl: null,
};

/**
 * Dữ liệu mock chuẩn cho danh sách chuyến đi khớp ERD trips & trip_members:
 * - name thay cho title
 * - TripMember có status: "ACTIVE" và joinOrder
 * - Không lưu cứng các trường dẫn xuất (durationText, totalMembers, coverGradient, userBalance.label)
 */
export const MOCK_TRIPS: readonly Trip[] = Object.freeze([
  {
    id: "trip-dalat-3n2d",
    name: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    budgetAmount: 10000000,
    status: "ACTIVE",
    inviteCode: "DL3N2D-TRIP99",
    updatedAt: "2026-10-16T10:00:00Z",
    members: [
      { id: "m1", name: "Lan Nguyễn", role: "HOST", status: "ACTIVE", joinOrder: 1, isCurrentUser: true },
      { id: "m2", name: "Tuấn Huy", role: "MEMBER", status: "ACTIVE", joinOrder: 2 },
      { id: "m3", name: "Quang Minh", role: "MEMBER", status: "ACTIVE", joinOrder: 3 },
      { id: "m4", name: "Thanh Quang", role: "MEMBER", status: "ACTIVE", joinOrder: 4 },
      { id: "m5", name: "Thu Hà", role: "MEMBER", status: "ACTIVE", joinOrder: 5 },
    ],
    userBalance: {
      type: "RECEIVE",
      amount: 350000,
    },
  },
  {
    id: "trip-phuquoc-team",
    name: "Phú Quốc cùng team",
    destination: "Phú Quốc, Kiên Giang",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    budgetAmount: 20000000,
    status: "SETTLING",
    inviteCode: "PQ2026-TEAM01",
    updatedAt: "2026-10-17T09:30:00Z",
    members: [
      { id: "m6", name: "Hoàng Anh", role: "HOST", status: "ACTIVE", joinOrder: 1 },
      { id: "m7", name: "Bảo Minh", role: "MEMBER", status: "ACTIVE", joinOrder: 2 },
      { id: "m8", name: "Khánh Duy", role: "MEMBER", status: "ACTIVE", joinOrder: 3 },
      { id: "m9", name: "Lan Nguyễn", role: "MEMBER", status: "ACTIVE", joinOrder: 4, isCurrentUser: true },
      { id: "m10", name: "Phương Linh", role: "MEMBER", status: "ACTIVE", joinOrder: 5 },
      { id: "m11", name: "Văn An", role: "MEMBER", status: "ACTIVE", joinOrder: 6, isNoAccount: true },
    ],
    userBalance: {
      type: "PAY",
      amount: 120000,
    },
  },
  {
    id: "trip-sapa-harvest",
    name: "Sa Pa mùa lúa chín",
    destination: "Sa Pa, Lào Cai",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    budgetAmount: 12000000,
    status: "COMPLETED",
    inviteCode: "SP2026-LUA99",
    updatedAt: "2026-10-13T16:00:00Z",
    members: [
      { id: "m12", name: "Phương Linh", role: "HOST", status: "ACTIVE", joinOrder: 1 },
      { id: "m13", name: "Việt Anh", role: "MEMBER", status: "ACTIVE", joinOrder: 2 },
      { id: "m14", name: "Tiến Đạt", role: "MEMBER", status: "ACTIVE", joinOrder: 3 },
      { id: "m15", name: "Lan Nguyễn", role: "MEMBER", status: "ACTIVE", joinOrder: 4, isCurrentUser: true },
    ],
    userBalance: {
      type: "SETTLED",
      amount: 0,
    },
  },
]);

/**
 * Chi tiết chuyến đi mẫu khớp ERD:
 * - name thay cho title
 * - TripExpense sạch: amount, spentAt ISO, locationName, note, receiptImageUrl, shares
 */
export const MOCK_TRIP_DETAILS: Record<string, TripDetailData> = Object.freeze({
  "trip-dalat-3n2d": {
    id: "trip-dalat-3n2d",
    name: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    budgetAmount: 10000000,
    plannedBudget: 10000000,
    status: "ACTIVE",
    inviteCode: "DL3N2D-TRIP99",
    updatedAt: "2026-10-16T10:00:00Z",
    currentMemberId: "m1",
    totalSpent: 8450000,
    userSpent: 2350000,
    userBalance: {
      type: "RECEIVE",
      amount: 350000,
    },
    expenseCount: 14,
    paidActivitiesCount: 4,
    members: [
      { id: "m1", name: "Lan Nguyễn", email: "lan.nguyen@gmail.com", role: "HOST", status: "ACTIVE", joinOrder: 1, spentAmount: 2350000, isCurrentUser: true },
      { id: "m2", name: "Tuấn Huy", email: "tuan.huy@gmail.com", role: "MEMBER", status: "ACTIVE", joinOrder: 2, spentAmount: 1800000 },
      { id: "m3", name: "Quang Minh", email: "quang.minh@gmail.com", role: "MEMBER", status: "ACTIVE", joinOrder: 3, spentAmount: 2100000 },
      { id: "m4", name: "Thanh Quang", email: "thanh.quang@gmail.com", role: "MEMBER", status: "ACTIVE", joinOrder: 4, spentAmount: 1200000 },
      { id: "m5", name: "Thu Hà", role: "MEMBER", status: "ACTIVE", joinOrder: 5, spentAmount: 1000000, isNoAccount: true, note: "Được Trưởng nhóm tạo để chia tiền" },
    ],
    recentExpenses: [
      {
        id: "exp-dl-01",
        title: "Bánh ướt lòng gà Long",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Lan Nguyễn",
        spentAtFormatted: "20/11 - 19:30",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 1060000,
        userAmount: 212000,
      },
      {
        id: "exp-dl-02",
        title: "Vé Cáp treo Đồi Robin",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Tuấn Huy",
        spentAtFormatted: "20/11 - 15:00",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 750000,
        userAmount: 150000,
      },
      {
        id: "exp-dl-03",
        title: "Thuê xe máy 3 ngày",
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByName: "Quang Minh",
        spentAtFormatted: "20/11 - 09:30",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 1200000,
        userAmount: 240000,
      },
      {
        id: "exp-dl-04",
        title: "Cà phê Túi Mơ To",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Thu Hà",
        spentAtFormatted: "20/11 - 08:00",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 480000,
        userAmount: 96000,
      },
    ],
    expenses: [
      {
        id: "exp-dl-01",
        tripId: "trip-dalat-3n2d",
        title: "Bánh ướt lòng gà Long",
        amount: 1060000,
        category: "FOOD",
        paidByMemberId: "m1",
        splitMethod: "EQUAL",
        spentAt: "2026-11-20T19:30:00.000Z",
        locationName: "Bánh ướt lòng gà Long - Hẻm 202 Phan Đình Phùng",
        shares: [
          { id: "sdl-01", expenseId: "exp-dl-01", memberId: "m1", amount: 212000 },
          { id: "sdl-02", expenseId: "exp-dl-01", memberId: "m2", amount: 212000 },
          { id: "sdl-03", expenseId: "exp-dl-01", memberId: "m3", amount: 212000 },
          { id: "sdl-04", expenseId: "exp-dl-01", memberId: "m4", amount: 212000 },
          { id: "sdl-05", expenseId: "exp-dl-01", memberId: "m5", amount: 212000 },
        ],
      },
      {
        id: "exp-dl-02",
        tripId: "trip-dalat-3n2d",
        title: "Vé Cáp treo Đồi Robin",
        amount: 750000,
        category: "TICKET",
        paidByMemberId: "m2",
        splitMethod: "EQUAL",
        spentAt: "2026-11-20T15:00:00.000Z",
        locationName: "Đồi Robin",
        shares: [
          { id: "sdl-06", expenseId: "exp-dl-02", memberId: "m1", amount: 150000 },
          { id: "sdl-07", expenseId: "exp-dl-02", memberId: "m2", amount: 150000 },
          { id: "sdl-08", expenseId: "exp-dl-02", memberId: "m3", amount: 150000 },
          { id: "sdl-09", expenseId: "exp-dl-02", memberId: "m4", amount: 150000 },
          { id: "sdl-10", expenseId: "exp-dl-02", memberId: "m5", amount: 150000 },
        ],
      },
      {
        id: "exp-dl-03",
        tripId: "trip-dalat-3n2d",
        title: "Thuê xe máy 3 ngày",
        amount: 1200000,
        category: "TRANSPORT",
        paidByMemberId: "m3",
        splitMethod: "EQUAL",
        spentAt: "2026-11-20T09:30:00.000Z",
        locationName: "Cửa hàng xe máy Hoàng Anh",
        shares: [
          { id: "sdl-11", expenseId: "exp-dl-03", memberId: "m1", amount: 240000 },
          { id: "sdl-12", expenseId: "exp-dl-03", memberId: "m2", amount: 240000 },
          { id: "sdl-13", expenseId: "exp-dl-03", memberId: "m3", amount: 240000 },
          { id: "sdl-14", expenseId: "exp-dl-03", memberId: "m4", amount: 240000 },
          { id: "sdl-15", expenseId: "exp-dl-03", memberId: "m5", amount: 240000 },
        ],
      },
      {
        id: "exp-dl-04",
        tripId: "trip-dalat-3n2d",
        title: "Cà phê Túi Mơ To",
        amount: 480000,
        category: "FOOD",
        paidByMemberId: "m5",
        splitMethod: "EQUAL",
        spentAt: "2026-11-20T08:00:00.000Z",
        locationName: "Tiệm cà phê Túi Mơ To",
        shares: [
          { id: "sdl-16", expenseId: "exp-dl-04", memberId: "m1", amount: 96000 },
          { id: "sdl-17", expenseId: "exp-dl-04", memberId: "m2", amount: 96000 },
          { id: "sdl-18", expenseId: "exp-dl-04", memberId: "m3", amount: 96000 },
          { id: "sdl-19", expenseId: "exp-dl-04", memberId: "m4", amount: 96000 },
          { id: "sdl-20", expenseId: "exp-dl-04", memberId: "m5", amount: 96000 },
        ],
      },
      {
        id: "exp-dl-05",
        tripId: "trip-dalat-3n2d",
        title: "Lẩu gà lá é Tao Ngộ",
        amount: 850000,
        category: "FOOD",
        paidByMemberId: "m4",
        splitMethod: "EQUAL",
        spentAt: "2026-11-21T19:00:00.000Z",
        locationName: "Quán Tao Ngộ số 5 đường 3/4",
        shares: [
          { id: "sdl-21", expenseId: "exp-dl-05", memberId: "m1", amount: 170000 },
          { id: "sdl-22", expenseId: "exp-dl-05", memberId: "m2", amount: 170000 },
          { id: "sdl-23", expenseId: "exp-dl-05", memberId: "m3", amount: 170000 },
          { id: "sdl-24", expenseId: "exp-dl-05", memberId: "m4", amount: 170000 },
          { id: "sdl-25", expenseId: "exp-dl-05", memberId: "m5", amount: 170000 },
        ],
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 42, amount: 3550000, color: "var(--color-tropical-teal)" },
      { category: "Tham quan", percentage: 28, amount: 2366000, color: "var(--color-cerulean)" },
      { category: "Di chuyển", percentage: 18, amount: 1521000, color: "var(--color-emerald-fill)" },
      { category: "Khác", percentage: 12, amount: 1013000, color: "var(--color-lime-cream)" },
    ],
  },
  "trip-phuquoc-team": {
    id: "trip-phuquoc-team",
    name: "Phú Quốc cùng team",
    destination: "Phú Quốc, Kiên Giang",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    budgetAmount: 20000000,
    plannedBudget: 20000000,
    status: "SETTLING",
    inviteCode: "PQ2026-TEAM01",
    updatedAt: "2026-10-17T09:30:00Z",
    currentMemberId: "m9",
    totalSpent: 18500000,
    userSpent: 1200000,
    userBalance: {
      type: "PAY",
      amount: 120000,
    },
    expenseCount: 8,
    paidActivitiesCount: 2,
    members: [
      { id: "m6", name: "Hoàng Anh", role: "HOST", status: "ACTIVE", joinOrder: 1, spentAmount: 8500000 },
      { id: "m7", name: "Bảo Minh", role: "MEMBER", status: "ACTIVE", joinOrder: 2, spentAmount: 4200000 },
      { id: "m8", name: "Khánh Duy", role: "MEMBER", status: "ACTIVE", joinOrder: 3, spentAmount: 3600000 },
      { id: "m9", name: "Lan Nguyễn", role: "MEMBER", status: "ACTIVE", joinOrder: 4, spentAmount: 1200000, isCurrentUser: true },
      { id: "m10", name: "Phương Linh", role: "MEMBER", status: "ACTIVE", joinOrder: 5, spentAmount: 1000000 },
      { id: "m11", name: "Văn An", role: "MEMBER", status: "ACTIVE", joinOrder: 6, spentAmount: 0, isNoAccount: true },
    ],
    recentExpenses: [
      {
        id: "exp-pq-01",
        title: "Hải sản Hàm Ninh",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Hoàng Anh",
        spentAtFormatted: "14/12 - 19:30",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 3600000,
        userAmount: 600000,
      },
      {
        id: "exp-pq-02",
        title: "Tour 4 đảo cano cao tốc",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Hoàng Anh",
        spentAtFormatted: "13/12 - 08:30",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 4800000,
        userAmount: 800000,
      },
      {
        id: "exp-pq-03",
        title: "Thuê xe 7 chỗ đưa đón sân bay",
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByName: "Khánh Duy",
        spentAtFormatted: "12/12 - 11:00",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 1200000,
        userAmount: 200000,
      },
    ],
    expenses: [
      {
        id: "exp-pq-01",
        tripId: "trip-phuquoc-team",
        title: "Hải sản Hàm Ninh",
        amount: 3600000,
        category: "FOOD",
        paidByMemberId: "m6",
        splitMethod: "EQUAL",
        spentAt: "2026-12-14T19:30:00.000Z",
        locationName: "Làng chài Hàm Ninh",
        shares: [
          { id: "spq-01", expenseId: "exp-pq-01", memberId: "m6", amount: 600000 },
          { id: "spq-02", expenseId: "exp-pq-01", memberId: "m7", amount: 600000 },
          { id: "spq-03", expenseId: "exp-pq-01", memberId: "m8", amount: 600000 },
          { id: "spq-04", expenseId: "exp-pq-01", memberId: "m9", amount: 600000 },
          { id: "spq-05", expenseId: "exp-pq-01", memberId: "m10", amount: 600000 },
          { id: "spq-06", expenseId: "exp-pq-01", memberId: "m11", amount: 600000 },
        ],
      },
      {
        id: "exp-pq-02",
        tripId: "trip-phuquoc-team",
        title: "Tour 4 đảo cano cao tốc",
        amount: 4800000,
        category: "TICKET",
        paidByMemberId: "m6",
        splitMethod: "EQUAL",
        spentAt: "2026-12-13T08:30:00.000Z",
        locationName: "Cảng An Thới",
        shares: [
          { id: "spq-07", expenseId: "exp-pq-02", memberId: "m6", amount: 800000 },
          { id: "spq-08", expenseId: "exp-pq-02", memberId: "m7", amount: 800000 },
          { id: "spq-09", expenseId: "exp-pq-02", memberId: "m8", amount: 800000 },
          { id: "spq-10", expenseId: "exp-pq-02", memberId: "m9", amount: 800000 },
          { id: "spq-11", expenseId: "exp-pq-02", memberId: "m10", amount: 800000 },
          { id: "spq-12", expenseId: "exp-pq-02", memberId: "m11", amount: 800000 },
        ],
      },
      {
        id: "exp-pq-03",
        tripId: "trip-phuquoc-team",
        title: "Thuê xe 7 chỗ đưa đón sân bay",
        amount: 1200000,
        category: "TRANSPORT",
        paidByMemberId: "m8",
        splitMethod: "EQUAL",
        spentAt: "2026-12-12T11:00:00.000Z",
        locationName: "Sân bay quốc tế Phú Quốc",
        shares: [
          { id: "spq-13", expenseId: "exp-pq-03", memberId: "m6", amount: 200000 },
          { id: "spq-14", expenseId: "exp-pq-03", memberId: "m7", amount: 200000 },
          { id: "spq-15", expenseId: "exp-pq-03", memberId: "m8", amount: 200000 },
          { id: "spq-16", expenseId: "exp-pq-03", memberId: "m9", amount: 200000 },
          { id: "spq-17", expenseId: "exp-pq-03", memberId: "m10", amount: 200000 },
          { id: "spq-18", expenseId: "exp-pq-03", memberId: "m11", amount: 200000 },
        ],
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 40, amount: 7400000, color: "var(--color-tropical-teal)" },
      { category: "Lưu trú", percentage: 35, amount: 6475000, color: "var(--color-yale-blue)" },
      { category: "Tham quan", percentage: 15, amount: 2775000, color: "var(--color-cerulean)" },
      { category: "Khác", percentage: 10, amount: 1850000, color: "var(--color-lime-cream)" },
    ],
  },
  "trip-sapa-harvest": {
    id: "trip-sapa-harvest",
    name: "Sa Pa mùa lúa chín",
    destination: "Sa Pa, Lào Cai",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    budgetAmount: 12000000,
    plannedBudget: 12000000,
    status: "COMPLETED",
    inviteCode: "SP2026-LUA99",
    updatedAt: "2026-10-13T16:00:00Z",
    currentMemberId: "m15",
    totalSpent: 11200000,
    userSpent: 3000000,
    userBalance: {
      type: "SETTLED",
      amount: 0,
    },
    expenseCount: 6,
    paidActivitiesCount: 2,
    members: [
      { id: "m12", name: "Phương Linh", role: "HOST", status: "ACTIVE", joinOrder: 1, spentAmount: 4500000 },
      { id: "m13", name: "Việt Anh", role: "MEMBER", status: "ACTIVE", joinOrder: 2, spentAmount: 2200000 },
      { id: "m14", name: "Tiến Đạt", role: "MEMBER", status: "ACTIVE", joinOrder: 3, spentAmount: 1500000 },
      { id: "m15", name: "Lan Nguyễn", role: "MEMBER", status: "ACTIVE", joinOrder: 4, spentAmount: 3000000, isCurrentUser: true },
    ],
    recentExpenses: [
      {
        id: "exp-sp-01",
        title: "Lẩu cá hồi Sapa Thác Bạc",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Phương Linh",
        spentAtFormatted: "10/10 - 19:00",
        splitMethodText: "Chia đều 4 người",
        totalAmount: 1800000,
        userAmount: 450000,
      },
      {
        id: "exp-sp-02",
        title: "Vé Fansipan Legend khứ hồi",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Lan Nguyễn",
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
        title: "Lẩu cá hồi Sapa Thác Bạc",
        amount: 1800000,
        category: "FOOD",
        paidByMemberId: "m12",
        splitMethod: "EQUAL",
        spentAt: "2026-10-10T19:00:00.000Z",
        locationName: "Nhà hàng Thác Bạc Sapa",
        shares: [
          { id: "ssp-01", expenseId: "exp-sp-01", memberId: "m12", amount: 450000 },
          { id: "ssp-02", expenseId: "exp-sp-01", memberId: "m13", amount: 450000 },
          { id: "ssp-03", expenseId: "exp-sp-01", memberId: "m14", amount: 450000 },
          { id: "ssp-04", expenseId: "exp-sp-01", memberId: "m15", amount: 450000 },
        ],
      },
      {
        id: "exp-sp-02",
        tripId: "trip-sapa-harvest",
        title: "Vé Fansipan Legend khứ hồi",
        amount: 3000000,
        category: "TICKET",
        paidByMemberId: "m15",
        splitMethod: "EQUAL",
        spentAt: "2026-10-11T08:30:00.000Z",
        locationName: "Ga cáp treo Fansipan",
        shares: [
          { id: "ssp-05", expenseId: "exp-sp-02", memberId: "m12", amount: 750000 },
          { id: "ssp-06", expenseId: "exp-sp-02", memberId: "m13", amount: 750000 },
          { id: "ssp-07", expenseId: "exp-sp-02", memberId: "m14", amount: 750000 },
          { id: "ssp-08", expenseId: "exp-sp-02", memberId: "m15", amount: 750000 },
        ],
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 35, amount: 3920000, color: "var(--color-tropical-teal)" },
      { category: "Tham quan", percentage: 35, amount: 3920000, color: "var(--color-cerulean)" },
      { category: "Di chuyển", percentage: 20, amount: 2240000, color: "var(--color-emerald-fill)" },
      { category: "Khác", percentage: 10, amount: 1120000, color: "var(--color-lime-cream)" },
    ],
  },
});

const dynamicTripDetails: Record<string, TripDetailData> = {};

/**
 * Đăng ký chi tiết chuyến đi vừa tạo trong session để các trang con /trips/[id] có thể nạp được.
 */
export function registerMockTripDetail(detail: TripDetailData): void {
  dynamicTripDetails[detail.id] = detail;
}

/**
 * Hàm trợ giúp lấy dữ liệu chi tiết chuyến đi mẫu theo ID (thuần túy, an toàn immutability).
 */
export function getTripDetailById(id: string | null | undefined): TripDetailData | null {
  if (!id) return null;
  const detail = dynamicTripDetails[id] || MOCK_TRIP_DETAILS[id];
  if (!detail) return null;

  return {
    ...detail,
    userBalance: detail.userBalance ? { ...detail.userBalance } : undefined,
    members: detail.members.map((m) => ({ ...m })),
    recentExpenses: detail.recentExpenses.map((r) => ({ ...r })),
    expenses: detail.expenses
      ? detail.expenses.map((e) => ({
          ...e,
          shares: e.shares ? e.shares.map((s) => ({ ...s })) : [],
        }))
      : [],
    categoryAllocations: detail.categoryAllocations.map((c) => ({ ...c })),
  };
}
