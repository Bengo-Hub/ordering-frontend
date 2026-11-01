import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// These match the ordering-backend Google Business Profile DTOs:
//   - StatusResult → internal/modules/googlebusiness/service.go (configured, connected,
//     linked, status, location_id, location_name, place_id, review_link)
//   - Location / Review → internal/modules/googlebusiness/client.go
//   - Reviews list → { data, total, average_rating, next_page_token }
//   - Review link → PUT/DELETE admin/integrations/google/review-link ({ value })
//
// Routes live under /api/v1/{tenant}/admin/integrations/google/* with the org slug as
// {tenant}, like every other ordering route reached via useOrgSlug().

/** The link customers open to write a Google review. */
export interface GoogleReviewLink {
  review_url: string;
  place_id: string;
  /** "google" when a connected location set it, "manual" when pasted, "" when unset. */
  source: "google" | "manual" | "";
}

/** GET admin/integrations/google/status */
export interface GoogleStatus {
  /** The platform has set up the Google OAuth client. */
  configured: boolean;
  /** Linked and a location is chosen; reviews can be read. */
  connected: boolean;
  /** Google tokens are stored, with or without a chosen location. */
  linked: boolean;
  /** disconnected | needs_location | connected | reconnect */
  status: string;
  location_id: string;
  location_name: string;
  place_id: string;
  review_link: GoogleReviewLink;
}

/** A Google Business Profile location (client.go Location). */
export interface GoogleLocation {
  name: string;
  title: string;
  storeCode: string;
  metadata: {
    placeId: string;
    mapsUri: string;
    newReviewUri: string;
  };
}

/** A single Google review (client.go Review). */
export interface GoogleReview {
  name: string;
  reviewId: string;
  comment: string;
  starRating: string;
  createTime: string;
  updateTime: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl: string;
  };
  reviewReply: {
    comment: string;
    updateTime: string;
  } | null;
}

/** One page of reviews plus Google's totals for the location. */
export interface GoogleReviewPage {
  reviews: GoogleReview[];
  total: number;
  averageRating: number;
  nextPageToken: string;
}

/** PUT admin/integrations/google/location request body (handler.go selectLocationRequest). */
export interface SelectLocationRequest {
  location_name: string;
  place_id: string;
  display_name: string;
  new_review_uri?: string;
}

// ─── API Functions ───────────────────────────────────────────────────

/** Read the connection status and the review link. Answers even when OAuth is not set up. */
export async function getGoogleStatus(slug: string): Promise<GoogleStatus> {
  const res = await api.get(`${slug}/admin/integrations/google/status`);
  return normalizeGoogleStatus(res.data);
}

/** Begin the OAuth connect flow: returns the Google consent URL to redirect to. */
export async function getGoogleAuthUrl(slug: string): Promise<string> {
  const res = await api.get(`${slug}/admin/integrations/google/connect`);
  return res.data?.auth_url ?? "";
}

/** List the locations available on the connected Google account. Shape: { data, total }. */
export async function listGoogleLocations(slug: string): Promise<GoogleLocation[]> {
  const res = await api.get(`${slug}/admin/integrations/google/locations`);
  const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  return (raw as Array<Record<string, unknown>>).map(normalizeLocation);
}

/** Persist the chosen location. The backend also writes the customer review link. */
export async function selectGoogleLocation(
  slug: string,
  body: SelectLocationRequest,
): Promise<void> {
  await api.put(`${slug}/admin/integrations/google/location`, body);
}

/** List one page of the chosen location's reviews. */
export async function listGoogleReviews(slug: string, pageToken = ""): Promise<GoogleReviewPage> {
  const res = await api.get(`${slug}/admin/integrations/google/reviews`, {
    params: pageToken ? { page_token: pageToken } : undefined,
  });
  return normalizeReviewPage(res.data);
}

/** Post an owner reply to a single review. */
export async function replyToGoogleReview(
  slug: string,
  reviewId: string,
  comment: string,
): Promise<void> {
  await api.post(
    `${slug}/admin/integrations/google/reviews/${encodeURIComponent(reviewId)}/reply`,
    { comment },
  );
}

/** Disconnect: clears stored tokens. The review link stays. */
export async function disconnectGoogle(slug: string): Promise<void> {
  await api.delete(`${slug}/admin/integrations/google/connect`);
}

/** Save a pasted Google review link or Place ID. Works without the OAuth connection. */
export async function saveGoogleReviewLink(slug: string, value: string): Promise<GoogleReviewLink> {
  const res = await api.put(`${slug}/admin/integrations/google/review-link`, { value });
  return normalizeReviewLink(res.data);
}

/** Remove the review link, which hides the customer button. */
export async function removeGoogleReviewLink(slug: string): Promise<void> {
  await api.delete(`${slug}/admin/integrations/google/review-link`);
}

// ─── Normalisers ──────────────────────────────────────────────────────
//
// Locations and reviews come from Google's API through the backend, so they are read
// tolerantly (a few alternate keys) into the typed shapes the page relies on.

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeReviewLink(raw: unknown): GoogleReviewLink {
  const d = (raw ?? {}) as Record<string, unknown>;
  const source = asString(d.source);
  return {
    review_url: asString(d.review_url),
    place_id: asString(d.place_id),
    source: source === "google" || source === "manual" ? source : "",
  };
}

export function normalizeGoogleStatus(raw: unknown): GoogleStatus {
  const d = (raw ?? {}) as Record<string, unknown>;
  const status = asString(d.status) || "disconnected";
  return {
    configured: !!d.configured,
    connected: !!d.connected,
    linked: d.linked === undefined ? !!d.connected : !!d.linked,
    status,
    location_id: asString(d.location_id),
    location_name: asString(d.location_name),
    place_id: asString(d.place_id),
    review_link: normalizeReviewLink(d.review_link),
  };
}

export function normalizeReviewPage(raw: unknown): GoogleReviewPage {
  const d = raw as Record<string, unknown> | unknown[] | null | undefined;
  const list = Array.isArray(d) ? d : ((d?.data as unknown[] | undefined) ?? []);
  const reviews = (list as Array<Record<string, unknown>>).map(normalizeReview);
  const obj = Array.isArray(d) ? {} : ((d ?? {}) as Record<string, unknown>);
  return {
    reviews,
    total: asNumber(obj.total) || reviews.length,
    averageRating: asNumber(obj.average_rating),
    nextPageToken: asString(obj.next_page_token),
  };
}

function normalizeLocation(raw: Record<string, unknown>): GoogleLocation {
  const metadata = (raw.metadata as Record<string, unknown> | undefined) ?? {};
  return {
    name: asString(raw.name ?? raw.location_id ?? raw.locationId),
    title: asString(raw.title ?? raw.location_name ?? raw.locationName ?? raw.displayName),
    storeCode: asString(raw.storeCode ?? raw.store_code),
    metadata: {
      placeId: asString(metadata.placeId ?? metadata.place_id ?? raw.place_id ?? raw.placeId),
      mapsUri: asString(metadata.mapsUri ?? metadata.maps_uri),
      newReviewUri: asString(metadata.newReviewUri ?? metadata.new_review_uri),
    },
  };
}

function normalizeReview(raw: Record<string, unknown>): GoogleReview {
  const reviewer = (raw.reviewer as Record<string, unknown> | undefined) ?? {};
  const reply = (raw.reviewReply ?? raw.review_reply) as Record<string, unknown> | undefined | null;
  return {
    name: asString(raw.name),
    reviewId: asString(raw.reviewId ?? raw.review_id ?? raw.name),
    comment: asString(raw.comment),
    starRating: asString(raw.starRating ?? raw.star_rating),
    createTime: asString(raw.createTime ?? raw.create_time),
    updateTime: asString(raw.updateTime ?? raw.update_time),
    reviewer: {
      displayName: asString(reviewer.displayName ?? reviewer.display_name),
      profilePhotoUrl: asString(reviewer.profilePhotoUrl ?? reviewer.profile_photo_url),
    },
    reviewReply: reply
      ? {
          comment: asString(reply.comment),
          updateTime: asString(reply.updateTime ?? reply.update_time),
        }
      : null,
  };
}

/**
 * Does a location resource name (e.g. "locations/2") point at the stored location id
 * (e.g. "accounts/1/locations/2")? The backend stores the full name; Google lists the
 * short one.
 */
export function isSameLocation(listed: string, stored: string): boolean {
  if (!listed || !stored) return false;
  const a = listed.replace(/^\/+|\/+$/g, "");
  const b = stored.replace(/^\/+|\/+$/g, "");
  return a === b || b.endsWith(`/${a}`) || a.endsWith(`/${b}`);
}

/** Map Google's enum star rating ("FIVE", "FOUR", ...) to a 1 to 5 number (0 when unknown). */
export function starRatingToNumber(rating: string): number {
  switch (rating.toUpperCase()) {
    case "ONE":
      return 1;
    case "TWO":
      return 2;
    case "THREE":
      return 3;
    case "FOUR":
      return 4;
    case "FIVE":
      return 5;
    default: {
      const n = Number(rating);
      return Number.isFinite(n) ? n : 0;
    }
  }
}
