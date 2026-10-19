"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Info,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPopover({ isOpen, onClose }: NotificationPopoverProps) {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useUserProfile();

  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 w-[360px] sm:w-[400px] bg-surface-card rounded-2xl border border-divider-border shadow-[0_12px_36px_rgba(24,78,119,0.18)] z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Thông báo hệ thống"
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-divider-border/80 flex items-center justify-between bg-surface-card">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cerulean" />
          <h3 className="font-title-md text-title-md text-yale-blue">Thông báo</h3>
          {unreadNotificationCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cerulean text-on-primary text-xs font-semibold">
              {unreadNotificationCount} mới
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-medium text-cerulean hover:text-baltic-blue px-2 py-1 rounded-lg hover:bg-hover-row transition-colors flex items-center gap-1 cursor-pointer"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã đọc hết</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Demo notice banner */}
      <div className="px-4 py-2 bg-functional-warning-bg/60 border-b border-divider-border/60 flex items-start gap-2">
        <Info className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
        <p className="text-[11px] text-yale-blue leading-tight">
          <strong>Dữ liệu thông báo mô phỏng (Demo Release 1):</strong> Không phải thông báo
          thời gian thực từ máy chủ. Cập nhật trạng thái tức thì trong phiên làm việc.
        </p>
      </div>

      {/* Notification list */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-divider-border/50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm">
            Bạn không có thông báo nào
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.isRead;
            return (
              <div
                key={item.id}
                className={`p-3.5 transition-colors flex items-start gap-3 relative ${
                  isUnread ? "bg-hover-row/60" : "hover:bg-hover-row/30"
                }`}
              >
                {/* Icon based on type */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === "CLAIM"
                      ? "bg-cerulean/15 text-cerulean"
                      : item.type === "PAYMENT"
                      ? "bg-functional-warning-bg text-functional-warning"
                      : "bg-emerald/20 text-functional-positive"
                  }`}
                >
                  {item.type === "CLAIM" && <UserCheck className="w-4 h-4" />}
                  {item.type === "PAYMENT" && <Wallet className="w-4 h-4" />}
                  {item.type === "SETTLEMENT" && <CheckCircle2 className="w-4 h-4" />}
                  {item.type === "INFO" && <Info className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-xs font-semibold text-yale-blue truncate">
                      {item.title}
                    </h4>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-cerulean shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-1.5">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted/80 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(item.id)}
                          className="text-[11px] text-text-muted hover:text-cerulean cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      {item.linkUrl && (
                        <Link
                          href={item.linkUrl}
                          onClick={() => {
                            markNotificationAsRead(item.id);
                            onClose();
                          }}
                          className="text-[11px] font-medium text-cerulean hover:underline cursor-pointer"
                        >
                          Xem chi tiết →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-surface-container-low border-t border-divider-border/80 text-center">
        <span className="text-[11px] text-text-muted">
          Smart Trip Release 1 • Trung tâm thông báo
        </span>
      </div>
    </div>
  );
}
