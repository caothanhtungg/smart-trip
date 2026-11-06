"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import {
  spring,
  ReducedMotionConfig,
} from "@animate-ui/react/utils/motion";
import {
  MapPin,
  Calendar,
  QrCode,
  ArrowRight,
  Compass,
  CheckCircle2,
  CloudSun,
} from "lucide-react";

interface DestinationSpot {
  id: string;
  name: string;
  location: string;
  weather: string;
  days: string;
  highlight: string;
  members: string[];
  imageUrl: string;
  settlementSummary: string;
}

const DESTINATIONS: DestinationSpot[] = [
  {
    id: "da-lat",
    name: "Đà Lạt",
    location: "Lâm Đồng",
    weather: "19°C • Sương mù mát lành",
    days: "3N2Đ • 8 điểm check-in",
    highlight: "Săn mây đồi chè Cầu Đất & lẩu gà lá é ấm cúng",
    members: ["Phương Lan", "Cao Tùng", "Quang Minh", "Thanh Hân"],
    imageUrl:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
    settlementSummary: "Rút gọn 12 khoản nợ → 3 lượt VietQR",
  },
  {
    id: "sa-pa",
    name: "Sa Pa",
    location: "Lào Cai",
    weather: "16°C • Biển mây bồng bềnh",
    days: "4N3Đ • Chinh phục đỉnh Fansipan",
    highlight: "Nóc nhà Đông Dương & ruộng bậc thang ngút ngàn",
    members: ["Hoàng Nam", "Bảo Trâm", "Tuấn Anh", "Mai Linh"],
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    settlementSummary: "Chia đều tiền xe & homestay chuẩn 100%",
  },
  {
    id: "ha-long",
    name: "Vịnh Hạ Long",
    location: "Quảng Ninh",
    weather: "26°C • Nắng vàng biển êm",
    days: "2N1Đ • Du thuyền vịnh biển",
    highlight: "Chèo kayak hang Sửng Sốt & ngắm hoàng hôn vịnh",
    members: ["Quốc Đạt", "Ngọc Anh", "Thế Hùng", "Diệu Thảo"],
    imageUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    settlementSummary: "Chia món hải sản & tiệc nướng 1-chạm",
  },
  {
    id: "hoi-an",
    name: "Hội An",
    location: "Quảng Nam",
    weather: "24°C • Phố đèn lồng",
    days: "3N2Đ • Di sản cổ kính",
    highlight: "Thả hoa đăng sông Hoài & thưởng thức cao lầu",
    members: ["Trọng Hiếu", "Bích Ngọc", "Đức Trí", "Hà Phương"],
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    settlementSummary: "Tất toán công nợ tức thì bằng Napas 24/7",
  },
];

export function HeroInteractiveShowcase() {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const activeSpot = DESTINATIONS[selectedIdx];

  // Spatial 2.5D Parallax Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const cardX = useSpring(mouseX, { stiffness: 45, damping: 20 });
  const cardY = useSpring(mouseY, { stiffness: 45, damping: 20 });

  // Floating overlays parallax in slightly opposite direction for true 3D spatial depth
  const badgeX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const badgeY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - rect.width / 2) * 0.04;
    const offsetY = (e.clientY - rect.top - rect.height / 2) * 0.04;
    mouseX.set(offsetX);
    mouseY.set(offsetY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <ReducedMotionConfig>
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-[580px] lg:max-w-[620px] mx-auto select-none pt-4 pb-6"
      >
        {/* Soft Ambient Aurora Halo */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-lime-cream/40 via-ocean-mist/20 to-cerulean/30 dark:from-sky-500/20 dark:via-emerald-500/15 dark:to-transparent rounded-[36px] blur-3xl opacity-80 -z-10 pointer-events-none" />

        {/* ================= MAIN CINEMATIC TRAVEL CONTAINER ================= */}
        <motion.div
          style={{ x: cardX, y: cardY }}
          className="relative rounded-[32px] overflow-hidden bg-white/95 dark:bg-[#0E1726]/95 border border-white/60 dark:border-white/10 shadow-[0_24px_60px_rgba(24,78,119,0.16)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl group"
        >
          {/* Top Destination Navigation Bar (Gliding Tabs) */}
          <div className="p-3.5 sm:p-4 bg-white/90 dark:bg-[#141C2E]/90 border-b border-border-hairline/80 dark:border-[#24314A] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar relative z-20">
            <div className="flex items-center gap-1.5 bg-bg-canvas dark:bg-[#0B1120] p-1 rounded-2xl border border-border-hairline dark:border-[#24314A]">
              {DESTINATIONS.map((spot, idx) => {
                const isActive = idx === selectedIdx;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "text-white"
                        : "text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="hero-spot-indicator"
                        className="absolute inset-0 bg-cerulean dark:bg-sky-600 rounded-xl shadow-sm -z-10"
                        transition={spring.selection}
                      />
                    )}
                    <span>{spot.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-functional-positive dark:text-emerald-400 bg-emerald/10 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald/20 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              <span>Chuyến đi trực tiếp</span>
            </div>
          </div>

          {/* Cinematic Photograph Stage with Crossfade */}
          <div className="relative aspect-[16/11] sm:aspect-[16/10] w-full overflow-hidden bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSpot.id}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                <Image
                  src={activeSpot.imageUrl}
                  alt={activeSpot.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 620px"
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                />

                {/* Depth Vignette and Content Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent hidden sm:block" />
              </motion.div>
            </AnimatePresence>

            {/* Top Left Badge: Location & Weather Pill */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-md">
                <MapPin className="w-3.5 h-3.5 text-lime-cream" />
                <span>{activeSpot.location}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white/90 text-xs font-medium shadow-md">
                <CloudSun className="w-3.5 h-3.5 text-sky-300" />
                <span>{activeSpot.weather}</span>
              </div>
            </div>

            {/* Bottom Content Layer Inside Photo */}
            <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-10 text-white flex flex-col justify-end">
              <div className="flex items-center gap-2 text-xs font-bold text-lime-cream tracking-wide uppercase mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeSpot.days}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
                {activeSpot.highlight}
              </h3>

              {/* Members Avatar Row & Quick Action */}
              <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {activeSpot.members.map((member, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-cream to-emerald text-yale-blue font-black text-[11px] flex items-center justify-center border-2 border-white/80 shadow-sm"
                        title={member}
                      >
                        {member.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-white/85 font-medium ml-1">
                    {activeSpot.members.length} bạn cùng đi
                  </span>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 transition-colors group/btn"
                >
                  <span>Xem hành trình</span>
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= SPATIAL FLOATING GLASS CARD 1 (Top Right) ================= */}
        <motion.div
          style={{ x: badgeX, y: badgeY }}
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-3 -right-2 sm:-right-5 z-30 max-w-[240px] sm:max-w-[270px] p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#141C2E]/90 border border-white/80 dark:border-[#24314A] shadow-[0_12px_32px_rgba(24,78,119,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl pointer-events-auto"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-cream dark:bg-emerald-950/60 flex items-center justify-center text-yale-blue dark:text-emerald-300 font-bold shrink-0 shadow-sm">
              <Compass className="w-4 h-4 text-cerulean dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                Lịch trình thông minh
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-yale-blue dark:text-white truncate mt-0.5">
                {activeSpot.name} • 06:00 Check-in
              </div>
              <div className="flex items-center gap-1 text-[11px] text-functional-positive dark:text-emerald-400 font-semibold mt-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Khớp lộ trình tối ưu</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= SPATIAL FLOATING GLASS CARD 2 (Bottom Left) ================= */}
        <motion.div
          style={{ x: badgeX, y: badgeY }}
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -bottom-4 -left-2 sm:-left-5 z-30 max-w-[250px] sm:max-w-[290px] p-3.5 rounded-2xl bg-white/90 dark:bg-[#141C2E]/90 border border-white/80 dark:border-[#24314A] shadow-[0_16px_40px_rgba(24,78,119,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cerulean/10 dark:bg-sky-500/15 flex items-center justify-center text-cerulean dark:text-sky-400 font-bold shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald/15 text-functional-positive dark:text-emerald-400">
                  VietQR 24/7
                </span>
                <span className="text-[11px] text-text-muted dark:text-slate-400 font-medium">
                  Chốt sổ 1-chạm
                </span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-yale-blue dark:text-white truncate mt-1">
                {activeSpot.settlementSummary}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </ReducedMotionConfig>
  );
}
