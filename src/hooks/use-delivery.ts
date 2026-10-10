"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchDeliveryCoverage, fetchDeliveryQuote, reversePlace, searchPlaces, type LatLng } from "@/lib/api/delivery";
import { useOrgSlug } from "@/providers/org-slug-provider";

const round4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** Where the tenant delivers: areas, outlets, map centre and the cheapest fee. */
export function useDeliveryCoverage(outletId?: string | null) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: ["delivery-coverage", slug, outletId ?? null],
    queryFn: () => fetchDeliveryCoverage(slug, outletId ?? undefined),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}

/** Live delivery quote for a pin. Keyed to about 11 m so dragging does not refetch constantly. */
export function useDeliveryQuote(point: LatLng | null, outletId?: string | null, orderTotal?: number) {
  const slug = useOrgSlug();
  const lat = point ? round4(point.lat) : null;
  const lng = point ? round4(point.lng) : null;
  return useQuery({
    queryKey: ["delivery-quote", slug, lat, lng, outletId ?? null],
    queryFn: () => fetchDeliveryQuote(slug, { lat: point!.lat, lng: point!.lng, outletId, orderTotal }),
    enabled: !!slug && lat != null && lng != null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function usePlaceSearch(q: string) {
  const slug = useOrgSlug();
  const term = q.trim();
  return useQuery({
    queryKey: ["place-search", slug, term.toLowerCase()],
    queryFn: () => searchPlaces(slug, term),
    enabled: !!slug && term.length >= 3,
    staleTime: 10 * 60_000,
  });
}

/** Name of the place at a pin (exact place, or "Near <area>"). */
export function useReversePlace(point: LatLng | null) {
  const slug = useOrgSlug();
  const lat = point ? round4(point.lat) : null;
  const lng = point ? round4(point.lng) : null;
  return useQuery({
    queryKey: ["place-reverse", slug, lat, lng],
    queryFn: () => reversePlace(slug, point!.lat, point!.lng),
    enabled: !!slug && lat != null && lng != null,
    staleTime: 30 * 60_000,
  });
}
