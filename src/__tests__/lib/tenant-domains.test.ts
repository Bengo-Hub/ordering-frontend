import { describe, expect, it } from "vitest";

import { normaliseHost, slugForHost, tenantRewritePath } from "@/lib/tenant-domains";

describe("tenant domains", () => {
  it("maps each tenant domain to its slug, ignoring port and case", () => {
    expect(slugForHost("AlphaChinaMarket.co.ke:443")).toBe("alpha-china-market");
    expect(slugForHost("www.alphachinamarket.co.ke")).toBe("alpha-china-market");
    expect(slugForHost("urbaneats.theurbanloftcafe.com")).toBe("urban-loft");
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
    for (const p of ["/_next/static/x.js", "/sw.js", "/brand/logo.svg", "/favicon.ico", "/healthz", "/api/x"]) {
      expect(tenantRewritePath(p, "alpha-china-market")).toBeNull();
    }
  });
});
