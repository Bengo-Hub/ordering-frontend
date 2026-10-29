import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** What the "Recently viewed" row needs to draw a card without another request. */
export interface RecentItem {
  id: string;
  name: string;
  image?: string | undefined;
  /** Display price, already formatted (lib/list-price), e.g. "From KES 900". */
  priceLabel: string;
  viewedAt: number;
}

/** Most recent first, per tenant; older views fall off. */
export const RECENT_LIMIT = 12;

interface RecentlyViewedState {
  byTenant: Record<string, RecentItem[]>;
  record: (orgSlug: string, item: Omit<RecentItem, "viewedAt">) => void;
  clear: (orgSlug: string) => void;
}

/** Puts item first, drops an older view of the same product, keeps at most RECENT_LIMIT. */
export function pushRecent(list: RecentItem[], item: RecentItem): RecentItem[] {
  return [item, ...list.filter((r) => r.id !== item.id)].slice(0, RECENT_LIMIT);
}

/**
 * Products this browser looked at, per tenant (like "Your Recent Finds" on large stores). Kept
 * only on the device; nothing is sent to a server. Storage can be unavailable (private mode), in
 * which case the row simply stays empty.
 */
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      byTenant: {},
      record: (orgSlug, item) =>
        set((s) => ({
          byTenant: {
            ...s.byTenant,
            [orgSlug]: pushRecent(s.byTenant[orgSlug] ?? [], { ...item, viewedAt: Date.now() }),
          },
        })),
      clear: (orgSlug) =>
        set((s) => {
          const next = { ...s.byTenant };
          delete next[orgSlug];
          return { byTenant: next };
        }),
    }),
    {
      name: "ordering-recently-viewed",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
