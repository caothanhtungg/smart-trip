"use client";

import * as React from "react";

interface AppShellContextValue {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapse: () => void;
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = React.useState(false);

  // Load initial preference from localStorage on client mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("smart_trip_sidebar_collapsed");
      if (stored !== null) {
        queueMicrotask(() => {
          setIsSidebarCollapsedState(stored === "true");
        });
      }
    } catch {
      // Ignore storage access errors in restricted iframe/incognito
    }
  }, []);

  const openMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const toggleMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const setIsSidebarCollapsed = React.useCallback((collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem("smart_trip_sidebar_collapsed", String(collapsed));
    } catch {}
  }, []);

  const toggleSidebarCollapse = React.useCallback(() => {
    setIsSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("smart_trip_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      isMobileSidebarOpen,
      openMobileSidebar,
      closeMobileSidebar,
      toggleMobileSidebar,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      toggleSidebarCollapse,
    }),
    [
      isMobileSidebarOpen,
      openMobileSidebar,
      closeMobileSidebar,
      toggleMobileSidebar,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      toggleSidebarCollapse,
    ]
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellContextValue {
  const context = React.useContext(AppShellContext);
  if (!context) {
    return {
      isMobileSidebarOpen: false,
      openMobileSidebar: () => {},
      closeMobileSidebar: () => {},
      toggleMobileSidebar: () => {},
      isSidebarCollapsed: false,
      setIsSidebarCollapsed: () => {},
      toggleSidebarCollapse: () => {},
    };
  }
  return context;
}

