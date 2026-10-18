import { describe, it, expect } from "vitest";
import { computeEqualShares } from "@/lib/money/split";
import { createMulberry32, randomIntBetween } from "@/lib/money/test-prng";

describe("computeEqualShares", () => {
  it("divides exact amount evenly without remainder", () => {
    const participants = ["m1", "m2", "m3", "m4"];
    const shares = computeEqualShares(100_000, participants);

    expect(shares).toHaveLength(4);
    shares.forEach((s) => {
      expect(s.amount).toBe(25_000);
      expect(s.hasRemainderExtra).toBe(false);
    });

    const sum = shares.reduce((acc, s) => acc + s.amount, 0);
    expect(sum).toBe(100_000);
  });

  it("distributes remainder according to Rule R4 (100,000 VND / 3 people)", () => {
    const participants = [
      { id: "m1", joinOrder: 1 },
      { id: "m2", joinOrder: 2 },
      { id: "m3", joinOrder: 3 },
    ];
    const shares = computeEqualShares(100_000, participants);

    expect(shares).toHaveLength(3);
    // Base = 33,333. Remainder = 1.
    // Member m1 (joinOrder 1) gets +1 -> 33,334
    expect(shares[0].memberId).toBe("m1");
    expect(shares[0].amount).toBe(33_334);
    expect(shares[0].hasRemainderExtra).toBe(true);

    expect(shares[1].memberId).toBe("m2");
    expect(shares[1].amount).toBe(33_333);
    expect(shares[1].hasRemainderExtra).toBe(false);

    expect(shares[2].memberId).toBe("m3");
    expect(shares[2].amount).toBe(33_333);
    expect(shares[2].hasRemainderExtra).toBe(false);

    const sum = shares.reduce((acc, s) => acc + s.amount, 0);
    expect(sum).toBe(100_000);
  });

  it("distributes remainder strictly according to joinOrder even when input array is scrambled", () => {
    // Array order is deliberately scrambled: m3, m1, m2
    const scrambled = [
      { id: "m3", joinOrder: 3 },
      { id: "m1", joinOrder: 1 },
      { id: "m2", joinOrder: 2 },
    ];
    const shares = computeEqualShares(100_000, scrambled);

    expect(shares).toHaveLength(3);
    // After sorting by joinOrder: [m1, m2, m3]
    // Remainder 1 must go to m1 (joinOrder 1), NOT m3 (first in scrambled array)
    expect(shares[0].memberId).toBe("m1");
    expect(shares[0].amount).toBe(33_334);
    expect(shares[0].hasRemainderExtra).toBe(true);

    expect(shares[1].memberId).toBe("m2");
    expect(shares[1].amount).toBe(33_333);
    expect(shares[1].hasRemainderExtra).toBe(false);

    expect(shares[2].memberId).toBe("m3");
    expect(shares[2].amount).toBe(33_333);
    expect(shares[2].hasRemainderExtra).toBe(false);

    const sum = shares.reduce((acc, s) => acc + s.amount, 0);
    expect(sum).toBe(100_000);
  });

  it("preserves arithmetic invariant for various prime numbers and large amounts", () => {
    const participants = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
    const testAmounts = [1, 7, 13, 999_999, 12_345_678, 1_999_999_999];

    for (const amt of testAmounts) {
      const shares = computeEqualShares(amt, participants);
      const sum = shares.reduce((acc, s) => acc + s.amount, 0);
      expect(sum).toBe(amt);
    }
  });

  it("throws TypeError if totalAmount is non-integer or float (no silent Math.floor)", () => {
    expect(() => computeEqualShares(100_000.5, ["m1", "m2"])).toThrowError(/số nguyên dương/);
    expect(() => computeEqualShares(0.99, ["m1"])).toThrowError(/số nguyên dương/);
  });

  it("throws TypeError if totalAmount is zero, negative, or NaN", () => {
    expect(() => computeEqualShares(0, ["m1", "m2"])).toThrowError(/số nguyên dương/);
    expect(() => computeEqualShares(-50_000, ["m1"])).toThrowError(/số nguyên dương/);
    expect(() => computeEqualShares(NaN, ["m1"])).toThrowError(/số nguyên dương/);
  });

  it("throws Error if participants array is empty", () => {
    expect(() => computeEqualShares(100_000, [])).toThrowError(/không được để trống/);
  });

  it("throws Error if participants array contains duplicate IDs", () => {
    const duplicates = ["m1", "m2", "m1"];
    expect(() => computeEqualShares(100_000, duplicates)).toThrowError(/trùng lặp/);

    const duplicatesObj = [
      { id: "m1", joinOrder: 1 },
      { id: "m2", joinOrder: 2 },
      { id: "m1", joinOrder: 3 },
    ];
    expect(() => computeEqualShares(100_000, duplicatesObj)).toThrowError(/trùng lặp/);
  });

  describe("Property-based test: 2,000 random pairs (amount, memberCount) with fixed seed", () => {
    it("satisfies sum invariant, diff <= 1, and remainder count = amount % n across 2,000 randomized cases", () => {
      const rng = createMulberry32(987654321);

      for (let i = 0; i < 2000; i++) {
        // Sinh số tiền từ 1 đến 500.000.000 VND
        const amount = randomIntBetween(rng, 1, 500_000_000);
        // Sinh số thành viên từ 1 đến 50 người
        const memberCount = randomIntBetween(rng, 1, 50);

        const participants = Array.from({ length: memberCount }, (_, idx) => ({
          id: `mem_${idx + 1}`,
          joinOrder: idx + 1,
        }));

        const shares = computeEqualShares(amount, participants);

        // Bất biến 1: Số lượng phần chia bằng đúng số thành viên
        expect(shares).toHaveLength(memberCount);

        // Bất biến 2: Tổng các phần chia luôn chính xác bằng số tiền ban đầu
        const totalShared = shares.reduce((sum, s) => sum + s.amount, 0);
        expect(totalShared).toBe(amount);

        // Bất biến 3: Hai phần bất kỳ chênh nhau không quá 1 đồng
        const amounts = shares.map((s) => s.amount);
        const minAmount = Math.min(...amounts);
        const maxAmount = Math.max(...amounts);
        expect(maxAmount - minAmount).toBeLessThanOrEqual(1);

        // Bất biến 4: Số người nhận thêm 1 đồng đúng bằng amount % memberCount
        const expectedRemainder = amount % memberCount;
        const extraCount = shares.filter((s) => s.hasRemainderExtra).length;
        expect(extraCount).toBe(expectedRemainder);

        // Bất biến 5: Những người nhận thêm 1 đồng phải là expectedRemainder người có joinOrder nhỏ nhất
        for (let j = 0; j < memberCount; j++) {
          const isExtra = j < expectedRemainder;
          expect(shares[j].hasRemainderExtra).toBe(isExtra);
          expect(shares[j].amount).toBe(minAmount + (isExtra ? 1 : 0));
        }
      }
    });
  });
});

