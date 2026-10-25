"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Ticket,
  ShieldAlert,
  ShieldCheck,
  Info,
  Calendar,
  Clock,
  MapPin,
  Users,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { validateInviteCode } from "@/lib/trips/invite-code";
import { formatDate } from "@/lib/utils";
import {
  parseInvitePreviewResponse,
  type ApiInvitePreviewData,
} from "@/components/trips/invite/trip-join-view";
import { TripClaimIdentityModal } from "@/components/trips/invite/trip-claim-identity-modal";

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteCodeModal({ isOpen, onClose }: InviteCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<ApiInvitePreviewData | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);

  const handleReset = () => {
    setCode("");
    setError(null);
    setIsLoading(false);
    setPreviewData(null);
    setIsClaimModalOpen(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra định dạng (Client-side format check)
    const result = validateInviteCode(code);
    if (!result.isValid || !result.normalizedCode) {
      setError(result.error ?? "Mã mời không đúng định dạng.");
      setPreviewData(null);
      return;
    }

    const normalizedCode = result.normalizedCode;
    setIsLoading(true);
    setError(null);

    // 2. Tra cứu mã thật từ backend GET /api/invites/[code]
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(normalizedCode)}`);
      const body = await res.json().catch(() => null);
      const parsed = parseInvitePreviewResponse(res, body, normalizedCode);

      if (parsed.status !== "VALID" || !parsed.previewData) {
        setError(parsed.errorMessage || "Mã mời không tồn tại hoặc đã bị thu hồi.");
        setPreviewData(null);
      } else {
        setError(null);
        setPreviewData(parsed.previewData);
      }
    } catch {
      setError("Lỗi kết nối mạng khi tra cứu mã mời. Vui lòng kiểm tra đường truyền và thử lại.");
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvitePage = () => {
    if (!previewData) return;
    router.push(`/join/${encodeURIComponent(previewData.inviteCode)}`);
    handleClose();
  };

  const handleJoinClick = () => {
    if (!previewData || !previewData.isJoinable) return;
    setIsClaimModalOpen(true);
  };

  const formattedStartDate = previewData
    ? formatDate(previewData.startDate) || previewData.startDate.slice(0, 10)
    : "";
  const formattedEndDate = previewData
    ? formatDate(previewData.endDate) || previewData.endDate.slice(0, 10)
    : "";

  return (
    <>
      <Modal
        isOpen={isOpen && !isClaimModalOpen}
        onClose={handleClose}
        title={
          previewData
            ? "Thông tin chuyến đi"
            : "Nhập mã mời tham gia chuyến đi"
        }
        description={
          previewData
            ? `Trưởng nhóm: ${previewData.hostName} · Mã: ${previewData.inviteCode}`
            : "Tra cứu thông tin và tham gia chuyến đi qua mã mời"
        }
        className="max-w-lg"
      >
        {!previewData ? (
          /* ==========================================
             BƯỚC 1: Form nhập mã mời
             ========================================== */
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                htmlFor="invite-code-input"
                className="text-sm font-semibold text-yale-blue block"
              >
                Mã mời (Invite Code)
              </label>
              <div className="relative">
                <Input
                  id="invite-code-input"
                  type="text"
                  maxLength={13}
                  placeholder="VD: DL3N2D-TRIP99"
                  value={code}
                  disabled={isLoading}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  className="uppercase tracking-widest text-center font-bold text-lg h-12"
                  autoFocus
                />
                <Ticket className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted pointer-events-none" />
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-functional-warning-bg border border-functional-warning/30 text-xs text-functional-negative font-medium flex items-start gap-2.5 mt-2"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <p className="text-xs text-text-muted">
                Mã mời gồm <strong>10–12 ký tự chữ/số</strong> (không tính tối đa một dấu gạch nối), độ dài tối đa 13 ký tự, ví dụ: <code className="font-mono bg-bg-canvas px-1 py-0.5 rounded border border-border-hairline">DL3N2D-TRIP99</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-canvas border border-border-hairline text-xs text-text-muted space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
                <Info className="w-4 h-4 text-cerulean shrink-0" />
                <span>Quy định bảo mật & tra cứu:</span>
              </div>
              <p className="leading-relaxed">
                Hệ thống xác minh mã mời thực tế từ máy chủ. Theo Quy tắc R19, lịch trình chi tiết và danh sách chi tiêu sẽ chỉ được mở sau khi bạn chính thức tham gia chuyến đi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !code.trim()}
                className="min-w-[140px] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tra cứu...</span>
                  </>
                ) : (
                  <>
                    <span>Tra cứu chuyến đi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* ==========================================
             BƯỚC 2: Hiển thị Preview chuyến đi thật (API thật)
             ========================================== */
          <div className="space-y-4 py-1 text-text-body">
            {/* Trip Preview Card */}
            <div className="rounded-2xl border border-divider-border overflow-hidden bg-surface-card shadow-xs">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-yale-blue via-cerulean to-baltic-blue p-5 text-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                    Lời mời hợp lệ
                  </span>
                  <span className="font-mono text-xs font-bold bg-black/25 px-2 py-0.5 rounded text-white/95">
                    {previewData.inviteCode}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {previewData.name}
                </h4>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/90">
                  {previewData.destination && (
                    <div className="inline-flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-white/80" />
                      <span>{previewData.destination}</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>
                      {formattedStartDate} — {formattedEndDate}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{previewData.durationText}</span>
                  </div>
                </div>
              </div>

              {/* Host & Members Summary */}
              <div className="p-4 space-y-3 bg-surface-container-low/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={previewData.hostName}
                      src={previewData.hostAvatarUrl}
                      size="sm"
                      className="shadow-xs"
                    />
                    <div>
                      <div className="text-[11px] text-text-muted">Trưởng nhóm</div>
                      <div className="text-sm font-bold text-yale-blue leading-tight">
                        {previewData.hostName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-text-muted bg-surface-card px-2.5 py-1 rounded-lg border border-divider-border">
                    <Users className="w-3.5 h-3.5 text-cerulean" />
                    <span>{previewData.memberCount} thành viên</span>
                  </div>
                </div>

                {/* Status Notice if not ACTIVE */}
                {!previewData.isJoinable && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">
                        {previewData.status === "SETTLING"
                          ? "Chuyến đi đang chốt sổ"
                          : "Chuyến đi đã hoàn tất"}
                      </strong>
                      <span>
                        Chuyến đi hiện tạm khóa tham gia và không nhận thêm thành viên mới.
                      </span>
                    </div>
                  </div>
                )}

                {/* Rule R19 Privacy Note */}
                <div className="p-3 rounded-xl bg-ocean-mist/20 border border-cerulean/20 text-xs text-yale-blue flex items-start gap-2 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
                  <span>
                    <strong>Bảo mật R19:</strong> Lịch trình chi tiết, danh sách chi tiêu và công nợ nhóm được bảo mật tuyệt đối cho đến khi bạn chính thức gia nhập chuyến đi.
                  </span>
                </div>
              </div>
            </div>

            {/* External link to /join/[code] */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={handleViewInvitePage}
                className="text-xs text-text-muted hover:text-cerulean font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Mở trang lời mời đầy đủ (/join/{previewData.inviteCode})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
              <Button type="button" variant="outline" onClick={handleReset}>
                Nhập mã khác
              </Button>
              {previewData.isJoinable ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleJoinClick}
                  className="bg-cerulean hover:bg-baltic-blue font-bold flex items-center gap-2"
                >
                  <span>Tham gia chuyến đi</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="primary" disabled className="bg-gray-200 text-gray-500 cursor-not-allowed">
                  Không thể tham gia
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Claim / Join Modal (UC33 & Direct Membership Join) */}
      {previewData && previewData.isJoinable && (
        <TripClaimIdentityModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          previewData={previewData}
          claimablePlaceholders={previewData.claimablePlaceholders || []}
          code={previewData.inviteCode}
          onJoinSuccess={() => {
            setIsClaimModalOpen(false);
            handleClose();
          }}
        />
      )}
    </>
  );
}
