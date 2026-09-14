"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTopSellers } from "@/lib/api/top-sellers";
import { useOrgSlug } from "@/providers/org-slug-provider";

/** Real units-sold-per-SKU for the current tenant (trailing 90 days). Mirrors usePromoDeals. */
export function useTopSellers() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: ["promo-top-sellers", slug],
    queryFn: () => fetchTopSellers(slug),
    enabled: !!slug,
    staleTime: 60 * 1000, // 1 minute — matches the backend's own short cache TTL
    retry: 1,
  });
}
