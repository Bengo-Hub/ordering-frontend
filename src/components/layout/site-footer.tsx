"use client";

import { PoweredByBadge } from "@bengo-hub/shared-ui-lib";
import { LegalLinks } from "@bengo-hub/shared-ui-lib/legal";

import { brand } from "@/config/brand";
import { useBrandConfig } from "@/hooks/use-brand";

/**
 * Storefront footer on the shared platform parts every Codevertex app mounts: the shared legal
 * pages and cookie settings (LegalLinks) and the "Powered by Codevertex Africa Limited" badge
 * (PoweredByBadge). It replaced a hand-made badge that still read "Codevertex IT Solutions" and
 * a list of links to pages this app never had.
 */
export function SiteFooter() {
  const { data: brandConfig } = useBrandConfig();
  const tenantName = brandConfig?.name || brand.name;

  return (
    <footer className="mt-auto w-full border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-semibold text-foreground">{tenantName}</span>. All rights
            reserved.
          </p>
          <LegalLinks layout="row" showEntity={false} className="text-xs" />
        </div>
        <PoweredByBadge />
      </div>
    </footer>
  );
}
