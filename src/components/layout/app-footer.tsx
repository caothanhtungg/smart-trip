"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function AppFooter() {
  const [legalModal, setLegalModal] = React.useState<"terms" | "privacy" | "contact" | null>(null);

  return (
    <>
      <footer className="w-full bg-yale-blue text-white py-8 sm:py-10 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6">
            <Link href="/trips" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lime-cream">
                <Compass className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Smart Trip
              </span>
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              <button
                type="button"
                onClick={() => setLegalModal("privacy")}
                className="hover:text-lime-cream transition-colors cursor-pointer focus:outline-none focus-visible:underline"
              >
                Chính sách bảo mật
              </button>
              <button
                type="button"
                onClick={() => setLegalModal("terms")}
                className="hover:text-lime-cream transition-colors cursor-pointer focus:outline-none focus-visible:underline"
              >
                Điều khoản sử dụng
              </button>
              <button
                type="button"
                onClick={() => setLegalModal("contact")}
                className="hover:text-lime-cream transition-colors cursor-pointer focus:outline-none focus-visible:underline"
              >
                Liên hệ hỗ trợ
              </button>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
            <p>© 2026 Smart Trip. Bản quyền thuộc về Smart Trip.</p>
            <p className="text-white/40">
              Nền tảng lập kế hoạch &amp; quản lý chi tiêu nhóm tự động
            </p>
          </div>
        </div>
      </footer>

      {/* Legal Sample/Draft Modal */}
      <Modal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === "terms"
            ? "Điều khoản Sử dụng (Bản mẫu)"
            : legalModal === "privacy"
            ? "Chính sách Bảo mật (Bản mẫu)"
            : "Liên hệ Hỗ trợ (Bản mẫu)"
        }
        description="Nội dung mô phỏng giao diện — Chưa phải văn bản pháp lý chính thức"
      >
        <div className="space-y-4 py-2 text-sm text-text-body leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3.5 rounded-xl bg-bg-canvas border border-border-hairline text-xs text-text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
              <Info className="w-4 h-4 text-cerulean shrink-0" />
              <span>Ghi chú dữ liệu mẫu (Mockup Notice)</span>
            </div>
            <p>
              Đây là nội dung bản mẫu được thiết kế để mô phỏng tương tác giao diện demo. Nội dung này không phải là văn bản pháp lý hay chính sách chính thức của Smart Trip.
            </p>
          </div>

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
            <div className="space-y-3">
              <p>
                <strong>Kênh hỗ trợ phát triển:</strong> Đội ngũ phát triển dự án Smart Trip &amp; Expense Planner.
              </p>
              <p className="text-xs text-text-muted">
                Email demo: support@smarttrip.local · Đường dây nóng mô phỏng: 1900-xxxx
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border-hairline">
            <Button variant="primary" onClick={() => setLegalModal(null)}>
              Đóng lại
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
