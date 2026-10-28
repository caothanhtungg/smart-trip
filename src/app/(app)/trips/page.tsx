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
  Map as MapIcon,
  Briefcase,
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
import { AppTopBar } from "@/components/layout/AppTopBar";
import { DiscoverySplitView } from "@/components/trips/discovery/DiscoverySplitView";
import { matchesSearchQuery } from "@/components/layout/top-bar-logic";

/**
 * API CONTRACT & LỌC/SẮP XẾP DANH SÁCH CHUYẾN ĐI (GET /api/trips):
 * - Backend GET /api/trips hỗ trợ query:
 *     + tab: "active" (status IN ['ACTIVE', 'SETTLING']), "completed" (status IN ['COMPLETED']), "all" (toàn bộ)
 *     + sortBy: "latest" (updatedAt desc), "departure" (startDate asc), "name" (name asc)
 * - Kiến trúc Client: TripsStoreProvider tải danh sách toàn bộ chuyến đi của người dùng qua fetchMyTrips(),
 *   sau đó áp dụng các hàm thuần túy filterTrips() và sortTrips() ở client-side để chuyển tab và sắp xếp
 *   ngay lập tức không có độ trễ mạng.
 * - Hỗ trợ chế độ xem chia đôi màn hình Split-View (Dream Destini):
 *     + view=discovery: Bản đồ khám phá tương tác bên phải + Địa danh & thời tiết bên trái.
 *     + Mặc định: Danh sách chuyến đi dạng thẻ kèm tóm tắt chi phí.
 */
function TripsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulateEmptyState = searchParams.get("empty") === "true";
  const viewParam = searchParams.get("view");
  const isDiscoveryView = viewParam === "discovery";

  const { trips: storeTrips, isLoading, error, refetchTrips } = useTripsStore();

  const [activeTab, setActiveTab] = React.useState<TripFilterTab>("all");
  const [sortBy, setSortBy] = React.useState<TripSortOption>("latest");
  const [searchQuery, setSearchQuery] = React.useState("");
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
  const currentTrips = React.useMemo(() => {
    if (simulateEmptyState) return [];
    let list = sortTrips(filterTrips(cardViews, activeTab), sortBy);
    if (searchQuery.trim()) {
      list = list.filter((item) =>
        matchesSearchQuery(
          { name: item.name, destination: item.destination },
          searchQuery
        )
      );
    }
    return list;
  }, [cardViews, activeTab, sortBy, simulateEmptyState, searchQuery]);

  const summary = simulateEmptyState
    ? { toReceive: 0, toPay: 0, net: 0 }
    : getOverallBalance(rawTrips);

  const isUnauthorized =
    (error instanceof TripsApiError && error.status === 401) ||
    (error as { status?: number })?.status === 401 ||
    (error as { code?: string })?.code === "UNAUTHORIZED";

  return (
    <>
      {/* Top Bar Navigation conforming to Dream Destini App Shell */}
      <AppTopBar
        title={isDiscoveryView ? "Khám phá & Bản đồ" : "Chuyến đi của tôi"}
        subtitle={
          isDiscoveryView
            ? "Bản đồ tương tác 50+ danh lam thắng cảnh Việt Nam & gợi ý thời tiết"
            : "Quản lý lịch trình, thời tiết và chia chi phí thông minh"
        }
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeTab}
        onFilterChange={(val) => setActiveTab(val as TripFilterTab)}
        onCreateTrip={() => router.push("/trips/new")}
        showFilters={!isDiscoveryView}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1600px] mx-auto">
        {/* View Switcher Bar (Khám phá & Bản đồ vs Chuyến đi của tôi) */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E9ECEF]">
          <div className="flex items-center gap-1.5 p-1 bg-[#F1F3F5] rounded-2xl border border-[#E9ECEF]">
            <button
              type="button"
              onClick={() => router.push("/trips?view=discovery")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isDiscoveryView
                  ? "bg-white text-yale-blue shadow-xs"
                  : "text-text-muted hover:text-yale-blue"
              }`}
            >
              <MapIcon className="w-4 h-4 text-[#E05833]" />
              <span>Khám phá & Bản đồ</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/trips")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                !isDiscoveryView
                  ? "bg-white text-yale-blue shadow-xs"
                  : "text-text-muted hover:text-yale-blue"
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#184E77]" />
              <span>Chuyến đi của tôi ({cardViews.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              className="h-9 px-3 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Nhập mã mời</span>
            </Button>
          </div>
        </div>

        {/* View Content: Discovery Split-View OR Standard Trips Grid */}
        {isDiscoveryView ? (
          <DiscoverySplitView
            trips={cardViews}
            onCreateTrip={() => router.push("/trips/new")}
          />
        ) : (
          <div>
            {/* Main Body: Loading vs Error vs Data Grid */}
            {isLoading && !simulateEmptyState ? (
              <div
                role="status"
                aria-label="Đang tải danh sách chuyến đi..."
                className="mt-6 space-y-6"
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
                {/* Slim Summary Strip (Balance Overview) */}
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
                        activeTab === "active"
                          ? "Các chuyến đi đang trong giai đoạn lên kế hoạch hoặc thanh toán sẽ xuất hiện tại đây."
                          : activeTab === "completed"
                          ? "Các chuyến đi đã kết thúc và đối soát công nợ hoàn tất sẽ được lưu trữ tại đây."
                          : "Khám phá danh lam thắng cảnh hoặc tạo chuyến đi mới để bắt đầu lên kế hoạch và phân chia chi phí cùng nhóm bạn."
                      }
                      actionLabel="Tạo chuyến đi đầu tiên"
                      onAction={() => router.push("/trips/new")}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Invite Code Modal */}
      <InviteCodeModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      {/* More Actions Modal for Trip Card */}
      {selectedTripModal && (
        <Modal
          isOpen={Boolean(selectedTripModal)}
          onClose={() => setSelectedTripModal(null)}
          title={selectedTripModal.name}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Điểm đến:{" "}
              <strong className="text-yale-blue">
                {selectedTripModal.destination}
              </strong>
            </p>
            <p className="text-sm text-text-muted">
              Trạng thái:{" "}
              <span className="font-semibold text-cerulean">
                {getTripStatusLabel(selectedTripModal.status)}
              </span>
            </p>
            <div className="pt-4 border-t border-border-hairline flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  const id = selectedTripModal.id;
                  setSelectedTripModal(null);
                  router.push(`/trips/${id}`);
                }}
              >
                Vào xem chuyến đi
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedTripModal(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Overall Settlement Notice Modal */}
      <Modal
        isOpen={settlementNoticeOpen}
        onClose={() => setSettlementNoticeOpen(false)}
        title="Chi tiết công nợ tổng hợp"
        maxWidth="md"
      >
        <div className="space-y-4 text-sm text-text-body">
          <p className="text-text-muted leading-relaxed">
            Số dư tổng hợp được tính dựa trên số tiền thực tế bạn đã thanh toán cho cả nhóm trừ đi phần chi phí của cá nhân bạn ở tất cả các chuyến đi đang hoạt động.
          </p>

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
