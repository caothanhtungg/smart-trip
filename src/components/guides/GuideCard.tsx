"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Wallet,
  Calendar,
  ArrowRight,
  Plus,
  Sparkles,
  Camera,
} from "lucide-react";
import { TravelGuide } from "@/lib/guides/guide-data";
import { buildTripCreationUrlFromGuide } from "@/lib/guides/guide-utils";
import { motion } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";

export interface GuideCardProps {
  guide: TravelGuide;
  onOpenDetail: (guide: TravelGuide) => void;
}

export function GuideCard({ guide, onOpenDetail }: GuideCardProps) {
  const tripUrl = buildTripCreationUrlFromGuide(guide);
  const photoCount = (guide.gallery?.length || 0) + 1;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={spring.pop}
      className="group flex flex-col bg-white dark:bg-[#141C2E] rounded-2xl border border-[#E9ECEF] dark:border-[#24314A] hover:border-[#B5E48C] dark:hover:border-[#38BDF8]/40 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => onOpenDetail(guide)}
      role="article"
      aria-label={guide.title}
    >
      {/* Cover Image Container */}
      <div className="relative w-full aspect-16/10 overflow-hidden bg-slate-100">
        <Image
          src={guide.coverPhoto.url}
          alt={guide.coverPhoto.caption}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Region & Duration Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/80 text-[#184E77] dark:text-white border border-transparent dark:border-white/20 shadow-xs backdrop-blur-xs">
            <MapPin className="w-3 h-3 text-[#1A759F]" />
            {guide.destination}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-xs">
            <Clock className="w-3 h-3 text-[#D9ED92]" />
            {guide.durationText}
          </span>
        </div>

        {/* Photo Count Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20 transition-colors">
          <Camera className="w-3 h-3 text-[#D9ED92]" />
          <span>{photoCount} ảnh</span>
        </div>

        {/* Best Season Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90 text-xs">
          <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md truncate">
            <Calendar className="w-3 h-3 text-[#D9ED92] shrink-0" />
            <span className="truncate">{guide.bestSeason}</span>
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-5">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-[#184E77] group-hover:text-[#1A759F] line-clamp-2 transition-colors">
          {guide.title}
        </h3>

        {/* Summary Description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {guide.summary}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {guide.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#184E77] dark:text-[#38BDF8] bg-[#F4F9EC] dark:bg-[#1B253B] border border-[#DDEBD0] dark:border-[#24314A] px-2 py-0.5 rounded-full"
            >
              <Sparkles className="w-2.5 h-2.5 text-[#52B69A]" />
              {tag}
            </span>
          ))}
          {guide.tags.length > 3 && (
            <span className="text-[11px] text-slate-400 self-center">
              +{guide.tags.length - 3}
            </span>
          )}
        </div>

        {/* Estimated Budget */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700">
          <Wallet className="w-4 h-4 text-[#52B69A] shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {guide.estimatedBudget}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(guide);
            }}
            className="text-xs font-semibold text-[#184E77] dark:text-[#38BDF8] group-hover:text-[#1A759F] dark:group-hover:text-[#7DD3FC] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Chi tiết & Bộ ảnh</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <Link
            href={tripUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D9ED92] dark:bg-[#1E3A2B] hover:bg-[#B5E48C] dark:hover:bg-[#2A4D3A] text-[#184E77] dark:text-[#4ADE80] border border-transparent dark:border-[#4ADE80]/30 shadow-xs transition-colors"
            title="Lập chuyến đi nhanh theo cẩm nang này"
          >
            <Plus className="w-3 h-3" />
            <span>Dùng mẫu</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
