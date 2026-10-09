/**
 * Server-side resolution of this tenant's ordering-app identity (name, home
 * screen label, icon, theme colour) for the PWA manifest, page metadata and
 * the generated app icons.
 *
 * Source: auth-api's public tenant record. A tenant can name the ordering app
 * in its service branding (tenant metadata `service_branding.ordering`, set in
 * Accounts > Branding > App Names and Icons), e.g. urban-loft's "Urban Eats".
 * Without an entry the app is "<Business> Ordering" with the business logo.
 */

import {
  serviceBrandingEntry,
  serviceFullName,
  serviceShortName,
  type ServiceBrandingEntry,
} from "@bengo-hub/shared-ui-lib/branding";

const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://sso.codevertexafrica.com";

export const DEFAULT_THEME_COLOR = "#f97316";

/** This app's key in tenant metadata service_branding (same key as the app-switcher registry). */
const SERVICE_KEY = "ordering";

interface PublicTenant {
  name?: string;
  logo_url?: string;
  brand_colors?: { primary?: string };
  metadata?: Record<string, unknown>;
}

export interface AppBranding {
  /** Business name, e.g. "Urban Loft". */
  businessName: string;
  /** Full app name, e.g. "Urban Eats" or "Urban Loft Ordering". */
  appName: string;
  /** Home screen label (launchers show about 12 characters). */
  shortName: string;
  description: string;
  themeColor: string;
  /** App icon (service icon, else business logo); null uses generated initials. */
  iconUrl: string | null;
  /** True when the tenant named the app itself. */
  custom: boolean;
}

async function fetchTenant(slug: string): Promise<PublicTenant | null> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicTenant;
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function getAppBranding(slug: string): Promise<AppBranding> {
  const tenant = await fetchTenant(slug);
  const entry: ServiceBrandingEntry = serviceBrandingEntry(tenant?.metadata, SERVICE_KEY) ?? {};
  const businessName = text(tenant?.name) || slug;
  const customName = text(entry.name);
  // Shared naming rule (shared-ui-lib branding): the tenant's own app name ("Urban Eats") wins,
  // else "<Business> Ordering" with a "<brand word> Ordering" launcher label ("The Urban Ordering").
  const appName = serviceFullName(businessName, "Ordering", slug, entry);
  const shortName = serviceShortName(businessName, "Ordering", slug, entry);
  const themeColor =
    text(entry.theme_color) ||
    text(tenant?.brand_colors?.primary) ||
    text(tenant?.metadata?.primary_color) ||
    DEFAULT_THEME_COLOR;
  const iconUrl = text(entry.icon_url) || text(tenant?.logo_url) || text(tenant?.metadata?.logo_url) || null;
  const description =
    text(entry.tagline) ||
    text(tenant?.metadata?.tagline) ||
    `Order from ${businessName} for pickup or delivery.`;

  return { businessName, appName, shortName, description, themeColor, iconUrl, custom: !!customName };
}

/** Square PNG icon generated from the app icon (see [orgSlug]/app-icon/[size]). */
export function appIconPath(slug: string, size: number, maskable = false): string {
  return `/${slug}/app-icon/${size}${maskable ? "?maskable=1" : ""}`;
}
