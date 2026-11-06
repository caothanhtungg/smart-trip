"use client";

import * as React from "react";
import {
  X,
  Camera,
  MapPin,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Plus,
  Maximize2,
} from "lucide-react";
import {
  useCursorGallery,
  CursorGalleryIndicator,
} from "@/components/ui/cursor-gallery";
import { Lightbox } from "@/components/ui/lightbox";
import {
  getDestinationPhoto,
  getDestinationGallery,
  DestinationPhoto,
} from "@/lib/geo/destination-photos";
import {
  getDestinationReviews,
  getDestinationRatingSummary,
  addDestinationReview,
  markReviewHelpful,
  DestinationReview,
  DestinationRatingSummary,
} from "@/lib/reviews/destination-review-service";

export interface DestinationGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function DestinationGalleryModal({
  isOpen,
  onClose,
  placeName,
  address,
  latitude,
  longitude,
}: DestinationGalleryModalProps) {
  const primaryPhoto = React.useMemo(
    () => getDestinationPhoto(placeName, address),
    [placeName, address]
  );

  const gallery = React.useMemo(() => {
    const list = getDestinationGallery(placeName);
    if (list.length === 0) {
      return [primaryPhoto];
    }
    return list;
  }, [placeName, primaryPhoto]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  // Cursor Gallery Hook for smooth directional indicator on Hero Photo
  const handleNavigateHero = React.useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((prev) =>
        dir === -1
          ? prev > 0
            ? prev - 1
            : gallery.length - 1
          : prev < gallery.length - 1
          ? prev + 1
          : 0
      );
    },
    [gallery.length]
  );

  const {
    containerRef: heroContainerRef,
    cursorRef: heroCursorRef,
    cursorSide: heroCursorSide,
    handlePointerMove: handleHeroPointerMove,
    handlePointerLeave: handleHeroPointerLeave,
    handleClick: handleHeroClick,
  } = useCursorGallery({
    total: gallery.length,
    currentIndex: activeIndex,
    onNavigate: handleNavigateHero,
    isCircular: true,
  });

  // Reviews & Rating State
  const [reviews, setReviews] = React.useState<DestinationReview[]>([]);
  const [ratingSummary, setRatingSummary] = React.useState<DestinationRatingSummary>({
    averageRating: 5.0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Review Form State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [newRating, setNewRating] = React.useState(5);
  const [authorName, setAuthorName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [visitMonth, setVisitMonth] = React.useState("Tháng 3/2026");
  const [helpfulVoted, setHelpfulVoted] = React.useState<Set<string>>(new Set());

  // Reload reviews when placeName changes or modal opens
  const [prevPlaceKey, setPrevPlaceKey] = React.useState<string>("");
  const currentPlaceKey = isOpen && placeName ? (isOpen ? '1:' : '0:') + placeName : '';
  if (currentPlaceKey !== prevPlaceKey) {
    setPrevPlaceKey(currentPlaceKey);
    if (isOpen && placeName) {
      setActiveIndex(0);
      setIsLightboxOpen(false);
      setIsFormOpen(false);
      setReviews(getDestinationReviews(placeName));
      setRatingSummary(getDestinationRatingSummary(placeName));
    }
  }

  // Handle ESC key to close (only if Lightbox is not open)
  React.useEffect(() => {
    if (!isOpen || isLightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLightboxOpen, onClose]);

  if (!isOpen) return null;

  const currentPhoto: DestinationPhoto = gallery[activeIndex] || primaryPhoto;

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    const created = addDestinationReview(placeName, {
      authorName: authorName.trim() || "Du khách thân thiết",
      rating: newRating,
      comment: comment.trim(),
      visitMonth,
      verifiedTraveler: true,
    });

    const updatedRevs = [created, ...reviews];
    setReviews(updatedRevs);
    setRatingSummary(getDestinationRatingSummary(placeName));

    // Reset form
    setComment("");
    setIsFormOpen(false);
  }

  function handleHelpfulClick(reviewId: string) {
    if (helpfulVoted.has(reviewId)) return;
    markReviewHelpful(reviewId);
    setHelpfulVoted((prev) => new Set(prev).add(reviewId));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      )
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#E9ECEF] flex items-center justify-between bg-white/90 dark:bg-[#141C2E] border-b border-[#E9ECEF] dark:border-[#24314A] backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-[#E05833]/10 flex items-center justify-center text-[#E05833] shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="gallery-modal-title"
                  className="text-base sm:text-lg font-bold text-yale-blue truncate"
                >
                  {placeName}
                </h3>
                {ratingSummary.totalReviews > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{ratingSummary.averageRating}</span>
                    <span className="text-amber-500 font-normal">
                      ({ratingSummary.totalReviews})
                    </span>
                  </span>
                )}
              </div>
              {address && (
                <p className="text-xs text-text-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#1A759F]" />
                  <span>{address}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bộ sưu tập ảnh"
            className="w-9 h-9 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Hero Photo Container with Directional Cursor Indicator */}
          <div
            ref={heroContainerRef}
            onPointerMove={handleHeroPointerMove}
            onPointerLeave={handleHeroPointerLeave}
            onClick={handleHeroClick}
            className="relative w-full aspect-16/10 sm:aspect-16/9 bg-slate-900 overflow-hidden group md:cursor-none select-none"
          >
            {/* Floating Directional Cursor Badge (Desktop) */}
            <CursorGalleryIndicator
              cursorRef={heroCursorRef}
              cursorSide={heroCursorSide}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 pointer-events-none"
              loading="eager"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

            {/* Prev/Next Navigation Controls for multi-photo gallery (Touch / Mobile) */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
                  }}
                  aria-label="Ảnh trước"
                  className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-colors z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
                  }}
                  aria-label="Ảnh kế tiếp"
                  className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-colors z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Fullscreen Enlarge Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              aria-label="Xem toàn màn hình"
              title="Xem toàn màn hình"
              className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/50 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md flex items-center gap-1.5 text-xs font-medium transition-all z-20 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Toàn màn hình</span>
            </button>

            {/* Photo Caption & Photographer Attribution Overlay */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <p className="text-sm sm:text-base font-semibold drop-shadow-md leading-tight">
                {currentPhoto.caption}
              </p>
              <p className="text-[11px] text-white/80 mt-1 flex items-center gap-1.5">
                <span>Nhiếp ảnh: {currentPhoto.photographer}</span>
                {currentPhoto.tags.length > 0 && (
                  <span className="hidden sm:inline">
                    • {currentPhoto.tags.slice(0, 3).join(", ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Thumbnail Gallery Strip (if > 1) */}
          {gallery.length > 1 && (
            <div className="p-3 bg-[#F8F9FA] border-b border-[#E9ECEF] flex items-center gap-2 overflow-x-auto">
              {gallery.map((photo, idx) => (
                <button
                  key={photo.url}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeIndex
                      ? "border-[#E05833] scale-105 shadow-sm"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Information & Travel Tips Section */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Landmark Description */}
            {primaryPhoto.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Giới thiệu danh lam thắng cảnh
                </h4>
                <p className="text-sm text-text-body leading-relaxed">
                  {primaryPhoto.description}
                </p>
              </div>
            )}

            {/* Travel Tip */}
            {primaryPhoto.recommendedTip && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#D9ED92]/20 to-[#99D98C]/20 border border-[#B5E48C]/40 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#52B69A]/20 flex items-center justify-center text-[#184E77] shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-[#184E77]" />
                </div>
                <div className="text-xs text-yale-blue">
                  <span className="font-bold block mb-0.5">Mẹo tham quan từ chuyên gia:</span>
                  <p className="leading-relaxed text-text-body">{primaryPhoto.recommendedTip}</p>
                </div>
              </div>
            )}

            {/* Tags & Coordinates */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E9ECEF] text-xs text-text-muted">
              <div className="flex flex-wrap gap-1.5">
                {currentPhoto.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-[#F1F3F5] text-text-body text-[11px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {latitude != null && longitude != null && (
                <div className="font-mono text-[11px] text-text-muted">
                  GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
              )}
            </div>

            {/* COMMUNITY REVIEWS & STAR RATINGS SECTION */}
            <div className="pt-4 border-t border-[#E9ECEF] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-yale-blue uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#1A759F]" />
                    Đánh giá & Trải nghiệm cộng đồng
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Chia sẻ thực tế từ các đoàn du lịch đã ghé thăm
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#184E77] text-white hover:bg-[#1A759F] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFormOpen ? "Hủy viết" : "Viết đánh giá"}</span>
                </button>
              </div>

              {/* Rating Summary Card */}
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF] flex flex-col sm:flex-row items-center gap-6">
                {/* Left: Overall Score */}
                <div className="text-center sm:border-r sm:border-slate-200 sm:pr-6 shrink-0">
                  <div className="text-3xl font-extrabold text-yale-blue">
                    {ratingSummary.averageRating}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(ratingSummary.averageRating)
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {ratingSummary.totalReviews} đánh giá
                  </div>
                </div>

                {/* Right: Breakdown bars */}
                <div className="flex-1 w-full space-y-1.5 text-xs text-slate-600">
                  {[5, 4, 3, 2, 1].map((starLevel) => {
                    const count = ratingSummary.breakdown[starLevel as 1 | 2 | 3 | 4 | 5] || 0;
                    const pct =
                      ratingSummary.totalReviews > 0
                        ? Math.round((count / ratingSummary.totalReviews) * 100)
                        : 0;
                    return (
                      <div key={starLevel} className="flex items-center gap-2">
                        <span className="w-8 flex items-center gap-1 font-mono text-[11px]">
                          {starLevel} <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        </span>
                        <div className="flex-1 bg-slate-200 dark:bg-[#1E2A42] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#52B69A] h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[10px] text-text-muted">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Submission Form (Expandable) */}
              {isFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 rounded-2xl bg-white border border-[#99D98C] shadow-sm space-y-3 animate-in fade-in duration-200"
                >
                  <h5 className="text-xs font-bold uppercase tracking-wider text-yale-blue">
                    Gửi trải nghiệm của bạn về {placeName}
                  </h5>

                  {/* Star Picker */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">Đánh giá điểm:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newRating
                                ? "fill-amber-400 text-amber-500"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-600 font-mono">
                      {newRating} / 5 sao
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Họ và tên của bạn..."
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#184E77]"
                    />
                    <input
                      type="text"
                      placeholder="Thời gian ghé thăm (VD: Tháng 03/2026)"
                      value={visitMonth}
                      onChange={(e) => setVisitMonth(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#184E77]"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Chia sẻ kinh nghiệm, góc chụp đẹp, lưu ý ăn uống hoặc giá cả..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#184E77] resize-none"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#184E77] hover:bg-[#1A759F] text-white disabled:opacity-50 shadow-xs"
                    >
                      Đăng đánh giá
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.map((rev) => {
                  const isHelpful = helpfulVoted.has(rev.id);
                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#184E77]/10 dark:bg-[#1E2A42] text-[#184E77] dark:text-[#38BDF8] border border-transparent dark:border-[#2D3E60] flex items-center justify-center font-bold text-xs shrink-0">
                            {rev.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {rev.authorName}
                              </span>
                              {rev.verifiedTraveler && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-[#52B69A] font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Đã trải nghiệm
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-muted">
                              {rev.visitMonth}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rev.rating
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        {rev.comment}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleHelpfulClick(rev.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors px-2 py-0.5 rounded-md ${
                            isHelpful
                              ? "bg-emerald-50 text-[#52B69A]"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Hữu ích ({rev.helpfulCount})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E9ECEF] bg-[#F8F9FA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#141C2E] hover:bg-slate-100 dark:hover:bg-[#1E2A42] border border-slate-200 dark:border-[#2D3E60] transition-colors cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Standalone Fullscreen Lightbox Modal */}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={gallery.map((p) => ({
          url: p.url,
          caption: p.caption,
          photographer: p.photographer,
          tags: p.tags,
        }))}
        initialIndex={activeIndex}
        title={placeName}
      />
    </div>
  );
}
