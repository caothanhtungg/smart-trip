import { describe, it, expect } from "vitest";
import { THEME_STORAGE_KEY, ThemeMode } from "./theme-context";

describe("ThemeContext & Key Specification", () => {
  it("defines standard theme storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("smart_trip_theme");
  });

  it("supports all 3 expected theme modes", () => {
    const validModes: ThemeMode[] = ["light", "dark", "system"];
    expect(validModes).toContain("light");
    expect(validModes).toContain("dark");
    expect(validModes).toContain("system");
  });
});
