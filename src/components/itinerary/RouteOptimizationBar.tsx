'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Compass, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface RouteOptimizationBarProps {
  tripId: string;
  dayDate: string;
  itemCount: number;
  onOptimized: () => Promise<void>;
  isLocked?: boolean;
}

export function RouteOptimizationBar({
  tripId,
  dayDate,
  itemCount,
  onOptimized,
  isLocked = false,
}: RouteOptimizationBarProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const { toast } = useToast();

  const handleOptimizeNow = async () => {
    if (itemCount <= 1 || isLocked || isOptimizing) return;

    setIsOptimizing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayDate }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Không thể tối ưu lộ trình');
      }

      await onOptimized();
      toast(
        `Tối ưu lộ trình thành công! Đã tự động sắp xếp lại ${itemCount} địa điểm theo tuyến đường ngắn nhất.`,
        'success'
      );
    } catch (err: any) {
      toast(err.message || 'Lỗi khi tối ưu lộ trình, vui lòng thử lại sau', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border-hairline shadow-[0_4px_20px_rgba(24,78,119,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(24,78,119,0.07)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-lime-cream flex items-center justify-center text-yale-blue shrink-0 shadow-xs">
          <Compass className="w-5 h-5 text-cerulean" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-yale-blue">Tối ưu lộ trình đường đi</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-cerulean text-[10px] font-bold">
              TSP 2-Opt
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {itemCount > 1
              ? `Tự động sắp xếp ${itemCount} điểm trong ngày theo đường ngắn nhất`
              : 'Thêm từ 2 địa điểm trở lên để hệ thống tính toán tuyến đường'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 self-end sm:self-auto">
        <label className="flex items-center gap-2 text-xs font-semibold text-yale-blue cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoOptimize}
            onChange={(e) => setAutoOptimize(e.target.checked)}
            className="w-4 h-4 rounded-md text-cerulean border-border-hairline focus:ring-cerulean cursor-pointer"
          />
          <span>Tự động tối ưu</span>
        </label>

        <button
          type="button"
          disabled={itemCount <= 1 || isLocked || isOptimizing}
          onClick={handleOptimizeNow}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
            itemCount <= 1 || isLocked
              ? 'bg-hover-row text-text-muted cursor-not-allowed opacity-60'
              : 'bg-cerulean hover:bg-baltic-blue text-white shadow-[0_4px_16px_rgba(26,117,159,0.25)] hover:shadow-[0_6px_20px_rgba(26,117,159,0.35)] active:scale-95'
          }`}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tính...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-lime-cream" />
              <span>Tối ưu ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
