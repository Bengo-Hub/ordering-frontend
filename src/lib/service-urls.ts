/**
 * How the browser reaches each platform API.
 *
 * On the app's own host (ordering.codevertexafrica.com) the browser calls each API directly, and
 * the APIs allow that origin. On a tenant's own domain (alphachinamarket.co.ke, or any domain
 * connected from the SSO Domains screen) it calls the same-origin path `/_svc/<name>/...`, which
 * next.config rewrites to the API, so a new tenant domain never needs adding to an API's CORS list.
 * Server code (route handlers, SSR) always uses the direct address. The address table itself lives
 * in service-urls.config.mjs, shared with next.config.
 */

import { SERVICE_PROXY_PREFIX, SERVICE_URLS, type ServiceName } from "./service-urls.config.mjs";

export { SERVICE_URLS, type ServiceName };

function appHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ordering.codevertexafrica.com").host.toLowerCase();
  } catch {
    return "";
  }
}

/** True when the page is served on a tenant's own domain rather than the app's host or localhost. */
export function isTenantDomain(host: string): boolean {
  const h = host.toLowerCase();
  if (!h || h === appHost()) return false;
  const name = h.split(":")[0] ?? "";
  return name !== "localhost" && name !== "127.0.0.1" && !name.endsWith(".local");
}

/**
 * The base URL to call a service with from here: the direct address on the app's host and on the
 * server, the same-origin proxy path on a tenant domain. Keeps the address's own path ("/api/v1/")
 * so callers append the same routes either way.
 */
export function serviceUrl(name: ServiceName): string {
  const direct = SERVICE_URLS[name];
  if (typeof window === "undefined" || !isTenantDomain(window.location.host)) return direct;
  let path = "";
  try {
    path = new URL(direct).pathname;
  } catch {
    path = "";
  }
  return `${window.location.origin}${SERVICE_PROXY_PREFIX}/${name}${path === "/" ? "" : path}`;
}
