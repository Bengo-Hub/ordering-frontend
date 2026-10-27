"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { fetchMarketplaceDeals, fetchMarketplaceTenants } from "@/lib/api/marketplace";

/** Storefront tenants for the platform landing page, a page at a time ("Show more stores"). */
export function useMarketplaceTenants(useCase?: string, limit = 24) {
  return useInfiniteQuery({
    queryKey: ["marketplace-tenants", useCase ?? "", limit],
    queryFn: ({ pageParam }) => fetchMarketplaceTenants(useCase, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/** Live deals and banners across the marketplace's stores. */
export function useMarketplaceDeals() {
  return useQuery({
    queryKey: ["marketplace-deals"],
    queryFn: fetchMarketplaceDeals,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
