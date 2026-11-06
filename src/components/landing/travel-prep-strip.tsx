"use client";

import * as React from "react";
import { motion } from "motion/react";
import { transition } from "@animate-ui/react/utils/motion";
import {
  MapPin,
  Users,
  Receipt,
  QrCode,
  Sparkles,
} from "lucide-react";

const PREP_ITEMS = [
  {
    icon: MapPin,
    title: "1. Lên lịch trình",
    desc: "Sắp xếp thứ tự các điểm check-in sáng, trưa, tối logic và mượt mà.",
    badge: "Bản đồ & Lộ trình",
    color: "text-cerulean dark:text-sky-400",
    bg: "bg-cerulean/10 dark:bg-sky-500/15",
  },
  {
    icon: Users,
    title: "2. Mời nhóm bạn",
    desc: "Tham gia tức thì qua link hoặc quét mã QR, không bắt buộc tải app.",
    badge: "1-chạm tham gia",
    color: "text-functional-positive dark:text-emerald-400",
    bg: "bg-emerald/10 dark:bg-emerald-950/40",
  },
  {
    icon: Receipt,
    title: "3. Ghi chi tiêu & hóa đơn",
    desc: "Lưu trữ ảnh hóa đơn gốc, linh hoạt chia đều hoặc chia theo từng món.",
    badge: "Minh bạch 100%",
    color: "text-yale-blue dark:text-teal-300",
    bg: "bg-lime-cream/60 dark:bg-teal-950/50",
  },
  {
    icon: QrCode,
    title: "4. Chốt sổ & VietQR",
    desc: "Tự động rút gọn nợ chéo, chuyển khoản tất toán tức thì bằng Napas 24/7.",
    badge: "Khớp từng đồng",
    color: "text-cerulean dark:text-sky-400",
    bg: "bg-cerulean/10 dark:bg-sky-500/15",
  },
];

export function TravelPrepStrip() {
  return (
    <section className="w-full py-16 lg:py-20 bg-white/70 dark:bg-[#0A0F1D]/80 border-y border-border-hairline dark:border-[#1E2A42] backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header (Editorial Minimalism) */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-cream/50 dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-yale-blue dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cerulean dark:text-sky-400" />
            <span>Trải nghiệm du lịch tinh gọn</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-yale-blue dark:text-white tracking-tight">
            Chuẩn bị cho chuyến đi của bạn
          </h2>
          <p className="text-sm sm:text-base text-text-muted dark:text-slate-400 mt-2">
            Mọi công cụ cần thiết để tổ chức chuyến đi nhóm hoàn hảo, không còn lo nghĩ tính toán.
          </p>
        </div>

        {/* 4 Icon Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {PREP_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ ...transition.panelIn, delay: idx * 0.07 }}
                className="flex flex-col items-start p-6 rounded-2xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] shadow-[0_6px_20px_rgba(24,78,119,0.04)] dark:shadow-none hover:shadow-[0_12px_32px_rgba(24,78,119,0.08)] dark:hover:border-sky-500/30 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-slate-400 mb-1">
                  {item.badge}
                </span>

                <h3 className="text-base font-bold text-yale-blue dark:text-white tracking-tight mb-2">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-text-muted dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
