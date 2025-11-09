"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MenuIcon, XIcon } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/delivery", label: "Delivery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeHref = useMemo(() => pathname ?? "/", [pathname]);

  useEffect(() => {
    // Close drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Lock scroll when drawer is open
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <span className="relative flex items-center">
            <Image
              src={brand.assets.logo}
              alt={`${brand.name} logo`}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
              priority
            />
          </span>
          <span>{brand.name}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={{ pathname: link.href }}
              className={cn(
                "transition-colors hover:text-primary",
                activeHref.startsWith(link.href)
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/riders/signup">Become a rider</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-full flex-col gap-6 overflow-y-auto border-l border-border bg-card p-6 shadow-2xl transition-transform duration-300 ease-out">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <Image
                  src={brand.assets.logo}
                  alt={`${brand.name} logo`}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span>{brand.shortName}</span>
              </Link>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-3 text-foreground">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={{ pathname: link.href }}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
                    activeHref.startsWith(link.href)
                      ? "bg-muted text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3">
              <Button variant="ghost" asChild>
                <Link href="/riders/signup">Become a rider</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
