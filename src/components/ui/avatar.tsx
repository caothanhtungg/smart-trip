import * as React from "react";
import Image from "next/image";
import { cn, getInitials, getAvatarBgColor } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isNoAccount?: boolean; // Thành viên chưa có tài khoản
  ringColor?: string;
}

export function Avatar({
  className,
  name,
  src,
  size = "md",
  isNoAccount = false,
  ringColor,
  ...props
}: AvatarProps) {
  const [prevSrc, setPrevSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
  }

  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm", // 40px standard
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const initials = getInitials(name);
  const bgColor = getAvatarBgColor(name);
  const showImage = Boolean(src && !hasError);

  return (
    <div
      title={isNoAccount ? `${name} (Chưa có tài khoản)` : name}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-bold text-yale-blue shrink-0 select-none overflow-hidden",
        sizes[size],
        !showImage && bgColor,
        isNoAccount && "ring-2 ring-dashed ring-ocean-mist ring-offset-2",
        ringColor && `ring-2 ${ringColor}`,
        className
      )}
      {...props}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={name}
          fill
          unoptimized
          className="object-cover rounded-full"
          sizes="64px"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// AVATAR GROUP (AVATAR STACK / FACEPILE)
export interface AvatarGroupItem {
  id?: string;
  name: string;
  src?: string | null;
  role?: string;
  isNoAccount?: boolean;
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: AvatarGroupItem[];
  max?: number; // Maximum visible avatars before overflow (default: 4)
  size?: "xs" | "sm" | "md" | "lg";
  ringColor?: string; // Separation ring color (default: "ring-white")
  stackDirection?: "first-on-top" | "last-on-top";
  onOverflowClick?: () => void;
  children?: React.ReactNode;
}

export function AvatarGroup({
  className,
  items,
  max = 4,
  size = "md",
  ringColor = "ring-white",
  stackDirection = "first-on-top",
  onOverflowClick,
  children,
  ...props
}: AvatarGroupProps) {
  // Negative spacing according to avatar size
  const spacingMap = {
    xs: "-space-x-1.5",
    sm: "-space-x-2",
    md: "-space-x-2.5",
    lg: "-space-x-3",
  };

  const overflowSizes = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  // 1. Data-driven mode: when items array is provided
  if (items && items.length > 0) {
    const total = items.length;
    const effectiveMax = Math.max(1, max);
    const hasOverflow = total > effectiveMax;
    const visibleCount = hasOverflow ? effectiveMax : total;
    const visibleItems = items.slice(0, visibleCount);
    const overflowCount = total - visibleCount;
    const hiddenNames = items.slice(visibleCount).map((m) => m.name).join(", ");

    return (
      <div
        className={cn(
          "flex items-center select-none py-0.5",
          spacingMap[size],
          className
        )}
        aria-label={`Nhóm ${total} thành viên`}
        {...props}
      >
        {visibleItems.map((item, index) => {
          const zIndex =
            stackDirection === "first-on-top"
              ? visibleCount - index + 10
              : index + 1;

          return (
            <div
              key={item.id || `${item.name}-${index}`}
              style={{ zIndex }}
              className="relative transition-transform duration-150 hover:scale-110 hover:z-30 cursor-pointer"
            >
              <Avatar
                name={item.name}
                src={item.src}
                size={size}
                isNoAccount={item.isNoAccount}
                className={cn("ring-2", ringColor)}
                title={item.role ? `${item.name} (${item.role})` : item.name}
              />
            </div>
          );
        })}

        {hasOverflow && (
          <div
            style={{
              zIndex: stackDirection === "first-on-top" ? 1 : visibleCount + 1,
            }}
            className="relative transition-transform duration-150 hover:scale-110 hover:z-30"
          >
            {onOverflowClick ? (
              <button
                type="button"
                onClick={onOverflowClick}
                title={`Và ${overflowCount} thành viên khác: ${hiddenNames}`}
                aria-label={`Xem thêm ${overflowCount} thành viên khác`}
                className={cn(
                  "relative inline-flex items-center justify-center rounded-full font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 ring-2 shrink-0 cursor-pointer transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-cerulean",
                  overflowSizes[size],
                  ringColor
                )}
              >
                +{overflowCount}
              </button>
            ) : (
              <div
                title={`Và ${overflowCount} thành viên khác: ${hiddenNames}`}
                className={cn(
                  "relative inline-flex items-center justify-center rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200/90 ring-2 shrink-0 shadow-2xs",
                  overflowSizes[size],
                  ringColor
                )}
              >
                +{overflowCount}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. Declarative composition mode: when using <AvatarGroup><Avatar ... /></AvatarGroup>
  const childArray = React.Children.toArray(children);
  const total = childArray.length;
  const effectiveMax = Math.max(1, max);
  const hasOverflow = total > effectiveMax;
  const visibleChildren = childArray.slice(0, hasOverflow ? effectiveMax : total);
  const overflowCount = total - effectiveMax;

  return (
    <div
      className={cn(
        "flex items-center select-none py-0.5",
        spacingMap[size],
        className
      )}
      aria-label={`Nhóm ${total} thành viên`}
      {...props}
    >
      {visibleChildren.map((child, index) => {
        const zIndex =
          stackDirection === "first-on-top"
            ? visibleChildren.length - index + 10
            : index + 1;

        return (
          <div
            key={index}
            style={{ zIndex }}
            className="relative transition-transform duration-150 hover:scale-110 hover:z-30 cursor-pointer"
          >
            {React.isValidElement<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>(child)
              ? React.cloneElement(child, {
                  size,
                  className: cn("ring-2", ringColor, child.props.className),
                })
              : child}
          </div>
        );
      })}

      {hasOverflow && (
        <div
          style={{
            zIndex: stackDirection === "first-on-top" ? 1 : visibleChildren.length + 1,
          }}
          className="relative transition-transform duration-150 hover:scale-110 hover:z-30"
        >
          {onOverflowClick ? (
            <button
              type="button"
              onClick={onOverflowClick}
              title={`Và ${overflowCount} người khác`}
              aria-label={`Xem thêm ${overflowCount} người khác`}
              className={cn(
                "relative inline-flex items-center justify-center rounded-full font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 ring-2 shrink-0 cursor-pointer transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-cerulean",
                overflowSizes[size],
                ringColor
              )}
            >
              +{overflowCount}
            </button>
          ) : (
            <div
              title={`Và ${overflowCount} người khác`}
              className={cn(
                "relative inline-flex items-center justify-center rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200/90 ring-2 shrink-0 shadow-2xs",
                overflowSizes[size],
                ringColor
              )}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
