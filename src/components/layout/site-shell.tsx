"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { Sidebar } from "./sidebar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { UserMenuDrawer } from "./user-menu-drawer";

type SiteShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

export function SiteShell({ children, className, mainClassName }: SiteShellProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background text-foreground transition-colors duration-150 ease-out",
        className,
      )}
    >
      <SiteHeader onMenuClick={() => setUserMenuOpen(true)} />
      <div className="flex flex-1">
        {/* Static Categories Sidebar - Always Visible */}
        <Sidebar open={true} onOpenChange={() => {}} />
        {/* Main Content */}
        <main className={cn("flex-1", mainClassName)}>{children}</main>
      </div>
      {/* Hidden User Menu Drawer - Overlays when hamburger clicked */}
      <UserMenuDrawer open={userMenuOpen} onOpenChange={setUserMenuOpen} />
      <SiteFooter />
    </div>
  );
}
