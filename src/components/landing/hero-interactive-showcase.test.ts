import { describe, it, expect } from "vitest";
import { HeroInteractiveShowcase } from "@/components/landing/hero-interactive-showcase";

describe("HeroInteractiveShowcase Component", () => {
  it("exports valid HeroInteractiveShowcase functional component", () => {
    expect(typeof HeroInteractiveShowcase).toBe("function");
  });
});
