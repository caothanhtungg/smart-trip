import { describe, it, expect } from "vitest";
import { calculateCursorSide } from "@/components/ui/cursor-gallery";

describe("Cursor Gallery Math & Navigation Invariants", () => {
  it("detects left and right sides accurately based on relative horizontal coordinate", () => {
    const width = 1000;
    // Left side: relX < 500
    expect(calculateCursorSide({ relX: 200, width, currentIndex: 1, total: 4 })).toBe("left");
    expect(calculateCursorSide({ relX: 499, width, currentIndex: 1, total: 4 })).toBe("left");

    // Right side: relX >= 500
    expect(calculateCursorSide({ relX: 500, width, currentIndex: 1, total: 4 })).toBe("right");
    expect(calculateCursorSide({ relX: 850, width, currentIndex: 1, total: 4 })).toBe("right");
  });

  it("returns none when total images is 1 or width is invalid", () => {
    expect(calculateCursorSide({ relX: 100, width: 500, currentIndex: 0, total: 1 })).toBe("none");
    expect(calculateCursorSide({ relX: 100, width: 0, currentIndex: 0, total: 4 })).toBe("none");
    expect(calculateCursorSide({ relX: 100, width: -100, currentIndex: 0, total: 4 })).toBe("none");
  });

  it("handles circular wrap mode (default: isCircular = true)", () => {
    const width = 800;
    // At index 0, circular mode still allows moving left (wraps to last)
    expect(
      calculateCursorSide({ relX: 200, width, currentIndex: 0, total: 5, isCircular: true })
    ).toBe("left");

    // At last index, circular mode still allows moving right (wraps to first)
    expect(
      calculateCursorSide({ relX: 600, width, currentIndex: 4, total: 5, isCircular: true })
    ).toBe("right");
  });

  it("suppresses navigation at boundaries when circular mode is explicitly disabled", () => {
    const width = 800;
    // At index 0, non-circular mode hides left arrow
    expect(
      calculateCursorSide({ relX: 200, width, currentIndex: 0, total: 5, isCircular: false })
    ).toBe("none");
    // But right arrow is still active
    expect(
      calculateCursorSide({ relX: 600, width, currentIndex: 0, total: 5, isCircular: false })
    ).toBe("right");

    // At last index (4 of 5), non-circular mode hides right arrow
    expect(
      calculateCursorSide({ relX: 600, width, currentIndex: 4, total: 5, isCircular: false })
    ).toBe("none");
    // But left arrow is active
    expect(
      calculateCursorSide({ relX: 200, width, currentIndex: 4, total: 5, isCircular: false })
    ).toBe("left");
  });
});

