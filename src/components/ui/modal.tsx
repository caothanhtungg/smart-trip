"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = "md",
}: ModalProps) {
  // Close on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-md",
    md: "max-w-[560px]", // 560px standard Stitch modal width
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-[#184E77]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          "relative w-full rounded-[24px] bg-white p-6 sm:p-8 shadow-[0_20px_48px_rgba(24,78,119,0.22)] border border-border-hairline z-10 animate-in fade-in zoom-in-95 duration-200",
          maxWidths[maxWidth],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && (
              <h3 className="text-xl sm:text-2xl font-bold text-yale-blue tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-text-muted mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-muted hover:bg-hover-row hover:text-yale-blue transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
