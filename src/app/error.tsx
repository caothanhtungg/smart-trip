"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Ghi nhận lỗi cho việc theo dõi sự cố
    console.error("Ứng dụng gặp lỗi không mong muốn:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 border border-border-hairline shadow-sm">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-functional-warning-bg flex items-center justify-center text-functional-warning">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-yale-blue mb-2">
          Đã xảy ra lỗi không mong muốn
        </h1>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          Hệ thống gặp sự cố trong quá trình xử lý yêu cầu của bạn. Bạn có thể thử
          tải lại hoặc quay về trang danh sách chuyến đi.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="w-full sm:w-auto"
          >
            Thử lại
          </Button>
          <Link href="/trips" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Về danh sách chuyến đi
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
