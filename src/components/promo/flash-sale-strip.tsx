"use client";

/**
 * FlashSaleStrip — the "Flash Sales · Live Now" bannered carousel on the retail homepage.
 * Distinct from the "Top Deals" rail (real best-sellers, see hooks/use-top-sellers.ts) — this
 * section is discount-driven, reusing the existing deal/countdown machinery
 * (resolveDealItems/applyDeal/dealBadge/useCountdown, lib/api/promo-deals.ts) rather than
 * reinventing it. Renders nothing when there are truly no discounted items to show.
 */

import { Zap } from "lucide-react";
import Link from "next/link";

import { FeaturedItemCard, FeaturedItemsCarousel, type FeaturedItemProps } from "@/components/catalog/featured-item-card";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

export interface FlashSaleStripProps {
  items: FeaturedItemProps[];
  /** Earliest active flash-sale end time across `items`, drives the shared header countdown.
   *  Null/undefined when the section is showing plain (non-time-boxed) discounted items. */
  endsAt?: string | null;
  seeAllHref: string;
  className?: string;
}

export function FlashSaleStrip({ items, endsAt, seeAllHref, className }: FlashSaleStripProps) {
  const countdown = useCountdown(endsAt);

  if (items.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-3 text-white shadow-sm sm:rounded-3xl sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <Zap className="size-5 fill-white text-white sm:size-6" />
          <h2 className="text-base font-bold sm:text-xl">Flash Sales</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs">
            Live Now
          </span>
          {countdown && (
            <span className="hidden rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold sm:inline-block">
              {countdown}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 bg-white text-red-700 hover:bg-white/90"
          asChild
        >
          <Link href={seeAllHref}>See All</Link>
        </Button>
      </div>
      <div className="rounded-xl bg-background/95 p-2 sm:rounded-2xl sm:p-3">
        <FeaturedItemsCarousel>
          {items.map((item) => (
            <FeaturedItemCard key={item.id} {...item} />
          ))}
        </FeaturedItemsCarousel>
      </div>
    </section>
  );
}
