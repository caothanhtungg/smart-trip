import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { CreateTripForm } from "@/components/trips/create-trip-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tạo chuyến đi mới | Smart Trip",
  description: "Lên kế hoạch và thiết lập ngân sách cho chuyến đi mới của bạn",
};

export default function CreateTripPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-bg-canvas font-sans antialiased text-text-body">
      {/* Fixed Navigation Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main className="w-full pt-[72px] flex-1">
        <div className="w-full max-w-[640px] mx-auto px-4 py-6 sm:py-10">
          {/* Top Back Navigation */}
          <div className="mb-5 sm:mb-6">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-cerulean transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-inherit" />
              <span>Quay lại danh sách chuyến đi</span>
            </Link>
          </div>

          {/* Form Card with Suspense boundary */}
          <React.Suspense
            fallback={
              <div className="w-full min-h-[400px] rounded-3xl bg-white border border-border-hairline p-8 animate-pulse flex items-center justify-center text-text-muted text-sm font-medium">
                Đang tải biểu mẫu...
              </div>
            }
          >
            <CreateTripForm />
          </React.Suspense>
        </div>
      </main>

      {/* Application Footer */}
      <AppFooter />
    </div>
  );
}
