"use client";

import {
  Loader2,
  MapPin,
  Pill as PillIcon,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Ticket,
  Truck,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LegalLinks } from "@bengo-hub/shared-ui-lib/legal";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CountdownBoxes, CountdownText } from "@/components/storefront/countdown-boxes";
import { DealCard, DealCardSkeleton } from "@/components/storefront/deal-card";
import { Pill, SectionHeader } from "@/components/storefront/section-header";
import { StoreCard, StoreCardSkeleton } from "@/components/storefront/store-card";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { brand } from "@/config/brand";
import { useMarketplaceDeals, useMarketplaceTenants } from "@/hooks/use-marketplace-tenants";
import type { MarketplaceBanner, MarketplaceTenant } from "@/lib/api/marketplace";
import { PLATFORM_GEO_SLUG, shortPlaceName } from "@/lib/api/delivery";
import { applyDeal } from "@/lib/api/promo-deals";
import { orgRoute } from "@/lib/routes";
import { normalizeOrderingUseCase, type OrderingProfile } from "@/lib/use-case-config";
import { cn } from "@/lib/utils";
import { useDiningModeStore } from "@/store/dining-mode";

/** Store groups for the "Shop by store" chips, in display order. */
const GROUPS: { key: string; label: string; profiles: OrderingProfile[] }[] = [
  { key: "shops", label: "Shops", profiles: ["retail", "wholesale", "general"] },
  { key: "food", label: "Restaurants", profiles: ["hospitality", "quick_service"] },
  { key: "pharmacy", label: "Pharmacy", profiles: ["pharmacy"] },
  { key: "services", label: "Services", profiles: ["services"] },
  { key: "events", label: "Events", profiles: ["ticketing"] },
];

const GROUP_ICON: Record<string, LucideIcon> = {
  shops: ShoppingBag,
  food: UtensilsCrossed,
  pharmacy: PillIcon,
  services: Scissors,
  events: Ticket,
};

/** How long each hero slide stays before the next, when there is more than one. */
const SLIDE_MS = 6000;

const tenantProfile = (t: MarketplaceTenant) =>
  normalizeOrderingUseCase(t.useCase ?? t.useCases?.[0]);

/**
 * The platform marketplace (root, no tenant slug), following the Codevertex storefront scene:
 * a dark hero, "Shop by store" logo cards and live flash deals. Every section is built from real
 * data and hides when there is none: the hero only counts down to a real promotion's end, the
 * deals rail only lists products on live promotions, and the promo tiles are real store banners
 * (or plain facts about ordering here when no store has one).
 */
export function MarketplaceLanding() {
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const tenantsQuery = useMarketplaceTenants(undefined, 24);
  const { data: dealsData, isLoading: dealsLoading } = useMarketplaceDeals();

  const tenants = useMemo(
    () => tenantsQuery.data?.pages.flatMap((p) => p.tenants) ?? [],
    [tenantsQuery.data],
  );
  const total = tenantsQuery.data?.pages[0]?.total ?? 0;

  // Only offer chips for groups that have stores.
  const groups = useMemo(
    () => GROUPS.filter((g) => tenants.some((t) => g.profiles.includes(tenantProfile(t)))),
    [tenants],
  );
  const shown = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    const q = query.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        (!g || g.profiles.includes(tenantProfile(t))) && (!q || t.name.toLowerCase().includes(q)),
    );
  }, [tenants, group, query]);

  const deals = useMemo(() => dealsData?.deals ?? [], [dealsData]);
  const banners = dealsData?.banners ?? [];
  const flashEnd = useMemo(() => {
    const ends = [
      ...deals.filter((d) => d.promotion.isFlashSale).map((d) => d.promotion.endAt),
      ...banners.filter((b) => b.isFlashSale).map((b) => b.endAt),
    ]
      .filter((e): e is string => !!e)
      .sort();
    return ends[0] ?? null;
  }, [deals, banners]);
  const bestSaving = useMemo(
    () =>
      deals.reduce((best, d) => {
        const pct =
          d.item.price > 0
            ? Math.round(
                ((d.item.price - applyDeal(d.item.price, d.promotion.rule)) / d.item.price) * 100,
              )
            : 0;
        return Math.max(best, pct);
      }, 0),
    [deals],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header query={query} onQuery={setQuery} hasDeals={deals.length > 0} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* Jumia-style hero: store-type rail, rotating carousel, two tiles (desktop); the carousel
            and a row of round shortcuts on phones. Every slide, tile and shortcut is real. */}
        <section
          className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)_18rem] xl:grid-cols-[14rem_minmax(0,1fr)_20rem]"
          aria-label="Highlights"
        >
          <nav
            aria-label="Store types"
            className="hidden rounded-3xl border border-border bg-card p-3 lg:block"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-semibold text-muted-foreground">
              Shop by type
            </p>
            <ul className="space-y-0.5">
              {groups.map((g) => {
                const Icon = GROUP_ICON[g.key] ?? Store;
                const count = tenants.filter((t) => g.profiles.includes(tenantProfile(t))).length;
                return (
                  <li key={g.key}>
                    <button
                      onClick={() => {
                        setGroup(g.key);
                        document.getElementById("stores")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      <Icon className="size-4 text-primary" />
                      <span className="flex-1">{g.label}</span>
                      <span className="tabular text-xs text-muted-foreground">{count}</span>
                    </button>
                  </li>
                );
              })}
              {deals.length > 0 && (
                <li>
                  <a
                    href="#deals"
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <Zap className="size-4 text-sale" />
                    <span className="flex-1">Deals</span>
                    <span className="tabular text-xs text-muted-foreground">{deals.length}</span>
                  </a>
                </li>
              )}
            </ul>
          </nav>
          <HeroCarousel
            slides={[
              <Hero
                key="hero"
                deals={deals}
                tenants={tenants}
                flashEnd={flashEnd}
                bestSaving={bestSaving}
              />,
              ...banners.slice(2).map((b) => <BannerSlide key={b.promoId} banner={b} />),
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {banners.length > 0 ? (
              banners.slice(0, 2).map((b, i) => (
                <Link
                  key={b.promoId}
                  href={`/${b.store.slug}`}
                  className={cn(
                    "flex items-center gap-4 rounded-3xl p-4 transition-shadow hover:shadow-floating sm:p-5",
                    i === 0
                      ? "bg-gold/15 text-night dark:text-white"
                      : "bg-brand-surface text-night dark:bg-secondary dark:text-white",
                  )}
                >
                  <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-white sm:size-28">
                    <ImageWithFallback
                      src={b.imageUrl ?? b.store.logoUrl}
                      alt=""
                      fill
                      sizes="112px"
                      className={b.imageUrl ? "object-cover" : "object-contain p-2"}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-bold leading-tight">
                      {b.title || b.name}
                    </span>
                    <span className="mt-1 block text-sm opacity-80">
                      {b.store.name}
                      {b.subtitle ? `, ${b.subtitle}` : ""}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <>
                <FactTile
                  icon={<Smartphone className="size-7" />}
                  title="Pay with M-Pesa"
                  body="Pay on your phone at checkout and get the receipt on WhatsApp."
                  tone="gold"
                />
                <FactTile
                  icon={<Truck className="size-7" />}
                  title="Track it to your door"
                  body="Follow your order from the shop to the rider and your door."
                  tone="plum"
                />
              </>
            )}
          </div>
        </section>

        {/* Round shortcuts (the icon row under Jumia's hero), only for store types that exist. */}
        {groups.length > 0 && (
          <nav
            aria-label="Shortcuts"
            className="scrollbar-hide -mx-1 -mt-4 flex gap-4 overflow-x-auto px-1 pb-1 sm:gap-6 lg:hidden"
          >
            {[
              ...(deals.length > 0 ? [{ key: "deals", label: "Deals", href: "#deals" }] : []),
              ...groups.map((g) => ({ key: g.key, label: g.label, href: "#stores" })),
            ].map((s) => {
              const Icon = s.key === "deals" ? Zap : (GROUP_ICON[s.key] ?? Store);
              return (
                <a
                  key={s.key}
                  href={s.href}
                  onClick={() => s.key !== "deals" && setGroup(s.key)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center text-xs font-medium text-foreground"
                >
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full",
                      s.key === "deals" ? "bg-sale/10 text-sale" : "bg-secondary text-primary",
                    )}
                  >
                    <Icon className="size-6" />
                  </span>
                  {s.label}
                </a>
              );
            })}
          </nav>
        )}

        <section aria-labelledby="stores-heading" id="stores">
          <SectionHeader
            id="stores-heading"
            title="Shop by store"
            pill={
              total > 0 ? (
                <Pill>
                  {total} {total === 1 ? "store" : "stores"}
                </Pill>
              ) : undefined
            }
          />
          {groups.length > 1 && (
            <div
              className="scrollbar-hide -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1"
              role="tablist"
              aria-label="Store type"
            >
              {[{ key: "all", label: "All" }, ...groups].map((g) => (
                <button
                  key={g.key}
                  role="tab"
                  aria-selected={group === g.key}
                  onClick={() => setGroup(g.key)}
                  className={cn(
                    "min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
                    group === g.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
          {tenantsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <StoreCardSkeleton key={i} />
              ))}
            </div>
          ) : tenantsQuery.isError ? (
            <EmptyState text="We could not load the stores right now. Please try again in a moment." />
          ) : shown.length === 0 ? (
            <EmptyState
              text={query ? `No store matches "${query}".` : "No stores here yet. Check back soon."}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {shown.map((t) => (
                <StoreCard
                  key={t.id}
                  slug={t.slug}
                  name={t.name}
                  logoUrl={t.logoUrl}
                  useCase={t.useCase ?? t.useCases?.[0]}
                />
              ))}
            </div>
          )}
          {tenantsQuery.hasNextPage && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => tenantsQuery.fetchNextPage()}
                disabled={tenantsQuery.isFetchingNextPage}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                {tenantsQuery.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
                Show more stores
              </button>
            </div>
          )}
        </section>

        {(dealsLoading || deals.length > 0) && (
          <section aria-labelledby="deals-heading" id="deals">
            <SectionHeader
              id="deals-heading"
              title={flashEnd ? "Flash deals" : "Deals"}
              pill={
                flashEnd ? (
                  <Pill tone="sale">
                    <CountdownText endAt={flashEnd} />
                  </Pill>
                ) : undefined
              }
              subtitle="Prices from live promotions at these stores"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {dealsLoading
                ? Array.from({ length: 5 }).map((_, i) => <DealCardSkeleton key={i} />)
                : deals.map((d) => (
                    <DealCard
                      key={`${d.store.slug}-${d.item.sku}`}
                      href={orgRoute(d.store.slug, `/catalog/${encodeURIComponent(d.item.sku)}`)}
                      name={d.item.name}
                      storeName={d.store.name}
                      storeLogo={d.store.logoUrl}
                      imageUrl={d.item.imageUrl}
                      useCase={normalizeOrderingUseCase(d.store.useCase)}
                      currency={d.item.currency}
                      price={d.item.price}
                      dealPrice={applyDeal(d.item.price, d.promotion.rule)}
                      availableQuantity={d.item.availableQuantity}
                    />
                  ))}
            </div>
          </section>
        )}

        <section
          className="grid gap-3 rounded-3xl border border-border bg-card p-5 sm:grid-cols-3 sm:p-6"
          aria-label="Ordering here"
        >
          {[
            {
              icon: <MapPin className="size-5" />,
              title: "Local stores",
              body: "Real shops, restaurants and service providers near you.",
            },
            {
              icon: <Smartphone className="size-5" />,
              title: "M-Pesa or card",
              body: "Pay the way you already do, with a receipt on WhatsApp.",
            },
            {
              icon: <ShieldCheck className="size-5" />,
              title: "Order tracking",
              body: "See when it is packed, picked up and on the way.",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                {f.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{f.title}</span>
                <span className="block text-sm text-muted-foreground">{f.body}</span>
              </span>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header({
  query,
  onQuery,
  hasDeals,
}: {
  query: string;
  onQuery: (v: string) => void;
  hasDeals: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label={`${brand.name} home`}>
          <Image
            src={brand.assets.logoFull}
            alt={brand.name}
            width={96}
            height={47}
            priority
            className="h-9 w-auto dark:hidden"
          />
          <Image
            src={brand.assets.logoFullOnDark}
            alt={brand.name}
            width={96}
            height={47}
            priority
            className="hidden h-9 w-auto dark:block"
          />
        </Link>
        <label className="relative flex min-w-0 max-w-xl flex-1 items-center">
          <span className="sr-only">Search stores</span>
          <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                document.getElementById("stores")?.scrollIntoView({ behavior: "smooth" });
            }}
            placeholder="Search stores"
            className="h-11 w-full rounded-full border border-border bg-mist pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none dark:bg-muted"
          />
        </label>
        <nav
          className="hidden items-center gap-5 text-sm font-semibold md:flex"
          aria-label="Sections"
        >
          <a href="#stores" className="hover:text-primary">
            Stores
          </a>
          {hasDeals && (
            <a href="#deals" className="hover:text-primary">
              Deals
            </a>
          )}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

function Hero({
  deals,
  tenants,
  flashEnd,
  bestSaving,
}: {
  deals: { item: { imageUrl?: string; name: string } }[];
  tenants: MarketplaceTenant[];
  flashEnd: string | null;
  bestSaving: number;
}) {
  const deliveryLocation = useDiningModeStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useDiningModeStore((s) => s.setDeliveryLocation);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  // Asked only when the shopper taps the button, never on page load.
  const locate = () => {
    if (!("geolocation" in navigator)) {
      setDenied(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const address =
          (await shortPlaceName(PLATFORM_GEO_SLUG, coords.latitude, coords.longitude)) ??
          "Current location";
        setDeliveryLocation({ address, latitude: coords.latitude, longitude: coords.longitude });
        setLocating(false);
      },
      () => {
        setDenied(true);
        setLocating(false);
      },
    );
  };

  const pictures = deals.filter((d) => d.item.imageUrl).slice(0, 3);
  const logos = tenants.filter((t) => t.logoUrl).slice(0, 3);
  const title = flashEnd
    ? "Flash sale across your local stores"
    : deals.length > 0
      ? "Deals from your local stores"
      : "Shop your local stores";

  return (
    <div className="relative flex min-h-[15rem] flex-col justify-center overflow-hidden rounded-3xl bg-night p-6 text-white ring-1 ring-transparent dark:bg-card dark:ring-white/10 sm:p-8">
      {bestSaving > 0 && (
        <span className="absolute right-5 top-5 z-10 rounded-full bg-gold px-3.5 py-1.5 text-sm font-extrabold text-night">
          Up to {bestSaving}% off
        </span>
      )}
      <div className="relative z-10 max-w-md lg:max-w-[55%]">
        <h1 className="font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-3 text-[15px] text-white/80">
          Many shops in one place. Pay with M-Pesa and track your rider to the door.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {flashEnd ? (
            <CountdownBoxes endAt={flashEnd} />
          ) : (
            <a
              href="#stores"
              className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-night hover:brightness-105"
            >
              Browse stores
            </a>
          )}
          {deliveryLocation ? (
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/20 px-4 text-sm">
              <MapPin className="size-4" />
              {deliveryLocation.address}
            </span>
          ) : (
            <button
              onClick={locate}
              disabled={locating}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/25 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-70"
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MapPin className="size-4" />
              )}
              {denied ? "Location unavailable" : "Use my location"}
            </button>
          )}
        </div>
      </div>
      {/* Product photos from live deals, or store logos when there are none. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-[3%] hidden w-[38%] lg:block"
        aria-hidden
      >
        {(pictures.length > 0
          ? pictures.map((p) => p.item.imageUrl)
          : logos.map((t) => t.logoUrl)
        ).map((src, i) => (
          <span
            key={`${src}-${i}`}
            className={cn(
              "absolute aspect-square w-[42%] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-floating",
              i === 0 && "left-0 top-[38%] -rotate-6",
              i === 1 && "left-[30%] top-[18%] z-10 rotate-[5deg]",
              i === 2 && "left-[58%] top-[44%] -rotate-2",
            )}
          >
            <ImageWithFallback
              src={src}
              alt=""
              fill
              sizes="200px"
              className={pictures.length > 0 ? "object-cover" : "object-contain p-3"}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The hero's slides, one at a time. With more than one it moves on every SLIDE_MS, pauses while
 * hovered or focused, never moves for people who ask for reduced motion, and has dots to pick a
 * slide. With one slide it is just that slide.
 */
function HeroCarousel({ slides }: { slides: React.ReactNode[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  const active = Math.min(index, count - 1);
  return (
    <div
      className="relative min-w-0"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          hidden={i !== active}
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          className="h-full"
        >
          {slide}
        </div>
      ))}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active ? "w-6 bg-gold" : "w-2 bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A store's storefront banner as a hero slide, linking to the store. */
function BannerSlide({ banner }: { banner: MarketplaceBanner }) {
  return (
    <Link
      href={`/${banner.store.slug}`}
      className="relative flex h-full min-h-[15rem] items-center gap-6 overflow-hidden rounded-3xl bg-night p-6 text-white dark:bg-card dark:ring-1 dark:ring-white/10 sm:p-8"
    >
      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-sm font-semibold text-gold">{banner.store.name}</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          {banner.title || banner.name}
        </h2>
        {banner.subtitle && <p className="mt-2 text-white/80">{banner.subtitle}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {banner.isFlashSale && banner.endAt ? <CountdownBoxes endAt={banner.endAt} /> : null}
          <span className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-night">
            Shop now
          </span>
        </div>
      </div>
      {(banner.imageUrl || banner.store.logoUrl) && (
        <span className="relative hidden aspect-square w-[36%] shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white sm:block">
          <ImageWithFallback
            src={banner.imageUrl ?? banner.store.logoUrl}
            alt=""
            fill
            sizes="280px"
            className={banner.imageUrl ? "object-cover" : "object-contain p-4"}
          />
        </span>
      )}
    </Link>
  );
}

function FactTile({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "gold" | "plum";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-3xl p-5",
        tone === "gold"
          ? "bg-gold/15 text-night dark:text-white"
          : "bg-brand-surface text-night dark:bg-secondary dark:text-white",
      )}
    >
      <span
        className={cn(
          "flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white",
          tone === "gold" ? "text-gold" : "text-brand",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block font-display text-lg font-bold leading-tight">{title}</span>
        <span className="mt-1 block text-sm opacity-80">{body}</span>
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function Footer() {
  const site = "https://codevertexafrica.com";
  return (
    <footer className="mt-12 bg-night text-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src={brand.assets.logoFullOnDark}
            alt={brand.name}
            width={96}
            height={47}
            className="h-9 w-auto"
          />
          <span className="text-sm">
            &copy; {new Date().getFullYear()} Codevertex Africa Limited
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <a href={`${site}/pricing`} className="hover:text-white">
            Sell here
          </a>
          <a href={`${site}/contact`} className="hover:text-white">
            Contact
          </a>
        </nav>
      </div>
      {/* The shared legal pages, cookie settings and registered company line every app mounts. */}
      <div className="mx-auto w-full max-w-7xl border-t border-white/10 px-4 py-4 sm:px-6 lg:px-8">
        <LegalLinks
          layout="row"
          showEntity
          className="text-xs text-white/70 [&_a:hover]:text-white [&_button:hover]:text-white"
        />
      </div>
    </footer>
  );
}
