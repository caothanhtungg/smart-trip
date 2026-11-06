"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CursorSide = "left" | "right" | "none";

export interface CalculateCursorSideOptions {
  relX: number;
  width: number;
  currentIndex: number;
  total: number;
  isCircular?: boolean;
}

/**
 * Pure helper function to compute which side of the gallery the pointer is on,
 * considering circular navigation and boundaries.
 */
export function calculateCursorSide({
  relX,
  width,
  currentIndex,
  total,
  isCircular = true,
}: CalculateCursorSideOptions): CursorSide {
  if (width <= 0 || total <= 1) return "none";

  const isLeftHalf = relX < width / 2;
  if (isLeftHalf) {
    if (!isCircular && currentIndex <= 0) return "none";
    return "left";
  } else {
    if (!isCircular && currentIndex >= total - 1) return "none";
    return "right";
  }
}

export interface UseCursorGalleryOptions {
  total: number;
  currentIndex: number;
  onNavigate: (direction: -1 | 1) => void;
  isCircular?: boolean;
}

/**
 * Custom hook providing 60fps cursor follower navigation without React state re-render thrashing.
 * Updates DOM style transform directly on pointermove, only updating React state when crossing midpoint.
 */
export function useCursorGallery({
  total,
  currentIndex,
  onNavigate,
  isCircular = true,
}: UseCursorGalleryOptions) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cursorRef = React.useRef<HTMLDivElement | null>(null);
  const [cursorSide, setCursorSide] = React.useState<CursorSide>("none");

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Disregard touch events (mobile phones/tablets)
      if (e.pointerType === "touch" || total <= 1) {
        setCursorSide("none");
        return;
      }

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      // Update cursor position directly via transform — zero React re-renders!
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${relX}px, ${relY}px, 0) translate(-50%, -50%)`;
      }

      const nextSide = calculateCursorSide({
        relX,
        width: rect.width,
        currentIndex,
        total,
        isCircular,
      });

      setCursorSide((prev) => (prev !== nextSide ? nextSide : prev));
    },
    [total, currentIndex, isCircular]
  );

  const handlePointerLeave = React.useCallback(() => {
    setCursorSide("none");
  }, []);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (total <= 1) return;

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const side = calculateCursorSide({
        relX,
        width: rect.width,
        currentIndex,
        total,
        isCircular,
      });

      if (side === "left") {
        onNavigate(-1);
      } else if (side === "right") {
        onNavigate(1);
      }
    },
    [total, currentIndex, isCircular, onNavigate]
  );

  return {
    containerRef,
    cursorRef,
    cursorSide,
    handlePointerMove,
    handlePointerLeave,
    handleClick,
  };
}

export interface CursorGalleryIndicatorProps {
  cursorRef: React.RefObject<HTMLDivElement | null>;
  cursorSide: CursorSide;
  size?: number;
  className?: string;
}

/**
 * Visual floating indicator badge rendered over the gallery container.
 */
export function CursorGalleryIndicator({
  cursorRef,
  cursorSide,
  size = 52,
  className = "",
}: CursorGalleryIndicatorProps) {
  const isVisible = cursorSide !== "none";

  return (
    <div
      ref={cursorRef}
      style={{
        width: size,
        height: size,
      }}
      className={`pointer-events-none absolute left-0 top-0 z-30 hidden md:flex items-center justify-center rounded-full bg-black/60 dark:bg-black/75 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-opacity duration-150 will-change-transform select-none ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
      } ${className}`}
      aria-hidden="true"
    >
      {cursorSide === "left" ? (
        <ChevronLeft className="w-6 h-6 text-white stroke-[2.5] drop-shadow-sm" />
      ) : cursorSide === "right" ? (
        <ChevronRight className="w-6 h-6 text-white stroke-[2.5] drop-shadow-sm" />
      ) : null}
    </div>
  );
}

