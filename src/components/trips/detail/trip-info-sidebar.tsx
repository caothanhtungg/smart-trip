"use client";

import * as React from "react";
import { Info, Copy, Check, AlertCircle } from "lucide-react";
import { TripDetailData } from "@/types/trip";

interface TripInfoSidebarProps {
  trip: TripDetailData;
}

export function TripInfoSidebar({ trip }: TripInfoSidebarProps) {
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "success" | "error">("idle");

  const handleCopyCode = async () => {
    let success = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        const copyPromise = navigator.clipboard.writeText(trip.inviteCode);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 400)
        );
        await Promise.race([copyPromise, timeoutPromise]);
        success = true;
      }
    } catch {
      // Fallback if clipboard API throws error (e.g. unfocused)
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = trip.inviteCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const execSuccess = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (execSuccess) {
          success = true;
        }
      } catch {
        // execCommand failed
      }
    }

    if (success) {
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2500);
    } else {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2">
        <Info className="w-5 h-5 text-cerulean shrink-0" />
        <h3 className="text-base sm:text-lg font-bold text-yale-blue">
          Thông tin chuyến đi
        </h3>
      </div>

      {/* Mã mời chuyến đi (Invite Code) with 1-click Copy */}
      <div className="flex items-center justify-between p-3.5 bg-lime-cream/30 rounded-xl border border-light-green/60">
        <div className="flex flex-col">
          <span className="text-[11px] text-text-muted font-medium">
            Mã mời chuyến đi
          </span>
          <span className="text-base sm:text-lg font-bold font-mono tracking-widest text-yale-blue">
            {trip.inviteCode}
          </span>
        </div>

        <button
          id="sidebar-copy-btn"
          type="button"
          onClick={handleCopyCode}
          className="h-9 px-3 rounded-lg bg-white hover:bg-hover-row text-cerulean text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs border border-border-hairline transition-all cursor-pointer"
          aria-label="Sao chép mã mời"
        >
          {copyStatus === "success" ? (
            <>
              <Check className="w-3.5 h-3.5 text-functional-positive" />
              <span className="text-functional-positive font-bold">Đã chép!</span>
            </>
          ) : copyStatus === "error" ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-functional-negative" />
              <span className="text-functional-negative font-bold">Lỗi chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
