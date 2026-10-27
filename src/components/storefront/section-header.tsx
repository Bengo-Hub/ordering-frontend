import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Section title for the storefront pages: display-face heading, an optional pill (a label like
 * "Retail and hospitality" or a live "Ends in 02:14:36"), an optional line under it and an
 * optional "See all" link that is only passed when a page for it really exists.
 */
export function SectionHeader({
  id,
  title,
  pill,
  subtitle,
  seeAllHref,
  className,
}: {
  id?: string;
  title: string;
  pill?: ReactNode;
  subtitle?: string;
  seeAllHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2
          id={id}
          className="flex flex-wrap items-center gap-2.5 font-display text-xl font-bold text-foreground sm:text-2xl"
        >
          {title}
          {pill}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-primary hover:bg-secondary"
        >
          See all
        </Link>
      )}
    </div>
  );
}

/** Small rounded label used inside a SectionHeader. */
export function Pill({ children, tone = "plum" }: { children: ReactNode; tone?: "plum" | "sale" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-sans text-xs font-semibold",
        tone === "sale" ? "bg-sale/10 text-sale" : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}
