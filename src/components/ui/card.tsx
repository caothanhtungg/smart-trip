import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasCoverGradient?: boolean;
}

export function Card({
  className,
  children,
  hasCoverGradient = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] bg-white border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] overflow-hidden transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {hasCoverGradient && (
        <div className="h-24 sm:h-28 w-full trip-cover-gradient" />
      )}
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pb-3 flex flex-col gap-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg sm:text-xl font-bold text-yale-blue tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-text-muted", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-6 pt-0 flex items-center justify-between gap-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
