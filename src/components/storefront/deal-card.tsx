"use client";

import Link from "next/link";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { cn } from "@/lib/utils";

/** "Only N left" shows when real stock is at or below this. */
const LOW_STOCK = 5;

export interface DealCardProps {
  href: string;
  name: string;
  storeName: string;
  storeLogo?: string | undefined;
  imageUrl?: string | undefined;
  useCase?: string | undefined;
  currency: string;
  price: number;
  dealPrice: number;
  /** Real stock from the catalogue; drives "Only N left". Unknown hides the line. */
  availableQuantity?: number | undefined;
  className?: string;
}

const money = (currency: string, v: number) => `${currency} ${Math.round(v).toLocaleString()}`;

/**
 * A product on a live promotion: photo with the store's logo, the saving as a percentage, the
 * deal price with the regular price struck through, and "Only N left" when real stock is low.
 * Every number comes from the catalogue and the promotion; nothing is invented for urgency.
 */
export function DealCard({
  href,
  name,
  storeName,
  storeLogo,
  imageUrl,
  useCase,
  currency,
  price,
  dealPrice,
  availableQuantity,
  className,
}: DealCardProps) {
  const pct = price > 0 ? Math.round(((price - dealPrice) / price) * 100) : 0;
  const lowStock = availableQuantity != null && availableQuantity > 0 && availableQuantity <= LOW_STOCK;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-floating focus-visible:shadow-floating",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          useCase={useCase}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {pct > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-sale px-2 py-0.5 text-xs font-extrabold text-white">
            -{pct}%
          </span>
        )}
        {storeLogo && (
          <span className="absolute bottom-2 right-2 size-10 overflow-hidden rounded-lg bg-white p-0.5 shadow-soft">
            <ImageWithFallback src={storeLogo} alt="" width={40} height={40} className="size-full object-contain" />
          </span>
        )}
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{name}</h3>
      <p className="line-clamp-1 text-xs text-muted-foreground">{storeName}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display tabular text-base font-bold text-primary sm:text-lg">{money(currency, dealPrice)}</span>
        {dealPrice < price && (
          <s className="tabular text-xs text-muted-foreground">{Math.round(price).toLocaleString()}</s>
        )}
      </div>
      {lowStock && <p className="mt-1 text-xs font-semibold text-sale">Only {availableQuantity} left</p>}
    </Link>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="aspect-square animate-pulse rounded-xl bg-muted" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}
