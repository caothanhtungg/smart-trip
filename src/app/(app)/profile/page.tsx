import * as React from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "Hồ sơ của tôi | Smart Trip",
  description: "Quản lý thông tin cá nhân và phương thức nhận tiền chia sẻ chi phí VietQR trong các chuyến đi",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-12 animate-pulse flex flex-col gap-8">
          <div className="h-10 bg-hover-row/60 rounded-xl w-1/3" />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-3 h-64 bg-hover-row/60 rounded-2xl" />
            <div className="col-span-12 lg:col-span-9 h-96 bg-hover-row/60 rounded-2xl" />
          </div>
        </div>
      }
    >
      <ProfileView />
    </Suspense>
  );
}
