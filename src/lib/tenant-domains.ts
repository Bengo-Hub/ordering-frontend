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
  // theurbanloftcafe.com itself is the cafe website (devops-k8s apps/cafe-website).
  "urbaneats.theurbanloftcafe.com": "urban-loft",
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
  if (/^\/(_next|api|brand|icons|images|illustrations|fonts)(\/|$)/.test(pathname)) return true;
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
