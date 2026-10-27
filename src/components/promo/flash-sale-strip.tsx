"use client";

/**
 * FlashSaleStrip: the deals panel on the retail homepage, titled "Flash sales" with a countdown
 * when a real flash sale ends at a known time, "Deals" otherwise. Distinct from the best-sellers
 * rail (real sales, see hooks/use-top-sellers.ts): this section is discount-driven, reusing the existing deal/countdown machinery
 * (resolveDealItems/applyDeal/dealBadge/useCountdown, lib/api/promo-deals.ts) rather than
 * reinventing it. Renders nothing when there are truly no discounted items to show.
 */

import { Zap } from "lucide-react";
import Link from "next/link";

import {
  FeaturedItemCard,
  FeaturedItemsCarousel,
  type FeaturedItemProps,
} from "@/components/catalog/featured-item-card";
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
    <section className={cn("rounded-3xl bg-night p-3 text-white sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Zap className="size-5 fill-gold text-gold sm:size-6" />
          <h2 className="font-display text-base font-bold sm:text-xl">
            {endsAt ? "Flash sales" : "Deals"}
          </h2>
          {countdown && (
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-night">
              {countdown}
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0 rounded-full bg-gold font-semibold text-night hover:bg-gold/90"
          asChild
        >
          <Link href={seeAllHref}>See all</Link>
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
