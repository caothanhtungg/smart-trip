import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-[12px] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-3 focus-visible:ring-ocean-mist focus-visible:ring-offset-2";

    const variants = {
      primary:
        "bg-cerulean text-white hover:bg-baltic-blue active:bg-baltic-blue shadow-sm",
      secondary:
        "bg-white text-cerulean border-[1.5px] border-cerulean hover:bg-hover-row",
      outline:
        "bg-white text-yale-blue border border-border-hairline hover:bg-hover-row",
      ghost:
        "bg-transparent text-yale-blue hover:bg-hover-row",
      destructive:
        "bg-transparent text-functional-negative hover:bg-functional-warning-bg hover:text-functional-negative",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm rounded-[10px]",
      md: "h-11 px-5 text-base", // 44px height default
      lg: "h-13 px-6 text-base md:text-lg rounded-[14px]", // 52px height
      icon: "h-11 w-11 p-0 rounded-full",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span>Đang xử lý...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
