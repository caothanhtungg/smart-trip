'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, AlertTriangle } from 'lucide-react';
import { getWeatherForecast, WeatherCondition, WeatherInfo } from '@/lib/geo/weather';

interface WeatherBadgeProps {
  lat?: number | null;
  lng?: number | null;
  dateStr?: string;
  tempC?: number;
  condition?: WeatherCondition;
  labelVi?: string;
  isOutdoorWarning?: boolean;
  warningMessage?: string;
  className?: string;
}

const weatherCache = new Map<string, WeatherInfo>();

export function WeatherBadge({
  lat,
  lng,
  dateStr,
  tempC: propTempC,
  condition: propCondition = 'cloudy',
  labelVi: propLabelVi,
  isOutdoorWarning: propOutdoorWarning = false,
  warningMessage: propWarningMessage,
  className = '',
}: WeatherBadgeProps) {
  const [weather, setWeather] = useState<WeatherInfo | null>(() => {
    if (propTempC !== undefined || propLabelVi) {
      return {
        tempC: propTempC ?? 25,
        condition: propCondition,
        labelVi: propLabelVi || 'Trời nhiều mây',
        rainProb: 0,
        isOutdoorWarning: propOutdoorWarning,
        warningMessage: propWarningMessage,
      };
    }
    return null;
  });

  useEffect(() => {
    if (propTempC !== undefined || propLabelVi) {
      setWeather({
        tempC: propTempC ?? 25,
        condition: propCondition,
        labelVi: propLabelVi || 'Trời nhiều mây',
        rainProb: 0,
        isOutdoorWarning: propOutdoorWarning,
        warningMessage: propWarningMessage,
      });
      return;
    }

    if (lat == null || lng == null || !dateStr) return;

    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}_${dateStr.slice(0, 10)}`;
    if (weatherCache.has(cacheKey)) {
      setWeather(weatherCache.get(cacheKey)!);
      return;
    }

    let isMounted = true;
    getWeatherForecast(lat, lng, dateStr)
      .then((data) => {
        if (isMounted && data) {
          weatherCache.set(cacheKey, data);
          setWeather(data);
        }
      })
      .catch(() => {
        // Im silent on error
      });

    return () => {
      isMounted = false;
    };
  }, [lat, lng, dateStr, propTempC, propCondition, propLabelVi, propOutdoorWarning, propWarningMessage]);

  if (!weather) {
    return null;
  }

  const renderIcon = () => {
    switch (weather.condition) {
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-2xs border transition-all ${
          weather.isOutdoorWarning
            ? 'bg-functional-warning-bg text-functional-warning border-functional-warning/30'
            : 'bg-[#EEF6E4] text-[#2E7D5B] border-[#DDEBD0]'
        }`}
        title={weather.warningMessage || weather.labelVi}
      >
        {renderIcon()}
        {weather.tempC !== undefined && <span>{weather.tempC}°C</span>}
        {weather.labelVi && (
          <>
            <span className="opacity-40">•</span>
            <span>{weather.labelVi}</span>
          </>
        )}
      </div>

      {weather.isOutdoorWarning && weather.warningMessage && (
        <div className="flex items-start gap-1 text-[11px] font-medium text-functional-warning px-1 leading-tight">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-functional-warning" />
          <span>{weather.warningMessage}</span>
        </div>
      )}
    </div>
  );
}
