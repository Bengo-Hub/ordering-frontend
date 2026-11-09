"use client";

import { useQuery } from "@tanstack/react-query";

import { listUsers, type TenantUser } from "@/lib/api/users";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  list: (slug: string, q: string) => [...userKeys.all, "list", slug, q] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * List the tenant's users, optionally filtered by a name/email query.
 *
 * Intended to back a searchable user combobox. The caller is expected to
 * debounce `q`; results are cached per (slug, q).
 */
export function useUsers(q = "") {
  const slug = useOrgSlug();
  return useQuery<TenantUser[]>({
    queryKey: userKeys.list(slug, q),
    // The signal cancels the request when a newer search replaces it.
    queryFn: ({ signal }) => listUsers(slug, q, signal),
    // Keep the current list while the next search loads.
    placeholderData: (prev) => prev,
    enabled: !!slug,
    staleTime: 30_000,
  });
}
