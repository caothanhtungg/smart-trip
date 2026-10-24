"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RotateCw,
  ShieldAlert,
  LogIn,
  ShieldX,
  ArrowLeft,
} from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { fetchTripDetailApi, TripsApiError } from "@/lib/services/trips-api";
import { TripSessionProvider } from "./trip-session-context";
import { TripDetailLayoutView } from "./trip-detail-layout-view";
import { TripNotFound } from "./trip-not-found";
import { Button } from "@/components/ui/button";

export interface TripDetailClientLoaderProps {
  tripId: string;
  children: React.ReactNode;
  /**
   * Dữ liệu khởi tạo tùy chọn dành cho testing hoặc khi đã nạp trước.
   */
  initialTrip?: TripDetailData;
}

export function TripDetailClientLoader({
  tripId,
  children,
  initialTrip,
}: TripDetailClientLoaderProps) {
  const router = useRouter();
  const [trip, setTrip] = React.useState<TripDetailData | null>(
    () => initialTrip ?? null
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(
    () => initialTrip === undefined
  );
  const [error, setError] = React.useState<TripsApiError | Error | null>(null);

  const loadTrip = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTripDetailApi(tripId);
      setTrip(data);
    } catch (err) {
      setError(
        err instanceof TripsApiError || err instanceof Error
          ? err
          : new Error("Lỗi không xác định khi tải chi tiết chuyến đi.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  const [prevTripId, setPrevTripId] = React.useState(tripId);
  if (tripId !== prevTripId) {
    setPrevTripId(tripId);
    setIsLoading(true);
    setError(null);
  }

  React.useEffect(() => {
    if (initialTrip !== undefined) return;

    let isMounted = true;
    (async () => {
      try {
        const data = await fetchTripDetailApi(tripId);
        if (isMounted) {
          setTrip(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof TripsApiError || err instanceof Error
              ? err
              : new Error("Lỗi không xác định khi tải chi tiết chuyến đi.")
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tripId, initialTrip]);

  // Trạng thái 1: Đang tải dữ liệu (Loading Skeleton)
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải chi tiết chuyến đi..."
        className="w-full bg-white animate-pulse min-h-[600px]"
      >
        {/* Banner skeleton */}
        <div className="w-full h-24 sm:h-28 bg-hover-row" />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-4">
          <div className="h-4 bg-hover-row rounded w-48" />
          <div className="h-8 bg-hover-row rounded w-72" />
          <div className="h-4 bg-hover-row rounded w-96" />
          <div className="h-12 border-b border-border-hairline" />
        </div>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-48 rounded-2xl bg-hover-row" />
              <div className="h-32 rounded-2xl bg-hover-row" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-64 rounded-2xl bg-hover-row" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái 2: Lỗi API hoặc lỗi mạng
  if (error) {
    const is401 =
      (error instanceof TripsApiError && error.status === 401) ||
      (error as { status?: number })?.status === 401;

    const is403 =
      (error instanceof TripsApiError && error.status === 403) ||
      (error as { status?: number })?.status === 403;

    const is404 =
      (error instanceof TripsApiError && error.status === 404) ||
      (error as { status?: number })?.status === 404;

    // 401: Hết hạn phiên đăng nhập -> Chuyển về /login có callbackUrl
    if (is401) {
      return (
        <div className="max-w-lg mx-auto my-16 px-4 text-center">
          <div
            role="alert"
            className="p-8 rounded-2xl bg-white border border-border-hairline shadow-sm space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-hover-row text-cerulean flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-yale-blue">
                Phiên đăng nhập đã hết hạn
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Vui lòng đăng nhập lại để tiếp tục xem và quản lý chuyến đi này.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() =>
                  router.push(
                    `/login?callbackUrl=${encodeURIComponent(`/trips/${tripId}`)}`
                  )
                }
                className="rounded-xl px-6 h-11 inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập lại</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // 403: Không có quyền thành viên
    if (is403) {
      return (
        <div className="max-w-lg mx-auto my-16 px-4 text-center">
          <div
            role="alert"
            className="p-8 rounded-2xl bg-white border border-border-hairline shadow-sm space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-functional-warning-bg text-functional-warning flex items-center justify-center mx-auto">
              <ShieldX className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-yale-blue">
                Không có quyền truy cập
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Bạn không phải là thành viên của chuyến đi này hoặc đã rời nhóm.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/trips")}
                className="rounded-xl px-6 h-11 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách chuyến đi</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // 404: Không tìm thấy chuyến đi
    if (is404) {
      return <TripNotFound tripId={tripId} />;
    }

    // Lỗi mạng, 500 hoặc lỗi khác
    return (
      <div className="max-w-lg mx-auto my-16 px-4 text-center">
        <div
          role="alert"
          className="p-8 rounded-2xl bg-white border border-functional-negative/20 shadow-sm space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-functional-negative/10 text-functional-negative flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-yale-blue">
              Không thể tải chi tiết chuyến đi
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              {error.message ||
                "Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/trips")}
              className="rounded-xl px-4 h-11"
            >
              Danh sách
            </Button>
            <Button
              variant="primary"
              onClick={loadTrip}
              className="rounded-xl px-6 h-11 inline-flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Thử lại</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái 3: An toàn khi không có trip
  if (!trip) {
    return <TripNotFound tripId={tripId} />;
  }

  // Trạng thái 4: Tải thành công -> Khởi tạo TripSessionProvider
  return (
    <TripSessionProvider key={trip.id} initialTrip={trip} isRealApi={true}>
      <TripDetailLayoutView tripId={trip.id}>{children}</TripDetailLayoutView>
    </TripSessionProvider>
  );
}
