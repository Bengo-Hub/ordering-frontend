"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsPickupMode } from "@/store/dining-mode";

export type OutletCardProps = {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  deliveryFee?: string;
  distance?: string;
  cuisines?: string[];
  promoted?: boolean;
  discount?: string;
  offerBadge?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  href?: string;
  className?: string;
  /** Business type for customizing display (food, retail, pharmacy, etc.) */
  businessType?: string;
};

export function OutletCard({
  id,
  name,
  image,
  rating = 4.5,
  reviewCount = 0,
  deliveryTime = "25-35",
  deliveryFee = "Free",
  distance,
  cuisines = [],
  promoted = false,
  discount,
  offerBadge,
  isFavorite: initialFavorite = false,
  onFavoriteToggle,
  href = `/outlet/${id}`,
  className,
  businessType,
}: OutletCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const isPickupMode = useIsPickupMode();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isFavorite;
    setIsFavorite(newState);
    onFavoriteToggle?.(id, newState);
  };

  // Format delivery fee display
  const formatDeliveryFee = (fee: string) => {
    if (fee.toLowerCase() === "free") return "Free delivery";
    if (fee.match(/^\d+$/)) return `KES${fee} Delivery Fee`;
    return fee;
  };

  // Format review count
  const formatReviewCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k+`;
    if (count > 0) return `(${count})`;
    return "";
  };

  return (
    <Link
      href={href as any}
      className={cn(
        "group block overflow-hidden rounded-xl bg-card transition-all hover:shadow-lg",
        className,
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl opacity-30">
              {businessType === "pharmacy"
                ? "💊"
                : businessType === "flowers"
                  ? "💐"
                  : businessType === "retail"
                    ? "🛍️"
                    : businessType === "grocery"
                      ? "🛒"
                      : "🍽️"}
            </span>
          </div>
        )}

        {/* Offer Badge - Top Left (Uber Eats style) */}
        {(offerBadge || discount) && (
          <div className="absolute left-0 top-3">
            <Badge
              className={cn(
                "rounded-l-none rounded-r-full px-3 py-1 text-xs font-semibold shadow-md",
                offerBadge?.toLowerCase().includes("top offer")
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white",
              )}
            >
              {offerBadge || discount}
            </Badge>
          </div>
        )}

        {/* Promoted Badge - Top Left under offer */}
        {promoted && !offerBadge && !discount && (
          <div className="absolute left-2 top-2">
            <Badge className="bg-black/70 text-xs font-medium text-white backdrop-blur-sm">
              Sponsored
            </Badge>
          </div>
        )}

        {/* Favorite Heart - Top Right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-md transition-all hover:scale-110 hover:bg-white"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600",
            )}
          />
        </button>
      </div>

      {/* Content Section - Uber Eats Style */}
      <div className="space-y-1.5 p-3">
        {/* Name */}
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{name}</h3>

        {/* Delivery Fee Badge + Rating Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Delivery info or distance for pickup */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isPickupMode ? (
              <>{distance && <span className="font-medium">{distance}</span>}</>
            ) : (
              <>
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-[10px]">🛵</span>
                </span>
                <span>{formatDeliveryFee(deliveryFee)}</span>
              </>
            )}
          </div>
        </div>

        {/* Rating + Time Row */}
        <div className="flex items-center gap-2 text-xs">
          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="size-3.5 fill-current text-foreground" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-muted-foreground">{formatReviewCount(reviewCount)}</span>
              )}
            </div>
          )}

          {/* Separator */}
          {rating > 0 && deliveryTime && <span className="text-muted-foreground">•</span>}

          {/* Time */}
          {deliveryTime && (
            <span className="text-muted-foreground">
              {isPickupMode ? `${deliveryTime} min` : `${deliveryTime} min`}
            </span>
          )}

          {/* Distance for delivery mode */}
          {!isPickupMode && distance && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{distance}</span>
            </>
          )}
        </div>

        {/* Cuisines/Categories - Only if provided */}
        {cuisines.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {cuisines.slice(0, 3).join(" • ")}
          </p>
        )}
      </div>
    </Link>
  );
}

// Grid wrapper component for outlet cards
export function OutletGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
