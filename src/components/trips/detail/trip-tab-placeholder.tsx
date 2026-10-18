"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TripTabPlaceholderProps {
  tripId: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

export function TripTabPlaceholder({
  tripId,
  icon,
  title,
  description,
  features,
}: TripTabPlaceholderProps) {
  return (
    <div className="w-full bg-white rounded-[24px] border border-border-hairline p-8 sm:p-12 shadow-[0_4px_16px_rgba(24,78,119,0.06)] flex flex-col items-center text-center max-w-2xl mx-auto my-4">
      <div className="w-16 h-16 rounded-2xl bg-ocean-mist/15 text-cerulean flex items-center justify-center mb-5">
        {icon}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-yale-blue text-xs font-semibold mb-3 border border-border-hairline">
        <span className="w-2 h-2 rounded-full bg-ocean-mist animate-pulse" />
        <span>Phân hệ đang được hoàn thiện</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-yale-blue tracking-tight mb-2">
        {title}
      </h2>

      <p className="text-sm text-text-muted max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {/* Feature Preview List */}
      <div className="w-full max-w-md bg-bg-canvas rounded-2xl p-4 sm:p-5 border border-border-hairline text-left mb-8 space-y-2.5">
        <p className="text-xs font-bold text-yale-blue uppercase tracking-wider">
          Tính năng dự kiến:
        </p>
        <ul className="text-xs text-text-body space-y-2">
          {features.map((feat) => (
            <li key={feat} className="flex items-start gap-2">
              <span className="text-cerulean font-bold">•</span>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link href={`/trips/${tripId}`}>
          <Button variant="secondary" size="md">
            Về Tổng quan
          </Button>
        </Link>
        <Link href={`/trips/${tripId}/expenses`}>
          <Button variant="primary" size="md">
            Xem Chi tiêu
          </Button>
        </Link>
      </div>
    </div>
  );
}
