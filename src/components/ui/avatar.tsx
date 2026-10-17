import * as React from "react";
import Image from "next/image";
import { cn, getInitials, getAvatarBgColor } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isNoAccount?: boolean; // Thành viên chưa có tài khoản
}

export function Avatar({
  className,
  name,
  src,
  size = "md",
  isNoAccount = false,
  ...props
}: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm", // 40px standard
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const initials = getInitials(name);
  const bgColor = getAvatarBgColor(name);

  return (
    <div
      title={isNoAccount ? `${name} (Chưa có tài khoản)` : name}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-bold text-yale-blue shrink-0 select-none overflow-hidden",
        sizes[size],
        !src && bgColor,
        isNoAccount && "ring-2 ring-dashed ring-ocean-mist ring-offset-2",
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover rounded-full"
          sizes="64px"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
