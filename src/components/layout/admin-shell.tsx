"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Lock, LogOut, Menu, Store, X } from "lucide-react";

import { TenantLogo } from "@/components/layout/tenant-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useBrandConfig } from "@/hooks/use-brand";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

import { type AdminNavItem, useAdminNav } from "./admin-nav";

/**
 * Layout for staff and platform pages: a left sidebar with the admin navigation and a top
 * bar (store link, theme, account). Customer pages keep the storefront SiteShell. Pages
 * render content only; the shell owns spacing and the subscription banner.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const orgSlug = useOrgSlug();
  const pathname = usePathname() || "";
  const groups = useAdminNav();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: brandConfig } = useBrandConfig();
  const logo = brandConfig?.logoUrl || brand.assets.logo;
  const name = user?.fullName || user?.email?.split("@")[0] || "Account";

  const isActive = (item: AdminNavItem) => {
    if (item.external) return false;
    const full = orgRoute(orgSlug, item.href);
    // The queue is the parent path of every staff page, so it only matches exactly.
    return item.href === "/dashboard/staff" ? pathname === full : pathname.startsWith(full);
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <TenantLogo src={logo} alt="Logo" className="h-9 w-auto max-w-[140px] object-contain" />
        <button type="button" className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = item.icon;
                const cls = cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(item)
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                );
                const body = (
                  <>
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.locked && <Lock className="size-3.5 opacity-60" aria-label="Upgrade required" />}
                    {item.external && <ExternalLink className="size-3.5 opacity-50" />}
                  </>
                );
                return item.external ? (
                  <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className={cls}>
                    {body}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={orgRoute(orgSlug, item.href)}
                    onClick={() => setOpen(false)}
                    className={cls}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button type="button" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={orgRoute(orgSlug, "/")}>
                <Store className="mr-1.5 size-4" /> View store
              </Link>
            </Button>
            <ThemeToggle />
            <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:block">{name}</span>
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
