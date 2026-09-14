/**
 * Storefront "Top Deals" (real best-sellers) API client.
 *
 * Mirrors promo-deals.ts: a thin read-through of ordering-backend's
 * GET /{tenant}/promotions/top-sellers, itself a proxy over pos-api's real completed-sales
 * aggregate (units sold per SKU, trailing 90 days). The storefront cross-references this
 * against the catalog items it already has loaded — same "fetch a bounded item page + match
 * against a pos-api aggregate client-side" pattern promo-deals.ts's resolveDealItems uses for
 * discount matching — rather than the backend re-sorting its own paginated item listing.
 */

import { api } from "./base";
import type { MenuItem } from "@/types/catalog";

export interface TopSellerRow {
  sku: string;
  quantitySold: number;
}

interface BackendTopSellerRow {
  sku: string;
  name?: string;
  quantity_sold?: number;
  revenue?: number;
}

/** Fetch units-sold-per-SKU for the tenant's real completed sales (trailing 90 days). Never
 *  throws — a reporting integration hiccup must never break the storefront homepage. */
export async function fetchTopSellers(tenantSlug: string): Promise<TopSellerRow[]> {
  try {
    const res = await api.get<BackendTopSellerRow[]>(`${tenantSlug}/promotions/top-sellers`);
    const rows = Array.isArray(res.data) ? res.data : [];
    return rows.map((r) => ({ sku: r.sku, quantitySold: r.quantity_sold ?? 0 }));
  } catch {
    return [];
  }
}

/** Rank catalog items by real units-sold (falling back to the end of the list for items with no
 *  recorded sales, so a low-volume/new catalog still fills out the section) and return the top
 *  `limit`. Items are matched by `id` (the SKU, per MenuItem.id's doc comment) or `inventoryId`,
 *  mirroring resolveDealItems' own item-matching in promo-deals.ts. */
export function rankBestSellers(items: MenuItem[], sales: TopSellerRow[], limit: number): MenuItem[] {
  const bySku = new Map(sales.map((r) => [r.sku, r.quantitySold]));
  const quantityFor = (item: MenuItem) => bySku.get(item.id) ?? bySku.get(item.inventoryId ?? "") ?? 0;
  return items
    .slice()
    .sort((a, b) => quantityFor(b) - quantityFor(a))
    .slice(0, limit);
}
