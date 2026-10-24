"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Ticket,
  Compass,
  Info,
  AlertCircle,
  RotateCw,
  ShieldAlert,
  LogIn,
} from "lucide-react";
import { TripSummaryStrip } from "@/components/trips/trip-summary-strip";
import { TripFilters } from "@/components/trips/trip-filters";
import { TripCard } from "@/components/trips/trip-card";
import { TripInviteBanner } from "@/components/trips/trip-invite-banner";
import { InviteCodeModal } from "@/components/trips/invite-code-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { filterTrips, sortTrips } from "@/lib/trips/filter-sort";
import { getOverallBalance } from "@/lib/trips/balance";
import { toTripCardViews } from "@/lib/view/trip-card";
import { TripCardView, TripFilterTab, TripSortOption } from "@/types/trip";
import { getTripStatusLabel, getBalanceTypeLabel } from "@/lib/labels";
import { useTripsStore } from "@/lib/trips/trips-store-context";
import { TripsApiError } from "@/lib/services/trips-api";

/**
 * API CONTRACT & LỌC/SẮP XẾP DANH SÁCH CHUYẾN ĐI (GET /api/trips):
 * - Backend GET /api/trips hỗ trợ query:
 *     + tab: "active" (status IN ['ACTIVE', 'SETTLING']), "completed" (status IN ['COMPLETED']), "all" (toàn bộ)
 *     + sortBy: "latest" (updatedAt desc), "departure" (startDate asc), "name" (name asc)
 * - Kiến trúc Client: TripsStoreProvider tải danh sách toàn bộ chuyến đi của người dùng qua fetchMyTrips(),
 *   sau đó áp dụng các hàm thuần túy filterTrips() và sortTrips() ở client-side để chuyển tab và sắp xếp
 *   ngay lập tức không có độ trễ mạng.
 * - Quy tắc an toàn: Không biến lỗi mạng, 401, 403, 500 thành danh sách rỗng, không dùng MOCK_TRIPS làm fallback.
 */
function TripsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulateEmptyState = searchParams.get("empty") === "true";
  const { trips: storeTrips, isLoading, error, refetchTrips } = useTripsStore();

  const [activeTab, setActiveTab] = React.useState<TripFilterTab>("all");
  const [sortBy, setSortBy] = React.useState<TripSortOption>("latest");
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [selectedTripModal, setSelectedTripModal] = React.useState<TripCardView | null>(null);
  const [settlementNoticeOpen, setSettlementNoticeOpen] = React.useState(false);

  const rawTrips = storeTrips;

  const cardViews: TripCardView[] = React.useMemo(() => {
    return toTripCardViews(rawTrips);
  }, [rawTrips]);

  // Compute counts (set all counts to 0 in simulated empty state)
  const allCount = simulateEmptyState ? 0 : cardViews.length;
  const activeCount = simulateEmptyState
    ? 0
    : cardViews.filter(
        (t) => t.status === "ACTIVE" || t.status === "SETTLING"
      ).length;
  const completedCount = simulateEmptyState
    ? 0
    : cardViews.filter((t) => t.status === "COMPLETED").length;

  // Filter and sort trips without mutating original data
  const currentTrips = simulateEmptyState
    ? []
    : sortTrips(filterTrips(cardViews, activeTab), sortBy);

  const summary = simulateEmptyState
    ? { toReceive: 0, toPay: 0, net: 0 }
    : getOverallBalance(rawTrips);

  const isUnauthorized =
    (error instanceof TripsApiError && error.status === 401) ||
    (error as { status?: number })?.status === 401 ||
    (error as { code?: string })?.code === "UNAUTHORIZED";

  return (
    <>
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
                onClick={() => router.push("/trips/new")}
                className="h-11 px-5 text-sm font-semibold flex items-center gap-2 rounded-xl shadow-[0_4px_12px_rgba(26,117,159,0.25)]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tạo chuyến đi</span>
              </Button>
            </div>
          </section>

          {/* Main Body: Loading vs Error vs Data Grid */}
          {isLoading && !simulateEmptyState ? (
            <div
              role="status"
              aria-label="Đang tải danh sách chuyến đi..."
              className="mt-6 sm:mt-8 space-y-6"
            >
              {/* Shimmer summary skeleton */}
              <div className="h-20 rounded-2xl bg-white/70 border border-border-hairline animate-pulse" />
              {/* Shimmer filter skeleton */}
              <div className="h-12 rounded-xl bg-white/70 border border-border-hairline animate-pulse" />
              {/* Shimmer card grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-white border border-border-hairline p-5 flex flex-col justify-between animate-pulse"
                  >
                    <div className="space-y-3">
                      <div className="h-4 bg-hover-row rounded w-1/3" />
                      <div className="h-6 bg-hover-row rounded w-3/4" />
                      <div className="h-4 bg-hover-row rounded w-1/2" />
                    </div>
                    <div className="h-10 bg-hover-row rounded-xl w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : error && !simulateEmptyState ? (
            <div className="mt-8 mb-12">
              {isUnauthorized ? (
                <div
                  role="alert"
                  className="p-6 sm:p-8 rounded-2xl bg-white border border-border-hairline shadow-sm text-center max-w-lg mx-auto space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-hover-row text-cerulean flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-yale-blue">
                      Phiên đăng nhập đã hết hạn
                    </h2>
                    <p className="text-sm text-text-muted leading-relaxed">
                      Vui lòng đăng nhập lại để tiếp tục quản lý và xem danh sách chuyến đi của bạn.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={() =>
                        router.push(
                          `/login?callbackUrl=${encodeURIComponent("/trips")}`
                        )
                      }
                      className="rounded-xl px-6 h-11 inline-flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Đăng nhập lại</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  role="alert"
                  className="p-6 sm:p-8 rounded-2xl bg-white border border-functional-negative/20 shadow-sm text-center max-w-lg mx-auto space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-functional-negative/10 text-functional-negative flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-yale-blue">
                      Không thể tải danh sách chuyến đi
                    </h2>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {error.message ||
                        "Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra mạng và thử lại."}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={() => refetchTrips()}
                      className="rounded-xl px-6 h-11 inline-flex items-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Thử lại</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Slim Summary Strip (Balance Overview) - Ẩn khi ở trạng thái chưa có chuyến đi */}
              {!simulateEmptyState && cardViews.length > 0 && (
                <TripSummaryStrip
                  summary={summary}
                  onViewSettlementDetails={() => setSettlementNoticeOpen(true)}
                />
              )}

              {/* Filter & Sorting Controls */}
              <TripFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sortBy={sortBy}
                onSortChange={setSortBy}
                counts={{
                  all: allCount,
                  active: activeCount,
                  completed: completedCount,
                }}
              />

              {/* Trips Grid / Empty State Presentation */}
              <div className="mt-6 sm:mt-8">
                {currentTrips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onSelectTrip={(t) => router.push(`/trips/${t.id}`)}
                        onMoreActions={(t) => setSelectedTripModal(t)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Compass className="w-8 h-8" />}
                    title={
                      activeTab === "active"
                        ? "Chưa có chuyến đi nào đang diễn ra"
                        : activeTab === "completed"
                        ? "Chưa có chuyến đi nào đã hoàn tất"
                        : "Bạn chưa tham gia chuyến đi nào"
                    }
                    description={
                      activeTab === "all"
                        ? "Hãy bắt đầu chuyến đi đầu tiên bằng cách tạo kế hoạch mới hoặc nhập mã mời từ bạn bè."
                        : "Chuyển sang tab khác để xem tất cả các chuyến đi bạn đã tham gia."
                    }
                    actionLabel={activeTab === "all" ? "Tạo chuyến đi mới" : undefined}
                    onAction={activeTab === "all" ? () => router.push("/trips/new") : undefined}
                    className="my-10"
                  />
                )}
              </div>
            </>
          )}

          {/* Secondary Action: Trip Invite Banner */}
          <div className="mt-10 sm:mt-12">
            <TripInviteBanner onOpenInviteModal={() => setInviteModalOpen(true)} />
          </div>
        </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. Invite Code Modal */}
      <InviteCodeModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      {/* 2. Trip Detail Preview Notice Modal */}
      <Modal
        isOpen={selectedTripModal !== null}
        onClose={() => setSelectedTripModal(null)}
        title={selectedTripModal ? selectedTripModal.name : "Chi tiết chuyến đi"}
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
                  {getTripStatusLabel(selectedTripModal.status)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Số thành viên tham gia:</span>
                <span className="font-semibold text-yale-blue">
                  {selectedTripModal.memberCount} thành viên
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Số dư cá nhân:</span>
                <span className="font-bold text-cerulean">
                  {selectedTripModal.userBalance.type === "RECEIVE"
                    ? `+${selectedTripModal.userBalance.amount.toLocaleString("vi-VN")} ₫ (${getBalanceTypeLabel("RECEIVE")})`
                    : selectedTripModal.userBalance.type === "PAY"
                    ? `-${selectedTripModal.userBalance.amount.toLocaleString("vi-VN")} ₫ (${getBalanceTypeLabel("PAY")})`
                    : `0 ₫ (${getBalanceTypeLabel("SETTLED")})`}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-functional-warning-bg border border-functional-warning/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
              <div className="text-xs text-text-muted space-y-1">
                <p className="font-bold text-yale-blue">
                  Trang chi tiết chuyến đi
                </p>
                <p className="leading-relaxed">
                  Xem chi tiết chuyến đi gồm các phân hệ Tổng quan, Lịch trình, Chi tiêu và Công nợ.
                </p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-border-hairline">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTripModal(null)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const targetId = selectedTripModal.id;
                  setSelectedTripModal(null);
                  router.push(`/trips/${targetId}`);
                }}
              >
                Xem chi tiết chuyến đi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Settlement Details Notice Modal */}
      <Modal
        isOpen={settlementNoticeOpen}
        onClose={() => setSettlementNoticeOpen(false)}
        title="Chi tiết công nợ tổng hợp"
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
    </>
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
