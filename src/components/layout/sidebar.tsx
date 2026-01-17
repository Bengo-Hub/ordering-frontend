"use client";

import { cn } from "@/lib/utils";
import { Flower, Home, Package, Pill, ShoppingCart, Wine, Zap } from "lucide-react";
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
      {/* Static Categories Sidebar - Always Visible and Sticky */}
      <aside className="sticky top-0 hidden h-screen w-64 border-r border-border bg-background md:block">
        <nav className="flex h-full flex-col gap-0 overflow-y-auto p-0">
          {/* Menu Items */}
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-muted text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
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
