"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripNotFoundProps {
  tripId?: string;
}

export function TripNotFound({ tripId }: TripNotFoundProps) {
  return (
    <div className="w-full max-w-[600px] mx-auto py-16 px-4 text-center">
      <div className="bg-white rounded-3xl border border-border-hairline p-8 sm:p-12 shadow-[0_8px_30px_rgba(24,78,119,0.08)] flex flex-col items-center">
        {/* Icon Circle */}
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
          <Compass className="w-10 h-10 text-cerulean stroke-[1.8] animate-spin-slow" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-yale-blue tracking-tight mb-3">
          Không tìm thấy chuyến đi
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-text-muted max-w-[440px] leading-relaxed mb-6">
          Chuyến đi với mã nhận diện{" "}
          {tripId ? (
            <code className="px-2 py-0.5 rounded-md bg-hover-row text-yale-blue font-mono font-semibold text-xs">
              {tripId}
            </code>
          ) : (
            "yêu cầu"
          )}{" "}
          không tồn tại hoặc bạn không có quyền truy cập vào dữ liệu này.
        </p>

        {/* Back Button */}
        <Link href="/trips">
          <Button
            variant="primary"
            size="lg"
            className="flex items-center gap-2 rounded-xl shadow-[0_4px_12px_rgba(26,117,159,0.25)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách chuyến đi</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
