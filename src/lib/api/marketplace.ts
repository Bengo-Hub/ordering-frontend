/**
 * Platform marketplace API client: the root (no tenant slug) landing page's data.
 * - `GET /marketplace/tenants`: stores with a real storefront (auth-api filters and pages them in
 *   SQL, ranked by plan tier), with an exact total.
 * - `GET /marketplace/deals`: products on live promotions across those stores, plus store
 *   banners. Empty when no store runs a promotion; the page then hides those sections.
 * Errors are thrown so React Query reports them; the page decides how to degrade.
 */

import { api } from "./base";
import type { DealRule } from "./promo-deals";

export interface MarketplaceTenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  brandColors?: Record<string, unknown>;
  useCase?: string;
  useCases?: string[];
  subscriptionPlan?: string;
  country?: string;
}

interface BackendMarketplaceTenant {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  brand_colors?: Record<string, unknown>;
  use_case?: string;
  use_cases?: string[];
  subscription_plan?: string;
  country?: string;
}

export interface MarketplaceTenantPage {
  tenants: MarketplaceTenant[];
  total: number;
  page: number;
  hasMore: boolean;
}

function toMarketplaceTenant(t: BackendMarketplaceTenant): MarketplaceTenant {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    ...(t.logo_url ? { logoUrl: t.logo_url } : {}),
    ...(t.brand_colors ? { brandColors: t.brand_colors } : {}),
    ...(t.use_case ? { useCase: t.use_case } : {}),
    ...(t.use_cases ? { useCases: t.use_cases } : {}),
    ...(t.subscription_plan ? { subscriptionPlan: t.subscription_plan } : {}),
    ...(t.country ? { country: t.country } : {}),
  };
}

/** One page of storefront tenants, optionally narrowed to a vertical. */
export async function fetchMarketplaceTenants(useCase?: string, page = 1, limit = 24): Promise<MarketplaceTenantPage> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (useCase) qs.set("use_case", useCase);
  const res = await api.get<{ data?: BackendMarketplaceTenant[]; total?: number; hasMore?: boolean }>(
    `marketplace/tenants?${qs.toString()}`,
  );
  const body = res.data ?? {};
  return {
    tenants: (body.data ?? []).map(toMarketplaceTenant),
    total: body.total ?? 0,
    page,
    hasMore: !!body.hasMore,
  };
}

export interface MarketplaceStore {
  slug: string;
  name: string;
  logoUrl?: string;
  useCase?: string;
}

export interface MarketplaceDeal {
  store: MarketplaceStore;
  promotion: { id: string; name: string; endAt: string | null; isFlashSale: boolean; rule: DealRule };
  item: { sku: string; name: string; imageUrl?: string; price: number; currency: string; availableQuantity?: number };
}

export interface MarketplaceBanner {
  store: MarketplaceStore;
  promoId: string;
  name: string;
  endAt: string | null;
  isFlashSale: boolean;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface MarketplaceDeals {
  deals: MarketplaceDeal[];
  banners: MarketplaceBanner[];
}

interface BackendStore {
  slug: string;
  name: string;
  logo_url?: string;
  use_case?: string;
}

interface BackendDeals {
  deals?: {
    store: BackendStore;
    promotion: {
      id: string;
      name: string;
      end_at: string | null;
      is_flash_sale?: boolean;
      rule: { scope_type: DealRule["scopeType"]; scope_ids: string[] | null; discount_type: DealRule["discountType"]; discount_value: number; max_discount: number };
    };
    item: { sku: string; name: string; image_url?: string; price: number; currency?: string; available_quantity?: number };
  }[];
  banners?: {
    store: BackendStore;
    promo_id: string;
    name: string;
    end_at?: string | null;
    is_flash_sale?: boolean;
    banner?: { banner_title?: string; banner_subtitle?: string; banner_image_url?: string };
  }[];
}

const toStore = (s: BackendStore): MarketplaceStore => ({
  slug: s.slug,
  name: s.name,
  ...(s.logo_url ? { logoUrl: s.logo_url } : {}),
  ...(s.use_case ? { useCase: s.use_case } : {}),
});

/** Live deals and banners across the marketplace's stores. */
export async function fetchMarketplaceDeals(): Promise<MarketplaceDeals> {
  const res = await api.get<BackendDeals>("marketplace/deals");
  const body = res.data ?? {};
  return {
    deals: (body.deals ?? []).map((d) => ({
      store: toStore(d.store),
      promotion: {
        id: d.promotion.id,
        name: d.promotion.name,
        endAt: d.promotion.end_at ?? null,
        isFlashSale: !!d.promotion.is_flash_sale,
        rule: {
          scopeType: d.promotion.rule.scope_type,
          scopeIds: d.promotion.rule.scope_ids ?? [],
          discountType: d.promotion.rule.discount_type,
          discountValue: d.promotion.rule.discount_value,
          maxDiscount: d.promotion.rule.max_discount,
        },
      },
      item: {
        sku: d.item.sku,
        name: d.item.name,
        ...(d.item.image_url ? { imageUrl: d.item.image_url } : {}),
        price: d.item.price,
        currency: d.item.currency || "KES",
        ...(d.item.available_quantity != null ? { availableQuantity: d.item.available_quantity } : {}),
      },
    })),
    banners: (body.banners ?? []).map((b) => ({
      store: toStore(b.store),
      promoId: b.promo_id,
      name: b.name,
      endAt: b.end_at ?? null,
      isFlashSale: !!b.is_flash_sale,
      ...(b.banner?.banner_title ? { title: b.banner.banner_title } : {}),
      ...(b.banner?.banner_subtitle ? { subtitle: b.banner.banner_subtitle } : {}),
      ...(b.banner?.banner_image_url ? { imageUrl: b.banner.banner_image_url } : {}),
    })),
  };
}
