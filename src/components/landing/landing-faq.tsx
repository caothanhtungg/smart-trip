"use client";

import * as React from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { transition, ReducedMotionConfig } from "@animate-ui/react/utils/motion";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Có cần tất cả mọi người trong chuyến đi phải tải app và đăng ký tài khoản không?",
    answer:
      "Hoàn toàn không bắt buộc! Trưởng nhóm có thể chủ động tạo 'Thành viên chưa có tài khoản' (như bạn bè, người lớn tuổi, trẻ em) để ghi chép chi phí bình thường. Sau này, khi người đó đăng nhập bằng Google, họ chỉ cần bấm 'Nhận lại hồ sơ' để liên kết dữ liệu cá nhân của mình rất thuận tiện.",
  },
  {
    question: "Thuật toán chia tiền có bị lệch số lẻ (1 đồng, 2 đồng) so với hóa đơn gốc không?",
    answer:
      "Chính xác tuyệt đối 100%! Smart Trip sử dụng thuật toán phân bổ số dư nguyên tệ VND có kiểm soát thứ tự tham gia, đảm bảo tổng tiền chia cho từng thành viên luôn cộng lại bằng chính xác số tiền trên hóa đơn gốc. Hoàn toàn không bao giờ có chuyện lệch lẻ hay thiếu hụt.",
  },
  {
    question: "Mã VietQR hoạt động thế nào? Tôi có phải liên kết thẻ ngân hàng vào Smart Trip không?",
    answer:
      "Bạn không cần phải cấp quyền hay liên kết thẻ ngân hàng vào Smart Trip! Hệ thống chỉ cần biết Số tài khoản và Ngân hàng của người nhận để tự động sinh mã VietQR chuẩn liên ngân hàng EMVCo Napas 24/7. Thành viên chuyển tiền chỉ cần mở App ngân hàng cá nhân của mình và quét mã để thanh toán tức thì mà không cần nhập STK hay số tiền thủ công.",
  },
  {
    question: "Số tài khoản ngân hàng và dữ liệu cá nhân của tôi có được bảo mật không?",
    answer:
      "An toàn tối đa! Mọi thông tin số tài khoản ngân hàng đều được mã hóa bằng thuật toán tiêu chuẩn quân đội AES-256-GCM tại tầng máy chủ trước khi lưu trữ. Chỉ những thành viên cùng tham gia trong chuyến đi cần chuyển tiền đối soát mới được cấp quyền xem mã VietQR thanh toán.",
  },
  {
    question: "Nếu trong bữa ăn có người không uống bia rượu hay ăn chay thì chia thế nào?",
    answer:
      "Smart Trip hỗ trợ cả hai chế độ: 'Chia đều' cho các khoản chung (như tiền phòng khách sạn, vé xe) và 'Chia theo món' cho các bữa tiệc. Bạn có thể chọn đích danh những ai ăn món nào để người không tham gia món đó không phải chịu tiền, đảm bảo công bằng và minh bạch tối đa.",
  },
  {
    question: "Sử dụng Smart Trip có mất phí hay giới hạn số lượng chuyến đi không?",
    answer:
      "Smart Trip hoàn toàn miễn phí! Bạn có thể tạo không giới hạn số lượng chuyến đi, mời bao nhiêu bạn bè tùy thích và lưu trữ lịch trình đầy đủ mà không mất bất kỳ khoản phí nào.",
  },
];

const collapsed = { height: 0, opacity: 0, filter: "blur(2px)" };
const expanded = {
  height: "auto",
  opacity: 1,
  filter: "blur(0px)",
  transitionEnd: { filter: "none" },
};

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ReducedMotionConfig>
      <section id="faq" className="w-full py-20 lg:py-28 bg-bg-canvas relative">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] shadow-sm mb-4">
              <HelpCircle className="w-4 h-4 text-cerulean dark:text-sky-400" />
              <span className="text-xs font-bold text-yale-blue dark:text-slate-200 uppercase tracking-wider">
                Giải đáp thắc mắc
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-yale-blue dark:text-white tracking-tight leading-[1.2]">
              Những câu hỏi thường gặp
            </h2>
            <p className="mt-4 text-base text-text-muted dark:text-slate-400">
              Mọi điều bạn cần biết trước khi bắt đầu lên kế hoạch cho chuyến đi đầu tiên cùng Smart Trip.
            </p>
          </div>

          {/* Accordion List with Animate UI Disclosure Recipe */}
          <div className="space-y-3.5">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] overflow-hidden shadow-[0_2px_12px_rgba(24,78,119,0.03)] dark:shadow-none"
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-hover-row/60 dark:hover:bg-[#1E2A42]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cerulean"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg font-bold text-yale-blue dark:text-white leading-snug">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={transition.disclosure}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isOpen
                          ? "bg-cerulean dark:bg-sky-600 text-white"
                          : "bg-bg-canvas dark:bg-[#0B1120] text-yale-blue dark:text-slate-300"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={collapsed}
                        animate={expanded}
                        exit={collapsed}
                        transition={transition.disclosure}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-text-muted dark:text-slate-300 leading-relaxed border-t border-border-hairline/60 dark:border-[#24314A] bg-bg-canvas/30 dark:bg-[#0B1120]/60">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Trust Footnote */}
          <div className="mt-10 p-4 rounded-2xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted dark:text-slate-400 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-functional-positive dark:text-emerald-400 shrink-0" />
              <span>Bạn còn câu hỏi khác? Chúng tôi luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào.</span>
            </div>
            <a
              href="mailto:support@smarttrip.vn"
              className="font-bold text-cerulean dark:text-sky-400 hover:underline shrink-0"
            >
              Liên hệ hỗ trợ →
            </a>
          </div>
        </div>
      </section>
    </ReducedMotionConfig>
  );
}
