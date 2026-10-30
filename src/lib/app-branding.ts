/**
 * Server-side resolution of this tenant's ordering-app identity (name, home
 * screen label, icon, theme colour) for the PWA manifest, page metadata and
 * the generated app icons.
 *
 * Source: auth-api's public tenant record, through the shared rule
 * resolveAppIdentity (shared-ui-lib branding). A tenant can name the ordering
 * app in its service branding (tenant metadata `service_branding.ordering`, set
 * in Accounts > Branding > App Names and Icons), e.g. urban-loft's "Urban Eats".
 * Without an entry the app is "<Business> Marketplace" with the business logo.
 */

import {
  resolveAppIdentity,
  type AppIdentity,
  type PublicTenantBranding,
} from "@bengo-hub/shared-ui-lib/branding";
import { brand } from "@/config/brand";
import { serviceUrl } from "@/lib/service-urls";

export { appIconPath } from "@bengo-hub/shared-ui-lib/app-icon";

const AUTH_API_BASE = serviceUrl("sso");

export const DEFAULT_THEME_COLOR = "#9B2C6B";

export type AppBranding = AppIdentity;

async function fetchTenant(slug: string): Promise<PublicTenantBranding | null> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicTenantBranding;
  } catch {
    return null;
  }
}

export async function getAppBranding(slug: string): Promise<AppBranding> {
  return resolveAppIdentity(await fetchTenant(slug), {
    slug,
    service: "ordering",
    label: brand.appNameSuffix,
    defaultThemeColor: DEFAULT_THEME_COLOR,
    defaultDescription: (business) => `Order from ${business} for pickup or delivery.`,
  });
}
