"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  disconnectGoogle,
  getGoogleAuthUrl,
  getGoogleStatus,
  listGoogleLocations,
  listGoogleReviews,
  removeGoogleReviewLink,
  replyToGoogleReview,
  saveGoogleReviewLink,
  selectGoogleLocation,
  type GoogleLocation,
  type GoogleStatus,
  type SelectLocationRequest,
} from "@/lib/api/google";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const googleKeys = {
  all: ["google-integration"] as const,
  status: (slug: string) => [...googleKeys.all, "status", slug] as const,
  locations: (slug: string) => [...googleKeys.all, "locations", slug] as const,
  reviews: (slug: string) => [...googleKeys.all, "reviews", slug] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** Read the connection status and review link (answers even when OAuth is not set up). */
export function useGoogleStatus() {
  const slug = useOrgSlug();
  return useQuery<GoogleStatus>({
    queryKey: googleKeys.status(slug),
    queryFn: () => getGoogleStatus(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/** List the Google account's locations. Only enabled once Google is linked. */
export function useGoogleLocations(enabled: boolean) {
  const slug = useOrgSlug();
  return useQuery<GoogleLocation[]>({
    queryKey: googleKeys.locations(slug),
    queryFn: () => listGoogleLocations(slug),
    enabled: !!slug && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

/** Page through the chosen location's reviews. Only enabled when a location is chosen. */
export function useGoogleReviews(enabled: boolean) {
  const slug = useOrgSlug();
  return useInfiniteQuery({
    queryKey: googleKeys.reviews(slug),
    queryFn: ({ pageParam }) => listGoogleReviews(slug, pageParam),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextPageToken || undefined,
    enabled: !!slug && enabled,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Fetch the OAuth consent URL (does not redirect; the caller decides). */
export function useGoogleConnect() {
  const slug = useOrgSlug();
  return useMutation<string>({
    mutationFn: () => getGoogleAuthUrl(slug),
  });
}

/** Choose a location; refreshes the status and reviews. */
export function useSelectGoogleLocation() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SelectLocationRequest) => selectGoogleLocation(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.status(slug) });
      queryClient.invalidateQueries({ queryKey: googleKeys.reviews(slug) });
    },
  });
}

/** Reply to a review; refreshes the reviews list. */
export function useReplyToGoogleReview() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { reviewId: string; comment: string }) =>
      replyToGoogleReview(slug, args.reviewId, args.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.reviews(slug) });
    },
  });
}

/** Disconnect; refreshes every Google query. */
export function useDisconnectGoogle() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectGoogle(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.all });
    },
  });
}

/** Save a pasted review link or Place ID; refreshes the status and the customer button. */
export function useSaveGoogleReviewLink() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => saveGoogleReviewLink(slug, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.status(slug) });
      queryClient.invalidateQueries({ queryKey: ["google-review-url", slug] });
    },
  });
}

/** Remove the review link; refreshes the status and the customer button. */
export function useRemoveGoogleReviewLink() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeGoogleReviewLink(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.status(slug) });
      queryClient.invalidateQueries({ queryKey: ["google-review-url", slug] });
    },
  });
}
