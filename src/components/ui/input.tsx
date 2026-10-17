import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-yale-blue"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            "h-12 w-full rounded-[12px] border border-border-hairline bg-white px-4 text-base text-yale-blue placeholder:text-text-muted transition-all duration-150",
            "focus:outline-none focus:border-cerulean focus:ring-3 focus:ring-ocean-mist/30",
            error && "border-functional-negative focus:border-functional-negative focus:ring-functional-negative/20",
            "disabled:cursor-not-allowed disabled:bg-hover-row disabled:opacity-60",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-functional-negative">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
