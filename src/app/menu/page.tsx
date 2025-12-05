import {
  ArrowLeftRight,
  ClockIcon,
  MapPinIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { CustomerLocationPicker } from "@/components/location/customer-location-picker";
import { MenuDiscovery } from "@/components/menu/menu-discovery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brand } from "@/config/brand";

export default function MenuPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-16">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4">
          {/* Text Content Section */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-emphasis/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
              <ShoppingCartIcon className="size-3.5" aria-hidden /> Menu & Ordering
            </span>
            <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
              Curated menus crafted for {brand.shortName} patrons.
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              Browse seasonal dishes, personalize dietary filters, and sync your cart across web,
              PWA, and mobile clients. Availability is managed in real time by cafe operations and
              the cafe backend services.
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

          {/* Delivery Location Section - Below Text Content */}
          <div className="grid gap-6 md:grid-cols-[1fr_1fr] lg:grid-cols-[1.2fr_0.8fr]">
            <CustomerLocationPicker />
            <div className="flex flex-col gap-4">
              <Card className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Multi-outlet menus</p>
                    <p className="leading-relaxed">
                      Pull tenant-aware pricing sourced from the backend order catalog service.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Additional Feature Cards */}
              <div className="space-y-4">
                <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                      <ClockIcon className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Real-time availability
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Menu items update instantly as inventory changes. No surprises at checkout.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                      <ArrowLeftRight className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">Sync across devices</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Your cart follows you. Start on web, finish on mobile—seamlessly.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                      <SparklesIcon className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">Dietary filters</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Filter by vegan, gluten-free, spicy, and more. Find what fits your needs.
                      </p>
                    </div>
                  </div>
                </Card>
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
