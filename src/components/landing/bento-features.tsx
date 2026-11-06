"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  spring,
  transition,
  scale,
  ReducedMotionConfig,
} from "@animate-ui/react/utils/motion";
import { Tilt, TiltContent } from "@animate-ui/react/primitives/effects/tilt";
import { Particles, ParticlesEffect } from "@animate-ui/react/primitives/effects/particles";
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";
import {
  QrCode,
  MapPin,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  Split,
  Eye,
  Lock,
} from "lucide-react";

export function BentoFeatures() {
  const [simplified, setSimplified] = React.useState(true);

  return (
    <ReducedMotionConfig>
      <section id="tinh-nang" className="w-full py-20 lg:py-28 bg-bg-canvas relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-cerulean dark:text-sky-400" />
              <span className="text-xs font-bold text-yale-blue dark:text-slate-200 uppercase tracking-wider">
                Tính năng đột phá cho chuyến đi
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yale-blue dark:text-white tracking-tight leading-[1.2]">
              Tất cả những gì nhóm bạn cần để đi chơi không lo nghĩ
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-muted dark:text-slate-400 leading-relaxed">
              Thay thế hoàn toàn bảng tính Excel rắc rối và nhóm chat đòi nợ ngượng ngùng bằng trải nghiệm tự động, chính xác và minh bạch.
            </p>
          </div>

          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ================= CARD 1: SMART SETTLEMENT (7 cols) ================= */}
            <Tilt maxTilt={4} perspective={1000} className="lg:col-span-7 h-full">
              <TiltContent className="h-full rounded-[28px] bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] p-5 sm:p-9 shadow-[0_12px_40px_rgba(24,78,119,0.06)] dark:shadow-none flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(24,78,119,0.1)] dark:hover:border-sky-500/30 transition-all group min-w-0">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-lime-cream dark:bg-emerald-950/60 dark:border dark:border-emerald-500/30 flex items-center justify-center text-yale-blue dark:text-emerald-400 shadow-sm shrink-0">
                      <Split className="w-6 h-6" />
                    </div>

                    {/* Interactive Gliding Toggle Button */}
                    <div className="flex items-center gap-1 bg-bg-canvas dark:bg-[#0B1120] p-1 rounded-xl border border-border-hairline dark:border-[#24314A] text-xs font-semibold max-w-full overflow-x-auto no-scrollbar relative">
                      <button
                        type="button"
                        onClick={() => setSimplified(false)}
                        className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap z-10 transition-colors ${
                          !simplified ? "text-yale-blue dark:text-white" : "text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white"
                        }`}
                      >
                        {!simplified && (
                          <motion.div
                            layoutId="bento-toggle-indicator"
                            className="absolute inset-0 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm border border-border-hairline/80 dark:border-[#2D3E60] -z-10"
                            transition={spring.selection}
                          />
                        )}
                        <span>Chưa rút gọn</span>
                      </button>

                      <div className="relative">
                        <Particles animate={simplified}>
                          <ParticlesEffect
                            count={8}
                            radius={22}
                            className="w-1.5 h-1.5 rounded-full bg-cerulean dark:bg-sky-400 pointer-events-none"
                          />
                          <button
                            type="button"
                            onClick={() => setSimplified(true)}
                            className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap z-10 transition-colors ${
                              simplified ? "text-white" : "text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white"
                            }`}
                          >
                            {simplified && (
                              <motion.div
                                layoutId="bento-toggle-indicator"
                                className="absolute inset-0 bg-cerulean dark:bg-sky-600 rounded-lg shadow-sm -z-10"
                                transition={spring.selection}
                              />
                            )}
                            <span>Đã rút gọn tối ưu</span>
                          </button>
                        </Particles>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-yale-blue dark:text-white tracking-tight">
                    Thuật toán rút gọn công nợ thông minh
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-text-muted dark:text-slate-400 leading-relaxed">
                    Biến ma trận chuyển tiền chéo phức tạp giữa nhiều người thành số lượt chuyển khoản tối thiểu nhất. Không ai phải chuyển tiền qua lại nhiều lần.
                  </p>
                </div>

                {/* Interactive Simulation Graphic with Animate UI Blur Bridge */}
                <div className="my-6 p-5 rounded-2xl bg-[#F8FAF6] dark:bg-[#0B1120] border border-border-hairline dark:border-[#24314A] overflow-hidden min-h-[140px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {simplified ? (
                      <motion.div
                        key="simplified"
                        initial={{ opacity: 0, filter: "blur(3px)", y: 4 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(3px)", y: -4 }}
                        transition={transition.panelIn}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-functional-positive dark:text-emerald-400 pb-2 border-b border-border-hairline dark:border-[#24314A]">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-functional-positive dark:text-emerald-400" />
                            Chí còn đúng 2 giao dịch tất toán:
                          </span>
                          <span className="bg-[#EAF7EC] dark:bg-emerald-950/60 text-functional-positive dark:text-emerald-300 px-2 py-0.5 rounded-md text-[11px] border border-transparent dark:border-emerald-500/30 flex items-center gap-0.5">
                            <span>Tiết kiệm</span>
                            <CountingNumber number={75} inView inViewOnce />
                            <span>% thao tác</span>
                          </span>
                        </div>

                      {/* Transaction 1 */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-lime-cream dark:bg-emerald-900/60 text-yale-blue dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                            T
                          </div>
                          <span className="text-xs font-semibold text-yale-blue dark:text-slate-200">Cao Tùng</span>
                          <ArrowRight className="w-3.5 h-3.5 text-cerulean dark:text-sky-400" />
                          <div className="w-7 h-7 rounded-full bg-emerald-fill dark:bg-teal-900/60 text-yale-blue dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                            L
                          </div>
                          <span className="text-xs font-semibold text-yale-blue dark:text-slate-200">Phương Lan</span>
                        </div>
                        <div className="text-xs font-bold text-cerulean dark:text-sky-400 tabular-nums">450.000 ₫</div>
                      </div>

                      {/* Transaction 2 */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#52B69A] text-white font-bold text-xs flex items-center justify-center">
                            M
                          </div>
                          <span className="text-xs font-semibold text-yale-blue dark:text-slate-200">Quang Minh</span>
                          <ArrowRight className="w-3.5 h-3.5 text-cerulean dark:text-sky-400" />
                          <div className="w-7 h-7 rounded-full bg-lime-cream dark:bg-emerald-900/60 text-yale-blue dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                            L
                          </div>
                          <span className="text-xs font-semibold text-yale-blue dark:text-slate-200">Phương Lan</span>
                        </div>
                        <div className="text-xs font-bold text-cerulean dark:text-sky-400 tabular-nums">350.000 ₫</div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unsimplified"
                      initial={{ opacity: 0, filter: "blur(3px)", y: 4 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                      exit={{ opacity: 0, filter: "blur(3px)", y: -4 }}
                      transition={transition.panelIn}
                      className="space-y-2"
                    >
                      <div className="text-xs font-bold text-[#E0443E] dark:text-rose-400 pb-1">
                        Cảnh báo: 8 giao dịch chéo lằng nhằng nếu tính thủ công!
                      </div>
                      <div className="text-xs text-text-muted dark:text-slate-400 space-y-1">
                        <div className="p-2 bg-white dark:bg-[#141C2E] rounded-lg border border-border-hairline dark:border-[#24314A] flex justify-between">
                          <span>Tùng nợ Minh (tiền vé xe): 120.000 ₫</span>
                          <span className="text-text-muted/60 dark:text-slate-500">Giao dịch 1</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-[#141C2E] rounded-lg border border-border-hairline dark:border-[#24314A] flex justify-between">
                          <span>Minh nợ Lan (tiền ăn trưa): 250.000 ₫</span>
                          <span className="text-text-muted/60 dark:text-slate-500">Giao dịch 2</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-[#141C2E] rounded-lg border border-border-hairline dark:border-[#24314A] flex justify-between">
                          <span>Hân nợ Tùng (tiền nước uống): 85.000 ₫</span>
                          <span className="text-text-muted/60 dark:text-slate-500">Giao dịch 3...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted dark:text-slate-400 pt-2 border-t border-border-hairline dark:border-[#24314A]">
                <CheckCircle2 className="w-4 h-4 text-functional-positive dark:text-emerald-400" />
                <span>Bảo đảm tổng công nợ luôn cân bằng chính xác tuyệt đối (Tổng ròng = 0)</span>
              </div>
            </TiltContent>
          </Tilt>

          {/* ================= CARD 2: VIETQR NAPAS 24/7 (5 cols) ================= */}
          <Tilt maxTilt={4} perspective={1000} className="lg:col-span-5 h-full">
            <TiltContent className="h-full rounded-[28px] bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] p-5 sm:p-9 shadow-[0_12px_40px_rgba(24,78,119,0.06)] dark:shadow-none flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(24,78,119,0.1)] dark:hover:border-sky-500/30 transition-all group min-w-0">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cerulean/10 dark:bg-sky-500/15 flex items-center justify-center text-cerulean dark:text-sky-400 mb-6 shadow-sm">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-yale-blue dark:text-white tracking-tight">
                  Mã VietQR Napas 24/7 một chạm
                </h3>
                <p className="mt-2 text-sm sm:text-base text-text-muted dark:text-slate-400 leading-relaxed">
                  Không cần hỏi số tài khoản, không lo bấm nhầm số tiền. Mở bất kỳ app ngân hàng nào quét mã là xong ngay tức khắc.
                </p>
              </div>

              {/* Visual QR Simulation Box */}
              <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-border-hairline dark:border-[#24314A] shadow-sm flex items-center gap-4">
                <div className="w-20 h-20 bg-yale-blue dark:bg-slate-900 rounded-xl border border-transparent dark:border-[#24314A] flex items-center justify-center shrink-0 shadow-md relative overflow-hidden">
                  <QrCode className="w-14 h-14 text-white" />
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-lime-cream to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-bold text-yale-blue dark:text-white truncate">TECHCOMBANK</div>
                  <div className="text-[11px] text-text-muted dark:text-slate-400">Chủ TK: NGUYEN PHUONG LAN</div>
                  <div className="inline-block px-2 py-0.5 rounded-md bg-emerald/20 dark:bg-emerald-950/60 text-yale-blue dark:text-emerald-300 text-[11px] font-bold border border-transparent dark:border-emerald-500/30">
                    Khớp sẵn <CountingNumber number={450000} thousandSeparator="." inView inViewOnce /> ₫
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted dark:text-slate-400 pt-2 border-t border-border-hairline dark:border-[#24314A]">
                <ShieldCheck className="w-4 h-4 text-functional-positive dark:text-emerald-400" />
                <span>Tuân thủ chuẩn thanh toán liên ngân hàng EMVCo Napas 247</span>
              </div>
            </TiltContent>
          </Tilt>

          {/* ================= CARD 3: ITINERARY & SPENDING (5 cols) ================= */}
          <Tilt maxTilt={4} perspective={1000} className="lg:col-span-5 h-full">
            <TiltContent className="h-full rounded-[28px] bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] p-5 sm:p-9 shadow-[0_12px_40px_rgba(24,78,119,0.06)] dark:shadow-none flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(24,78,119,0.1)] dark:hover:border-sky-500/30 transition-all group min-w-0">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald/20 dark:bg-emerald-950/60 flex items-center justify-center text-yale-blue dark:text-emerald-400 mb-6 shadow-sm border border-transparent dark:border-emerald-500/30">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-yale-blue dark:text-white tracking-tight">
                  Lịch trình gắn liền chi tiêu
                </h3>
                <p className="mt-2 text-sm sm:text-base text-text-muted dark:text-slate-400 leading-relaxed">
                  Mỗi địa điểm tham quan hay quán ăn đều có thể đính kèm chi phí thực tế, giúp nhóm kiểm soát ngân sách theo từng chặng đường.
                </p>
              </div>

              {/* Timeline Snippet */}
              <div className="my-6 space-y-2 bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-2xl border border-border-hairline dark:border-[#24314A] shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-yale-blue dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cerulean dark:bg-sky-400" />
                    Điểm đến: Cà phê Túi Mơ To
                  </span>
                  <span className="text-cerulean dark:text-sky-400 font-bold tabular-nums">
                    <CountingNumber number={320000} thousandSeparator="." inView inViewOnce /> ₫
                  </span>
                </div>
                <div className="text-[11px] text-text-muted dark:text-slate-400 pl-3.5">
                  4 người tham gia • Lan thanh toán trước
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted dark:text-slate-400 pt-2 border-t border-border-hairline dark:border-[#24314A]">
                <Clock className="w-4 h-4 text-functional-positive dark:text-emerald-400" />
                <span>Sắp xếp linh hoạt theo ngày và khung giờ di chuyển</span>
              </div>
            </TiltContent>
          </Tilt>

          {/* ================= CARD 4: TRANSPARENT RECEIPTS (7 cols) ================= */}
          <Tilt maxTilt={4} perspective={1000} className="lg:col-span-7 h-full">
            <TiltContent className="h-full rounded-[28px] bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] p-5 sm:p-9 shadow-[0_12px_40px_rgba(24,78,119,0.06)] dark:shadow-none flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(24,78,119,0.1)] dark:hover:border-sky-500/30 transition-all group min-w-0">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#B5E48C] dark:bg-emerald-950/60 flex items-center justify-center text-yale-blue dark:text-emerald-400 mb-6 shadow-sm border border-transparent dark:border-emerald-500/30">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-yale-blue dark:text-white tracking-tight">
                  Lưu trữ ảnh hóa đơn minh bạch
                </h3>
                <p className="mt-2 text-sm sm:text-base text-text-muted dark:text-slate-400 leading-relaxed">
                  Chụp và đính kèm hóa đơn ngay lúc thanh toán. Mọi thành viên đều có thể mở xem ảnh gốc với độ phân giải cao, nói không với nghi ngờ hay tranh cãi.
                </p>
              </div>

              {/* Receipt Preview Row */}
              <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-border-hairline dark:border-[#24314A] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] flex flex-col items-center justify-center text-cerulean dark:text-sky-400 shadow-sm shrink-0">
                    <Receipt className="w-7 h-7" />
                    <span className="text-[9px] font-bold mt-0.5">HÓA ĐƠN</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-yale-blue dark:text-white">Hóa đơn BBQ & Nướng ngói Đà Lạt</div>
                    <div className="text-[11px] text-text-muted dark:text-slate-400">Định dạng ảnh bảo mật Magic Bytes (JPEG/PNG/WEBP)</div>
                    <div className="text-xs font-semibold text-functional-positive dark:text-emerald-400 mt-0.5 tabular-nums">
                      Tổng tiền khớp <CountingNumber number={1450000} thousandSeparator="." inView inViewOnce /> ₫
                    </div>
                  </div>
                </div>

                <motion.div
                  whileTap={{ scale: scale.press }}
                  transition={spring.press}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-xs font-semibold text-cerulean dark:text-sky-400 shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem ảnh gốc</span>
                </motion.div>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted dark:text-slate-400 pt-2 border-t border-border-hairline dark:border-[#24314A]">
                <Lock className="w-4 h-4 text-functional-positive dark:text-emerald-400" />
                <span>Lưu trữ bảo mật phân quyền, chỉ thành viên trong chuyến đi mới xem được</span>
              </div>
            </TiltContent>
          </Tilt>
          </div>
        </div>
      </section>
    </ReducedMotionConfig>
  );
}
