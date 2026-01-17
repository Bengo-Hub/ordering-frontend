"use client";

import { cn } from "@/lib/utils";
import { Flower, Home, Package, Pill, ShoppingCart, Wine, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sidebarItems = [
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "grocery", label: "Grocery", href: "/category/grocery", icon: ShoppingCart },
  { id: "convenience", label: "Convenience", href: "/category/convenience", icon: Package },
  { id: "alcohol", label: "Alcohol", href: "/category/alcohol", icon: Wine },
  { id: "health", label: "Health", href: "/category/health", icon: Pill },
  { id: "retail", label: "Retail", href: "/category/retail", icon: Package },
  { id: "flowers", label: "Flowers", href: "/category/flowers", icon: Flower },
  { id: "offers", label: "Offers", href: "/offers", icon: Zap },
];

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-border bg-background transition-all duration-300 ease-out",
          "md:relative md:inset-auto md:z-auto md:translate-x-0 md:border-r md:bg-muted/30",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {/* Close button for mobile */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <h2 className="text-lg font-bold">Menu</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Items */}
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when clicking a link
                  if (window.innerWidth < 768) {
                    onOpenChange(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
