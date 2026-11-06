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
      className="absolute right-0 top-12 w-[340px] sm:w-[380px] bg-white dark:bg-[#1C2541] rounded-2xl border border-divider-border dark:border-[#2D3A54] shadow-[0_12px_36px_rgba(24,78,119,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Thông báo hệ thống"
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-divider-border/80 dark:border-[#2D3A54] flex items-center justify-between bg-white dark:bg-[#1C2541]">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cerulean dark:text-sky-400" />
          <h3 className="font-bold text-sm sm:text-base text-yale-blue dark:text-white">Thông báo</h3>
          {unreadNotificationCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cerulean dark:bg-sky-500 text-white text-xs font-semibold">
              {unreadNotificationCount} mới
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-medium text-cerulean dark:text-sky-400 hover:text-baltic-blue px-2 py-1 rounded-lg hover:bg-hover-row dark:hover:bg-[#243050] transition-colors flex items-center gap-1 cursor-pointer"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã đọc hết</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification list or Empty State */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-divider-border/50 dark:divide-[#2D3A54]">
        {notifications.length === 0 ? (
          <div className="py-10 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-hover-row dark:bg-[#243050] flex items-center justify-center text-text-muted dark:text-slate-400 mb-3">
              <Bell className="w-6 h-6 text-text-muted dark:text-slate-400 stroke-[1.8]" />
            </div>
            <h4 className="text-sm font-bold text-yale-blue dark:text-white mb-1">
              Chưa có thông báo nào
            </h4>
            <p className="text-xs text-text-muted dark:text-slate-400 max-w-[240px] leading-relaxed">
              Bạn sẽ nhận được thông báo khi có khoản chi mới hoặc nhắc nợ trong chuyến đi.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.isRead;
            return (
              <div
                key={item.id}
                className={`p-3.5 transition-colors flex items-start gap-3 relative ${
                  isUnread
                    ? "bg-hover-row/60 dark:bg-[#243050]/60"
                    : "hover:bg-hover-row/30 dark:hover:bg-[#243050]/30"
                }`}
              >
                {/* Icon based on type */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === "CLAIM"
                      ? "bg-cerulean/15 text-cerulean dark:text-sky-400"
                      : item.type === "PAYMENT"
                      ? "bg-functional-warning-bg text-functional-warning dark:bg-amber-500/15 dark:text-amber-400"
                      : "bg-emerald/20 text-functional-positive dark:text-emerald-400"
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
                    <h4 className="text-xs font-semibold text-yale-blue dark:text-white truncate">
                      {item.title}
                    </h4>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-cerulean dark:bg-sky-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted dark:text-slate-300 line-clamp-2 leading-relaxed mb-1.5">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted/80 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(item.id)}
                          className="text-[11px] text-text-muted dark:text-slate-400 hover:text-cerulean dark:hover:text-sky-400 cursor-pointer"
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
                          className="text-[11px] font-medium text-cerulean dark:text-sky-400 hover:underline cursor-pointer"
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
      <div className="px-4 py-2.5 bg-hover-row/40 dark:bg-[#131B2E] border-t border-divider-border/80 dark:border-[#2D3A54] text-center">
        <span className="text-[11px] text-text-muted dark:text-slate-400">
          Trung tâm thông báo
        </span>
      </div>
    </div>
  );
}
