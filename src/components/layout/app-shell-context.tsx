"use client";

import * as React from "react";

interface AppShellContextValue {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const openMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const toggleMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isMobileSidebarOpen,
      openMobileSidebar,
      closeMobileSidebar,
      toggleMobileSidebar,
    }),
    [isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar, toggleMobileSidebar]
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
    };
  }
  return context;
}

