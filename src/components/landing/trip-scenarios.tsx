"use client";

import * as React from "react";
import { Users, Briefcase, HeartHandshake, CheckCircle2, Sparkles, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { spring, transition, scale, ReducedMotionConfig } from "@animate-ui/react/utils/motion";
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";
import { Tilt, TiltContent } from "@animate-ui/react/primitives/effects/tilt";

type ScenarioKey = "friends" | "company" | "family";

const SCENARIOS = {
  friends: {
    id: "friends",
    title: "Nhóm bạn thân & Phượt thủ",
    badge: "Phổ biến nhất",
    description: "Đi ăn uống, cà phê săn mây, thuê xe, homestay. Ai tiện tay trả trước người đó ghi sổ, cuối chuyến chốt số trong đúng 1 phút.",
    highlights: [
      "Nhập khoản chi cực nhanh chỉ mất 5 giây ngay tại bàn ăn",
      "Tách riêng người không uống rượu bia hay không ăn một số món",
      "Quét VietQR chuyển tiền tức thì, không ai phải ngại ngùng nhắc nợ",
      "Tổng kết chi phí minh bạch, chia đều từng nghìn lẻ không tranh cãi",
    ],
    statNum: 45,
    statPrefix: "Tiết kiệm ",
    statSuffix: " phút",
    statDesc: "thời gian tính toán sau mỗi chuyến phượt",
    previewImage: "🏔️ Đà Lạt, Tà Xùa, Hà Giang",
  },
  company: {
    id: "company",
    title: "Team Building & Công ty",
    badge: "Minh bạch cao",
    description: "Trưởng ban tổ chức quản lý quỹ chung, tạm ứng chi phí khách sạn, tiệc gala và chia sẻ lịch trình chi tiết cho toàn bộ thành viên.",
    highlights: [
      "Chụp ảnh lưu trữ hóa đơn VAT, chứng từ gốc độ phân giải cao",
      "Theo dõi tiến độ thanh toán của từng phòng ban theo thời gian thực",
      "Phân quyền Trưởng nhóm chốt sổ công nợ để khóa dữ liệu",
      "Dễ dàng kiểm tra lịch sử sửa đổi của từng khoản chi",
    ],
    statNum: 100,
    statPrefix: "",
    statSuffix: "% minh bạch",
    statDesc: "đầy đủ chứng từ hóa đơn đối soát",
    previewImage: "🏖️ Nha Trang, Phú Quốc, Phan Thiết",
  },
  family: {
    id: "family",
    title: "Du lịch đại gia đình",
    badge: "Thân thiện mọi lứa tuổi",
    description: "Chuyến đi gồm nhiều thế hệ từ ông bà, bố mẹ đến trẻ nhỏ. Người lớn tuổi không rành công nghệ vẫn tham gia đầy đủ danh sách.",
    highlights: [
      "Hỗ trợ thành viên chưa có tài khoản, một người đại diện ghi hộ",
      "Lập lịch trình chi tiết theo từng khung giờ phù hợp sức khỏe",
      "Quản lý vé máy bay, phòng resort và tiền tip thuận tiện",
      "Giao diện chữ to, trực quan, dễ theo dõi trên điện thoại",
    ],
    statNum: 100,
    statPrefix: "Dễ dùng ",
    statSuffix: "%",
    statDesc: "không bắt buộc tất cả phải đăng ký tài khoản",
    previewImage: "🌴 Đà Nẵng, Hội An, Quy Nhơn",
  },
};

const TABS: { id: ScenarioKey; label: string; icon: React.ElementType }[] = [
  { id: "friends", label: "Nhóm bạn thân", icon: Users },
  { id: "company", label: "Team building công ty", icon: Briefcase },
  { id: "family", label: "Du lịch gia đình", icon: HeartHandshake },
];

export function TripScenarios() {
  const [activeTab, setActiveTab] = React.useState<ScenarioKey>("friends");
  const current = SCENARIOS[activeTab];

  return (
    <ReducedMotionConfig>
      <section className="w-full py-20 lg:py-28 bg-white dark:bg-[#0A0F1D] border-b border-border-hairline dark:border-[#1E2A42] relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-cream/50 dark:bg-sky-500/15 border border-border-hairline dark:border-[#24314A] mb-4">
              <Compass className="w-4 h-4 text-yale-blue dark:text-sky-300" />
              <span className="text-xs font-bold text-yale-blue dark:text-sky-300 uppercase tracking-wider">
                Thiết kế cho mọi nhóm du lịch
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yale-blue dark:text-white tracking-tight leading-[1.2]">
              Dù bạn đi đâu, với ai — Smart Trip đều giải quyết trọn vẹn
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-muted dark:text-slate-400 leading-relaxed">
              Mỗi loại hình chuyến đi đều có những vấn đề riêng. Chúng tôi thiết kế giải pháp vừa vặn cho từng hoàn cảnh.
            </p>
          </div>

          {/* Tab Selection Row with Animate UI Sliding Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: scale.press }}
                  transition={spring.press}
                  className={`relative flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold cursor-pointer shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "bg-bg-canvas dark:bg-[#141C2E] text-yale-blue dark:text-slate-300 hover:bg-hover-row dark:hover:bg-[#1E2A42] border border-border-hairline dark:border-[#24314A]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="scenarios-tab-indicator"
                      className="absolute inset-0 bg-cerulean dark:bg-sky-600 rounded-2xl shadow-[0_8px_20px_rgba(26,117,159,0.25)]"
                      transition={spring.selection}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Selected Scenario Showcase Card with AnimatePresence Panel In/Out & 3D Tilt */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(3px)" }}
              transition={transition.panelIn}
              className="w-full"
            >
              <Tilt maxTilt={3} perspective={1200} className="w-full">
                <TiltContent className="rounded-[32px] bg-bg-canvas dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] p-5 sm:p-12 shadow-[0_16px_50px_rgba(24,78,119,0.06)] dark:shadow-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-w-0">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-[#1E293B] border border-border-hairline dark:border-[#2D3E60] text-xs font-bold text-cerulean dark:text-sky-400 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{current.badge}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold text-yale-blue dark:text-white tracking-tight">
                      {current.title}
                    </h3>

                    <p className="text-base sm:text-lg text-text-muted dark:text-slate-300 leading-relaxed">
                      {current.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      {current.highlights.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-functional-positive dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-text-body dark:text-slate-200">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Card: Metrics & Highlights */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-border-hairline dark:border-[#24314A] p-7 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                        Điểm đến gợi ý
                      </div>
                      <div className="text-base font-bold text-yale-blue dark:text-white">
                        {current.previewImage}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F8FAF6] dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] space-y-1">
                      <div className="text-3xl sm:text-4xl font-extrabold text-cerulean dark:text-sky-400 tracking-tight flex items-center gap-1">
                        <span>{current.statPrefix}</span>
                        <CountingNumber number={current.statNum} inView inViewOnce />
                        <span>{current.statSuffix}</span>
                      </div>
                      <div className="text-sm text-text-muted dark:text-slate-400">
                        {current.statDesc}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-text-muted dark:text-slate-400 border-t border-border-hairline dark:border-[#24314A]">
                      <span>Được tin chọn bởi cộng đồng xê dịch</span>
                      <span className="font-bold text-yale-blue dark:text-white flex items-center gap-1">
                        ⭐ 4.9/5
                      </span>
                    </div>
                  </div>
                </TiltContent>
              </Tilt>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </ReducedMotionConfig>
  );
}
