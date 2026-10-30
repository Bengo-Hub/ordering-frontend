import { describe, expect, it } from "vitest";

import { normaliseHost, slugForHost, tenantRewritePath } from "@/lib/tenant-domains";

describe("tenant domains", () => {
  it("maps each tenant domain to its slug, ignoring port and case", () => {
    expect(slugForHost("AlphaChinaMarket.co.ke:443")).toBe("alpha-china-market");
    expect(slugForHost("www.alphachinamarket.co.ke")).toBe("alpha-china-market");
    // urbaneats is connected from the SSO Domains screen (resolveTenantHost), not the fixed map.
    expect(slugForHost("urbaneats.theurbanloftcafe.com")).toBeUndefined();
    expect(slugForHost("theurbanloftcafe.com")).toBeUndefined(); // the cafe website
    expect(slugForHost("ordering.codevertexafrica.com")).toBeUndefined();
    expect(normaliseHost(null)).toBe("");
  });

  it("serves the tenant's pages under its slug", () => {
    const slug = "alpha-china-market";
    expect(tenantRewritePath("/", slug)).toBe("/alpha-china-market");
    expect(tenantRewritePath("/catalog", slug)).toBe("/alpha-china-market/catalog");
    expect(tenantRewritePath("/alpha-china-market/cart", slug)).toBeNull();
    expect(tenantRewritePath("/alpha-china-market", slug)).toBeNull();
  });

  it("never exposes another store and leaves static files alone", () => {
    expect(tenantRewritePath("/urban-loft", "alpha-china-market")).toBe("/alpha-china-market/urban-loft");
    for (const p of ["/_svc/ordering/api/v1/x", "/_next/static/x.js", "/sw.js", "/brand/logo.svg", "/favicon.ico", "/healthz", "/api/x"]) {
      expect(tenantRewritePath(p, "alpha-china-market")).toBeNull();
    }
  });
});

describe("service urls", () => {
  it("tells a tenant domain from the app host and localhost", async () => {
    const { isTenantDomain } = await import("@/lib/service-urls");
    expect(isTenantDomain("ordering.codevertexafrica.com")).toBe(false);
    expect(isTenantDomain("localhost:3000")).toBe(false);
    expect(isTenantDomain("alphachinamarket.co.ke")).toBe(true);
  });
  it("proxies every service under /_svc to its origin", async () => {
    const { serviceRewrites } = await import("@/lib/service-urls.config.mjs");
    const rw = serviceRewrites();
    expect(rw.find((r) => r.source === "/_svc/sso/:path*")?.destination).toBe("https://sso.codevertexafrica.com/:path*");
    expect(rw.every((r) => r.destination.endsWith("/:path*"))).toBe(true);
  });
});
