"use client";

import * as React from "react";
import {
  MapPin,
  Calendar,
  Wallet,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatMoney, formatSignedMoney } from "@/lib/utils";

export default function Home() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  return (
    <div className="min-h-screen bg-bg-canvas flex flex-col">
      {/* Top Navigation Bar (Stitch 72px Standard) */}
      <header className="h-[72px] bg-white border-b border-border-hairline sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cerulean/10 flex items-center justify-center text-cerulean">
            <MapPin className="w-5 h-5 text-cerulean" />
          </div>
          <span className="text-xl font-bold text-yale-blue tracking-tight">
            Smart Trip
          </span>
          <span className="hidden sm:inline-block ml-3 px-2.5 py-0.5 rounded-full bg-lime-cream text-yale-blue text-xs font-semibold">
            Giai đoạn 1: Nền tảng &amp; Design Tokens
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast("Hệ thống thông báo Toast hoạt động chính xác!", "info")}
          >
            Thử nghiệm Toast
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-border-hairline">
            <Avatar name="Hương Lan" size="md" />
            <span className="text-sm font-semibold text-yale-blue hidden sm:inline-block">
              Lan
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 sm:p-8 space-y-10">
        {/* Hero Banner / Summary */}
        <section className="rounded-[24px] bg-white border border-border-hairline p-8 shadow-[0_4px_16px_rgba(24,78,119,0.06)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 trip-cover-gradient" />
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52B69A]/15 text-cerulean text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tactile Organic Minimalism · Be Vietnam Pro · Tailwind CSS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-yale-blue tracking-tight leading-tight">
              Hệ thống Nền tảng &amp; Component Cơ bản
            </h1>
            <p className="mt-3 text-base text-text-muted leading-relaxed">
              Khởi tạo kiến trúc Next.js App Router hoàn chỉnh với bộ Design Tokens, typography, màu sắc thương hiệu và toàn bộ component dùng chung đã được đối chiếu chuẩn xác theo đặc tả Google Stitch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
              >
                Mở Modal mẫu (560px)
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => toast("Sao chép mã mời DL3N2D-TRIP99 thành công!", "success")}
              >
                Sao chép mã mời
              </Button>
            </div>
          </div>
        </section>

        {/* Brand Palette & Tokens Showcase */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-yale-blue tracking-tight">
              Bảng màu thương hiệu (Brand Palette)
            </h2>
            <span className="text-xs text-text-muted">Độ tương phản đạt chuẩn WCAG AA</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="p-3 rounded-[16px] bg-white border border-border-hairline shadow-sm">
              <div className="h-12 rounded-[10px] bg-cerulean mb-2" />
              <div className="text-xs font-bold text-yale-blue">Cerulean</div>
              <div className="text-[11px] text-text-muted">#1A759F · Nút chính</div>
            </div>
            <div className="p-3 rounded-[16px] bg-white border border-border-hairline shadow-sm">
              <div className="h-12 rounded-[10px] bg-baltic-blue mb-2" />
              <div className="text-xs font-bold text-yale-blue">Baltic Blue</div>
              <div className="text-[11px] text-text-muted">#1E6091 · Hover</div>
            </div>
            <div className="p-3 rounded-[16px] bg-white border border-border-hairline shadow-sm">
              <div className="h-12 rounded-[10px] bg-yale-blue mb-2" />
              <div className="text-xs font-bold text-yale-blue">Yale Blue</div>
              <div className="text-[11px] text-text-muted">#184E77 · Tiêu đề</div>
            </div>
            <div className="p-3 rounded-[16px] bg-white border border-border-hairline shadow-sm">
              <div className="h-12 rounded-[10px] bg-ocean-mist mb-2" />
              <div className="text-xs font-bold text-yale-blue">Ocean Mist</div>
              <div className="text-[11px] text-text-muted">#52B69A · Viền focus</div>
            </div>
            <div className="p-3 rounded-[16px] bg-white border border-border-hairline shadow-sm">
              <div className="h-12 rounded-[10px] bg-lime-cream mb-2" />
              <div className="text-xs font-bold text-yale-blue">Lime Cream</div>
              <div className="text-[11px] text-text-muted">#D9ED92 · Hoàn tất</div>
            </div>
            <div className="p-3 rounded-[16px] bg-white border border-border-hairline shadow-sm">
              <div className="h-12 rounded-[10px] bg-bg-canvas border border-border-hairline mb-2" />
              <div className="text-xs font-bold text-yale-blue">Canvas</div>
              <div className="text-[11px] text-text-muted">#F4F9EC · Nền web</div>
            </div>
          </div>
        </section>

        {/* Typography & Number Formatting */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quy chuẩn Hiển thị Số tiền (Tabular Numbers)</CardTitle>
              <CardDescription>
                Định dạng hàng nghìn dấu chấm, ký hiệu ₫ sau cùng, giữ thẳng hàng theo cột.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-hover-row">
                <span className="text-sm font-medium text-yale-blue">Dự toán ngân sách:</span>
                <span className="text-xl font-bold text-yale-blue tabular-nums">
                  {formatMoney(5000000)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-hover-row">
                <span className="text-sm font-medium text-yale-blue">Khoản được nhận (Dương):</span>
                <span className={formatSignedMoney(350000).className + " tabular-nums text-lg"}>
                  {formatSignedMoney(350000).text}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-hover-row">
                <span className="text-sm font-medium text-yale-blue">Khoản nợ cần trả (Âm):</span>
                <span className={formatSignedMoney(-120000).className + " tabular-nums text-lg"}>
                  {formatSignedMoney(-120000).text}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hệ thống Status Chips &amp; Vai trò</CardTitle>
              <CardDescription>
                Tuân thủ nghiêm ngặt 3 trạng thái chuyến đi và danh xưng đúng chuẩn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Trạng thái chuyến đi:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="planning">Đang lên kế hoạch</Badge>
                  <Badge variant="settling">Đang thanh toán</Badge>
                  <Badge variant="completed">Đã hoàn tất</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted mb-2">Vai trò &amp; Thành viên:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="host">Trưởng nhóm</Badge>
                  <Badge variant="no-account">Chưa có tài khoản</Badge>
                  <Badge variant="paid">Đã thanh toán</Badge>
                  <Badge variant="unpaid">Chưa thanh toán</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Form Controls & Card Previews */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nút bấm &amp; Biểu mẫu nhập liệu</CardTitle>
              <CardDescription>
                Chiều cao 48px cho input, 44px cho button, viền mờ 1px và vòng focus rõ nét.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Tên chuyến đi"
                placeholder="Ví dụ: Đà Lạt 3N2Đ"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Tên gợi nhớ cho các thành viên trong nhóm"
              />
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="primary">Nút hành động chính</Button>
                <Button variant="secondary">Nút thứ cấp</Button>
                <Button variant="destructive">Xóa khoản chi</Button>
              </div>
            </CardContent>
          </Card>

          <Card hasCoverGradient>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="planning">Đang lên kế hoạch</Badge>
                <Badge variant="host">Trưởng nhóm</Badge>
              </div>
              <CardTitle className="mt-2">Đà Lạt 3N2Đ cùng bạn thân</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-cerulean" />
                <span>20/11/2026 – 22/11/2026</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm py-2 border-t border-border-hairline">
                <span className="text-text-muted">Tổng dự toán:</span>
                <span className="font-bold text-yale-blue tabular-nums">{formatMoney(6500000)}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-t border-border-hairline">
                <span className="text-text-muted">Thành viên tham gia:</span>
                <div className="flex -space-x-2">
                  <Avatar name="Lan" size="sm" />
                  <Avatar name="Minh" size="sm" />
                  <Avatar name="Nam" size="sm" isNoAccount />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => toast("Sẵn sàng triển khai Giai đoạn 2!", "success")}
              >
                <span>Xem chi tiết chuyến đi</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>
        </section>
      </main>

      {/* Demo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thử nghiệm Modal Chuẩn Stitch"
        description="Độ rộng 560px, bán kính bo góc 24px, scrim phủ mờ chống chói mắt."
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-text-body">
            Modal này được định cấu hình bằng Tailwind CSS, tự động bắt sự kiện phím <strong>ESC</strong> và khóa thanh cuộn trang để đảm bảo khả năng tiếp cận chuẩn mực theo <strong>UI/UX Pro Max</strong>.
          </p>
          <Input
            label="Nhập mã mời thử nghiệm"
            placeholder="DL3N2D-TRIP99"
            defaultValue="DL3N2D-TRIP99"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border-hairline">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Đóng lại
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                toast("Đã lưu cài đặt modal thành công!", "success");
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
