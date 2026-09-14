"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ChefHatIcon,
  FilterIcon,
  Heart,
  SearchIcon,
  ShieldAlert,
  ShoppingCart as ShoppingCartIcon,
  SproutIcon,
  WheatIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AddToCartModal, needsAddToCartModal, type AddToCartModalItem } from "@/components/catalog/add-to-cart-modal";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useCatalogItems, useOutlets, useToggleFavorite } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { usePromoDeals } from "@/hooks/use-promo-deals";
import { useTopSellers } from "@/hooks/use-top-sellers";
import { resolveDealItems } from "@/lib/api/promo-deals";
import { rankBestSellers } from "@/lib/api/top-sellers";
import type { OrderingConfig } from "@/lib/use-case-config";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { CatalogVariant, DietaryTag, ModifierGroup } from "@/types/catalog";

/** Sort keys the storefront's own dropdown offers. Only "newest" is a real backend sort key
 *  (see fetchMenuItems) — the others are resolved client-side over an over-fetched batch (see
 *  SPECIAL_LISTING_BATCH_SIZE below), same posture as the homepage's deal/best-seller rails. */
type CatalogSort = "default" | "newest" | "best_selling" | "price_asc" | "price_desc";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  category: string;
  categoryId: string;
  dietary: DietaryTag[];
  feature?: "recommended" | "new";
  image?: string;
  outletId?: string;
  outletName?: string;
  isFavorite?: boolean | undefined;
  manufacturer?: string | undefined;
  model?: string | undefined;
  condition?: string | undefined;
  brandId?: string | undefined;
  brandName?: string | undefined;
  availableQuantity?: number | undefined;
  hasVariants?: boolean | undefined;
  variants?: CatalogVariant[] | undefined;
  modifierGroups?: ModifierGroup[] | undefined;
} & Record<string, any>;

function DiscoveryMenuItem({
  item,
  orgSlug,
  onAddToCart,
  cfg,
  index = 0,
}: {
  item: MenuItem;
  orgSlug: string;
  onAddToCart: (item: MenuItem) => void;
  cfg: OrderingConfig;
  index?: number;
}) {
  const opensModal = needsAddToCartModal(item);
  const itemUrl = item.id ? `/${orgSlug}/catalog/${item.id}` : "#";
  const { mutate: toggleFavorite } = useToggleFavorite(orgSlug);
  const [isWhitelisted, setIsWhitelisted] = useState(item.isFavorite ?? false);

  const toggleWhitelist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWhitelisted(!isWhitelisted);
    toggleFavorite(item.id);
  };

  return (
    <Link
      href={itemUrl}
      prefetch={false}
      data-menu-item-id={item.id}
      className="flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] sm:rounded-3xl"
    >
      {/* Image - Responsive height */}
      <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-52 md:h-60">
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          useCase={cfg.profile}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading={index < 4 ? "eager" : "lazy"}
          priority={index < 2}
        />

        {/* Whitelist Toggle */}
        <button
          onClick={toggleWhitelist}
          className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 sm:size-9"
          aria-label="Add to whitelist"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isWhitelisted ? "fill-red-500 text-red-500" : "text-muted-foreground",
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          <header className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">
                {item.name}
              </h3>
              {cfg.showMakeModel && (item.manufacturer || item.model) && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[item.manufacturer, item.model].filter(Boolean).join(" · ")}
                </p>
              )}
              {cfg.showMakeModel && item.condition && item.condition !== "NEW" && (
                <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {item.condition.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              {item.feature === "recommended" ? (
                <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand-emphasis sm:px-3 sm:py-1 sm:text-xs">
                  ⭐
                </span>
              ) : null}
              {item.feature === "new" ? (
                <span className="rounded-full bg-brand-emphasis/10 px-2 py-0.5 text-[10px] font-medium text-brand-emphasis sm:px-3 sm:py-1 sm:text-xs">
                  New
                </span>
              ) : null}
            </div>
          </header>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {item.description}
          </p>
        </div>
        <footer className="mt-4 space-y-3 sm:mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-base font-semibold text-foreground sm:text-sm">
              {item.price}
            </span>
            <div className="flex flex-wrap gap-1">
              {item.dietary.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-muted px-1.5 py-0.5 text-[10px] font-medium text-brand-dark sm:px-2 sm:text-[11px]"
                >
                  {dietaryFilterOpts.find((f) => f.value === tag)?.label ?? tag}
                </span>
              ))}
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(item);
            }}
            className="w-full min-h-[48px]"
            size="sm"
            variant={opensModal ? "outline" : "default"}
          >
            <ShoppingCartIcon className="mr-2 size-4" />
            {opensModal ? cfg.selectOptionsLabel : cfg.ctaLabel}
          </Button>
        </footer>
      </div>
    </Link>
  );
}

/**
 * Facebook-style skeleton placeholder matching DiscoveryMenuItem's real layout —
 * shown for the initial catalog fetch so the grid never blocks on a spinner/text
 * message. Individual item images resolve independently inside ImageWithFallback
 * once real data arrives, so this only covers the "no data yet at all" gap.
 */
function MenuItemCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-3xl">
      <Skeleton className="h-44 w-full rounded-none sm:h-52 md:h-60" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

const dietaryFilterOpts: Array<{ value: DietaryTag; label: string; icon: React.ReactNode }> = [
  { value: "vegan", label: "Vegan", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "vegetarian", label: "Vegetarian", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "glutenFree", label: "Gluten Free", icon: <WheatIcon className="size-4" aria-hidden /> },
  { value: "spicy", label: "Spicy", icon: <FilterIcon className="size-4" aria-hidden /> },
  {
    value: "chefSpecial",
    label: "Chef Special",
    icon: <ChefHatIcon className="size-4" aria-hidden />,
  },
];

const MENU_PAGE_SIZE = 24;
// Sort keys resolved client-side (best_selling/price_asc/price_desc) or the flash_sale filter
// need the WHOLE matching set before sorting/paginating, not just one server page — mirrors the
// homepage's own bounded over-fetch for the same reason (deal/best-seller matching there caps at
// 60). 200 is a reasonable ceiling for a single storefront catalog view.
const SPECIAL_LISTING_BATCH_SIZE = 200;

type MenuDiscoveryProps = {
  initialCategory?: string | undefined;
  initialOutlet?: string | undefined;
  initialSearch?: string | undefined;
  initialDietary?: string[] | undefined;
  /** Optional deep-link action, e.g. /menu?item_id=...&action=add-to-cart|view|whitelist */
  initialItemId?: string | undefined;
  initialAction?: string | undefined;
  initialFavoriteOnly?: boolean | undefined;
  /** "newest" (real backend sort) | "best_selling" | "price_asc" | "price_desc" (client-side). */
  initialSort?: string | undefined;
  /** Only "flash_sale" is recognized today — matches the homepage's Flash Sales rail. */
  initialFilter?: string | undefined;
  initialBrand?: string | undefined;
};

export function MenuDiscovery({
  initialCategory,
  initialOutlet,
  initialSearch,
  initialDietary,
  initialItemId,
  initialAction,
  initialFavoriteOnly,
  initialSort,
  initialFilter,
  initialBrand,
}: MenuDiscoveryProps = {}) {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">(initialCategory ?? "all");
  const [activeOutletId, setActiveOutletId] = useState<string>(initialOutlet ?? "");
  const [activeDietary, setActiveDietary] = useState<DietaryTag[]>((initialDietary as DietaryTag[]) ?? []);
  const [favoriteOnly, setFavoriteOnly] = useState(initialFavoriteOnly ?? false);
  const [sort, setSort] = useState<CatalogSort>((initialSort as CatalogSort) || "default");
  const [specialFilter, setSpecialFilter] = useState<string>(initialFilter ?? "");
  const [brandId, setBrandId] = useState<string>(initialBrand ?? "");
  // Price/in-stock filters: applied via an explicit "Apply" button (matches the reference
  // filter bar), not live-as-you-type — draft state is separate from what's actually applied.
  const [minPriceDraft, setMinPriceDraft] = useState("");
  const [maxPriceDraft, setMaxPriceDraft] = useState("");
  const [inStockDraft, setInStockDraft] = useState(false);
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>(undefined);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>(undefined);
  const [appliedInStockOnly, setAppliedInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState<AddToCartModalItem | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const { data: outletsData } = useOutlets(orgSlug, undefined, 1, 50);
  const outlets = outletsData?.data ?? [];
  const firstOutletId = outlets[0]?.id ?? undefined;

  // Adapt the storefront to the browsed outlet's vertical: a hardware/electronics
  // shop, a restaurant, a pharmacy and a ticketed event must not render the same
  // food-oriented menu. cfg/copy drive layout, CTA labels, dietary filters, etc.;
  // effectiveUseCase also gates which categories the backend returns.
  const browsedOutlet = outlets.find((o) => o.id === (activeOutletId || firstOutletId));
  const { config: cfg, copy, useCase: effectiveUseCase } = useOrderingConfig(browsedOutlet?.businessType);

  const { data: categoriesData } = useCategories(orgSlug, firstOutletId, effectiveUseCase);
  const categoriesFromApi = useMemo(() => categoriesData ?? [], [categoriesData]);

  // A sort/filter that needs the whole matching set before ranking (best-sellers, flash-sale
  // discount matching, or a simple price sort applied across more than one server page) switches
  // this view into "special listing" mode: one bounded over-fetch + client-side
  // sort/filter/paginate, instead of the normal server-paginated flow.
  const isSpecialListing = sort === "best_selling" || sort === "price_asc" || sort === "price_desc" || specialFilter === "flash_sale";

  const filters = useMemo(
    () => ({
      ...(activeCategoryId && activeCategoryId !== "all" && { category: activeCategoryId }),
      ...(activeOutletId && { outletId: activeOutletId }),
      ...(search.trim() && { search: search.trim() }),
      ...(activeDietary.length > 0 && { dietary: activeDietary }),
      ...(favoriteOnly && { favoriteOnly: true }),
      ...(brandId && { brandId }),
      ...(sort === "newest" && { sort: "newest" }),
    }),
    [activeCategoryId, activeOutletId, search, activeDietary, favoriteOnly, brandId, sort],
  );

  const { data: normalPage, isPending: normalPending, error: normalError } = useCatalogItems(
    orgSlug,
    filters,
    page,
    MENU_PAGE_SIZE,
    !isSpecialListing,
  );
  const { data: specialPage, isPending: specialPending, error: specialError } = useCatalogItems(
    orgSlug,
    filters,
    1,
    SPECIAL_LISTING_BATCH_SIZE,
    isSpecialListing,
  );
  const { data: deals } = usePromoDeals();
  const { data: topSellerSales } = useTopSellers();

  const isPending = isSpecialListing ? specialPending : normalPending;
  const itemsError = isSpecialListing ? specialError : normalError;

  // Special-listing pipeline: rank/filter the whole over-fetched batch, then paginate the
  // RESULT client-side (not the raw batch) so page 2+ shows the next slice of the ranked set.
  const specialRankedItems = useMemo(() => {
    if (!isSpecialListing) return [];
    const batch = specialPage?.data ?? [];
    if (specialFilter === "flash_sale") {
      return resolveDealItems(batch, deals ?? []).map(({ item }) => item);
    }
    if (sort === "best_selling") {
      return rankBestSellers(batch, topSellerSales ?? [], batch.length);
    }
    if (sort === "price_asc") {
      return batch.slice().sort((a, b) => a.price - b.price);
    }
    if (sort === "price_desc") {
      return batch.slice().sort((a, b) => b.price - a.price);
    }
    return batch;
  }, [isSpecialListing, specialPage, specialFilter, deals, sort, topSellerSales]);

  const apiItems = useMemo(() => {
    if (isSpecialListing) {
      return specialRankedItems.slice((page - 1) * MENU_PAGE_SIZE, page * MENU_PAGE_SIZE);
    }
    return normalPage?.data ?? [];
  }, [isSpecialListing, specialRankedItems, page, normalPage]);

  const totalPages = isSpecialListing
    ? Math.max(1, Math.ceil(specialRankedItems.length / MENU_PAGE_SIZE))
    : normalPage?.meta?.totalPages ?? 1;
  const total = isSpecialListing ? specialRankedItems.length : normalPage?.meta?.total ?? 0;

  // Price/stock filters apply to whichever page is currently displayed (same "filters the
  // loaded page, not the whole server-side result set" tier as the existing dietary filters).
  const visibleItems = useMemo(
    () =>
      apiItems.filter((m) => {
        if (appliedMinPrice != null && (m.price ?? 0) < appliedMinPrice) return false;
        if (appliedMaxPrice != null && (m.price ?? 0) > appliedMaxPrice) return false;
        if (appliedInStockOnly && m.availableQuantity != null && m.availableQuantity <= 0) return false;
        return true;
      }),
    [apiItems, appliedMinPrice, appliedMaxPrice, appliedInStockOnly],
  );

  const menuItems: MenuItem[] = useMemo(
    () =>
      visibleItems.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description ?? "",
        price: `${m.currency ?? "KES"} ${(m.price ?? 0).toLocaleString()}`,
        priceValue: m.price ?? 0,
        category: m.category || "Other",
        categoryId: m.categoryId ?? "",
        dietary: (m.dietary ?? []) as DietaryTag[],
        ...(m.image != null && m.image !== "" && { image: m.image }),
        outletId: m.outletId,
        outletName: m.outletName,
        isFavorite: m.isFavorite,
        manufacturer: m.manufacturer,
        model: m.model,
        condition: m.condition,
        brandName: m.brandName,
        availableQuantity: m.availableQuantity,
        hasVariants: m.hasVariants,
        variants: m.variants,
        modifierGroups: m.modifierGroups,
        ...(m.featured && { feature: "recommended" as const }),
      })),
    [visibleItems],
  );

  const updateUrl = useCallback(
    (updates: {
      category?: string | undefined;
      outlet?: string | undefined;
      search?: string | undefined;
      dietary?: string | undefined;
      sort?: string | undefined;
      filter?: string | undefined;
      brand?: string | undefined;
    }) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      if (updates.category !== undefined) (updates.category && updates.category !== "all") ? p.set("category", updates.category) : p.delete("category");
      if (updates.outlet !== undefined) updates.outlet ? p.set("outlet", updates.outlet) : p.delete("outlet");
      if (updates.search !== undefined) updates.search ? p.set("search", updates.search) : p.delete("search");
      if (updates.dietary !== undefined) updates.dietary ? p.set("dietary", updates.dietary) : p.delete("dietary");
      if (updates.sort !== undefined) (updates.sort && updates.sort !== "default") ? p.set("sort", updates.sort) : p.delete("sort");
      if (updates.filter !== undefined) updates.filter ? p.set("filter", updates.filter) : p.delete("filter");
      if (updates.brand !== undefined) updates.brand ? p.set("brand", updates.brand) : p.delete("brand");
      const q = p.toString();
      router.replace(q ? `?${q}` : window.location.pathname, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (initialCategory != null) setActiveCategoryId(initialCategory || "all");
    if (initialOutlet != null) setActiveOutletId(initialOutlet);
    if (initialSearch != null) setSearch(initialSearch);
    if (initialDietary != null) setActiveDietary(initialDietary as DietaryTag[]);
    if (initialFavoriteOnly != null) setFavoriteOnly(initialFavoriteOnly);
    if (initialSort != null) setSort((initialSort as CatalogSort) || "default");
    if (initialFilter != null) setSpecialFilter(initialFilter);
    if (initialBrand != null) setBrandId(initialBrand);
  }, [initialCategory, initialOutlet, initialSearch, initialDietary, initialFavoriteOnly, initialSort, initialFilter, initialBrand]);

  const handleAddToCart = (item: MenuItem) => {
    // Variant/modifier products open the quick add-to-cart modal so the customer can
    // configure their selection without leaving the grid (mirrors Uber Eats).
    if (needsAddToCartModal(item)) {
      setModalItem({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.priceValue,
        image: item.image,
        outletId: item.outletId,
        outletName: item.outletName,
        hasVariants: item.hasVariants,
        variants: item.variants,
        modifierGroups: item.modifierGroups,
      });
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price: item.priceValue,
      ...(item.outletId && { outletId: item.outletId }),
      ...(item.outletName && { outletName: item.outletName }),
    });
    toast.success(`Added ${item.name} to cart`);
  };

  // Handle deep-linked item actions from /menu?item_id=&action=
  useEffect(() => {
    if (!initialItemId || !initialAction) return;
    const action = initialAction as "add-to-cart" | "view" | "whitelist";
    const target = menuItems.find((m) => m.id === initialItemId);
    if (!target) return;

    if (action === "add-to-cart") {
      handleAddToCart(target);
      toast.success(`Added ${target.name} to cart`);
    } else if (action === "view") {
      // Scroll to the item card and highlight; for now just scroll into view.
      const el = document.querySelector<HTMLElement>(`[data-menu-item-id="${target.id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Whitelist action intentionally no-op here; reserved for future feature flags.
  }, [initialItemId, initialAction, menuItems]);

  const isSubscriptionError =
    (itemsError as any)?.response?.status === 402 ||
    (itemsError as any)?.response?.data?.code === 'subscription_inactive';

  if (isSubscriptionError) {
    return (
      <section className="border-t border-border bg-card py-8 sm:py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
          <ShieldAlert className="size-12 text-muted-foreground" aria-hidden />
          <h2 className="text-xl font-semibold text-foreground">Menu Temporarily Unavailable</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This menu is currently unavailable. Please check back later or contact the venue directly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border bg-card py-8 sm:py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-brand-surface/40 p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              Browse {activeCategoryId === "all" ? `all ${copy.itemLabelPlural.toLowerCase()}` : (categoriesFromApi.find((c) => c.id === activeCategoryId)?.name ?? copy.itemLabelPlural).toLowerCase()}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Filter by dietary preference, explore specials, and build your cart seamlessly.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <label htmlFor="menu-search" className="sr-only">
              Search catalog items
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="menu-search"
                placeholder={copy.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => updateUrl({ search: search.trim() || undefined })}
                onKeyDown={(e) => e.key === "Enter" && updateUrl({ search: search.trim() || undefined })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Sort + price/stock filter bar — retail/wholesale product listings only (a food/
            services catalog has no "Most Popular by sales"/price-range shopping pattern). */}
        {cfg.productLayout === "compact" && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => updateUrl({ search: search.trim() || undefined })}
              onKeyDown={(e) => e.key === "Enter" && updateUrl({ search: search.trim() || undefined })}
              className="sm:w-48"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Min KES"
              value={minPriceDraft}
              onChange={(e) => setMinPriceDraft(e.target.value)}
              className="sm:w-28"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Max KES"
              value={maxPriceDraft}
              onChange={(e) => setMaxPriceDraft(e.target.value)}
              className="sm:w-28"
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={inStockDraft}
                onChange={(e) => setInStockDraft(e.target.checked)}
                className="size-4 rounded border-border"
              />
              In Stock
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setAppliedMinPrice(minPriceDraft.trim() ? Number(minPriceDraft) : undefined);
                setAppliedMaxPrice(maxPriceDraft.trim() ? Number(maxPriceDraft) : undefined);
                setAppliedInStockOnly(inStockDraft);
                setPage(1);
              }}
            >
              Apply
            </Button>

            <label htmlFor="menu-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="menu-sort"
              value={sort}
              onChange={(e) => {
                const next = e.target.value as CatalogSort;
                setSort(next);
                setPage(1);
                updateUrl({ sort: next });
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground sm:ml-auto"
            >
              <option value="default">Most Popular</option>
              <option value="best_selling">Best Selling</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        )}

        {/* Category filters from backend — horizontal carousel at ALL breakpoints (no wrapping into
            many rows); chips are shrink-0 so they scroll sideways instead of stacking. */}
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none]">
          <Button
            type="button"
            size="sm"
            variant={activeCategoryId === "all" ? "default" : "outline"}
            onClick={() => {
              setActiveCategoryId("all");
              setPage(1);
              updateUrl({ category: undefined });
            }}
            className={cn(
              "shrink-0",
              activeCategoryId === "all"
                ? "bg-brand text-brand-contrast shadow-soft"
                : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
            )}
          >
            All
          </Button>
          {categoriesFromApi.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              size="sm"
              variant={activeCategoryId === cat.id ? "default" : "outline"}
              onClick={() => {
                setActiveCategoryId(cat.id);
                setPage(1);
                updateUrl({ category: cat.id });
              }}
              className={cn(
                "shrink-0 h-10 gap-2 px-4 rounded-xl",
                activeCategoryId === cat.id
                  ? "bg-brand text-brand-contrast shadow-soft"
                  : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
              )}
            >
              <div className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-current/10 text-xs">
                {cat.emoji ? (
                  <span aria-hidden>{cat.emoji}</span>
                ) : (
                  <ImageWithFallback
                    src={cat.image}
                    alt={cat.name}
                    useCase={cfg.profile}
                    fill
                    className="object-cover"
                    iconClassName="size-3"
                  />
                )}
              </div>
              <span className="font-bold">{cat.name}</span>
            </Button>
          ))}
        </div>

        {/* Outlet filter when multiple */}
        {outlets.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Outlet:</span>
            {outlets.map((out) => (
              <Button
                key={out.id}
                type="button"
                size="sm"
                variant={activeOutletId === out.id ? "default" : "outline"}
                onClick={() => {
                  setActiveOutletId(activeOutletId === out.id ? "" : out.id);
                  setPage(1);
                  updateUrl({ outlet: activeOutletId === out.id ? undefined : out.id });
                }}
                className="shrink-0"
              >
                {out.name}
              </Button>
            ))}
          </div>
        )}

        {/* Dietary filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          <button
            type="button"
            onClick={() => {
              router.push(orgRoute(orgSlug, "/favorites"));
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              initialAction === "whitelist"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-border text-muted-foreground hover:border-red-500 hover:text-red-600",
            )}
          >
            <Heart className={cn("size-4", initialAction === "whitelist" && "fill-current")} aria-hidden />
            <span>Favorites</span>
          </button>
          {/* Dietary filters only make sense for food verticals (vegan/gluten-free/etc.) —
              hidden for retail/pharmacy/services/ticketing where they're meaningless. */}
          {cfg.showDietaryFilters && dietaryFilterOpts.map((filter) => {
            const isActive = activeDietary.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  const next = isActive ? activeDietary.filter((tag) => tag !== filter.value) : [...activeDietary, filter.value];
                  setActiveDietary(next);
                  setPage(1);
                  updateUrl({ dietary: next.length ? next.join(",") : undefined });
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                    : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
                )}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Items grid — denser (4-up) for product-style retail/wholesale verticals,
            comfortable (3-up) for food/services where cards carry more detail. */}
        <div className={cn(
          "grid gap-4 sm:grid-cols-2 sm:gap-6",
          cfg.productLayout === "compact" ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}>
          {isPending && menuItems.length === 0 ? (
            Array.from({ length: 8 }, (_, i) => <MenuItemCardSkeleton key={i} />)
          ) : itemsError && menuItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-xs text-muted-foreground sm:text-sm">
                We couldn&apos;t load the catalog. Please check your connection and try again.
              </p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <p className="text-xs text-muted-foreground sm:text-sm">
                No items match the current filters. Try clearing a filter or
                adjusting your search.
              </p>
            </div>
          ) : (
            menuItems.map((item, idx) => (
              <DiscoveryMenuItem
                key={item.id}
                item={item}
                orgSlug={orgSlug}
                onAddToCart={handleAddToCart}
                cfg={cfg}
                index={idx}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
              }}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} items)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <AddToCartModal item={modalItem} onClose={() => setModalItem(null)} />
    </section>
  );
}
