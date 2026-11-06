"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";

interface TabItem {
  id: string;
  segment: string;
  label: string;
  isImplemented: boolean;
}

const TABS: TabItem[] = [
  { id: "tong-quan", segment: "", label: "Tổng quan", isImplemented: true },
  { id: "lich-trinh", segment: "itinerary", label: "Lịch trình", isImplemented: true },
  { id: "chi-tieu", segment: "expenses", label: "Chi tiêu", isImplemented: true },
  { id: "cong-no", segment: "settlement", label: "Công nợ", isImplemented: true },
  { id: "thanh-vien", segment: "members", label: "Thành viên", isImplemented: true },
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
    <div className="w-full bg-white dark:bg-[#141C2E] border-b border-border-hairline dark:border-[#24314A]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <nav
          aria-label="Các phân hệ chuyến đi"
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = tab.segment === activeSegment;
            const tabHref = tab.segment ? `/trips/${tripId}/${tab.segment}` : `/trips/${tripId}`;

            return (
              <motion.div
                key={tab.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={spring.press}
                className="relative"
              >
                <Link
                  href={tabHref}
                  className={`relative py-3 sm:py-3.5 px-1 sm:px-1.5 text-sm whitespace-nowrap transition-colors font-medium flex items-center group cursor-pointer ${
                    isActive
                      ? "text-cerulean dark:text-sky-400 font-bold"
                      : "text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-sky-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="relative z-10 transition-transform duration-200 group-hover:scale-105">
                    {tab.label}
                  </span>
                  {!tab.isImplemented && (
                    <span className="relative z-10 ml-1.5 text-[10px] font-semibold text-text-muted/60 dark:text-slate-400 bg-surface-container dark:bg-slate-800 px-1.5 py-0.5 rounded-full align-middle">
                      Sắp có
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="trip-detail-active-tab-indicator"
                      className="absolute bottom-0 inset-x-0 h-[3px] bg-cerulean dark:bg-sky-400 rounded-full shadow-[0_1px_8px_rgba(14,165,233,0.5)] dark:shadow-[0_1px_8px_rgba(56,189,248,0.5)]"
                      transition={spring.selection}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
