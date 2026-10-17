"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Ticket,
  Compass,
  Sparkles,
  Info,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { TripSummaryStrip } from "@/components/trips/trip-summary-strip";
import { TripFilters } from "@/components/trips/trip-filters";
import { TripCard } from "@/components/trips/trip-card";
import { TripInviteBanner } from "@/components/trips/trip-invite-banner";
import { InviteCodeModal } from "@/components/trips/invite-code-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  MOCK_TRIPS,
  getOverallBalance,
  filterTrips,
  sortTrips,
} from "@/lib/mock-trips";
import { Trip, TripFilterTab, TripSortOption } from "@/types/trip";

function TripsContent() {
  const searchParams = useSearchParams();
  const simulateEmptyState = searchParams.get("empty") === "true";

  const [activeTab, setActiveTab] = React.useState<TripFilterTab>("all");
  const [sortBy, setSortBy] = React.useState<TripSortOption>("latest");
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [createNoticeModalOpen, setCreateNoticeModalOpen] = React.useState(false);
  const [selectedTripModal, setSelectedTripModal] = React.useState<Trip | null>(null);
  const [settlementNoticeOpen, setSettlementNoticeOpen] = React.useState(false);

  // Compute counts (set all counts to 0 in simulated empty state)
  const allCount = simulateEmptyState ? 0 : MOCK_TRIPS.length;
  const activeCount = simulateEmptyState
    ? 0
    : MOCK_TRIPS.filter(
        (t) => t.status === "ACTIVE" || t.status === "SETTLING"
      ).length;
  const completedCount = simulateEmptyState
    ? 0
    : MOCK_TRIPS.filter((t) => t.status === "COMPLETED").length;

  // Filter and sort trips without mutating mock data
  const currentTrips = simulateEmptyState
    ? []
    : sortTrips(filterTrips(MOCK_TRIPS, activeTab), sortBy);

  const summary = simulateEmptyState
    ? { toReceive: 0, toPay: 0, net: 0 }
    : getOverallBalance(MOCK_TRIPS);

  return (
    <div className="w-full min-h-screen flex flex-col bg-bg-canvas font-sans antialiased text-text-body">
      {/* Fixed Navigation Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main className="w-full pt-[72px] flex-1">
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Header Section: Title + Actions */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-yale-blue tracking-tight">
                Chuyến đi của tôi
              </h1>
              <p className="text-text-muted mt-1 text-sm sm:text-[15px]">
                Quản lý lịch trình và phân chia chi phí cùng nhóm bạn
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Secondary Button: Nhập mã mời */}
              <Button
                variant="secondary"
                size="md"
                onClick={() => setInviteModalOpen(true)}
                className="h-11 px-4 text-sm font-semibold flex items-center gap-2 rounded-xl"
              >
                <Ticket className="w-4 h-4 stroke-[2]" />
                <span>Nhập mã mời</span>
              </Button>

              {/* Primary Button: Tạo chuyến đi */}
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreateNoticeModalOpen(true)}
                className="h-11 px-5 text-sm font-semibold flex items-center gap-2 rounded-xl shadow-[0_4px_12px_rgba(26,117,159,0.25)]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tạo chuyến đi</span>
              </Button>
            </div>
          </section>

          {/* Slim Summary Strip (Balance Overview) - Ẩn khi ở trạng thái chưa có chuyến đi */}
          {!simulateEmptyState && (
            <TripSummaryStrip
              summary={summary}
              onViewSettlementDetails={() => setSettlementNoticeOpen(true)}
            />
          )}

          {/* Filter Tabs and Sort Row */}
          <TripFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              all: allCount,
              active: activeCount,
              completed: completedCount,
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Trips Grid or Empty State */}
          {currentTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onSelectTrip={(t) => setSelectedTripModal(t)}
                  onMoreActions={(t) => setSelectedTripModal(t)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Compass className="w-8 h-8 text-cerulean stroke-[1.8]" />}
              title={
                simulateEmptyState
                  ? "Bạn chưa có chuyến đi nào"
                  : activeTab === "active"
                  ? "Không có chuyến đi đang diễn ra"
                  : "Chưa có chuyến đi nào đã hoàn tất"
              }
              description={
                simulateEmptyState
                  ? "Bắt đầu chuyến đi mới cùng bạn bè hoặc nhập mã mời để tham gia chuyến đi có sẵn."
                  : activeTab === "active"
                  ? "Tất cả các chuyến đi hiện tại đã được hoàn tất hoặc lưu trữ."
                  : "Các chuyến đi sau khi đã chốt sổ công nợ và hoàn tất thanh toán sẽ hiển thị tại đây."
              }
              actionLabel={
                simulateEmptyState
                  ? "Tạo chuyến đi đầu tiên"
                  : "Xem tất cả chuyến đi"
              }
              onAction={() => {
                if (simulateEmptyState) {
                  setCreateNoticeModalOpen(true);
                } else {
                  setActiveTab("all");
                }
              }}
              className="my-6 py-14"
            />
          )}

          {/* Quick action footer invite banner */}
          <TripInviteBanner onOpenInviteModal={() => setInviteModalOpen(true)} />
        </div>
      </main>

      {/* App Footer */}
      <AppFooter />

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. Invite Code Modal */}
      <InviteCodeModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      {/* 2. Create Trip Notice Modal (Phased scope control) */}
      <Modal
        isOpen={createNoticeModalOpen}
        onClose={() => setCreateNoticeModalOpen(false)}
        title="Tạo chuyến đi mới (UC03)"
        description="Thông tin phạm vi phát triển Release 1"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cerulean shrink-0 mt-0.5" />
            <div className="text-sm text-text-body space-y-1">
              <p className="font-bold text-yale-blue">
                Màn hình Tạo chuyến đi (`/trips/new`)
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Màn hình tạo chuyến đi với các trường: Tên chuyến đi, Điểm đến, Ngày đi - Ngày về (chọn qua Date Picker) và Ngân sách dự kiến được lập trình ở <strong>Giai đoạn 2C.2</strong> theo đúng kế hoạch đã thống nhất.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button
              variant="primary"
              onClick={() => setCreateNoticeModalOpen(false)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Trip Detail Preview Notice Modal */}
      <Modal
        isOpen={selectedTripModal !== null}
        onClose={() => setSelectedTripModal(null)}
        title={selectedTripModal ? selectedTripModal.title : "Chi tiết chuyến đi"}
        description={
          selectedTripModal
            ? `${selectedTripModal.destination} · ${selectedTripModal.durationText}`
            : "Thông tin tổng quan chuyến đi"
        }
      >
        {selectedTripModal && (
          <div className="space-y-4 py-2 text-sm text-text-body">
            <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Mã mời chuyến đi:</span>
                <span className="font-mono font-bold text-cerulean bg-white px-2 py-0.5 rounded border border-border-hairline">
                  {selectedTripModal.inviteCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Trạng thái:</span>
                <span className="font-semibold text-yale-blue">
                  {selectedTripModal.status === "ACTIVE"
                    ? "Đang lên kế hoạch"
                    : selectedTripModal.status === "SETTLING"
                    ? "Đang thanh toán"
                    : "Đã hoàn tất"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Số thành viên tham gia:</span>
                <span className="font-semibold text-yale-blue">
                  {selectedTripModal.totalMembers} thành viên
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Số dư cá nhân:</span>
                <span className="font-bold text-cerulean">
                  {selectedTripModal.userBalance.type === "RECEIVE"
                    ? `+${selectedTripModal.userBalance.amount.toLocaleString("vi-VN")} ₫ (Được nhận)`
                    : selectedTripModal.userBalance.type === "PAY"
                    ? `-${selectedTripModal.userBalance.amount.toLocaleString("vi-VN")} ₫ (Cần trả)`
                    : "0 ₫ (Đã xong)"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF1E6] border border-[#C2410C]/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
              <div className="text-xs text-text-muted space-y-1">
                <p className="font-bold text-yale-blue">
                  Hub Tổng quan chuyến đi (`/trips/[id]`)
                </p>
                <p className="leading-relaxed">
                  Trang Hub gồm 4 tab (Tổng quan, Lịch trình, Chi tiêu, Công nợ) sẽ được triển khai ở các giai đoạn tiếp theo (Giai đoạn 2D, 2E, 2F).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border-hairline">
              <Button
                variant="primary"
                onClick={() => setSelectedTripModal(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. Settlement Details Notice Modal */}
      <Modal
        isOpen={settlementNoticeOpen}
        onClose={() => setSettlementNoticeOpen(false)}
        title="Chi tiết công nợ tổng hợp (UC17)"
        description="Bảng đối soát công nợ giữa các thành viên"
      >
        <div className="space-y-4 py-2 text-sm text-text-body">
          <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Bạn đang được nhận:</span>
              <span className="font-bold text-functional-positive tabular-nums">
                +{summary.toReceive.toLocaleString("vi-VN")}&nbsp;₫
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Bạn cần trả:</span>
              <span className="font-bold text-functional-negative tabular-nums">
                -{summary.toPay.toLocaleString("vi-VN")}&nbsp;₫
              </span>
            </div>
            <div className="pt-2 border-t border-border-hairline flex items-center justify-between font-bold">
              <span>Chênh lệch ròng (Net):</span>
              <span className="text-cerulean tabular-nums">
                +{summary.net.toLocaleString("vi-VN")}&nbsp;₫
              </span>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Bảng công nợ chi tiết theo từng giao dịch chuyển tiền (settlement transfers) và mã thanh toán VietQR sẽ được xem trực tiếp tại trang chi tiết từng chuyến đi khi sổ công nợ được chốt.
          </p>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button
              variant="primary"
              onClick={() => setSettlementNoticeOpen(false)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-bg-canvas flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-cerulean border-t-transparent animate-spin" />
        </div>
      }
    >
      <TripsContent />
    </Suspense>
  );
}
