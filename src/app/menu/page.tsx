import { MapPinIcon, ShoppingCartIcon } from "lucide-react";

import { CustomerLocationPicker } from "@/components/location/customer-location-picker";
import { SiteShell } from "@/components/layout/site-shell";
import { MenuDiscovery } from "@/components/menu/menu-discovery";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

export default function MenuPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-16">
        <div className="w/full mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-emphasis/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
              <ShoppingCartIcon className="size-3.5" aria-hidden /> Menu & Ordering
            </span>
            <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
              Curated menus crafted for {brand.shortName} patrons.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Browse seasonal dishes, personalize dietary filters, and sync your cart across web,
              PWA, and mobile clients. Availability is managed in real time by cafe operations and
              the food-delivery backend services.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#menu-browser">Explore menu</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/contact">Talk to sales</a>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <CustomerLocationPicker />
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPinIcon className="size-5 text-primary" aria-hidden />
                <div>
                  <p className="font-semibold text-foreground">Multi-outlet menus</p>
                  <p>Pull tenant-aware pricing sourced from the backend order catalog service.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div id="menu-browser">
        <MenuDiscovery />
      </div>
    </SiteShell>
  );
}
