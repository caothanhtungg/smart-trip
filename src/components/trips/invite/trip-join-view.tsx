"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Compass,
  MapPin,
  ShieldCheck,
  Users,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";
import { TripClaimIdentityModal } from "@/components/trips/invite/trip-claim-identity-modal";
import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/ui/avatar";

export type TripJoinViewStatus =
  | "LOADING"
  | "VALID"
  | "INVALID_CODE"
  | "NOT_FOUND"
  | "ARCHIVED"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export interface ApiInvitePreviewMember {
  id: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string | null;
  role: string;
}

export interface ApiInviteClaimablePlaceholder {
  id: string;
  displayName?: string;
  name?: string;
  note?: string | null;
}

export interface ApiInvitePreviewData {
  id: string;
  name: string;
  destination?: string | null;
  startDate: string;
  endDate: string;
  durationText: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  members: ApiInvitePreviewMember[];
  memberCount: number;
  status: "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";
  inviteCode: string;
  isJoinable: boolean;
  claimablePlaceholders: ApiInviteClaimablePlaceholder[];
}

export interface ParsedInvitePreview {
  status: TripJoinViewStatus;
  previewData: ApiInvitePreviewData | null;
  errorMessage: string | null;
  isJoinable: boolean;
}

/**
 * Phân tích và chuẩn hóa response từ GET /api/invites/[code]
 */
export function parseInvitePreviewResponse(
  res: { status: number },
  body: unknown,
  code: string
): ParsedInvitePreview {
  const typedBody = body as
    | {
        success?: boolean;
        data?: Record<string, unknown>;
        error?: { message?: string; code?: string };
      }
    | null
    | undefined;

  if (res.status === 200 && typedBody?.success && typedBody.data) {
    const rawData = typedBody.data;
    const isJoinable =
      typeof rawData.isJoinable === "boolean"
        ? rawData.isJoinable
        : rawData.status === "ACTIVE";

    const rawMembers = Array.isArray(rawData.members)
      ? (rawData.members as Record<string, unknown>[])
      : [];
    const rawPlaceholders = Array.isArray(rawData.claimablePlaceholders)
      ? (rawData.claimablePlaceholders as Record<string, unknown>[])
      : [];

    return {
      status: "VALID",
      previewData: {
        id: String(rawData.id || ""),
        name: String(rawData.name || ""),
        destination: (rawData.destination as string) ?? null,
        startDate: String(rawData.startDate || ""),
        endDate: String(rawData.endDate || ""),
        durationText: String(rawData.durationText || "1 ngày"),
        hostName: String(rawData.hostName || "Trưởng nhóm"),
        hostAvatarUrl: (rawData.hostAvatarUrl as string) ?? null,
        members: rawMembers.map((m) => {
          const dName = String(m.displayName || m.name || "Thành viên");
          return {
            id: String(m.id || ""),
            displayName: dName,
            name: dName,
            avatarUrl: (m.avatarUrl as string) ?? null,
            role: String(m.role || "MEMBER"),
          };
        }),
        memberCount:
          typeof rawData.memberCount === "number"
            ? rawData.memberCount
            : rawMembers.length,
        status: (rawData.status as ApiInvitePreviewData["status"]) || "ACTIVE",
        inviteCode: String(rawData.inviteCode || code),
        isJoinable,
        claimablePlaceholders: rawPlaceholders.map((p) => {
          const dName = String(p.displayName || p.name || "Thành viên");
          return {
            id: String(p.id || ""),
            displayName: dName,
            name: dName,
          };
        }),
      },
      errorMessage: null,
      isJoinable,
    };
  }

  if (res.status === 410) {
    return {
      status: "ARCHIVED",
      previewData: null,
      errorMessage:
        typedBody?.error?.message ||
        "Chuyến đi này đã được lưu trữ hoặc đóng tham gia và không nhận thêm thành viên mới.",
      isJoinable: false,
    };
  }

  if (res.status === 429) {
    return {
      status: "RATE_LIMITED",
      previewData: null,
      errorMessage:
        typedBody?.error?.message ||
        "Bạn đã vượt quá giới hạn tra cứu mã mời (tối đa 10 lần/phút). Vui lòng thử lại sau giây lát.",
      isJoinable: false,
    };
  }

  if (res.status === 404) {
    return {
      status: "NOT_FOUND",
      previewData: null,
      errorMessage:
        typedBody?.error?.message || `Mã mời « ${code} » không tồn tại hoặc đã bị thu hồi.`,
      isJoinable: false,
    };
  }

  if (res.status === 400) {
    return {
      status: "INVALID_CODE",
      previewData: null,
      errorMessage:
        typedBody?.error?.message || "Mã mời chuyến đi không đúng định dạng.",
      isJoinable: false,
    };
  }

  return {
    status: "SERVER_ERROR",
    previewData: null,
    errorMessage:
      typedBody?.error?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
    isJoinable: false,
  };
}

/**
 * Xây dựng URL đăng nhập chuyển tiếp an toàn với callbackUrl
 */
export function buildLoginRedirectUrl(code: string): string {
  const targetPath = `/join/${encodeURIComponent(code.trim().toUpperCase())}`;
  return `/login?callbackUrl=${encodeURIComponent(targetPath)}`;
}

export interface TripJoinViewProps {
  code: string;
  initialPreviewData?: ApiInvitePreviewData | null;
}

export function TripJoinView({ code, initialPreviewData }: TripJoinViewProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const [previewData, setPreviewData] = React.useState<ApiInvitePreviewData | null>(
    initialPreviewData || null
  );
  const [status, setStatus] = React.useState<TripJoinViewStatus>(() =>
    initialPreviewData ? "VALID" : "LOADING"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);
  const [altCode, setAltCode] = React.useState("");
  const [retryCount, setRetryCount] = React.useState(0);

  // Fetch real invite preview from GET /api/invites/[code]
  React.useEffect(() => {
    let isMounted = true;

    async function fetchPreview() {
      setStatus("LOADING");
      setErrorMessage(null);

      try {
        const normalizedCode = code.trim().toUpperCase();
        const res = await fetch(`/api/invites/${encodeURIComponent(normalizedCode)}`);
        const body = await res.json().catch(() => null);

        if (!isMounted) return;

        const parsed = parseInvitePreviewResponse(res, body, normalizedCode);
        setStatus(parsed.status);
        setPreviewData(parsed.previewData);
        setErrorMessage(parsed.errorMessage);
      } catch {
        if (!isMounted) return;
        setStatus("SERVER_ERROR");
        setPreviewData(null);
        setErrorMessage("Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.");
      }
    }

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [code, retryCount]);

  const handleAltCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (altCode.trim()) {
      router.push(`/join/${encodeURIComponent(altCode.trim().toUpperCase())}`);
    }
  };

  const handleJoinClick = () => {
    // Khi session đang tải, không vội coi người dùng là chưa đăng nhập
    if (isSessionPending) return;

    if (!session?.user) {
      router.push(buildLoginRedirectUrl(code));
      return;
    }

    setIsClaimModalOpen(true);
  };

  // 1. Loading Skeleton State
  if (status === "LOADING") {
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col justify-between py-10 px-4 sm:px-6">
        <header className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-cerulean flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-yale-blue tracking-tight">Smart Trip</span>
          </Link>
          <div className="h-4 w-20 bg-surface-container-low rounded-md animate-pulse" />
        </header>

        <main className="max-w-xl mx-auto w-full my-auto py-8">
          <div className="bg-surface-card rounded-2xl border border-divider-border shadow-md overflow-hidden animate-pulse">
            <div className="h-40 bg-gradient-to-r from-yale-blue/40 via-cerulean/40 to-baltic-blue/40 p-6 flex flex-col justify-between">
              <div className="h-5 w-28 bg-white/30 rounded-full" />
              <div className="h-8 w-3/4 bg-white/40 rounded-lg" />
              <div className="h-4 w-1/2 bg-white/30 rounded-md" />
            </div>
            <div className="p-6 space-y-5">
              <div className="h-16 bg-surface-container-low rounded-xl" />
              <div className="h-12 bg-surface-container-low rounded-xl" />
              <div className="h-12 bg-surface-container-low rounded-xl" />
            </div>
          </div>
          <p className="text-center text-xs text-text-muted mt-4 animate-pulse">
            Đang tải thông tin chuyến đi...
          </p>
        </main>

        <footer className="max-w-3xl mx-auto w-full text-center text-xs text-text-muted">
          Smart Trip © 2026 • Nền tảng chia tiền và quản lý chuyến đi thông minh
        </footer>
      </div>
    );
  }

  // 2. Error / Invalid / Not Found / Archived / Rate Limited / Server Error State
  if (status !== "VALID" || !previewData) {
    const isRateLimited = status === "RATE_LIMITED";
    const isServerError = status === "SERVER_ERROR";
    const isArchived = status === "ARCHIVED";

    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col justify-between py-10 px-4 sm:px-6">
        {/* Top bar */}
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-cerulean flex items-center justify-center text-white shadow-xs group-hover:bg-baltic-blue transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-yale-blue tracking-tight">Smart Trip</span>
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-cerulean hover:text-baltic-blue flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </header>

        {/* Error Card */}
        <main className="max-w-md mx-auto w-full my-auto py-12">
          <div className="bg-surface-card rounded-2xl border border-divider-border shadow-xs p-6 sm:p-8 text-center space-y-5">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
                isRateLimited || isServerError
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-amber-50 border-amber-200 text-amber-600"
              }`}
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-yale-blue">
                {isArchived
                  ? "Chuyến đi đã đóng hoặc lưu trữ"
                  : isRateLimited
                  ? "Tra cứu quá thường xuyên"
                  : isServerError
                  ? "Không thể kết nối"
                  : "Mã mời không khả dụng"}
              </h1>
              <p className="text-sm text-text-muted leading-relaxed">
                {errorMessage ||
                  `Mã mời « ${code} » không tồn tại, đã hết hạn hoặc không đúng định dạng.`}
              </p>
            </div>

            {/* Action buttons or alternate code form */}
            {isRateLimited || isServerError ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="w-full h-11 bg-cerulean hover:bg-baltic-blue font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử tải lại</span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAltCodeSubmit} className="pt-2 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập mã mời khác (ví dụ: DL3N2D-TRIP99)"
                    value={altCode}
                    onChange={(e) => setAltCode(e.target.value.toUpperCase())}
                    className="w-full h-11 px-3.5 rounded-xl border border-divider-border bg-bg-canvas text-sm font-medium text-yale-blue placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-cerulean/20 focus:border-cerulean tracking-wider uppercase text-center"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!altCode.trim()}
                  className="w-full h-11 bg-cerulean hover:bg-baltic-blue font-semibold text-sm rounded-xl"
                >
                  Tra cứu mã mời
                </Button>
              </form>
            )}

            <div className="pt-3 border-t border-border-hairline">
              <Link
                href="/"
                className="text-xs text-text-muted hover:text-cerulean font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang chủ Smart Trip</span>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto w-full text-center text-xs text-text-muted">
          Smart Trip © 2026 • Nền tảng lập kế hoạch và chia tiền chuyến đi minh bạch
        </footer>
      </div>
    );
  }

  // 3. Valid Invitation Preview State
  const formattedStartDate =
    formatDate(previewData.startDate) || previewData.startDate.slice(0, 10);
  const formattedEndDate =
    formatDate(previewData.endDate) || previewData.endDate.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-canvas via-surface-container-low/40 to-bg-canvas flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cerulean/15 via-ocean-mist/30 to-cerulean/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Brand Bar */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-cerulean flex items-center justify-center text-white shadow-xs group-hover:bg-baltic-blue transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-yale-blue tracking-tight block leading-tight">
              Smart Trip
            </span>
            <span className="text-[11px] text-text-muted hidden sm:block">
              Đi cùng nhau, vui vẻ và minh bạch
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-cerulean hover:text-baltic-blue flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </header>

      {/* Main Preview Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-8 relative z-10">
        <div className="bg-surface-card rounded-2xl border border-divider-border shadow-md overflow-hidden transition-all">
          {/* Card Top Accent / Banner */}
          <div className="bg-gradient-to-r from-yale-blue via-cerulean to-baltic-blue p-6 sm:p-7 text-white relative">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lời mời tham gia</span>
              </span>
              <span className="text-xs font-mono font-semibold bg-black/20 px-2.5 py-1 rounded-lg text-white/90 tracking-wider">
                {previewData.inviteCode}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {previewData.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs sm:text-sm text-white/90">
              {previewData.destination && (
                <div className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 shrink-0 text-white/80" />
                  <span>{previewData.destination}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 shrink-0 text-white/80" />
                <span>
                  {formattedStartDate} — {formattedEndDate}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 shrink-0 text-white/80" />
                <span>{previewData.durationText}</span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Host Section */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-divider-border">
              <div className="flex items-center gap-3.5">
                <Avatar
                  name={previewData.hostName}
                  src={previewData.hostAvatarUrl}
                  size="md"
                  className="shadow-xs"
                />
                <div>
                  <div className="text-xs text-text-muted font-medium">Trưởng nhóm mời bạn</div>
                  <div className="font-bold text-yale-blue text-base leading-tight">
                    {previewData.hostName}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-surface-card rounded-lg text-cerulean border border-divider-border">
                Trưởng nhóm
              </span>
            </div>

            {/* Member Avatars Stack */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
                  <Users className="w-4 h-4 text-cerulean" />
                  <span>Các thành viên trong nhóm ({previewData.memberCount} người)</span>
                </div>
                <span>
                  {previewData.status === "ACTIVE"
                    ? "Đang lên kế hoạch"
                    : previewData.status === "SETTLING"
                    ? "Đang chốt sổ"
                    : "Đã hoàn tất"}
                </span>
              </div>

              {/* Avatars */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {previewData.members.map((member) => {
                  const memberName =
                    member.displayName || member.name || "Thành viên";
                  const lastName =
                    memberName.split(" ").slice(-1)[0] || memberName;

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col items-center gap-1 shrink-0 group relative"
                      title={memberName}
                    >
                      <Avatar
                        name={memberName}
                        src={member.avatarUrl}
                        size="md"
                        className="border-2 border-surface-card shadow-xs"
                      />
                      <span className="text-[11px] font-medium text-text-muted truncate max-w-[64px] text-center">
                        {lastName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rule R19 Privacy Guarantee Callout */}
            <div className="p-4 bg-ocean-mist/30 rounded-xl border border-cerulean/20 flex items-start gap-3 text-xs leading-relaxed text-yale-blue">
              <ShieldCheck className="w-5 h-5 text-cerulean shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-cerulean block mb-0.5">
                  Bảo mật tài chính & lịch trình (Quy tắc R19)
                </strong>
                <span>
                  Thông tin lịch trình chi tiết, danh sách chi tiêu và công nợ nhóm được bảo mật tuyệt
                  đối và chỉ hiển thị sau khi bạn chính thức gia nhập chuyến đi.
                </span>
              </div>
            </div>

            {/* Call To Action Buttons */}
            <div className="space-y-3 pt-2">
              {previewData.isJoinable ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleJoinClick}
                  disabled={isSessionPending}
                  className="w-full h-12 bg-cerulean hover:bg-baltic-blue font-bold text-base rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isSessionPending ? (
                    <span>Đang kiểm tra đăng nhập...</span>
                  ) : (
                    <>
                      <span>Tham gia chuyến đi</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  {previewData.status === "SETTLING" ? (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block mb-0.5">
                          Chuyến đi đang chốt sổ và thanh toán
                        </strong>
                        <span>
                          Chuyến đi đang trong giai đoạn chốt sổ và thanh toán công nợ. Tạm thời không nhận thêm thành viên mới.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-surface-container-low rounded-xl border border-divider-border flex items-start gap-2.5 text-xs text-yale-blue leading-relaxed">
                      <Info className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block mb-0.5">
                          Chuyến đi đã hoàn tất
                        </strong>
                        <span>
                          Chuyến đi này đã kết thúc và hoàn tất quyết toán. Không thể tham gia chuyến đi này.
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    disabled
                    className="w-full h-12 bg-gray-200 text-gray-500 cursor-not-allowed font-bold text-base rounded-xl flex items-center justify-center gap-2"
                  >
                    <span>
                      {previewData.status === "SETTLING"
                        ? "Chuyến đi tạm khóa tham gia"
                        : "Chuyến đi đã hoàn tất"}
                    </span>
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center">
                <Link
                  href="/"
                  className="text-xs font-medium text-text-muted hover:text-cerulean transition-colors px-3 py-1.5"
                >
                  Để sau, quay lại trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-text-muted relative z-10">
        Smart Trip © 2026 • Nền tảng chia tiền và quản lý chuyến đi thông minh
      </footer>

      {/* Claim / Join Modal */}
      {previewData.isJoinable && (
        <TripClaimIdentityModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          previewData={previewData}
          claimablePlaceholders={previewData.claimablePlaceholders || []}
          code={code}
          onJoinSuccess={() => {
            setIsClaimModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
