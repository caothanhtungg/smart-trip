import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[20px] bg-white border border-dashed border-border-hairline",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#52B69A]/15 text-cerulean">
          {icon}
        </div>
      )}
      <h4 className="text-lg font-bold text-yale-blue tracking-tight">{title}</h4>
      <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md" className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
