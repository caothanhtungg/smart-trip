import { describe, it, expect } from "vitest";
import { LandingFooter } from "@/components/landing/landing-footer";

describe("LandingFooter Component & Brand Signature", () => {
  it("exports valid LandingFooter component", () => {
    expect(typeof LandingFooter).toBe("function");
  });
});
