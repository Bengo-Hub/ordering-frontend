"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { Sidebar } from "./sidebar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type SiteShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

export function SiteShell({ children, className, mainClassName }: SiteShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background text-foreground transition-colors duration-150 ease-out",
        className,
      )}
    >
      <SiteHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className={cn("flex-1", mainClassName)}>{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
