import { describe, it, expect } from "vitest";
import { computeEqualShares, computeItemizedShares } from "@/lib/money/split";
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

describe("computeItemizedShares (Giai đoạn 2D.2)", () => {
  const mockParticipants = [
    { id: "mem-1", joinOrder: 1 },
    { id: "mem-2", joinOrder: 2 },
    { id: "mem-3", joinOrder: 3 },
    { id: "mem-4", joinOrder: 4 },
    { id: "mem-5", joinOrder: 5 },
  ];

  it("Ca 1: chia 3 món tiêu chuẩn không có phụ phí", () => {
    // Món 1: 300k (mem-1, mem-2) -> 150k mỗi người
    // Món 2: 200k (mem-2, mem-3) -> 100k mỗi người
    // Món 3: 100k (mem-3) -> 100k cho mem-3
    // Tổng: 600k
    const items = [
      { id: "item-1", name: "Lẩu gà", amount: 300_000, assignedMemberIds: ["mem-1", "mem-2"] },
      { id: "item-2", name: "Bia", amount: 200_000, assignedMemberIds: ["mem-2", "mem-3"] },
      { id: "item-3", name: "Nước ngọt", amount: 100_000, assignedMemberIds: ["mem-3"] },
    ];

    const results = computeItemizedShares(600_000, items, null, mockParticipants);

    expect(results).toHaveLength(3);
    const m1 = results.find((r) => r.memberId === "mem-1")!;
    const m2 = results.find((r) => r.memberId === "mem-2")!;
    const m3 = results.find((r) => r.memberId === "mem-3")!;

    expect(m1.itemsAmount).toBe(150_000);
    expect(m1.surchargeAmount).toBe(0);
    expect(m1.totalAmount).toBe(150_000);
    expect(m1.assignedItemCount).toBe(1);

    expect(m2.itemsAmount).toBe(250_000); // 150k + 100k
    expect(m2.surchargeAmount).toBe(0);
    expect(m2.totalAmount).toBe(250_000);
    expect(m2.assignedItemCount).toBe(2);

    expect(m3.itemsAmount).toBe(200_000); // 100k + 100k
    expect(m3.surchargeAmount).toBe(0);
    expect(m3.totalAmount).toBe(200_000);
    expect(m3.assignedItemCount).toBe(2);

    const sum = results.reduce((acc, r) => acc + r.totalAmount, 0);
    expect(sum).toBe(600_000);
  });

  it("Ca 2: 1 món gán cho đúng 1 người", () => {
    const items = [
      { id: "item-1", name: "Cơm chiên đặc biệt", amount: 120_000, assignedMemberIds: ["mem-2"] },
    ];
    const results = computeItemizedShares(120_000, items, null, mockParticipants);

    expect(results).toHaveLength(1);
    expect(results[0].memberId).toBe("mem-2");
    expect(results[0].itemsAmount).toBe(120_000);
    expect(results[0].totalAmount).toBe(120_000);
  });

  it("Ca 3: 1 món gán cho tất cả 5 thành viên", () => {
    const items = [
      {
        id: "item-1",
        name: "Lẩu hải sản khổng lồ",
        amount: 500_000,
        assignedMemberIds: ["mem-1", "mem-2", "mem-3", "mem-4", "mem-5"],
      },
    ];
    const results = computeItemizedShares(500_000, items, null, mockParticipants);

    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r.itemsAmount).toBe(100_000);
      expect(r.totalAmount).toBe(100_000);
      expect(r.assignedItemCount).toBe(1);
    });
  });

  it("Ca 4: phân bổ phần dư 1 đồng ở từng món độc lập theo joinOrder", () => {
    // Món 1: 100.000 ₫ chia 3 người (mem-1, mem-2, mem-3)
    // Base = 33.333, Remainder = 1 -> mem-1 nhận 33.334, mem-2 nhận 33.333, mem-3 nhận 33.333
    const items = [
      { id: "item-1", name: "Món A", amount: 100_000, assignedMemberIds: ["mem-1", "mem-2", "mem-3"] },
    ];
    const results = computeItemizedShares(100_000, items, null, mockParticipants);

    const m1 = results.find((r) => r.memberId === "mem-1")!;
    const m2 = results.find((r) => r.memberId === "mem-2")!;
    const m3 = results.find((r) => r.memberId === "mem-3")!;

    expect(m1.itemsAmount).toBe(33_334);
    expect(m2.itemsAmount).toBe(33_333);
    expect(m3.itemsAmount).toBe(33_333);
    expect(results.reduce((s, r) => s + r.totalAmount, 0)).toBe(100_000);
  });

  it("Ca 5: phụ phí VAT / dịch vụ không chia hết cho số người tham gia hóa đơn", () => {
    // 2 món: Món 1 = 200k (mem-1, mem-2), Món 2 = 100k (mem-2, mem-3). Tổng món = 300k.
    // Phụ phí VAT = 50.000 ₫. Tổng hóa đơn = 350.000 ₫.
    // Người tham gia hóa đơn: mem-1, mem-2, mem-3 (3 người).
    // Phụ phí 50k / 3: Base = 16.666, Remainder = 2 -> mem-1 nhận +16.667, mem-2 nhận +16.667, mem-3 nhận +16.666.
    const items = [
      { id: "item-1", name: "Món 1", amount: 200_000, assignedMemberIds: ["mem-1", "mem-2"] },
      { id: "item-2", name: "Món 2", amount: 100_000, assignedMemberIds: ["mem-2", "mem-3"] },
    ];
    const surcharge = { name: "VAT 10%", amount: 50_000 };

    const results = computeItemizedShares(350_000, items, surcharge, mockParticipants);

    expect(results).toHaveLength(3);
    const m1 = results.find((r) => r.memberId === "mem-1")!;
    const m2 = results.find((r) => r.memberId === "mem-2")!;
    const m3 = results.find((r) => r.memberId === "mem-3")!;

    expect(m1.itemsAmount).toBe(100_000);
    expect(m1.surchargeAmount).toBe(16_667);
    expect(m1.totalAmount).toBe(116_667);

    expect(m2.itemsAmount).toBe(150_000); // 100k + 50k
    expect(m2.surchargeAmount).toBe(16_667);
    expect(m2.totalAmount).toBe(166_667);

    expect(m3.itemsAmount).toBe(50_000);
    expect(m3.surchargeAmount).toBe(16_666);
    expect(m3.totalAmount).toBe(66_666);

    const sum = results.reduce((acc, r) => acc + r.totalAmount, 0);
    expect(sum).toBe(350_000);
  });

  it("Ca 6: thành viên không ăn món nào (0 món) KHÔNG bị tính phụ phí VAT", () => {
    // 5 thành viên trong chuyến đi, nhưng chỉ mem-1 và mem-2 tham gia ăn uống.
    // Món 1 = 180k (mem-1, mem-2). Phụ phí = 20k. Tổng = 200k.
    // mem-3, mem-4, mem-5 không tham gia -> Không chịu phụ phí, không xuất hiện trong phần chia.
    const items = [
      { id: "item-1", name: "Món A", amount: 180_000, assignedMemberIds: ["mem-1", "mem-2"] },
    ];
    const surcharge = { name: "VAT 10%", amount: 20_000 };

    const results = computeItemizedShares(200_000, items, surcharge, mockParticipants);

    expect(results).toHaveLength(2);
    expect(results.some((r) => r.memberId === "mem-3")).toBe(false);
    expect(results.some((r) => r.memberId === "mem-4")).toBe(false);
    expect(results.some((r) => r.memberId === "mem-5")).toBe(false);

    const m1 = results.find((r) => r.memberId === "mem-1")!;
    const m2 = results.find((r) => r.memberId === "mem-2")!;

    expect(m1.itemsAmount).toBe(90_000);
    expect(m1.surchargeAmount).toBe(10_000);
    expect(m1.totalAmount).toBe(100_000);

    expect(m2.itemsAmount).toBe(90_000);
    expect(m2.surchargeAmount).toBe(10_000);
    expect(m2.totalAmount).toBe(100_000);

    expect(results.reduce((s, r) => s + r.totalAmount, 0)).toBe(200_000);
  });

  it("Ca 7: ném lỗi đối soát khi tổng món + phụ phí lệch số tiền hóa đơn", () => {
    const items = [
      { id: "item-1", name: "Lẩu gà", amount: 450_000, assignedMemberIds: ["mem-1"] },
    ];
    const surcharge = { name: "VAT", amount: 50_000 };

    // Tổng thực tế = 500k, nhưng totalAmount truyền vào = 480k -> Lệch 20k
    expect(() => computeItemizedShares(480_000, items, surcharge, mockParticipants)).toThrowError(
      /không khớp với tổng tiền hóa đơn/
    );
  });

  it("Ca 8: ném lỗi khi món không có ai tham gia hoặc thành viên không thuộc chuyến đi", () => {
    const emptyMembersItem = [
      { id: "item-1", name: "Lẩu gà", amount: 200_000, assignedMemberIds: [] },
    ];
    expect(() => computeItemizedShares(200_000, emptyMembersItem, null, mockParticipants)).toThrowError(
      /chưa có thành viên nào tham gia/
    );

    const unknownMemberItem = [
      { id: "item-1", name: "Lẩu gà", amount: 200_000, assignedMemberIds: ["mem-unknown"] },
    ];
    expect(() => computeItemizedShares(200_000, unknownMemberItem, null, mockParticipants)).toThrowError(
      /không thuộc danh sách thành viên/
    );
  });

  it("Ca 9: ném lỗi khi số tiền món không nguyên dương hoặc âm", () => {
    const invalidAmountItem = [
      { id: "item-1", name: "Lẩu gà", amount: 150_000.5, assignedMemberIds: ["mem-1"] },
    ];
    expect(() => computeItemizedShares(150_000.5, invalidAmountItem, null, mockParticipants)).toThrowError(
      /số nguyên dương an toàn/
    );

    const negativeAmountItem = [
      { id: "item-1", name: "Giảm giá", amount: -50_000, assignedMemberIds: ["mem-1"] },
    ];
    expect(() => computeItemizedShares(50_000, negativeAmountItem, null, mockParticipants)).toThrowError(
      /số nguyên dương an toàn/
    );
  });

  describe("Property-based test: 1,000 random itemized bills with fixed seed", () => {
    it("preserves sum invariant and safe integer amounts across 1,000 randomized itemized cases", () => {
      const rng = createMulberry32(543216789);

      for (let iter = 0; iter < 1000; iter++) {
        // 2 đến 7 thành viên
        const memberCount = randomIntBetween(rng, 2, 7);
        const participants = Array.from({ length: memberCount }, (_, idx) => ({
          id: `member_${idx + 1}`,
          joinOrder: idx + 1,
        }));

        // 1 đến 8 món ăn
        const itemCount = randomIntBetween(rng, 1, 8);
        const items: { id: string; name: string; amount: number; assignedMemberIds: string[] }[] = [];
        let itemsSum = 0;

        for (let j = 0; j < itemCount; j++) {
          const itemAmount = randomIntBetween(rng, 10_000, 2_000_000);
          itemsSum += itemAmount;

          // Chọn ngẫu nhiên ít nhất 1 thành viên tham gia món này
          const numAssigned = randomIntBetween(rng, 1, memberCount);
          const assignedIds: string[] = [];
          for (let k = 0; k < numAssigned; k++) {
            const memberId = participants[k].id;
            if (!assignedIds.includes(memberId)) {
              assignedIds.push(memberId);
            }
          }

          items.push({
            id: `item_${j + 1}`,
            name: `Món ăn số ${j + 1}`,
            amount: itemAmount,
            assignedMemberIds: assignedIds,
          });
        }

        // Phụ phí ngẫu nhiên (hoặc 0)
        const hasSurcharge = randomIntBetween(rng, 0, 1) === 1;
        const surchargeAmount = hasSurcharge ? randomIntBetween(rng, 5_000, 300_000) : 0;
        const surcharge = hasSurcharge ? { name: "VAT", amount: surchargeAmount } : null;

        const totalBillAmount = itemsSum + surchargeAmount;

        const results = computeItemizedShares(totalBillAmount, items, surcharge, participants);

        // Bất biến 1: Tổng phần chia của các thành viên bằng chính xác tổng hóa đơn
        const actualTotal = results.reduce((acc, r) => acc + r.totalAmount, 0);
        expect(actualTotal).toBe(totalBillAmount);

        // Bất biến 2: Mọi phần chia là số nguyên an toàn >= 0
        for (const r of results) {
          expect(Number.isSafeInteger(r.totalAmount)).toBe(true);
          expect(r.totalAmount).toBeGreaterThan(0);
          expect(r.itemsAmount + r.surchargeAmount).toBe(r.totalAmount);
          expect(r.assignedItemCount).toBeGreaterThan(0);
        }
      }
    });
  });
});


