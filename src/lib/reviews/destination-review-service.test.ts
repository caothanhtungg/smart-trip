import { describe, it, expect, beforeEach } from "vitest";
import {
  getDestinationReviews,
  getDestinationRatingSummary,
  addDestinationReview,
  markReviewHelpful,
  resetReviewsForTesting,
} from "./destination-review-service";

describe("Destination Review Service", () => {
  beforeEach(() => {
    resetReviewsForTesting();
  });

  it("returns curated reviews for popular destinations", () => {
    const reviews = getDestinationReviews("ninh-binh");
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].rating).toBeGreaterThanOrEqual(1);
    expect(reviews[0].rating).toBeLessThanOrEqual(5);
    expect(reviews[0].authorName).toBeDefined();
    expect(reviews[0].comment).toBeDefined();

    const sonDoongReviews = getDestinationReviews("hang-son-doong");
    expect(sonDoongReviews.length).toBeGreaterThan(0);

    const haLongReviews = getDestinationReviews("ha-long");
    expect(haLongReviews.length).toBeGreaterThan(0);

    const saPaReviews = getDestinationReviews("sa-pa");
    expect(saPaReviews.length).toBeGreaterThan(0);

    const haGiangReviews = getDestinationReviews("ha-giang");
    expect(haGiangReviews.length).toBeGreaterThan(0);

    const mySonReviews = getDestinationReviews("my-son");
    expect(mySonReviews.length).toBeGreaterThan(0);

    const hueReviews = getDestinationReviews("hue");
    expect(hueReviews.length).toBeGreaterThan(0);

    const thienMuReviews = getDestinationReviews("chua-thien-mu");
    expect(thienMuReviews.length).toBeGreaterThan(0);

    const hoiAnReviews = getDestinationReviews("hoi-an");
    expect(hoiAnReviews.length).toBeGreaterThan(0);

    const catBaReviews = getDestinationReviews("cat-ba");
    expect(catBaReviews.length).toBeGreaterThan(0);

    const banGiocReviews = getDestinationReviews("thac-ban-gioc");
    expect(banGiocReviews.length).toBeGreaterThan(0);

    const phuQuocReviews = getDestinationReviews("phu-quoc");
    expect(phuQuocReviews.length).toBeGreaterThan(0);

    const daLatReviews = getDestinationReviews("da-lat");
    expect(daLatReviews.length).toBeGreaterThan(0);

    const conDaoReviews = getDestinationReviews("con-dao");
    expect(conDaoReviews.length).toBeGreaterThan(0);

    const muiNeReviews = getDestinationReviews("mui-ne");
    expect(muiNeReviews.length).toBeGreaterThan(0);

    const maiChauReviews = getDestinationReviews("mai-chau");
    expect(maiChauReviews.length).toBeGreaterThan(0);

    const baDenReviews = getDestinationReviews("nui-ba-den");
    expect(baDenReviews.length).toBeGreaterThan(0);

    const baNaReviews = getDestinationReviews("ba-na-hills");
    expect(baNaReviews.length).toBeGreaterThan(0);

    const tamDaoReviews = getDestinationReviews("tam-dao");
    expect(tamDaoReviews.length).toBeGreaterThan(0);

    const baViReviews = getDestinationReviews("ba-vi");
    expect(baViReviews.length).toBeGreaterThan(0);

    const hamLonReviews = getDestinationReviews("ham-lon");
    expect(hamLonReviews.length).toBeGreaterThan(0);

    const samSonReviews = getDestinationReviews("sam-son");
    expect(samSonReviews.length).toBeGreaterThan(0);

    const tamChucReviews = getDestinationReviews("tam-chuc");
    expect(tamChucReviews.length).toBeGreaterThan(0);

    const batTrangReviews = getDestinationReviews("bat-trang");
    expect(batTrangReviews.length).toBeGreaterThan(0);

    const eoGioReviews = getDestinationReviews("eo-gio");
    expect(eoGioReviews.length).toBeGreaterThan(0);

    const nhaTrangReviews = getDestinationReviews("nha-trang");
    expect(nhaTrangReviews.length).toBeGreaterThan(0);
  });

  it("calculates accurate rating summary and breakdown", () => {
    const summary = getDestinationRatingSummary("ninh-binh");
    expect(summary.totalReviews).toBeGreaterThan(0);
    expect(summary.averageRating).toBeGreaterThanOrEqual(1);
    expect(summary.averageRating).toBeLessThanOrEqual(5);
    expect(summary.breakdown[5] + summary.breakdown[4] + summary.breakdown[3] + summary.breakdown[2] + summary.breakdown[1]).toBe(summary.totalReviews);
  });

  it("adds a new user review and updates the rating summary immediately", () => {
    const prevSummary = getDestinationRatingSummary("ninh-binh");
    const newReview = addDestinationReview("ninh-binh", {
      authorName: "Minh Anh",
      rating: 5,
      comment: "Quần thể danh thắng Tràng An tuyệt đẹp, dịch vụ đò chu đáo!",
      visitMonth: "Tháng 3/2026",
      verifiedTraveler: true,
    });

    expect(newReview.id).toBeDefined();
    expect(newReview.helpfulCount).toBe(0);

    const updatedReviews = getDestinationReviews("ninh-binh");
    expect(updatedReviews.some((r) => r.id === newReview.id)).toBe(true);

    const updatedSummary = getDestinationRatingSummary("ninh-binh");
    expect(updatedSummary.totalReviews).toBe(prevSummary.totalReviews + 1);
  });

  it("increments helpful count when a user marks a review as helpful", () => {
    const reviews = getDestinationReviews("ninh-binh");
    const firstReview = reviews[0];
    const initialHelpful = firstReview.helpfulCount;

    const success = markReviewHelpful(firstReview.id);
    expect(success).toBe(true);

    const reloadedReviews = getDestinationReviews("ninh-binh");
    const updatedReview = reloadedReviews.find((r) => r.id === firstReview.id);
    expect(updatedReview?.helpfulCount).toBe(initialHelpful + 1);
  });

  it("provides fallback rating summary for destination with no reviews", () => {
    const summary = getDestinationRatingSummary("unknown-destination-xyz");
    expect(summary.totalReviews).toBe(0);
    expect(summary.averageRating).toBe(5);
  });
});
