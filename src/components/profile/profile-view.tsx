"use client";

import * as React from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import {
  Shield,
  Smartphone,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { ProfileSidebar } from "./profile-sidebar";
import { ProfilePersonalSection } from "./profile-personal-section";
import { ProfileBankSection } from "./profile-bank-section";
import { useToast } from "@/components/ui/toast";

const profileContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const profileItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function ProfileView() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = React.useState("thong-tin-ca-nhan");

  // Demo toggles
  const [notifySms, setNotifySms] = React.useState(true);
  const [enable2Fa, setEnable2Fa] = React.useState(true);

  const handleSelectSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.div
      variants={profileContainerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10"
    >
      {/* Top Back Navigation to Trips */}
      <motion.div variants={profileItemVariants} className="mb-4">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-cerulean transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại Chuyến đi của tôi</span>
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={profileItemVariants} className="flex flex-col gap-2 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-yale-blue tracking-tight">
              Hồ sơ của tôi
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Quản lý thông tin cá nhân và phương thức nhận tiền chia sẻ chi phí trong các chuyến đi
            </p>
          </div>

          {/* Live status pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-surface-card rounded-full border border-divider-border shadow-xs self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
            <span className="text-xs font-semibold text-yale-blue">
              Tài khoản nhận tiền: Đã đồng bộ VietQR
            </span>
          </div>
        </div>
      </motion.div>

      {/* 12-Column Responsive Workspace Layout */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT SIDE NAVIGATION (3 columns) */}
        <ProfileSidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />

        {/* RIGHT MAIN CONTENT (9 columns) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 sm:gap-8">
          {/* SECTION 1: Personal Information */}
          <motion.div variants={profileItemVariants}>
            <ProfilePersonalSection />
          </motion.div>

          {/* SECTION 2: Receiving Bank Account & VietQR */}
          <motion.div variants={profileItemVariants}>
            <ProfileBankSection />
          </motion.div>

          {/* SECTION 3: Notification & Security Quick Overview */}
          <motion.section
            variants={profileItemVariants}
            className="bg-surface-card rounded-[20px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-6"
            id="thong-bao-bao-mat"
          >
            <div className="flex items-center justify-between pb-4 border-b border-divider-border">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-cerulean" />
                <div>
                  <h2 className="text-xl font-bold text-yale-blue">
                    Thông báo &amp; Bảo mật
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Kiểm soát cách bạn nhận nhắc nợ và cảnh báo chi tiêu
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle item 1: SMS / Zalo */}
              <div className="p-4 rounded-xl bg-hover-row/40 border border-divider-border/60 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-cerulean mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-yale-blue">
                      Thông báo qua Zalo / SMS
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Nhận link mã QR khi có khoản cần quyết toán
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifySms(!notifySms);
                    toast(`Đã ${!notifySms ? "bật" : "tắt"} thông báo qua Zalo/SMS.`, "info");
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    notifySms ? "bg-cerulean" : "bg-border-hairline"
                  }`}
                  aria-label="Bật tắt thông báo qua Zalo/SMS"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      notifySms ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle item 2: 2FA */}
              <div className="p-4 rounded-xl bg-hover-row/40 border border-divider-border/60 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-cerulean mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-yale-blue">
                      Xác thực hai yếu tố (2FA)
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Bảo vệ tài khoản khi đăng nhập thiết bị mới
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEnable2Fa(!enable2Fa);
                    toast(`Đã ${!enable2Fa ? "kích hoạt" : "hủy"} xác thực hai yếu tố.`, "info");
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    enable2Fa ? "bg-cerulean" : "bg-border-hairline"
                  }`}
                  aria-label="Bật tắt xác thực 2 yếu tố"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      enable2Fa ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
