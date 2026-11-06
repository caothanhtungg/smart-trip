"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container top-right */}
      <div className="fixed top-5 right-5 z-[110] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-[14px] bg-white border shadow-[0_8px_24px_rgba(24,78,119,0.14)] animate-in slide-in-from-top-3 duration-200",
              item.type === "success" && "border-ocean-mist text-yale-blue",
              item.type === "error" && "border-functional-negative text-functional-negative",
              item.type === "info" && "border-cerulean text-yale-blue"
            )}
          >
            <div className="flex items-center gap-2.5">
              {item.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-ocean-mist shrink-0" />
              )}
              {item.type === "error" && (
                <AlertCircle className="w-5 h-5 text-functional-negative shrink-0" />
              )}
              {item.type === "info" && (
                <Info className="w-5 h-5 text-cerulean shrink-0" />
              )}
              <span className="text-sm font-semibold">{item.message}</span>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-text-muted hover:text-yale-blue p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
