"use client";

import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export const THEME_STORAGE_KEY = "smart_trip_theme";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore localStorage access failures
  }
  return "light";
}

function getInitialResolvedTheme(themeMode: ThemeMode): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (themeMode === "dark") return "dark";
  if (themeMode === "system") {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    getInitialResolvedTheme(getStoredTheme())
  );

  // Sync theme with DOM and listen for system preference changes
  React.useEffect(() => {
    const root = document.documentElement;

    function applyResolved(isDark: boolean) {
      if (isDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
        setResolvedTheme("light");
      }
    }

    if (theme === "dark") {
      applyResolved(true);
    } else if (theme === "light") {
      applyResolved(false);
    } else {
      // System mode: detect and watch MediaQuery
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      applyResolved(mql.matches);

      const handler = (e: MediaQueryListEvent) => applyResolved(e.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = React.useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light",
      resolvedTheme: "light",
      setTheme: () => {},
    };
  }
  return context;
}
