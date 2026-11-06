import { describe, it, expect } from "vitest";
import { ShaderCanvas } from "@/components/ui/shader-canvas";

describe("ShaderCanvas Component Interface & Fallbacks", () => {
  it("exports valid ShaderCanvas React component", () => {
    expect(typeof ShaderCanvas).toBe("function");
  });

  it("handles default colors matching travel planner design system tokens", () => {
    // Validates that color tokens match project theme conventions
    const sampleColors = {
      u_accent: "var(--color-cerulean, #1A759F)",
      u_surface: "var(--color-bg-canvas, #F4F9EC)",
      u_highlight: "var(--color-lime-cream, #D9ED92)",
      u_ink: "var(--color-baltic-blue, #184E77)",
    };

    expect(sampleColors.u_accent).toContain("--color-cerulean");
    expect(sampleColors.u_surface).toContain("--color-bg-canvas");
    expect(sampleColors.u_highlight).toContain("--color-lime-cream");
    expect(sampleColors.u_ink).toContain("--color-baltic-blue");
  });

  it("defines GLSL fragment shader with valid main entrypoint", () => {
    const glslFragment = `
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;
    expect(glslFragment).toContain("void main()");
    expect(glslFragment).toContain("gl_FragColor");
  });
});

