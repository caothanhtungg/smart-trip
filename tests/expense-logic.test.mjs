import test from "node:test";
import assert from "node:assert/strict";

import {
  computeEqualShares,
  getCategoryLabel,
  getCategoryColor,
} from "../src/lib/split-service.ts";

import {
  validateExpenseForm,
  parseExpenseMoneyInput,
  formatExpenseMoneyInput,
  MAX_EXPENSE_AMOUNT,
} from "../src/lib/expense-validation.ts";

/* =========================================================================
   MOCK TRIP MEMBERS FIXTURE FOR TESTING
   ========================================================================= */

const MOCK_MEMBERS = [
  {
    id: "mem-1",
    name: "Minh",
    role: "HOST",
    isHost: true,
    isCurrentUser: true,
    joinOrder: 1,
  },
  {
    id: "mem-2",
    name: "Lan",
    role: "MEMBER",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 2,
  },
  {
    id: "mem-3",
    name: "Tùng",
    role: "MEMBER",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 3,
  },
  {
    id: "mem-4",
    name: "Hà",
    role: "MEMBER",
    isHost: false,
    isCurrentUser: false,
    joinOrder: 4,
  },
  {
    id: "mem-5",
    name: "Nam (Chưa có TK)",
    role: "MEMBER",
    isHost: false,
    isCurrentUser: false,
    isNoAccount: true,
    joinOrder: 5,
  },
];

/* =========================================================================
   1. EQUAL SPLIT SERVICE TESTS (RULE R4)
   ========================================================================= */

test("computeEqualShares: exact division without remainder", () => {
  const members = ["mem-1", "mem-2", "mem-3", "mem-4"];
  const shares = computeEqualShares(100_000, members);

  assert.equal(shares.length, 4);
  shares.forEach((s) => {
    assert.equal(s.amount, 25_000);
    assert.equal(s.hasRemainderExtra, false);
  });

  const total = shares.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(total, 100_000);
});

test("computeEqualShares: odd remainder distribution (Rule R4 - 100,000 VND / 3 people)", () => {
  const members = ["mem-1", "mem-2", "mem-3"];
  const shares = computeEqualShares(100_000, members);

  assert.equal(shares.length, 3);
  // Base = 33,333. Remainder = 1.
  // First member (index 0) gets 33,334
  assert.equal(shares[0].amount, 33_334);
  assert.equal(shares[0].hasRemainderExtra, true);

  // Remaining members get 33,333
  assert.equal(shares[1].amount, 33_333);
  assert.equal(shares[1].hasRemainderExtra, false);

  assert.equal(shares[2].amount, 33_333);
  assert.equal(shares[2].hasRemainderExtra, false);

  // Invariant: sum must match exactly 100,000
  const total = shares.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(total, 100_000);
});

test("computeEqualShares: remainder distribution across 6 members (100,000 VND / 6 people)", () => {
  const members = ["m1", "m2", "m3", "m4", "m5", "m6"];
  const shares = computeEqualShares(100_000, members);

  assert.equal(shares.length, 6);
  // Base = floor(100000 / 6) = 16,666. Remainder = 4.
  // First 4 members get 16,667 (+1 VND), last 2 get 16,666
  for (let i = 0; i < 4; i++) {
    assert.equal(shares[i].amount, 16_667);
    assert.equal(shares[i].hasRemainderExtra, true);
  }
  for (let i = 4; i < 6; i++) {
    assert.equal(shares[i].amount, 16_666);
    assert.equal(shares[i].hasRemainderExtra, false);
  }

  const total = shares.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(total, 100_000);
});

test("computeEqualShares: mathematical invariant holds for prime amounts & large numbers", () => {
  const members = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
  const testAmounts = [1, 2, 7, 13, 999_999, 12_345_678, 999_999_999];

  for (const amt of testAmounts) {
    const shares = computeEqualShares(amt, members);
    const sum = shares.reduce((s, x) => s + x.amount, 0);
    assert.equal(sum, amt, `Invariant failed for amount ${amt}`);
  }
});

test("computeEqualShares: returns empty array for empty members or non-positive amount", () => {
  assert.deepEqual(computeEqualShares(100_000, []), []);
  assert.deepEqual(computeEqualShares(0, ["m1", "m2"]), []);
  assert.deepEqual(computeEqualShares(-50_000, ["m1"]), []);
});

test("category helpers return correct labels and brand colors", () => {
  assert.equal(getCategoryLabel("FOOD"), "Ăn uống");
  assert.equal(getCategoryLabel("TRANSPORT"), "Di chuyển");
  assert.equal(getCategoryLabel("LODGING"), "Lưu trú");
  assert.equal(getCategoryLabel("TICKET"), "Vé tham quan");
  assert.equal(getCategoryLabel("SHOPPING"), "Mua sắm");
  assert.equal(getCategoryLabel("OTHER"), "Khác");

  assert.ok(getCategoryColor("FOOD").startsWith("#"));
  assert.ok(getCategoryColor("TRANSPORT").startsWith("#"));
});

/* =========================================================================
   2. EXPENSE FORM VALIDATION TESTS
   ========================================================================= */

test("validateExpenseForm: valid complete data passes", () => {
  const validData = {
    title: "Ăn tối lẩu gà lá é",
    amount: 450_000,
    category: "FOOD",
    paidByMemberId: "mem-1",
    participantMemberIds: ["mem-1", "mem-2", "mem-3"],
    spentAtDate: "15/10/2026",
  };

  const result = validateExpenseForm(validData, "mem-1", true, MOCK_MEMBERS);
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
});

test("validateExpenseForm: title validation rules", () => {
  const baseData = {
    title: "",
    amount: 100_000,
    category: "FOOD",
    paidByMemberId: "mem-1",
    participantMemberIds: ["mem-1"],
    spentAtDate: "15/10/2026",
  };

  // Empty title
  const r1 = validateExpenseForm(baseData, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r1.isValid, false);
  assert.ok(r1.errors.title);

  // Whitespace only
  const r2 = validateExpenseForm({ ...baseData, title: "   " }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r2.isValid, false);
  assert.ok(r2.errors.title);

  // Over 200 characters
  const longTitle = "A".repeat(201);
  const r3 = validateExpenseForm({ ...baseData, title: longTitle }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r3.isValid, false);
  assert.ok(r3.errors.title.includes("200"));

  // Exactly 200 characters passes
  const valid200 = "B".repeat(200);
  const r4 = validateExpenseForm({ ...baseData, title: valid200 }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r4.isValid, true);
});

test("validateExpenseForm: amount validation rules (R3 integer VND)", () => {
  const baseData = {
    title: "Mua nước uống",
    amount: 0,
    category: "FOOD",
    paidByMemberId: "mem-1",
    participantMemberIds: ["mem-1"],
    spentAtDate: "15/10/2026",
  };

  // Zero amount
  assert.equal(validateExpenseForm(baseData, "mem-1", true, MOCK_MEMBERS).isValid, false);

  // Negative amount
  assert.equal(validateExpenseForm({ ...baseData, amount: -100 }, "mem-1", true, MOCK_MEMBERS).isValid, false);

  // NaN or null
  assert.equal(validateExpenseForm({ ...baseData, amount: NaN }, "mem-1", true, MOCK_MEMBERS).isValid, false);

  // Exceeds 1 billion VND limit
  assert.equal(validateExpenseForm({ ...baseData, amount: MAX_EXPENSE_AMOUNT + 1 }, "mem-1", true, MOCK_MEMBERS).isValid, false);

  // Exactly 1 billion VND is allowed
  assert.equal(validateExpenseForm({ ...baseData, amount: MAX_EXPENSE_AMOUNT }, "mem-1", true, MOCK_MEMBERS).isValid, true);
});

test("validateExpenseForm: payer permissions (Approved Rule R18)", () => {
  const baseData = {
    title: "Thuê xe máy",
    amount: 300_000,
    category: "TRANSPORT",
    paidByMemberId: "mem-2", // Lan is regular member
    participantMemberIds: ["mem-1", "mem-2"],
    spentAtDate: "15/10/2026",
  };

  // Scenario 1: Regular member (Lan, mem-2) attempts to record expense paid by herself -> VALID
  const r1 = validateExpenseForm(baseData, "mem-2", false, MOCK_MEMBERS);
  assert.equal(r1.isValid, true);

  // Scenario 2: Regular member (Lan, mem-2) attempts to record expense paid by Minh (mem-1) -> FORBIDDEN (R18)
  const r2 = validateExpenseForm({ ...baseData, paidByMemberId: "mem-1" }, "mem-2", false, MOCK_MEMBERS);
  assert.equal(r2.isValid, false);
  assert.ok(r2.errors.paidByMemberId.includes("R18"));

  // Scenario 3: Host (Minh, mem-1) records expense on behalf of another member (Lan, mem-2) -> ALLOWED (R18)
  const r3 = validateExpenseForm({ ...baseData, paidByMemberId: "mem-2" }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r3.isValid, true);

  // Scenario 4: Host records on behalf of member without account (Nam, mem-5) -> ALLOWED (R18)
  const r4 = validateExpenseForm({ ...baseData, paidByMemberId: "mem-5" }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r4.isValid, true);

  // Scenario 5: Non-existent member ID as payer -> FORBIDDEN
  const r5 = validateExpenseForm({ ...baseData, paidByMemberId: "mem-999" }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r5.isValid, false);
  assert.ok(r5.errors.paidByMemberId);
});

test("validateExpenseForm: participants list requirements", () => {
  const baseData = {
    title: "Vé tham quan thác",
    amount: 150_000,
    category: "TICKET",
    paidByMemberId: "mem-1",
    participantMemberIds: [],
    spentAtDate: "15/10/2026",
  };

  // Empty participants
  const r1 = validateExpenseForm(baseData, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r1.isValid, false);
  assert.ok(r1.errors.participants);

  // Invalid participant ID
  const r2 = validateExpenseForm({ ...baseData, participantMemberIds: ["mem-fake"] }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r2.isValid, false);
  assert.ok(r2.errors.participants);

  // Valid participant
  const r3 = validateExpenseForm({ ...baseData, participantMemberIds: ["mem-1"] }, "mem-1", true, MOCK_MEMBERS);
  assert.equal(r3.isValid, true);
});

test("parseExpenseMoneyInput and formatExpenseMoneyInput", () => {
  assert.equal(parseExpenseMoneyInput("1.250.000"), 1250000);
  assert.equal(parseExpenseMoneyInput("50000"), 50000);
  assert.equal(parseExpenseMoneyInput("1 000 000 ₫"), 1000000);
  assert.equal(parseExpenseMoneyInput(""), null);
  assert.equal(parseExpenseMoneyInput("abc"), null);

  assert.equal(formatExpenseMoneyInput(1250000), "1.250.000");
  assert.equal(formatExpenseMoneyInput(50000), "50.000");
  assert.equal(formatExpenseMoneyInput(0), "");
  assert.equal(formatExpenseMoneyInput(null), "");
});
