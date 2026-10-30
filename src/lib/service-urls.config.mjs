// Platform API addresses, shared by next.config.mjs (same-origin proxy rewrites) and
// src/lib/service-urls.ts (which address the browser calls). Plain JS so next.config can import it;
// types in service-urls.config.d.mts. NEXT_PUBLIC_* values are inlined at build time.

export const SERVICE_URLS = {
  ordering: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api/v1/",
  sso: process.env.NEXT_PUBLIC_SSO_URL || process.env.NEXT_PUBLIC_AUTH_API_URL || "https://sso.codevertexafrica.com",
  logistics: process.env.NEXT_PUBLIC_LOGISTICS_API_URL || "https://logisticsapi.codevertexafrica.com/api/v1",
  treasury: process.env.NEXT_PUBLIC_TREASURY_API_URL || "http://localhost:4201",
  notifications: process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || "http://localhost:4301",
  subscriptions: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || "https://pricingapi.codevertexafrica.com",
  pos: process.env.NEXT_PUBLIC_POS_API_URL || "https://posapi.codevertexafrica.com",
};

/** The same-origin prefix a service is proxied under on a tenant's own domain. */
export const SERVICE_PROXY_PREFIX = "/_svc";

/** next.config rewrites: `/_svc/<name>/:path*` to each API's origin. */
export function serviceRewrites() {
  const out = [];
  for (const [name, url] of Object.entries(SERVICE_URLS)) {
    try {
      out.push({ source: `${SERVICE_PROXY_PREFIX}/${name}/:path*`, destination: `${new URL(url).origin}/:path*` });
    } catch {
      // A malformed address simply gets no proxy route.
    }
  }
  return out;
}
