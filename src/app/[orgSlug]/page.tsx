"use client";

/**
 * Homepage thin shell — resolves the tenant/outlet's effective ordering profile
 * (useOrderingConfig) and renders the matching per-profile view. Mirrors the
 * pos-ui pattern: "thin shell selects a per-use-case view, shared building
 * blocks stay shared." Each view owns its own SiteShell wrapper (some profiles
 * need different SiteShell props, e.g. FoodHomeView's pickup-mode layout).
 */

import { FoodHomeView } from "@/components/home/food-home-view";
import { RetailHomeView } from "@/components/home/retail-home-view";
import { ServicesHomeView } from "@/components/home/services-home-view";
import { useOrderingConfig } from "@/hooks/use-ordering-config";

export default function HomePage() {
  const { profile, resolving } = useOrderingConfig();

  // Until the tenant's use case is known, show a neutral page instead of the generic services
  // layout, which used to flash before a shop or restaurant layout replaced it.
  if (resolving) return <HomeResolving />;

  switch (profile) {
    case "hospitality":
    case "quick_service":
      return <FoodHomeView />;
    case "retail":
    case "pharmacy":
    case "wholesale":
      return <RetailHomeView />;
    case "services":
    case "ticketing":
    case "general":
    default:
      return <ServicesHomeView />;
  }
}

function HomeResolving() {
  return (
    <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Loading the store">
      <div className="h-16 border-b border-border bg-card" />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
