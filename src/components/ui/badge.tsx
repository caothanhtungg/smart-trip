import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ShieldCheck } from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "planning" // Đang lên kế hoạch
    | "settling" // Đang thanh toán
    | "completed" // Đã hoàn tất
    | "unpaid" // Chưa thanh toán
    | "paid" // Đã thanh toán
    | "host" // Trưởng nhóm
    | "no-account" // Chưa có tài khoản
    | "default";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 font-semibold rounded-full select-none";

  const sizes = {
    sm: "h-6 px-2.5 text-xs",
    md: "h-8 px-3.5 text-sm",
  };

  const variants = {
    default: "bg-[#EEF6E4] text-yale-blue border border-border-hairline",
    planning: "bg-[#52B69A]/15 text-cerulean", // Đang lên kế hoạch
    settling: "bg-[#FFF1E6] text-functional-warning", // Đang thanh toán
    completed: "bg-lime-cream text-yale-blue font-bold", // Đã hoàn tất
    unpaid: "bg-[#FFF1E6] text-functional-warning", // Chưa thanh toán
    paid: "bg-[#52B69A]/15 text-ocean-mist font-bold", // Đã thanh toán
    host: "bg-yale-blue text-white", // Trưởng nhóm
    "no-account": "border-[1.5px] border-dashed border-ocean-mist bg-ocean-mist/10 text-cerulean font-medium", // Chưa có tài khoản
  };

  return (
    <span
      className={cn(baseStyles, sizes[size], variants[variant], className)}
      {...props}
    >
      {variant === "completed" && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
      {variant === "host" && <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />}
      <span>{children}</span>
    </span>
  );
}
