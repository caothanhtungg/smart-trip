import { describe, it, expect } from "vitest";
import {
  calculateMemberBalances,
  generateSettlementTransfers,
  canReopenSettlement,
  isSettlementFullyCompleted,
} from "./settlement";
import type { TripMember, TripExpense } from "@/types/trip";
import type { MemberBalanceBreakdown, SettlementTransfer } from "@/types/settlement";

const MOCK_MEMBERS: TripMember[] = [
  { id: "m1", name: "Lan Nguyễn", role: "HOST", status: "ACTIVE", joinOrder: 1, isCurrentUser: true },
  { id: "m2", name: "Tuấn Huy", role: "MEMBER", status: "ACTIVE", joinOrder: 2 },
  { id: "m3", name: "Quang Minh", role: "MEMBER", status: "ACTIVE", joinOrder: 3 },
  { id: "m4", name: "Thanh Quang", role: "MEMBER", status: "ACTIVE", joinOrder: 4, isNoAccount: true },
  { id: "m5", name: "Thu Hà", role: "MEMBER", status: "ACTIVE", joinOrder: 5 },
];

describe("calculateMemberBalances", () => {
  it("tính chính xác số dư ròng, tổng đã trả và tổng phải gánh", () => {
    // 2 khoản chi:
    // exp1: Lan (m1) trả 1.000.000 ₫ chia đều 5 người (mỗi người 200.000 ₫)
    // exp2: Huy (m2) trả 500.000 ₫ chia 2 người m2 và m3 (mỗi người 250.000 ₫)
    const expenses: TripExpense[] = [
      {
        id: "exp1",
        tripId: "trip-1",
        title: "Ăn trưa",
        amount: 1_000_000,
        category: "FOOD",
        paidByMemberId: "m1",
        splitMethod: "EQUAL",
        spentAt: "2026-10-15T12:00:00Z",
        shares: [
          { id: "s1", expenseId: "exp1", memberId: "m1", amount: 200_000 },
          { id: "s2", expenseId: "exp1", memberId: "m2", amount: 200_000 },
          { id: "s3", expenseId: "exp1", memberId: "m3", amount: 200_000 },
          { id: "s4", expenseId: "exp1", memberId: "m4", amount: 200_000 },
          { id: "s5", expenseId: "exp1", memberId: "m5", amount: 200_000 },
        ],
      },
      {
        id: "exp2",
        tripId: "trip-1",
        title: "Vé tham quan",
        amount: 500_000,
        category: "TICKET",
        paidByMemberId: "m2",
        splitMethod: "EQUAL",
        spentAt: "2026-10-15T14:00:00Z",
        shares: [
          { id: "s6", expenseId: "exp2", memberId: "m2", amount: 250_000 },
          { id: "s7", expenseId: "exp2", memberId: "m3", amount: 250_000 },
        ],
      },
    ];

    const result = calculateMemberBalances(MOCK_MEMBERS, expenses);

    expect(result.totalPaid).toBe(1_500_000);
    expect(result.totalOwed).toBe(1_500_000);
    expect(result.isZeroSum).toBe(true);

    const b1 = result.balances.find((b) => b.memberId === "m1")!;
    expect(b1.paidAmount).toBe(1_000_000);
    expect(b1.owedAmount).toBe(200_000);
    expect(b1.netAmount).toBe(800_000); // Được nhận 800k

    const b2 = result.balances.find((b) => b.memberId === "m2")!;
    expect(b2.paidAmount).toBe(500_000);
    expect(b2.owedAmount).toBe(450_000); // 200k + 250k
    expect(b2.netAmount).toBe(50_000); // Được nhận 50k

    const b3 = result.balances.find((b) => b.memberId === "m3")!;
    expect(b3.paidAmount).toBe(0);
    expect(b3.owedAmount).toBe(450_000);
    expect(b3.netAmount).toBe(-450_000); // Cần trả 450k

    const b4 = result.balances.find((b) => b.memberId === "m4")!;
    expect(b4.netAmount).toBe(-200_000);

    const b5 = result.balances.find((b) => b.memberId === "m5")!;
    expect(b5.netAmount).toBe(-200_000);

    // Kiểm tra tổng net triệt tiêu
    const sumNet = result.balances.reduce((acc, b) => acc + b.netAmount, 0);
    expect(sumNet).toBe(0);
  });

  it("xử lý chính xác danh sách chi tiêu rỗng", () => {
    const result = calculateMemberBalances(MOCK_MEMBERS, []);
    expect(result.totalPaid).toBe(0);
    expect(result.totalOwed).toBe(0);
    expect(result.isZeroSum).toBe(true);
    expect(result.balances.every((b) => b.netAmount === 0)).toBe(true);
  });

  it("xử lý trường hợp tất cả thành viên tự cân bằng (mọi người đều net = 0)", () => {
    // Mỗi người tự trả 100k cho chính mình
    const expenses: TripExpense[] = MOCK_MEMBERS.map((m, idx) => ({
      id: `exp-${idx}`,
      tripId: "trip-1",
      title: `Chi riêng ${m.name}`,
      amount: 100_000,
      category: "FOOD",
      paidByMemberId: m.id,
      splitMethod: "EQUAL",
      spentAt: "2026-10-15T12:00:00Z",
      shares: [{ id: `s-${idx}`, expenseId: `exp-${idx}`, memberId: m.id, amount: 100_000 }],
    }));

    const result = calculateMemberBalances(MOCK_MEMBERS, expenses);
    expect(result.isZeroSum).toBe(true);
    expect(result.balances.every((b) => b.netAmount === 0)).toBe(true);

    const transfers = generateSettlementTransfers("set-1", result.balances);
    expect(transfers).toHaveLength(0); // Không ai nợ ai
  });

  it("ném lỗi khi tổng số dư ròng khác 0 (vi phạm bất biến zero-sum)", () => {
    // Cố tình tạo shares bị lệch so với paid:
    const invalidExpenses: TripExpense[] = [
      {
        id: "exp-corrupt",
        tripId: "trip-1",
        title: "Lỗi",
        amount: 500_000,
        category: "FOOD",
        paidByMemberId: "m1",
        splitMethod: "EQUAL",
        spentAt: "2026-10-15T12:00:00Z",
        shares: [
          // Tổng shares = 400.000 thay vì 500.000
          { id: "s1", expenseId: "exp-corrupt", memberId: "m1", amount: 200_000 },
          { id: "s2", expenseId: "exp-corrupt", memberId: "m2", amount: 200_000 },
        ],
      },
    ];

    expect(() => calculateMemberBalances(MOCK_MEMBERS, invalidExpenses)).toThrowError(
      /Lỗi bất biến số học nghiêm trọng/
    );
  });

  it("ném lỗi khi khoản chi có số tiền <= 0", () => {
    const zeroExpense: TripExpense[] = [
      {
        id: "exp-0",
        tripId: "trip-1",
        title: "Chi tiêu 0đ",
        amount: 0,
        category: "OTHER",
        paidByMemberId: "m1",
        splitMethod: "EQUAL",
        spentAt: "2026-10-15T12:00:00Z",
        shares: [],
      },
    ];
    expect(() => calculateMemberBalances(MOCK_MEMBERS, zeroExpense)).toThrowError(
      /Số tiền khoản chi không hợp lệ/
    );
  });

  it("bỏ qua thành viên có status là LEFT (chỉ tính cho thành viên ACTIVE)", () => {
    const membersWithLeft: TripMember[] = [
      ...MOCK_MEMBERS,
      { id: "m-left", name: "Đã Rời Nhóm", role: "MEMBER", status: "LEFT", joinOrder: 6 },
    ];
    const result = calculateMemberBalances(membersWithLeft, []);
    expect(result.balances.find((b) => b.memberId === "m-left")).toBeUndefined();
    expect(result.balances).toHaveLength(5);
  });
});

describe("generateSettlementTransfers", () => {
  it("sinh giao dịch rút gọn nợ bằng thuật toán tham lam đảm bảo tính tất định", () => {
    const balances: MemberBalanceBreakdown[] = [
      { memberId: "m1", memberName: "Lan", paidAmount: 600_000, owedAmount: 0, netAmount: 600_000 },
      { memberId: "m2", memberName: "Huy", paidAmount: 0, owedAmount: 300_000, netAmount: -300_000 },
      { memberId: "m3", memberName: "Minh", paidAmount: 0, owedAmount: 200_000, netAmount: -200_000 },
      { memberId: "m4", memberName: "Quang", paidAmount: 0, owedAmount: 100_000, netAmount: -100_000 },
    ];

    const transfers = generateSettlementTransfers("set-100", balances);

    // K = 4 người có số dư khác 0 -> số giao dịch tối đa <= 3
    expect(transfers.length).toBeLessThanOrEqual(3);
    expect(transfers.every((t) => t.status === "UNPAID")).toBe(true);

    // Tổng tiền chuyển từ con nợ tới Lan phải bằng đúng 600.000 ₫
    const sumTransfers = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(sumTransfers).toBe(600_000);
    expect(transfers.every((t) => t.toMemberId === "m1")).toBe(true);

    // Xáo thứ tự mảng balances thì kết quả transfers không thay đổi (tính tất định tuyệt đối)
    const scrambled = [balances[2], balances[0], balances[3], balances[1]];
    const transfersScrambled = generateSettlementTransfers("set-100", scrambled);
    expect(transfers).toEqual(transfersScrambled);
  });
});

describe("canReopenSettlement", () => {
  it("trả về true khi tất cả giao dịch đều là UNPAID", () => {
    const transfers: SettlementTransfer[] = [
      { id: "t1", settlementId: "s1", fromMemberId: "m1", toMemberId: "m2", amount: 100_000, status: "UNPAID" },
      { id: "t2", settlementId: "s1", fromMemberId: "m3", toMemberId: "m2", amount: 200_000, status: "UNPAID" },
    ];
    expect(canReopenSettlement(transfers)).toBe(true);
  });

  it("trả về false khi có ít nhất một giao dịch là PAID", () => {
    const transfers: SettlementTransfer[] = [
      { id: "t1", settlementId: "s1", fromMemberId: "m1", toMemberId: "m2", amount: 100_000, status: "PAID" },
      { id: "t2", settlementId: "s1", fromMemberId: "m3", toMemberId: "m2", amount: 200_000, status: "UNPAID" },
    ];
    expect(canReopenSettlement(transfers)).toBe(false);
  });

  it("trả về false khi có giao dịch đã COMPLETED", () => {
    const transfers: SettlementTransfer[] = [
      { id: "t1", settlementId: "s1", fromMemberId: "m1", toMemberId: "m2", amount: 100_000, status: "COMPLETED" },
    ];
    expect(canReopenSettlement(transfers)).toBe(false);
  });
});

describe("isSettlementFullyCompleted", () => {
  it("trả về true khi toàn bộ giao dịch là COMPLETED", () => {
    const transfers: SettlementTransfer[] = [
      { id: "t1", settlementId: "s1", fromMemberId: "m1", toMemberId: "m2", amount: 100_000, status: "COMPLETED" },
      { id: "t2", settlementId: "s1", fromMemberId: "m3", toMemberId: "m2", amount: 200_000, status: "COMPLETED" },
    ];
    expect(isSettlementFullyCompleted(transfers)).toBe(true);
  });

  it("trả về false nếu vẫn còn giao dịch UNPAID hoặc PAID", () => {
    const transfers: SettlementTransfer[] = [
      { id: "t1", settlementId: "s1", fromMemberId: "m1", toMemberId: "m2", amount: 100_000, status: "COMPLETED" },
      { id: "t2", settlementId: "s1", fromMemberId: "m3", toMemberId: "m2", amount: 200_000, status: "PAID" },
    ];
    expect(isSettlementFullyCompleted(transfers)).toBe(false);
  });

  it("trả về false cho danh sách giao dịch rỗng", () => {
    expect(isSettlementFullyCompleted([])).toBe(false);
  });
});
