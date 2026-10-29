"use client";

import Link from "next/link";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { orgRoute } from "@/lib/routes";
import { useRecentlyViewedStore } from "@/store/recently-viewed";

interface RecentlyViewedRailProps {
  orgSlug: string;
  /** The product on screen, left out of its own row. */
  excludeId?: string | undefined;
  useCase?: string | undefined;
}

/** "Recently viewed": products this browser opened in this store, newest first. Device only. */
export function RecentlyViewedRail({ orgSlug, excludeId, useCase }: RecentlyViewedRailProps) {
  const items = useRecentlyViewedStore((s) => s.byTenant[orgSlug] ?? []).filter(
    (r) => r.id !== excludeId,
  );
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-title" className="space-y-3">
      <h2 id="recently-viewed-title" className="font-semibold text-foreground">
        Recently viewed
      </h2>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={orgRoute(orgSlug, `/catalog/${encodeURIComponent(item.id)}`)}
            className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40"
          >
            <div className="relative aspect-square bg-muted">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                useCase={useCase}
                fill
                className="object-cover"
                sizes="144px"
                iconClassName="size-7"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-1 p-2">
              <p className="line-clamp-2 text-xs font-medium text-foreground">{item.name}</p>
              <span className="text-xs font-semibold text-foreground">{item.priceLabel}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
