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
} from "lucide-react";
import { InviteLookupResult } from "@/lib/trips/invite-preview";
import { TripClaimIdentityModal } from "@/components/trips/invite/trip-claim-identity-modal";
import { Button } from "@/components/ui/button";

interface TripJoinViewProps {
  lookupResult: InviteLookupResult;
  code: string;
}

export function TripJoinView({ lookupResult, code }: TripJoinViewProps) {
  const router = useRouter();
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);
  const [altCode, setAltCode] = React.useState("");

  const handleAltCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (altCode.trim()) {
      router.push(`/join/${encodeURIComponent(altCode.trim().toUpperCase())}`);
    }
  };

  // 1. Error / Invalid / Not Found State
  if (lookupResult.status !== "VALID" || !lookupResult.previewData) {
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
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-yale-blue">
                Mã mời không khả dụng
              </h1>
              <p className="text-sm text-text-muted leading-relaxed">
                {lookupResult.errorMessage ||
                  `Mã mời « ${code} » không tồn tại, đã hết hạn hoặc không đúng định dạng.`}
              </p>
            </div>

            {/* Form to enter a different code */}
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

  const { previewData, claimablePlaceholders } = lookupResult;

  // 2. Valid Invitation Preview State
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
              <div className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 shrink-0 text-white/80" />
                <span>{previewData.destination}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 shrink-0 text-white/80" />
                <span>
                  {previewData.startDate} — {previewData.endDate}
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
                <div className="w-11 h-11 rounded-full bg-cerulean text-white font-bold flex items-center justify-center text-base shadow-xs">
                  {previewData.hostName.charAt(0).toUpperCase()}
                </div>
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
                <span>Đang lên kế hoạch</span>
              </div>

              {/* Avatars */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {previewData.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center gap-1 shrink-0 group relative"
                    title={member.name}
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-container-low border-2 border-surface-card text-yale-blue font-semibold text-xs flex items-center justify-center shadow-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-medium text-text-muted truncate max-w-[64px] text-center">
                      {member.name.split(" ").slice(-1)[0]}
                    </span>
                  </div>
                ))}
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
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsClaimModalOpen(true)}
                className="w-full h-12 bg-cerulean hover:bg-baltic-blue font-bold text-base rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <span>Tham gia chuyến đi</span>
                <ArrowRight className="w-5 h-5" />
              </Button>

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
      <TripClaimIdentityModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        previewData={previewData}
        claimablePlaceholders={claimablePlaceholders}
        onJoinSuccess={() => {
          setIsClaimModalOpen(false);
        }}
      />
    </div>
  );
}
