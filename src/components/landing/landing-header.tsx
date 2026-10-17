"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  onStartClick: () => void;
  onLoginClick: () => void;
}

export function LandingHeader({ onStartClick, onLoginClick }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)]">
      <div className="h-[72px] max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          >
            <div className="h-9 w-9 rounded-full bg-cerulean/10 flex items-center justify-center text-cerulean">
              <MapPin className="w-5 h-5 text-cerulean stroke-[2.2]" />
            </div>
            <span className="text-xl font-bold text-yale-blue tracking-tight">
              Smart Trip
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#tinh-nang"
              className="text-sm font-medium text-text-muted hover:text-cerulean py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-lg px-2"
            >
              Tính năng
            </a>
            <a
              href="#cach-hoat-dong"
              className="text-sm font-medium text-text-muted hover:text-cerulean py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-lg px-2"
            >
              Cách hoạt động
            </a>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLoginClick}
            className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-yale-blue px-3.5 py-2 rounded-xl hover:text-cerulean hover:bg-hover-row transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
          >
            Đăng nhập
          </button>
          <Button
            variant="primary"
            size="md"
            onClick={onStartClick}
            className="h-11 px-5 text-sm sm:text-base font-semibold shadow-[0_4px_16px_rgba(24,78,119,0.12)]"
          >
            Bắt đầu miễn phí
          </Button>

          {/* Mobile menu hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-yale-blue hover:bg-hover-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border-hairline px-6 py-4 flex flex-col gap-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <a
            href="#tinh-nang"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-yale-blue py-2 border-b border-border-hairline"
          >
            Tính năng
          </a>
          <a
            href="#cach-hoat-dong"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-yale-blue py-2 border-b border-border-hairline"
          >
            Cách hoạt động
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onLoginClick();
            }}
            className="text-left text-base font-semibold text-cerulean py-2"
          >
            Đăng nhập tài khoản
          </button>
        </div>
      )}
    </header>
  );
}
