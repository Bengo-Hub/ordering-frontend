/**
 * Next.js 16 proxy: hostname-based tenant slug injection, as in truload-frontend. A tenant's own
 * domain (alphachinamarket.co.ke) serves that tenant's storefront by rewriting the request under
 * "/{slug}" (the address bar keeps the clean URL). Every other host, including
 * ordering.codevertexafrica.com, passes through untouched. See lib/tenant-domains.ts.
 */

import { NextResponse, type NextRequest } from "next/server";

import { slugForHost, tenantRewritePath } from "@/lib/tenant-domains";

export function proxy(request: NextRequest) {
  const slug = slugForHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  if (!slug) return NextResponse.next();

  const target = tenantRewritePath(request.nextUrl.pathname, slug);
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and API routes up front; the rest is filtered in tenantRewritePath.
  matcher: ["/((?!_next/|api/).*)"],
};
