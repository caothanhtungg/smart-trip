"use client";

import * as React from "react";
import { Link2, ArrowLeftRight, Check, X } from "lucide-react";
import { MemberClaim, TripMember } from "@/types/trip";
import { Button } from "@/components/ui/button";

interface TripPendingClaimsBannerProps {
  claims: MemberClaim[];
  members: TripMember[];
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string) => void;
}

export function TripPendingClaimsBanner({
  claims,
  members,
  onApproveClaim,
  onRejectClaim,
}: TripPendingClaimsBannerProps) {
  const pendingClaims = claims.filter((c) => c.status === "PENDING");

  if (pendingClaims.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {pendingClaims.map((claim) => {
        const placeholder = members.find((m) => m.id === claim.placeholderMemberId);
        const placeholderName = placeholder?.name || claim.placeholderMemberName;
        const spentAmount = placeholder?.spentAmount || 0;

        return (
          <section
            key={claim.id}
            className="w-full bg-gradient-to-r from-surface-card via-[#F9FCF5] to-surface-card rounded-2xl p-5 sm:p-6 shadow-[0_6px_22px_rgba(24,78,119,0.07)] relative overflow-hidden border-[1.5px] border-[#99D98C]"
          >
            {/* Subtle glow backdrop */}
            <div
              className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-lime-cream/35 blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col gap-3 max-w-2xl">
                {/* Status indicator badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-functional-warning-bg text-functional-warning border border-functional-warning/20">
                    <span className="w-2 h-2 rounded-full bg-functional-warning animate-ping" />
                    <span>Yêu cầu đang chờ duyệt</span>
                  </span>
                  <span className="text-text-muted text-xs">
                    Gửi lúc {new Date(claim.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {/* Headline & Narrative */}
                <h3 className="text-lg sm:text-xl font-bold text-yale-blue flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-tropical-teal shrink-0" />
                  <span>Yêu cầu liên kết tài khoản</span>
                </h3>

                <p className="text-sm text-text-body leading-relaxed">
                  <strong className="text-yale-blue font-semibold">{claim.userName}</strong> (
                  <span className="text-cerulean font-medium">{claim.userEmail}</span>) đã tham gia
                  qua mã mời và đề nghị nhận diện là thành viên{" "}
                  <strong className="text-yale-blue font-semibold">« {placeholderName} »</strong> để
                  đồng bộ toàn bộ lịch sử chi tiêu và công nợ.
                </p>

                {/* Mapping Comparison Pill */}
                <div className="mt-1 p-3 bg-white/95 rounded-xl shadow-xs border border-divider-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Real Claimant */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-mint-green text-yale-blue font-bold flex items-center justify-center shrink-0 shadow-xs">
                      <span>{claim.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-yale-blue truncate">
                        {claim.userName} (Đã có tài khoản)
                      </span>
                      <span className="text-xs text-text-muted truncate">{claim.userEmail}</span>
                    </div>
                  </div>

                  {/* Sync Arrow */}
                  <div className="flex items-center justify-center text-ocean-mist shrink-0">
                    <div className="w-8 h-8 rounded-full bg-emerald/15 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-tropical-teal" />
                    </div>
                  </div>

                  {/* Placeholder Member */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low text-yale-blue font-bold flex items-center justify-center shrink-0 border border-dashed border-ocean-mist">
                      <span>{placeholderName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-yale-blue">{placeholderName}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                          Chưa có tài khoản
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">
                        Đã chi: {spentAmount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-2.5 shrink-0">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRejectClaim(claim.id)}
                    className="h-11 px-4 bg-white hover:bg-red-50 text-functional-negative border-functional-negative/30 font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs flex-1 sm:flex-initial"
                  >
                    <X className="w-4 h-4" />
                    <span>Từ chối</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => onApproveClaim(claim.id)}
                    className="h-11 px-5 bg-cerulean hover:bg-baltic-blue text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg flex-1 sm:flex-initial"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Duyệt liên kết</span>
                  </Button>
                </div>

                <p className="text-xs text-text-muted text-left lg:text-right max-w-xs leading-normal">
                  Sau khi duyệt, {claim.userName} sẽ chính thức quản lý các khoản chi tiêu và công nợ
                  của {placeholderName}.
                </p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
