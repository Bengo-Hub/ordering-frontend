"use client";

/**
 * RetailHomeView — the retail/pharmacy/wholesale homepage. Unlike FoodHomeView
 * (Uber-Eats-shaped, outlet-ranking sections), this leads with browsing the
 * catalog: a "Shop by Category" sidebar, a hero banner, Flash Sales, Top Deals
 * (real best-sellers), New Arrivals, Products by Category, Top Brands, then a
 * plain store grid. No fork-and-knife outlet leaderboards ("Most reviewed" /
 * "Top 10 local spots") — those read as food-delivery concepts that don't fit
 * a hardware/general-goods storefront.
 */

import { Headset, MapPin, ShieldCheck, Tag, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CategorySidebar } from "@/components/category/category-sidebar";
import {
  FeaturedItemCard,
  type FeaturedItemProps,
} from "@/components/catalog/featured-item-card";
import { toCardProps } from "@/components/home/home-helpers";
import { SiteShell } from "@/components/layout/site-shell";
import { OutletSection } from "@/components/outlet/outlet-section";
import { FlashSaleStrip } from "@/components/promo/flash-sale-strip";
import { PromoBannerCarousel, type PromoBanner } from "@/components/promo/promo-banner-carousel";
import { Button } from "@/components/ui/button";
import { useBrands, useCategories, useCatalogItems, useOutlets } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { usePromoBanners } from "@/hooks/use-promo-banners";
import { usePromoDeals } from "@/hooks/use-promo-deals";
import { useTopSellers } from "@/hooks/use-top-sellers";
import { buildCategoryTree } from "@/lib/category-tree";
import { applyDeal, dealBadge, resolveDealItems } from "@/lib/api/promo-deals";
import { rankBestSellers } from "@/lib/api/top-sellers";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import type { MenuItem } from "@/types/catalog";

const TRUST_BADGES = [
  { icon: Truck, label: "Fast Delivery" },
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Tag, label: "Best Prices" },
  { icon: Headset, label: "24/7 Support" },
];

/** Number of top-level categories to render a "Products by Category" row for — capped so the
 *  homepage doesn't grow unbounded on tenants with many categories. */
const MAX_CATEGORY_ROWS = 4;

function itemToCardProps(
  item: MenuItem,
  orgSlug: string,
  useCase: string,
): FeaturedItemProps {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    currency: item.currency ?? "KES",
    ...(item.image ? { image: item.image } : {}),
    outletId: item.outletId,
    outletName: item.outletName,
    category: item.category,
    useCase,
    href: orgRoute(orgSlug, `/catalog/${item.id}`),
  };
}

/** One "Products by Category" row — its own component so each category's item fetch is a
 *  proper per-instance hook call (mapping over N of these, rather than looping useCatalogItems
 *  inside one component, keeps this rules-of-hooks-safe regardless of how many categories a
 *  tenant has). Renders nothing while the category has no items yet. */
function CategoryProductsRow({
  categoryId,
  categoryName,
  orgSlug,
  useCase,
}: {
  categoryId: string;
  categoryName: string;
  orgSlug: string;
  useCase: string;
}) {
  const { data } = useCatalogItems(orgSlug, { category: categoryId }, 1, 8);
  const items = data?.data ?? [];
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h2 className="text-base font-bold text-foreground sm:text-xl">{categoryName}</h2>
        <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
          <Link href={orgRoute(orgSlug, `/catalog?category=${categoryId}`)}>See all</Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {items.map((item) => (
          <FeaturedItemCard key={item.id} {...itemToCardProps(item, orgSlug, useCase)} className="w-full" />
        ))}
      </div>
    </div>
  );
}

export function RetailHomeView() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const { profile, useCase: effectiveUseCase, copy } = useOrderingConfig();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: categoriesData } = useCategories(orgSlug, undefined, effectiveUseCase);
  const { data: itemsPage } = useCatalogItems(orgSlug, {}, 1, 60);
  const { data: newArrivalsPage } = useCatalogItems(orgSlug, { sort: "newest" }, 1, 8);
  const { data: promoBanners } = usePromoBanners(effectiveUseCase);
  const { data: deals } = usePromoDeals();
  const { data: topSellerSales } = useTopSellers();
  const { data: brands } = useBrands(orgSlug);
  const { data: outletsPage, isLoading: outletsLoading } = useOutlets(
    orgSlug,
    { sort: "relevance" },
    1,
    50,
  );

  const categories = categoriesData ?? [];
  const items = itemsPage?.data ?? [];

  // Flash Sales: discount-driven (per the explicit spec, falls back to any item with a
  // discount price set when no promo is flagged is_flash_sale — resolveDealItems already
  // produces exactly this shape for non-flash-sale discounts too, nothing extra to build).
  const dealItems = useMemo(
    () => resolveDealItems(items, deals ?? []).slice(0, 12),
    [items, deals],
  );
  const flashSaleItems: FeaturedItemProps[] = useMemo(
    () =>
      dealItems.map(({ item, deal }) => {
        const discounted = applyDeal(item.price, deal.rule);
        const badge = dealBadge(deal.rule);
        const percentOff =
          badge && deal.rule?.discountType === "percentage" ? deal.rule.discountValue : undefined;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: discounted,
          currency: item.currency ?? "KES",
          ...(item.image ? { image: item.image } : {}),
          outletId: item.outletId,
          outletName: item.outletName,
          category: item.category,
          useCase: profile,
          href: orgRoute(orgSlug, `/catalog/${item.id}`),
          ...(percentOff != null ? { discountPercent: percentOff } : {}),
          originalPrice: item.price,
          isFlashSale: deal.isFlashSale,
          dealEndsAt: deal.endAt,
        };
      }),
    [dealItems, orgSlug, profile],
  );
  const flashSaleEndsAt = useMemo(() => {
    const activeCountdowns = dealItems
      .filter(({ deal }) => deal.isFlashSale && deal.endAt)
      .map(({ deal }) => deal.endAt as string);
    return activeCountdowns.length > 0 ? activeCountdowns.sort()[0] : null;
  }, [dealItems]);

  // Top Deals: real best-sellers (units sold, trailing 90 days), NOT discounts — matches the
  // reference, where these cards carry no discount badge. Falls back gracefully to whatever
  // items are loaded when no sales history exists yet (a new/low-volume catalog still fills
  // the section — see rankBestSellers' own doc comment).
  const topDeals: FeaturedItemProps[] = useMemo(() => {
    const ranked = rankBestSellers(items, topSellerSales ?? [], 8);
    return ranked.map((item) => itemToCardProps(item, orgSlug, profile));
  }, [items, topSellerSales, orgSlug, profile]);

  const newArrivalItems = newArrivalsPage?.data ?? [];
  const newArrivals: FeaturedItemProps[] = useMemo(
    () => newArrivalItems.map((item) => itemToCardProps(item, orgSlug, profile)),
    [newArrivalItems, orgSlug, profile],
  );

  // Products by Category: first few top-level categories that actually have items.
  const categoryRows = useMemo(
    () => buildCategoryTree(categories).slice(0, MAX_CATEGORY_ROWS),
    [categories],
  );

  const handleFavoriteToggle = (id: string, isFavorite: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    if (id === "all") {
      router.push(orgRoute(orgSlug, "/catalog"));
    } else {
      router.push(orgRoute(orgSlug, `/catalog?category=${id}`));
    }
  };

  const storeOutlets = useMemo(
    () => (outletsPage?.data ?? []).map((o) => toCardProps(o, orgSlug, effectiveUseCase)),
    [outletsPage, orgSlug, effectiveUseCase],
  );
  // A single-outlet retail tenant (the common case) gains nothing from a "Browse Stores" grid
  // with exactly one card in it — that reads as broken, not as a feature. Multi-outlet chains
  // still get the section.
  const showBrowseStores = storeOutlets.length > 1;

  // Hero banner: always show something — a tenant with zero configured promo banners gets a
  // generic placeholder (never blank), a tenant with real banners gets exactly those (the
  // placeholder never mixes in alongside a real one). `promoBanners` is undefined while
  // loading; only fall back once the fetch has actually resolved to an empty array.
  const heroBanners: PromoBanner[] = useMemo(() => {
    if (promoBanners != null && promoBanners.length > 0) return promoBanners;
    if (promoBanners == null) return [];
    return [
      {
        id: "default-hero",
        title: copy.heroTitle,
        subtitle: copy.heroSubtitle,
        ctaText: "Shop Now",
        ctaLink: orgRoute(orgSlug, "/catalog"),
        useCase: effectiveUseCase,
      },
    ];
  }, [promoBanners, copy.heroTitle, copy.heroSubtitle, orgSlug, effectiveUseCase]);

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-8">
          {/* Shop by Category — left rail on desktop, drill-in accordion on mobile */}
          {categories.length > 0 && (
            <aside className="mb-5 md:mb-0">
              <CategorySidebar
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                useCase={effectiveUseCase}
              />
            </aside>
          )}

          <div className="min-w-0">
            {/* Hero / marketing banner */}
            {heroBanners.length > 0 && (
              <div className="mb-6">
                <PromoBannerCarousel banners={heroBanners} />
              </div>
            )}

            {/* Flash Sales — discount-driven, distinct from Top Deals below */}
            {flashSaleItems.length > 0 && (
              <div className="mb-6">
                <FlashSaleStrip
                  items={flashSaleItems}
                  endsAt={flashSaleEndsAt}
                  seeAllHref={orgRoute(orgSlug, "/catalog?filter=flash_sale")}
                />
              </div>
            )}

            {/* Top Deals — real best-sellers */}
            {topDeals.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground sm:text-xl">Top Deals</h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Our best-selling {copy.itemLabelPlural.toLowerCase()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
                    <Link href={orgRoute(orgSlug, "/catalog?sort=best_selling")}>See all</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                  {topDeals.map((item) => (
                    <FeaturedItemCard key={item.id} {...item} className="w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground sm:text-xl">New Arrivals</h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Fresh {copy.itemLabelPlural.toLowerCase()} just added
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
                    <Link href={orgRoute(orgSlug, "/catalog?sort=newest")}>See all</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                  {newArrivals.map((item) => (
                    <FeaturedItemCard key={item.id} {...item} className="w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* Products by Category */}
            {categoryRows.map((cat) => (
              <CategoryProductsRow
                key={cat.id}
                categoryId={cat.id}
                categoryName={cat.name}
                orgSlug={orgSlug}
                useCase={profile}
              />
            ))}

            {/* Top Brands */}
            {brands != null && brands.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-xl">
                  Shop by Brand
                </h2>
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 sm:gap-4">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={orgRoute(orgSlug, `/catalog?brand=${brand.id}`)}
                      className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition hover:shadow-md sm:w-28"
                    >
                      <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-muted sm:size-16">
                        {brand.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={brand.logoUrl} alt={brand.name} className="size-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-1 text-xs font-medium text-foreground">{brand.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse stores — multi-outlet tenants only */}
      {showBrowseStores && (
        <OutletSection
          title={`Browse ${copy.outletLabelPlural}`}
          subtitle={`All ${copy.outletLabelPlural.toLowerCase()} on ${copy.brandSuffix}`}
          icon={<MapPin className="size-5" />}
          outlets={storeOutlets}
          isLoading={outletsLoading}
          variant="grid"
          favorites={favorites}
          onFavoriteToggle={handleFavoriteToggle}
          className="bg-muted/30"
        />
      )}

      {/* Trust badge strip */}
      <section className="border-t border-border py-8 sm:py-10">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-3 sm:grid-cols-4 sm:gap-6 sm:px-4 lg:px-8">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{copy.heroTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{copy.heroSubtitle}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="min-h-[48px] sm:px-8">
              <Link href={orgRoute(orgSlug, "/catalog")}>Browse Catalog</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="min-h-[48px] sm:px-8">
              <Link href={orgRoute(orgSlug, "/auth")}>Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
