/**
 * Next.js 16 proxy: hostname-based tenant slug injection, as in truload-frontend. A tenant's own
 * domain serves that tenant's storefront by rewriting the request under "/{slug}" (the address bar
 * keeps the clean URL). Hosts come from the fixed map (lib/tenant-domains.ts) or, for domains
 * connected from the SSO Domains screen, from auth-api's resolve endpoint. The app's own host and
 * localhost pass through untouched.
 */

import { NextResponse, type NextRequest } from "next/server";

import { SERVICE_URLS, isTenantDomain } from "@/lib/service-urls";
import { normaliseHost, resolveTenantHost, slugForHost, tenantRewritePath } from "@/lib/tenant-domains";

export async function proxy(request: NextRequest) {
  const host = normaliseHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  let slug = slugForHost(host);
  if (!slug && isTenantDomain(host)) slug = await resolveTenantHost(host, SERVICE_URLS.sso);
  if (!slug) return NextResponse.next();

  const target = tenantRewritePath(request.nextUrl.pathname, slug);
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes and the same-origin service proxy up front; the rest is
  // filtered in tenantRewritePath.
  matcher: ["/((?!_next/|api/|_svc/).*)"],
};
