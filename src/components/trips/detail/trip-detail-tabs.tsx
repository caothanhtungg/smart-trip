"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  isImplemented: boolean;
  phaseNotice?: string;
}

const TABS: TabItem[] = [
  { id: "tong-quan", label: "Tổng quan", isImplemented: true },
  {
    id: "lich-trinh",
    label: "Lịch trình",
    isImplemented: false,
    phaseNotice: "Phân hệ Lịch trình (Itinerary) sẽ được triển khai ở các giai đoạn tiếp theo của Release 1.",
  },
  {
    id: "chi-tieu",
    label: "Chi tiêu",
    isImplemented: false,
    phaseNotice: "Phân hệ Chi tiêu & Quản lý hóa đơn sẽ được triển khai ở Giai đoạn 2D của Release 1.",
  },
  {
    id: "cong-no",
    label: "Công nợ",
    isImplemented: false,
    phaseNotice: "Phân hệ Quyết toán & Rút gọn công nợ sẽ được triển khai ở Giai đoạn 2E của Release 1.",
  },
  {
    id: "thanh-vien",
    label: "Thành viên",
    isImplemented: false,
    phaseNotice: "Phân hệ Quản lý thành viên chi tiết sẽ được phát triển tiếp nối ở các giai đoạn sau của Release 1.",
  },
];

export function TripDetailTabs() {
  const [selectedNoticeTab, setSelectedNoticeTab] = React.useState<TabItem | null>(null);

  return (
    <div className="w-full bg-white border-b border-border-hairline">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <nav
          aria-label="Các phân hệ chuyến đi"
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === "tong-quan";
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (!tab.isImplemented) {
                    setSelectedNoticeTab(tab);
                  }
                }}
                className={`py-3 sm:py-3.5 text-sm whitespace-nowrap transition-all duration-150 cursor-pointer border-b-[3px] font-medium ${
                  isActive
                    ? "text-cerulean font-bold border-cerulean"
                    : "text-text-muted hover:text-yale-blue border-transparent hover:border-border-hairline"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Notice Modal */}
      <Modal
        isOpen={selectedNoticeTab !== null}
        onClose={() => setSelectedNoticeTab(null)}
        title={`Phân hệ ${selectedNoticeTab?.label || ""}`}
        description="Thông tin phạm vi phát triển Release 1"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cerulean shrink-0 mt-0.5" />
            <div className="text-sm text-text-body space-y-1">
              <p className="font-bold text-yale-blue">
                Chức năng đang phát triển
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                {selectedNoticeTab?.phaseNotice ||
                  "Phân hệ này sẽ được phát triển ở các giai đoạn tiếp theo của Release 1."}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button
              variant="primary"
              size="md"
              onClick={() => setSelectedNoticeTab(null)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
