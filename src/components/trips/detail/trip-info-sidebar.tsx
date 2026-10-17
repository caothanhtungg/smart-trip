"use client";

import * as React from "react";
import { Info, CloudSun, Copy, Check, AlertCircle, MapPin } from "lucide-react";
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

      {/* 1. Weather Mini Block (Minh họa tĩnh) */}
      <div className="flex items-center justify-between p-3.5 bg-bg-canvas/80 rounded-xl border border-border-hairline/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cerulean/10 flex items-center justify-center text-cerulean shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-yale-blue">
              Thời tiết {trip.weatherInfo?.locationName || trip.destination}
            </span>
            <span className="text-[11px] text-text-muted">
              {trip.weatherInfo?.description || "Dữ liệu minh họa tĩnh"}
            </span>
          </div>
        </div>
        <span className="text-lg sm:text-xl font-bold text-yale-blue tabular-nums">
          {trip.weatherInfo?.temperature || "22°C"}
        </span>
      </div>

      {/* 2. Mã mời chuyến đi (Invite Code) with 1-click Copy */}
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

      {/* 3. Destination Map Snapshot (Minh họa tĩnh) */}
      <div className="w-full h-36 rounded-xl overflow-hidden relative border border-border-hairline/80 shadow-inner bg-surface-container">
        {/* Decorative Map Pattern Background */}
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(135deg, #e0f0ff 0%, #d4e4f4 50%, #ebf5ff 100%)",
          }}
        />

        {/* Map grid lines overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#184E77 1px, transparent 1px), radial-gradient(#184E77 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
          aria-hidden="true"
        />

        {/* Bottom Label overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-yale-blue/80 via-transparent to-transparent flex items-end p-3">
          <span className="text-white text-xs font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-lime-cream shrink-0" />
            <span className="truncate">Trung tâm {trip.destination}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
