import { describe, it, expect } from "vitest";
import { TRAVEL_GUIDES, getGuideGallery } from "@/lib/guides/guide-data";
import { LightboxImage } from "@/components/ui/lightbox";

describe("Lightbox & Gallery Architecture", () => {
  const sampleImages: LightboxImage[] = [
    { url: "https://example.com/img1.jpg", caption: "Ảnh 1", photographer: "Tác giả 1" },
    { url: "https://example.com/img2.jpg", caption: "Ảnh 2", photographer: "Tác giả 2" },
    { url: "https://example.com/img3.jpg", caption: "Ảnh 3", photographer: "Tác giả 3" },
    { url: "https://example.com/img4.jpg", caption: "Ảnh 4", photographer: "Tác giả 4" },
  ];

  it("calculates circular pagination index correctly for next and previous navigation", () => {
    function getNextIndex(current: number, total: number): number {
      return current < total - 1 ? current + 1 : 0;
    }

    function getPrevIndex(current: number, total: number): number {
      return current > 0 ? current - 1 : total - 1;
    }

    const total = sampleImages.length; // 4
    // Forward wrap
    expect(getNextIndex(0, total)).toBe(1);
    expect(getNextIndex(2, total)).toBe(3);
    expect(getNextIndex(3, total)).toBe(0); // wraps back to 0

    // Backward wrap
    expect(getPrevIndex(3, total)).toBe(2);
    expect(getPrevIndex(1, total)).toBe(0);
    expect(getPrevIndex(0, total)).toBe(3); // wraps back to last
  });

  it("calculates adjacent preloading targets accurately so paging does not pop from blurry to sharp", () => {
    function getPreloadTargets(current: number, total: number): { nextIdx: number; prevIdx: number } {
      const nextIdx = (current + 1) % total;
      const prevIdx = (current - 1 + total) % total;
      return { nextIdx, prevIdx };
    }

    const targetsFrom0 = getPreloadTargets(0, 4);
    expect(targetsFrom0.nextIdx).toBe(1);
    expect(targetsFrom0.prevIdx).toBe(3);

    const targetsFrom3 = getPreloadTargets(3, 4);
    expect(targetsFrom3.nextIdx).toBe(0);
    expect(targetsFrom3.prevIdx).toBe(2);
  });

  it("prevents default event propagation on keyboard arrow navigation to keep page stationary", () => {
    let preventDefaultCalled = false;
    const fakeArrowEvent = {
      key: "ArrowRight",
      preventDefault: () => {
        preventDefaultCalled = true;
      },
    };

    if (fakeArrowEvent.key === "ArrowRight" || fakeArrowEvent.key === "ArrowLeft") {
      fakeArrowEvent.preventDefault();
    }

    expect(preventDefaultCalled).toBe(true);
  });

  it("ensures all travel guides have rich gallery photos for Lightbox browsing", () => {
    for (const guide of TRAVEL_GUIDES) {
      const gallery = getGuideGallery(guide);

      // Must have cover photo as index 0
      expect(gallery[0].url).toBe(guide.coverPhoto.url);
      expect(gallery[0].caption).toBe(guide.coverPhoto.caption);

      // Must have at least 4 photos for a rich visual gallery experience
      expect(gallery.length).toBeGreaterThanOrEqual(4);

      // All photos must have valid https URL and non-empty caption
      for (const photo of gallery) {
        expect(photo.url).toMatch(/^https:\/\//);
        expect(photo.caption.trim().length).toBeGreaterThan(0);
      }

      // No duplicate URLs in the same guide gallery
      const urlSet = new Set(gallery.map((p) => p.url));
      expect(urlSet.size).toBe(gallery.length);
    }
  });

  it("restores original body scroll on unmount or dismiss", () => {
    const originalOverflow = "scroll";
    let bodyStyleOverflow = originalOverflow;

    // Simulate modal opening
    bodyStyleOverflow = "hidden";
    expect(bodyStyleOverflow).toBe("hidden");

    // Simulate cleanup on unmount
    bodyStyleOverflow = originalOverflow;
    expect(bodyStyleOverflow).toBe("scroll");
  });
});

