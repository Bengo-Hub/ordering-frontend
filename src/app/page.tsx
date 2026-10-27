import type { Metadata } from "next";

import { MarketplaceLanding } from "@/components/marketplace/marketplace-landing";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} Marketplace: local stores, restaurants and services` },
  description: brand.description,
  openGraph: {
    title: `${brand.name} Marketplace`,
    description: brand.tagline,
    images: [{ url: brand.assets.logoFull }],
    type: "website",
  },
};

/**
 * Platform marketplace landing page: the root domain with no tenant slug. The page itself is a
 * server component so it carries real metadata; the interactive marketplace (stores, deals,
 * location) is the MarketplaceLanding client component. Each tenant's own branded storefront
 * lives at /{slug}.
 */
export default function MarketplaceLandingPage() {
  return <MarketplaceLanding />;
}
