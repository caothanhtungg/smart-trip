import { describe, it, expect } from "vitest";
import { simplify } from "@/lib/money/simplify";
import { createMulberry32, randomIntBetween } from "@/lib/money/test-prng";

describe("simplify", () => {
  it("returns at most 2 transactions for a 3-person group", () => {
    // 3 people: A pays 60k, B pays 30k, C pays 0k -> equal split is 30k each.
    // Net: A = +30k (creditor), B = 0, C = -30k (debtor)
    const net1 = { A: 30_000, B: 0, C: -30_000 };
    const tx1 = simplify(net1);
    expect(tx1.length).toBeLessThanOrEqual(2);
    expect(tx1).toEqual([{ from: "C", to: "A", amount: 30_000 }]);

    // Another 3-person scenario:
    // A: +40k, B: -10k, C: -30k
    const net2 = { A: 40_000, B: -10_000, C: -30_000 };
    const tx2 = simplify(net2);
    expect(tx2.length).toBeLessThanOrEqual(2);
    expect(tx2).toEqual([
      { from: "C", to: "A", amount: 30_000 },
      { from: "B", to: "A", amount: 10_000 },
    ]);
  });

  it("returns empty array when all net balances are 0 (all settled)", () => {
    const net = { A: 0, B: 0, C: 0, D: 0 };
    const tx = simplify(net);
    expect(tx).toEqual([]);
  });

  it("is deterministic: running multiple times on the same input produces the exact same result", () => {
    const net = {
      Lan: 350_000,
      Tuan: -120_000,
      Quang: -230_000,
    };
    const run1 = simplify(net);
    const run2 = simplify(net);
    expect(run1).toEqual(run2);
  });

  it("breaks ties deterministically using character code ascending order", () => {
    // Two debtors with identical debt (-20k) and one creditor (+40k)
    // Debtor "D2" vs "D1": "D1" comes first in character code and should settle first
    const net = {
      C: 40_000,
      D2: -20_000,
      D1: -20_000,
    };
    const tx = simplify(net);
    expect(tx).toHaveLength(2);
    expect(tx[0].from).toBe("D1");
    expect(tx[1].from).toBe("D2");
  });

  it("demonstrates greedy algorithm is non-optimal: produces 4 transactions for 5 people while optimal is 3", () => {
    // Bộ số dư: { A: 30_000, B: -170_000, C: 160_000, D: -190_000, E: 170_000 }
    // Tổng số dư = 30k - 170k + 160k - 190k + 170k = 0.
    // Lưu ý: Có thể chia thành 2 nhóm con độc lập có tổng bằng 0:
    // Nhóm 1: { A: 30k, C: 160k, D: -190k } -> cần 2 giao dịch (D trả A 30k, D trả C 160k).
    // Nhóm 2: { B: -170k, E: 170k } -> cần 1 giao dịch (B trả E 170k).
    // Tổng số giao dịch tối thiểu tuyệt đối lý thuyết là 3.
    // Tuy nhiên, thuật toán tham lam (greedy) khớp maxDebtor (D: 190k) với maxCreditor (E: 170k),
    // làm vỡ nhóm độc lập và sinh ra 4 giao dịch.
    const net = {
      A: 30_000,
      B: -170_000,
      C: 160_000,
      D: -190_000,
      E: 170_000,
    };

    const transactions = simplify(net);

    // Chứng minh thuật toán tham lam tạo 4 giao dịch (thay vì 3)
    expect(transactions).toHaveLength(4);

    // Xác nhận kết quả vẫn triệt tiêu hoàn toàn công nợ về 0
    const finalBalance: Record<string, number> = { ...net };
    for (const tx of transactions) {
      finalBalance[tx.from] += tx.amount;
      finalBalance[tx.to] -= tx.amount;
    }
    for (const val of Object.values(finalBalance)) {
      expect(val).toBe(0);
    }
  });

  it("throws Error if sum of net balances is not 0 (violates zero-sum invariant)", () => {
    const unbalanced = { A: 50_000, B: -40_000 }; // sum = +10,000
    expect(() => simplify(unbalanced)).toThrowError(/phải chính xác bằng 0/);
  });

  it("throws TypeError if any net balance is non-integer or NaN", () => {
    const invalid = { A: 100_000.5, B: -100_000.5 };
    expect(() => simplify(invalid)).toThrowError(/số nguyên an toàn/);

    const withNaN = { A: NaN, B: 0 };
    expect(() => simplify(withNaN)).toThrowError(/số nguyên an toàn/);
  });

  describe("Property-based test: 1,000 random zero-sum balances with fixed seed", () => {
    it("satisfies all 5 invariant properties across 1,000 randomized test cases", () => {
      const rng = createMulberry32(123456789);

      for (let iteration = 0; iteration < 1000; iteration++) {
        // Sinh số thành viên từ 2 đến 8
        const numMembers = randomIntBetween(rng, 2, 8);
        const net: Record<string, number> = {};
        let currentSum = 0;

        for (let i = 0; i < numMembers - 1; i++) {
          const id = `user_${i + 1}`;
          // Sinh số dư trong khoảng -500.000 đến +500.000
          const val = randomIntBetween(rng, -500_000, 500_000);
          net[id] = val;
          currentSum += val;
        }
        // Thành viên cuối cùng nhận số dư đối ứng để đảm bảo tổng = 0
        const lastId = `user_${numMembers}`;
        net[lastId] = -currentSum;

        // Chạy 2 lần để kiểm tra tính tất định
        const run1 = simplify(net);
        const run2 = simplify(net);

        // Bất biến 1: Chạy 2 lần cho cùng kết quả (deterministic)
        expect(run1).toEqual(run2);

        // Đếm số người có số dư khác 0
        const nonZeroCount = Object.values(net).filter((b) => b !== 0).length;

        // Bất biến 2: Số giao dịch không quá (số người có số dư khác 0) - 1
        const maxAllowedTransactions = Math.max(0, nonZeroCount - 1);
        expect(run1.length).toBeLessThanOrEqual(maxAllowedTransactions);

        const reconstructed = { ...net };
        for (const tx of run1) {
          // Bất biến 3: Không có giao dịch tự chuyển cho mình
          expect(tx.from).not.toBe(tx.to);

          // Bất biến 4: Mọi số tiền là số nguyên dương an toàn
          expect(Number.isSafeInteger(tx.amount)).toBe(true);
          expect(tx.amount).toBeGreaterThan(0);

          // Áp dụng giao dịch vào số dư
          reconstructed[tx.from] += tx.amount;
          reconstructed[tx.to] -= tx.amount;
        }

        // Bất biến 5: Mọi số dư sau khi áp dụng giao dịch phải về 0
        for (const bal of Object.values(reconstructed)) {
          expect(bal).toBe(0);
        }
      }
    });
  });
});
