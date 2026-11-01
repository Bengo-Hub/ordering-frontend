import { describe, expect, it } from "vitest";

import {
  isSameLocation,
  normalizeGoogleStatus,
  normalizeReviewPage,
  starRatingToNumber,
} from "@/lib/api/google";

describe("Google status", () => {
  it("reads the full status with the review link", () => {
    const s = normalizeGoogleStatus({
      configured: true,
      connected: false,
      linked: true,
      status: "needs_location",
      location_id: "",
      review_link: {
        review_url: "https://search.google.com/local/writereview?placeid=ChIJabc",
        place_id: "ChIJabc",
        source: "manual",
      },
    });
    expect(s.linked).toBe(true);
    expect(s.connected).toBe(false);
    expect(s.status).toBe("needs_location");
    expect(s.review_link.source).toBe("manual");
    expect(s.review_link.place_id).toBe("ChIJabc");
  });

  it("fills safe defaults for an empty or older response", () => {
    const s = normalizeGoogleStatus({ configured: false, connected: true });
    expect(s.status).toBe("disconnected");
    // Older backends had no "linked"; connected implies linked.
    expect(s.linked).toBe(true);
    expect(s.review_link).toEqual({ review_url: "", place_id: "", source: "" });
    expect(normalizeGoogleStatus(undefined).configured).toBe(false);
  });

  it("drops an unknown review link source", () => {
    const s = normalizeGoogleStatus({ review_link: { review_url: "https://g.page/r/x", source: "other" } });
    expect(s.review_link.source).toBe("");
  });
});

describe("Google reviews page", () => {
  it("reads reviews, totals and the next page token", () => {
    const p = normalizeReviewPage({
      data: [
        {
          name: "accounts/1/locations/2/reviews/r1",
          reviewId: "r1",
          starRating: "FOUR",
          comment: "Good",
          reviewer: { displayName: "Ann" },
          reviewReply: { comment: "Thanks" },
        },
      ],
      total: 12,
      average_rating: 4.3,
      next_page_token: "tok",
    });
    expect(p.reviews).toHaveLength(1);
    expect(p.reviews[0].reviewReply?.comment).toBe("Thanks");
    expect(p.total).toBe(12);
    expect(p.averageRating).toBe(4.3);
    expect(p.nextPageToken).toBe("tok");
  });

  it("tolerates a bare array and an empty body", () => {
    expect(normalizeReviewPage([{ reviewId: "a" }]).reviews).toHaveLength(1);
    const empty = normalizeReviewPage(null);
    expect(empty.reviews).toEqual([]);
    expect(empty.nextPageToken).toBe("");
  });
});

describe("Google helpers", () => {
  it("matches a listed location to the stored full name", () => {
    expect(isSameLocation("locations/2", "accounts/1/locations/2")).toBe(true);
    expect(isSameLocation("accounts/1/locations/2", "accounts/1/locations/2")).toBe(true);
    expect(isSameLocation("locations/2", "accounts/1/locations/12")).toBe(false);
    expect(isSameLocation("locations/2", "")).toBe(false);
  });

  it("maps star ratings", () => {
    expect(starRatingToNumber("FIVE")).toBe(5);
    expect(starRatingToNumber("ONE")).toBe(1);
    expect(starRatingToNumber("STAR_RATING_UNSPECIFIED")).toBe(0);
  });
});
