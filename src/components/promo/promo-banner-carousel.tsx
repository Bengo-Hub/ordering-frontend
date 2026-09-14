"use client";

import { ChevronLeft, ChevronRight, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useCountdown } from "@/hooks/use-countdown";
import { cn, getMediaUrl } from "@/lib/utils";

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink: string;
  priceBadge?: string;
  backgroundColor?: string;
  textColor?: string;
  /** Outlet/tenant use_case — drives the SVG placeholder when the banner has no image. */
  useCase?: string;
  /** Whether this promotion is a time-boxed flash sale — drives the countdown + badge. */
  isFlashSale?: boolean;
  /** ISO timestamp the flash sale ends at (only meaningful when isFlashSale is true). */
  endAt?: string;
}

interface PromoBannerCarouselProps {
  banners: PromoBanner[];
  className?: string;
}

export function PromoBannerCarousel({ banners, className }: PromoBannerCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 400;
    const newScrollLeft =
      scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
    setTimeout(checkScrollability, 300);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div className={cn("relative h-full", className)}>
      {/* Left Arrow */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-4 top-1/2 z-10 hidden size-10 -translate-y-1/2 rounded-full border-border bg-background shadow-lg hover:bg-muted md:flex"
          onClick={() => scroll("left")}
          aria-label="Previous banner"
        >
          <ChevronLeft className="size-5" />
        </Button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="scrollbar-hide flex h-full gap-4 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {banners.map((banner) => (
          <PromoBannerCard key={banner.id} banner={banner} />
        ))}
      </div>

      {/* Right Arrow */}
      {canScrollRight && banners.length > 2 && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 z-10 hidden size-10 -translate-y-1/2 rounded-full border-border bg-background shadow-lg hover:bg-muted md:flex"
          onClick={() => scroll("right")}
          aria-label="Next banner"
        >
          <ChevronRight className="size-5" />
        </Button>
      )}
    </div>
  );
}

interface PromoBannerCardProps {
  banner: PromoBanner;
}

function PromoBannerCard({ banner }: PromoBannerCardProps) {
  const bgColor = banner.backgroundColor || "#f87171"; // Default coral/red
  const textColor = banner.textColor || "#000000";
  const countdown = useCountdown(banner.isFlashSale ? banner.endAt : null);
  // A real image gets its own boxed photo area; without one, a separate muted-gray fallback
  // box next to a solid brand-color background looks like two mismatched surfaces glued
  // together. Instead, fall back to a large low-opacity icon watermark painted directly on
  // the SAME solid background — the common "no photo yet" treatment for a marketing banner.
  const hasRealImage = !!getMediaUrl(banner.imageUrl);

  return (
    <Link
      href={banner.ctaLink as any}
      className="group relative flex h-full min-w-[280px] grow overflow-hidden rounded-xl transition-transform hover:scale-[1.01] sm:min-w-[340px]"
      style={{ backgroundColor: bgColor }}
    >
      {/* Text Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center p-4 sm:p-6 md:p-8" style={{ color: textColor }}>
        {banner.isFlashSale && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
              <Zap className="size-3 fill-current" />
              Flash Sale
            </span>
            {countdown && (
              <span className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                {countdown}
              </span>
            )}
          </div>
        )}
        <h3 className="text-lg font-bold leading-tight sm:text-2xl md:text-3xl">{banner.title}</h3>
        <p className="mt-1 max-w-md text-xs opacity-90 sm:mt-2 sm:text-sm md:text-base">{banner.subtitle}</p>
        {banner.priceBadge && (
          <div className="mt-3">
            <span className="inline-block rounded-full bg-black/90 px-3 py-1.5 text-xs font-semibold text-white">
              {banner.priceBadge}
            </span>
          </div>
        )}
        {banner.ctaText && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-fit bg-white text-black hover:bg-white/90"
          >
            {banner.ctaText}
          </Button>
        )}
      </div>

      {/* Image or decorative watermark */}
      {hasRealImage ? (
        <div className="relative aspect-square w-1/3 min-w-[120px] sm:w-2/5">
          <ImageWithFallback
            src={banner.imageUrl}
            alt={banner.title}
            useCase={banner.useCase}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 120px, 180px"
            iconClassName="size-8"
          />
        </div>
      ) : (
        <ShoppingCart
          aria-hidden
          className="pointer-events-none absolute -right-6 bottom-0 top-0 my-auto size-32 opacity-15 sm:size-40 md:size-48"
          style={{ color: textColor }}
          strokeWidth={1.25}
        />
      )}
    </Link>
  );
}
