/**
 * Tenants' own domains served by this app, the same pattern as truload-frontend's proxy
 * (kuraweigh.kura.go.ke -> kura): each host maps to a fixed tenant slug and requests are rewritten
 * under "/{slug}". Adding a domain takes three places kept in step:
 * - HOSTNAME_SLUG_MAP below;
 * - devops-k8s apps/ordering-frontend/values.yaml ingress host + TLS (and the CORS lists of the
 *   APIs the storefront calls);
 * - auth-api TENANT_APP_HOSTS (OAuth redirect URIs, sign-in return, logout, CORS).
 * Pure functions, used by src/proxy.ts.
 */

/** Maps tenant-branded hostnames to their fixed tenant slugs. */
export const HOSTNAME_SLUG_MAP: Readonly<Record<string, string>> = {
  "alphachinamarket.co.ke": "alpha-china-market",
  "www.alphachinamarket.co.ke": "alpha-china-market",
};

/** The tenant slug for a request host (port and case ignored), or undefined. */
export function slugForHost(host: string | null | undefined): string | undefined {
  return HOSTNAME_SLUG_MAP[normaliseHost(host)];
}

/** The request host without its port, lower case. */
export function normaliseHost(host: string | null | undefined): string {
  return (host ?? "").split(":")[0]!.trim().toLowerCase();
}

/** Framework, API and static paths that must never be prefixed with the tenant slug. */
function isPassthrough(pathname: string): boolean {
  if (/^\/(_next|_svc|api|brand|icons|images|illustrations|fonts)(\/|$)/.test(pathname)) return true;
  if (pathname === "/healthz" || pathname === "/favicon.ico" || pathname === "/robots.txt") return true;
  // A last segment with a file extension is a static file (sw.js, manifest.webmanifest, logo.png).
  return /\.[a-z0-9]+$/i.test(pathname.split("/").pop() ?? "");
}

/**
 * Where a request on a tenant domain is served from: "/" becomes "/{slug}", "/catalog" becomes
 * "/{slug}/catalog", and a path already under "/{slug}" stays as it is (every link the app builds
 * carries the slug). Returns null when nothing changes. Another tenant's slug is never reachable:
 * "/other-store" becomes "/{slug}/other-store", which is not a page.
 */
export function tenantRewritePath(pathname: string, slug: string): string | null {
  if (isPassthrough(pathname)) return null;
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) return null;
  return pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
}

type CachedSlug = { slug: string | undefined; at: number };
const resolved = new Map<string, CachedSlug>();
const RESOLVE_TTL_MS = 60_000;

/**
 * The tenant slug for a host connected from the SSO Domains screen, via auth-api's public
 * `/api/v1/domains/resolve` (only domains connected to the ordering storefront count). Cached for a
 * minute per host, misses included, so an unknown host costs one lookup a minute at most.
 */
export async function resolveTenantHost(host: string, authBase: string): Promise<string | undefined> {
  const h = normaliseHost(host);
  if (!h) return undefined;
  const hit = resolved.get(h);
  if (hit && Date.now() - hit.at < RESOLVE_TTL_MS) return hit.slug;
  let slug: string | undefined;
  try {
    const base = authBase.replace(/\/+$/, "");
    const res = await fetch(`${base}/api/v1/domains/resolve?host=${encodeURIComponent(h)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const body = (await res.json()) as { tenant_slug?: string; service?: string };
      if (body.service === "ordering" && body.tenant_slug && /^[a-z0-9-]+$/i.test(body.tenant_slug)) slug = body.tenant_slug;
    }
  } catch {
    slug = undefined; // auth-api unreachable: serve the host as is and try again next minute
  }
  resolved.set(h, { slug, at: Date.now() });
  return slug;
}
