"use client";

import Link from "next/link";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { normalizeOrderingUseCase } from "@/lib/use-case-config";
import { getUseCaseCopy } from "@/lib/use-case-copy";
import { cn } from "@/lib/utils";

/**
 * A store on the marketplace page: the logo shown whole (contain, on white, so square and wide
 * logos both read; covering it cropped them), the name and what kind of store it is.
 */
export function StoreCard({
  slug,
  name,
  logoUrl,
  useCase,
  className,
}: {
  slug: string;
  name: string;
  logoUrl?: string | undefined;
  useCase?: string | undefined;
  className?: string;
}) {
  const copy = getUseCaseCopy(useCase);
  return (
    <Link
      href={`/${slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-floating focus-visible:shadow-floating",
        className,
      )}
    >
      <div className="relative flex h-24 items-center justify-center border-b border-border bg-white p-3 sm:h-28">
        <div className="relative size-full">
          <ImageWithFallback
            src={logoUrl}
            alt={name}
            useCase={normalizeOrderingUseCase(useCase)}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            iconClassName="size-9"
          />
        </div>
      </div>
      <div className="px-3 py-2.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{name}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{copy.outletLabel}</p>
      </div>
    </Link>
  );
}

export function StoreCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="h-24 animate-pulse bg-muted sm:h-28" />
      <div className="space-y-2 px-3 py-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
