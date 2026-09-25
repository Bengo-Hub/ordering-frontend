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

const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://sso.codevertexafrica.com";

export const DEFAULT_THEME_COLOR = "#f97316";

interface ServiceBrandingEntry {
  name?: string;
  short_name?: string;
  tagline?: string;
  theme_color?: string;
  icon_url?: string;
}

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

function orderingEntry(metadata: Record<string, unknown> | undefined): ServiceBrandingEntry {
  const all = metadata?.service_branding;
  if (!all || typeof all !== "object") return {};
  const entry = (all as Record<string, unknown>).ordering;
  return entry && typeof entry === "object" ? (entry as ServiceBrandingEntry) : {};
}

/** Launcher label: explicit short name, else a name that already fits, else "<First word> Ordering". */
function deriveShortName(appName: string, businessName: string, custom: boolean): string {
  if (appName.length <= 12) return appName;
  const firstWord = businessName.split(/\s+/)[0] || appName.split(/\s+/)[0] || "Ordering";
  return custom ? appName.split(/\s+/).slice(0, 2).join(" ") : `${firstWord} Ordering`;
}

export async function getAppBranding(slug: string): Promise<AppBranding> {
  const tenant = await fetchTenant(slug);
  const entry = orderingEntry(tenant?.metadata);
  const businessName = text(tenant?.name) || slug;
  const customName = text(entry.name);
  const appName = customName || `${businessName} Ordering`;
  const shortName = text(entry.short_name) || deriveShortName(appName, businessName, !!customName);
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
