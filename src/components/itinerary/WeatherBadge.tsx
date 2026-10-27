'use client';

import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, AlertTriangle } from 'lucide-react';
import type { WeatherCondition } from '@/lib/geo/weather';

interface WeatherBadgeProps {
  tempC?: number;
  condition?: WeatherCondition;
  labelVi?: string;
  isOutdoorWarning?: boolean;
  warningMessage?: string;
  className?: string;
}

export function WeatherBadge({
  tempC,
  condition = 'cloudy',
  labelVi,
  isOutdoorWarning = false,
  warningMessage,
  className = '',
}: WeatherBadgeProps) {
  if (tempC === undefined && !labelVi) {
    return null;
  }

  const renderIcon = () => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'rainy':
        return <CloudRain className="w-3.5 h-3.5 text-cerulean" />;
      case 'storm':
        return <CloudLightning className="w-3.5 h-3.5 text-red-500" />;
      case 'cloudy':
      default:
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs border transition-all ${
          isOutdoorWarning
            ? 'bg-functional-warning-bg text-functional-warning border-functional-warning/30'
            : 'bg-[#EEF6E4] text-[#2E7D5B] border-[#DDEBD0]'
        }`}
        title={warningMessage || labelVi}
      >
        {renderIcon()}
        {tempC !== undefined && <span>{tempC}°C</span>}
        {labelVi && (
          <>
            <span className="opacity-40">•</span>
            <span>{labelVi}</span>
          </>
        )}
      </div>

      {isOutdoorWarning && warningMessage && (
        <div className="flex items-start gap-1 text-[11px] font-medium text-functional-warning px-1 leading-tight">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-functional-warning" />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}
