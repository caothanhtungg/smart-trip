"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { spring, transition } from "@animate-ui/react/utils/motion";
import {
  Compass,
  MapPin,
  ArrowRight,
} from "lucide-react";

type CategoryFilter = "all" | "mountain" | "beach" | "heritage";

interface InspirationDestination {
  id: string;
  name: string;
  province: string;
  category: "mountain" | "beach" | "heritage";
  imageUrl: string;
  tag: string;
  duration: string;
  budget: string;
  bestTime: string;
  description: string;
}

const DESTINATIONS: InspirationDestination[] = [
  {
    id: "da-lat",
    name: "Đà Lạt ngàn hoa",
    province: "Lâm Đồng",
    category: "mountain",
    imageUrl:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
    tag: "Khí hậu se lạnh",
    duration: "3N2Đ",
    budget: "1.800.000₫ - 3.200.000₫",
    bestTime: "Tháng 10 - Tháng 4",
    description: "Đồi thông bạt ngàn, sương mờ buổi sớm và những quán cà phê săn mây chill hết nấc.",
  },
  {
    id: "sa-pa",
    name: "Sa Pa & Fansipan",
    province: "Lào Cai",
    category: "mountain",
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    tag: "Nóc nhà Đông Dương",
    duration: "4N3Đ",
    budget: "2.500.000₫ - 4.200.000₫",
    bestTime: "Tháng 9 - Tháng 3",
    description: "Chinh phục đỉnh 3.143m ngắm trọn biển mây bồng bềnh và bản làng thơ mộng.",
  },
  {
    id: "ha-long",
    name: "Vịnh Hạ Long",
    province: "Quảng Ninh",
    category: "beach",
    imageUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    tag: "Kỳ quan thế giới",
    duration: "2N1Đ",
    budget: "2.000.000₫ - 4.500.000₫",
    bestTime: "Tháng 4 - Tháng 10",
    description: "Du thuyền giữa hàng nghìn đảo đá vôi kỳ vĩ và chèo kayak qua hang động ngọc bích.",
  },
  {
    id: "hoi-an",
    name: "Phố cổ Hội An",
    province: "Quảng Nam",
    category: "heritage",
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    tag: "Di sản UNESCO",
    duration: "3N2Đ",
    budget: "1.500.000₫ - 3.000.000₫",
    bestTime: "Tháng 2 - Tháng 7",
    description: "Đô thị cổ rực rỡ sắc màu hoa đăng bên dòng sông Hoài thơ mộng và ẩm thực đậm đà.",
  },
  {
    id: "ha-giang",
    name: "Hà Giang hùng vĩ",
    province: "Hà Giang",
    category: "mountain",
    imageUrl:
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
    tag: "Cung đèo huyền thoại",
    duration: "3N2Đ",
    budget: "2.200.000₫ - 3.800.000₫",
    bestTime: "Tháng 9 - Tháng 12",
    description: "Chinh phục đèo Mã Pí Lèng hiểm trở, du ngoạn sông Nho Quế và mùa hoa tam giác mạch.",
  },
  {
    id: "phu-quoc",
    name: "Đảo ngọc Phú Quốc",
    province: "Kiên Giang",
    category: "beach",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    tag: "Thiên đường biển đảo",
    duration: "3N2Đ",
    budget: "3.500.000₫ - 6.000.000₫",
    bestTime: "Tháng 11 - Tháng 4",
    description: "Bãi cát trắng mịn Bãi Sao, lặn ngắm rạn san hô Nam Đảo và hoàng hôn Sunset Sanato.",
  },
];

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Tất cả điểm đến" },
  { id: "mountain", label: "Săn mây & Núi rừng" },
  { id: "beach", label: "Biển đảo ngọc" },
  { id: "heritage", label: "Di sản & Cổ kính" },
];

export function TravelInspiration() {
  const [activeTab, setActiveTab] = React.useState<CategoryFilter>("all");

  const filtered = React.useMemo(() => {
    if (activeTab === "all") return DESTINATIONS;
    return DESTINATIONS.filter((d) => d.category === activeTab);
  }, [activeTab]);

  return (
    <section className="w-full py-20 lg:py-28 bg-bg-canvas relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header (Lonely Planet Editorial Style) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-cerulean dark:text-sky-400 font-bold text-xs uppercase tracking-wider shadow-sm mb-3.5">
              <Compass className="w-4 h-4" />
              <span>Cảm hứng du lịch</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-yale-blue dark:text-white tracking-tight leading-[1.15]">
              Những cung đường đáng đi nhất cùng bạn bè
            </h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-slate-400 mt-3 leading-relaxed">
              Khám phá cảnh sắc tuyệt mỹ của Việt Nam. Chọn một điểm đến để lập lịch trình và chia tiền sòng phẳng ngay.
            </p>
          </div>

          {/* Gliding Filter Pills */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#141C2E] p-1.5 rounded-2xl border border-border-hairline dark:border-[#24314A] shadow-sm overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "text-white"
                      : "text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="inspiration-filter-pill"
                      className="absolute inset-0 bg-cerulean dark:bg-sky-600 rounded-xl shadow-sm -z-10"
                      transition={spring.selection}
                    />
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Travel Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ ...transition.panelIn, delay: idx * 0.05 }}
                whileHover={{ y: -6 }}
                className="group rounded-[28px] overflow-hidden bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] shadow-[0_10px_30px_rgba(24,78,119,0.06)] dark:shadow-none hover:shadow-[0_20px_50px_rgba(24,78,119,0.14)] dark:hover:border-sky-500/40 transition-all flex flex-col justify-between"
              >
                {/* Photo Stage */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-800">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Top Tags */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                    <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md text-yale-blue dark:text-white text-[11px] font-bold shadow-sm">
                      {item.tag}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-lime-cream text-[11px] font-bold">
                      {item.duration}
                    </span>
                  </div>

                  {/* Bottom Location */}
                  <div className="absolute bottom-3.5 left-3.5 z-10 text-white flex items-center gap-1.5 text-xs font-semibold drop-shadow">
                    <MapPin className="w-3.5 h-3.5 text-lime-cream" />
                    <span>{item.province}</span>
                  </div>
                </div>

                {/* Content Body (Concise, Visual-first) */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-yale-blue dark:text-white group-hover:text-cerulean dark:group-hover:text-sky-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-muted dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Meta metrics & Quick Action */}
                  <div className="mt-5 pt-4 border-t border-border-hairline dark:border-[#24314A] flex items-center justify-between gap-2">
                    <div className="text-[11px] text-text-muted dark:text-slate-400">
                      <div className="font-semibold text-yale-blue dark:text-slate-200">
                        {item.budget}
                      </div>
                      <div>{item.bestTime}</div>
                    </div>

                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-cerulean/10 hover:bg-cerulean text-cerulean hover:text-white dark:bg-sky-500/15 dark:hover:bg-sky-600 dark:text-sky-300 dark:hover:text-white transition-all group/btn"
                    >
                      <span>Lên lịch</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View All Guides Link Bar */}
        <div className="mt-12 text-center">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-sm font-bold text-yale-blue dark:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] shadow-sm transition-all group"
          >
            <span>Khám phá toàn bộ 15+ cẩm nang du lịch Việt Nam</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cerulean dark:text-sky-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
