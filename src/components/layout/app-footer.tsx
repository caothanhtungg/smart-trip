"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Info, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function AppFooter() {
  const [legalModal, setLegalModal] = React.useState<"terms" | "privacy" | "contact" | null>(null);

  return (
    <>
      <footer className="w-full bg-white/70 dark:bg-[#0E1527]/80 backdrop-blur-md border-t border-divider-border dark:border-[#24314A] pt-3.5 pb-24 sm:py-3.5 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 sm:pr-32">
            {/* Left: Brand & Copyright */}
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/trips"
                className="flex items-center gap-1.5 font-bold text-yale-blue dark:text-white hover:text-cerulean dark:hover:text-sky-400 transition-colors group"
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#E05833] to-[#E76F51] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Compass className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="tracking-tight">Smart Trip</span>
              </Link>
              <span className="text-text-muted/40 dark:text-slate-600">·</span>
              <span className="text-[11px] text-text-muted dark:text-slate-400">
                © 2026 Bản quyền thuộc về Smart Trip
              </span>
            </div>

            {/* Right: Minimal Dot-Separated Legal Nav */}
            <nav className="flex items-center gap-3 text-xs text-text-muted dark:text-slate-400">
              <button
                type="button"
                onClick={() => setLegalModal("privacy")}
                className="hover:text-cerulean dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                Chính sách bảo mật
              </button>
              <span className="text-text-muted/40 dark:text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setLegalModal("terms")}
                className="hover:text-cerulean dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                Điều khoản
              </button>
              <span className="text-text-muted/40 dark:text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setLegalModal("contact")}
                className="hover:text-cerulean dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                Liên hệ hỗ trợ
              </button>
            </nav>
          </div>
        </div>
      </footer>

      {/* Legal & Contact Modal */}
      <Modal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === "terms"
            ? "Điều khoản Sử dụng (Bản mẫu)"
            : legalModal === "privacy"
            ? "Chính sách Bảo mật (Bản mẫu)"
            : "Liên hệ Hỗ trợ"
        }
        description={
          legalModal === "contact"
            ? "Kết nối trực tiếp với tác giả & nhà phát triển dự án Smart Trip"
            : "Nội dung mô phỏng giao diện — Chưa phải văn bản pháp lý chính thức"
        }
      >
        <div className="space-y-4 py-2 text-sm text-text-body leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {legalModal !== "contact" && (
            <div className="p-3.5 rounded-xl bg-bg-canvas border border-border-hairline text-xs text-text-muted space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
                <Info className="w-4 h-4 text-cerulean shrink-0" />
                <span>Ghi chú dữ liệu mẫu (Mockup Notice)</span>
              </div>
              <p>
                Đây là nội dung bản mẫu được thiết kế để mô phỏng tương tác giao diện demo. Nội dung này không phải là văn bản pháp lý hay chính sách chính thức của Smart Trip.
              </p>
            </div>
          )}

          {legalModal === "terms" && (
            <div className="space-y-3">
              <p>
                <strong>1. Mục đích sử dụng (Mô phỏng):</strong> Smart Trip hỗ trợ các nhóm bạn lên lịch trình, chia sẻ chi phí và giải quyết công nợ sau chuyến đi một cách minh bạch, tự nguyện.
              </p>
              <p>
                <strong>2. Quyền hạn Trưởng nhóm (Mô phỏng):</strong> Người tạo chuyến đi giữ vai trò Trưởng nhóm, có trách nhiệm điều phối lịch trình, quản lý thành viên và chốt sổ công nợ.
              </p>
              <p>
                <strong>3. Giao dịch tài chính (Mô phỏng):</strong> Các khoản thanh toán qua mã VietQR hoặc tiền mặt diễn ra trực tiếp giữa các thành viên ngoài hệ thống. Smart Trip chỉ đóng vai trò tính toán rút gọn nợ.
              </p>
            </div>
          )}

          {legalModal === "privacy" && (
            <div className="space-y-3">
              <p>
                <strong>1. Thu thập thông tin (Mô phỏng):</strong> Hệ thống chỉ lưu trữ thông tin cơ bản do người dùng cung cấp qua tài khoản Google (tên hiển thị, email, avatar) và thông tin STK ngân hàng (nếu cung cấp để nhận tiền chuyển khoản).
              </p>
              <p>
                <strong>2. Bảo mật mã mời (Mô phỏng):</strong> Mã mời chuyến đi chỉ cung cấp quyền xem trước thẻ chuyến đi (Preview Card). Thành viên chỉ được xem chi tiết lịch trình và chi tiêu sau khi được phê duyệt tham gia.
              </p>
              <p>
                <strong>3. Không chia sẻ bên thứ ba (Mô phỏng):</strong> Dữ liệu nhóm du lịch không được thương mại hóa hoặc chuyển giao cho mục đích quảng cáo bên ngoài.
              </p>
            </div>
          )}

          {legalModal === "contact" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:from-[#1A253D] dark:via-[#141C2E] dark:to-[#16233B] border border-blue-100 dark:border-[#243A5E] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 dark:bg-[#1877F2]/20 flex items-center justify-center text-[#1877F2] shrink-0">
                    <FacebookIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cao Thanh Tùng
                    </h4>
                    <p className="text-xs text-text-muted dark:text-slate-400">
                      Tác giả &amp; Nhà phát triển dự án Smart Trip
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nếu bạn có bất kỳ thắc mắc, đề xuất tính năng, phản hồi trải nghiệm hoặc cần hỗ trợ trong quá trình sử dụng, hãy kết nối và nhắn tin trực tiếp với mình qua Facebook cá nhân:
                </p>

                <div className="pt-1">
                  <a
                    href="https://www.facebook.com/caoothanhtung"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <FacebookIcon className="w-4 h-4" />
                    <span>Nhắn tin qua Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

                <div className="text-center pt-1">
                  <a
                    href="https://www.facebook.com/caoothanhtung"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#1877F2] hover:underline break-all"
                  >
                    https://www.facebook.com/caoothanhtung
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border-hairline dark:border-[#24314A]">
            <Button variant="primary" onClick={() => setLegalModal(null)}>
              Đóng lại
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
