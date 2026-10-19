"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabItem {
  id: string;
  segment: string;
  label: string;
  isImplemented: boolean;
}

const TABS: TabItem[] = [
  { id: "tong-quan", segment: "", label: "Tổng quan", isImplemented: true },
  { id: "lich-trinh", segment: "itinerary", label: "Lịch trình", isImplemented: false },
  { id: "chi-tieu", segment: "expenses", label: "Chi tiêu", isImplemented: true },
  { id: "cong-no", segment: "settlement", label: "Công nợ", isImplemented: true },
  { id: "thanh-vien", segment: "members", label: "Thành viên", isImplemented: false },
];

interface TripDetailTabsProps {
  tripId: string;
}

export function TripDetailTabs({ tripId }: TripDetailTabsProps) {
  const pathname = usePathname();

  // Xác định active segment dựa trên pathname hiện tại
  const activeSegment = React.useMemo(() => {
    const basePath = `/trips/${tripId}`;
    if (pathname === basePath || pathname === `${basePath}/`) return "";
    const sub = pathname.replace(`${basePath}/`, "");
    return sub.split("/")[0] || "";
  }, [pathname, tripId]);

  return (
    <div className="w-full bg-white border-b border-border-hairline">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <nav
          aria-label="Các phân hệ chuyến đi"
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = tab.segment === activeSegment;
            const tabHref = tab.segment ? `/trips/${tripId}/${tab.segment}` : `/trips/${tripId}`;

            return (
              <Link
                key={tab.id}
                href={tabHref}
                className={`py-3 sm:py-3.5 text-sm whitespace-nowrap transition-all duration-150 border-b-[3px] font-medium flex items-center ${
                  isActive
                    ? "text-cerulean font-bold border-cerulean"
                    : "text-text-muted hover:text-yale-blue border-transparent hover:border-border-hairline"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{tab.label}</span>
                {!tab.isImplemented && (
                  <span className="ml-1.5 text-[10px] font-semibold text-text-muted/60 bg-surface-container px-1.5 py-0.5 rounded-full align-middle">
                    Sắp có
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
