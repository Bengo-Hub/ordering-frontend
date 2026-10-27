"use client";

import { Loader2, MapPin, Search, ShieldCheck, Smartphone, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { LegalLinks } from "@bengo-hub/shared-ui-lib/legal";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CountdownBoxes, CountdownText } from "@/components/storefront/countdown-boxes";
import { DealCard, DealCardSkeleton } from "@/components/storefront/deal-card";
import { Pill, SectionHeader } from "@/components/storefront/section-header";
import { StoreCard, StoreCardSkeleton } from "@/components/storefront/store-card";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { brand } from "@/config/brand";
import { useMarketplaceDeals, useMarketplaceTenants } from "@/hooks/use-marketplace-tenants";
import type { MarketplaceTenant } from "@/lib/api/marketplace";
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

const tenantProfile = (t: MarketplaceTenant) => normalizeOrderingUseCase(t.useCase ?? t.useCases?.[0]);

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

  const tenants = useMemo(() => tenantsQuery.data?.pages.flatMap((p) => p.tenants) ?? [], [tenantsQuery.data]);
  const total = tenantsQuery.data?.pages[0]?.total ?? 0;

  // Only offer chips for groups that have stores.
  const groups = useMemo(
    () => GROUPS.filter((g) => tenants.some((t) => g.profiles.includes(tenantProfile(t)))),
    [tenants],
  );
  const shown = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => (!g || g.profiles.includes(tenantProfile(t))) && (!q || t.name.toLowerCase().includes(q)));
  }, [tenants, group, query]);

  const deals = useMemo(() => dealsData?.deals ?? [], [dealsData]);
  const banners = dealsData?.banners ?? [];
  const flashEnd = useMemo(() => {
    const ends = [...deals.filter((d) => d.promotion.isFlashSale).map((d) => d.promotion.endAt), ...banners.filter((b) => b.isFlashSale).map((b) => b.endAt)]
      .filter((e): e is string => !!e)
      .sort();
    return ends[0] ?? null;
  }, [deals, banners]);
  const bestSaving = useMemo(
    () =>
      deals.reduce((best, d) => {
        const pct = d.item.price > 0 ? Math.round(((d.item.price - applyDeal(d.item.price, d.promotion.rule)) / d.item.price) * 100) : 0;
        return Math.max(best, pct);
      }, 0),
    [deals],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header query={query} onQuery={setQuery} hasDeals={deals.length > 0} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]" aria-label="Highlights">
          <Hero deals={deals} tenants={tenants} flashEnd={flashEnd} bestSaving={bestSaving} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {banners.length > 0 ? (
              banners.slice(0, 2).map((b, i) => (
                <Link
                  key={b.promoId}
                  href={`/${b.store.slug}`}
                  className={cn(
                    "flex items-center gap-4 rounded-3xl p-4 transition-shadow hover:shadow-floating sm:p-5",
                    i === 0 ? "bg-gold/15 text-night dark:text-white" : "bg-brand-surface text-night dark:bg-secondary dark:text-white",
                  )}
                >
                  <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-white sm:size-28">
                    <ImageWithFallback src={b.imageUrl ?? b.store.logoUrl} alt="" fill sizes="112px" className={b.imageUrl ? "object-cover" : "object-contain p-2"} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-display block text-lg font-bold leading-tight">{b.title || b.name}</span>
                    <span className="mt-1 block text-sm opacity-80">
                      {b.store.name}
                      {b.subtitle ? `, ${b.subtitle}` : ""}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <>
                <FactTile icon={<Smartphone className="size-7" />} title="Pay with M-Pesa" body="Pay on your phone at checkout and get the receipt on WhatsApp." tone="gold" />
                <FactTile icon={<Truck className="size-7" />} title="Track it to your door" body="Follow your order from the shop to the rider and your door." tone="plum" />
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="stores-heading" id="stores">
          <SectionHeader
            id="stores-heading"
            title="Shop by store"
            pill={total > 0 ? <Pill>{total} {total === 1 ? "store" : "stores"}</Pill> : undefined}
          />
          {groups.length > 1 && (
            <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide" role="tablist" aria-label="Store type">
              {[{ key: "all", label: "All" }, ...groups].map((g) => (
                <button
                  key={g.key}
                  role="tab"
                  aria-selected={group === g.key}
                  onClick={() => setGroup(g.key)}
                  className={cn(
                    "min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
                    group === g.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary",
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
            <EmptyState text={query ? `No store matches "${query}".` : "No stores here yet. Check back soon."} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {shown.map((t) => (
                <StoreCard key={t.id} slug={t.slug} name={t.name} logoUrl={t.logoUrl} useCase={t.useCase ?? t.useCases?.[0]} />
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

        <section className="grid gap-3 rounded-3xl border border-border bg-card p-5 sm:grid-cols-3 sm:p-6" aria-label="Ordering here">
          {[
            { icon: <MapPin className="size-5" />, title: "Local stores", body: "Real shops, restaurants and service providers near you." },
            { icon: <Smartphone className="size-5" />, title: "M-Pesa or card", body: "Pay the way you already do, with a receipt on WhatsApp." },
            { icon: <ShieldCheck className="size-5" />, title: "Order tracking", body: "See when it is packed, picked up and on the way." },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">{f.icon}</span>
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

function Header({ query, onQuery, hasDeals }: { query: string; onQuery: (v: string) => void; hasDeals: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label={`${brand.name} home`}>
          <Image src={brand.assets.logoFull} alt={brand.name} width={96} height={47} priority className="h-9 w-auto dark:hidden" />
          <Image src={brand.assets.logoFullOnDark} alt={brand.name} width={96} height={47} priority className="hidden h-9 w-auto dark:block" />
        </Link>
        <label className="relative flex min-w-0 max-w-xl flex-1 items-center">
          <span className="sr-only">Search stores</span>
          <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") document.getElementById("stores")?.scrollIntoView({ behavior: "smooth" });
            }}
            placeholder="Search stores"
            className="h-11 w-full rounded-full border border-border bg-mist pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none dark:bg-muted"
          />
        </label>
        <nav className="hidden items-center gap-5 text-sm font-semibold md:flex" aria-label="Sections">
          <a href="#stores" className="hover:text-primary">Stores</a>
          {hasDeals && <a href="#deals" className="hover:text-primary">Deals</a>}
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
        const address = (await shortPlaceName(PLATFORM_GEO_SLUG, coords.latitude, coords.longitude)) ?? "Current location";
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
  const title = flashEnd ? "Flash sale across your local stores" : deals.length > 0 ? "Deals from your local stores" : "Shop your local stores";

  return (
    <div className="relative flex min-h-[15rem] flex-col justify-center overflow-hidden rounded-3xl bg-night p-6 text-white ring-1 ring-transparent dark:bg-card dark:ring-white/10 sm:p-8">
      {bestSaving > 0 && (
        <span className="absolute right-5 top-5 z-10 rounded-full bg-gold px-3.5 py-1.5 text-sm font-extrabold text-night">
          Up to {bestSaving}% off
        </span>
      )}
      <div className="relative z-10 max-w-md lg:max-w-[55%]">
        <h1 className="font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-[2.6rem]">{title}</h1>
        <p className="mt-3 text-[15px] text-white/80">
          Many shops in one place. Pay with M-Pesa and track your rider to the door.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {flashEnd ? (
            <CountdownBoxes endAt={flashEnd} />
          ) : (
            <a href="#stores" className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-night hover:brightness-105">
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
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {denied ? "Location unavailable" : "Use my location"}
            </button>
          )}
        </div>
      </div>
      {/* Product photos from live deals, or store logos when there are none. */}
      <div className="pointer-events-none absolute inset-y-0 right-[3%] hidden w-[38%] lg:block" aria-hidden>
        {(pictures.length > 0 ? pictures.map((p) => p.item.imageUrl) : logos.map((t) => t.logoUrl)).map((src, i) => (
          <span
            key={`${src}-${i}`}
            className={cn(
              "absolute aspect-square w-[42%] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-floating",
              i === 0 && "left-0 top-[38%] -rotate-6",
              i === 1 && "left-[30%] top-[18%] z-10 rotate-[5deg]",
              i === 2 && "left-[58%] top-[44%] -rotate-2",
            )}
          >
            <ImageWithFallback src={src} alt="" fill sizes="200px" className={pictures.length > 0 ? "object-cover" : "object-contain p-3"} />
          </span>
        ))}
      </div>
    </div>
  );
}

function FactTile({ icon, title, body, tone }: { icon: React.ReactNode; title: string; body: string; tone: "gold" | "plum" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-3xl p-5",
        tone === "gold" ? "bg-gold/15 text-night dark:text-white" : "bg-brand-surface text-night dark:bg-secondary dark:text-white",
      )}
    >
      <span className={cn("flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white", tone === "gold" ? "text-gold" : "text-brand")}>{icon}</span>
      <span>
        <span className="font-display block text-lg font-bold leading-tight">{title}</span>
        <span className="mt-1 block text-sm opacity-80">{body}</span>
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">{text}</p>;
}

function Footer() {
  const site = "https://codevertexafrica.com";
  return (
    <footer className="mt-12 bg-night text-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image src={brand.assets.logoFullOnDark} alt={brand.name} width={96} height={47} className="h-9 w-auto" />
          <span className="text-sm">&copy; {new Date().getFullYear()} Codevertex Africa Limited</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <a href={`${site}/pricing`} className="hover:text-white">Sell here</a>
          <a href={`${site}/contact`} className="hover:text-white">Contact</a>
        </nav>
      </div>
      {/* The shared legal pages, cookie settings and registered company line every app mounts. */}
      <div className="mx-auto w-full max-w-7xl border-t border-white/10 px-4 py-4 sm:px-6 lg:px-8">
        <LegalLinks layout="row" showEntity className="text-xs text-white/70 [&_a:hover]:text-white [&_button:hover]:text-white" />
      </div>
    </footer>
  );
}
