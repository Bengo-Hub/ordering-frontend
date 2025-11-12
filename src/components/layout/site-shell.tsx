import { cn } from "@/lib/utils";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type SiteShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

export function SiteShell({ children, className, mainClassName }: SiteShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background text-foreground transition-colors duration-150 ease-out",
        className,
      )}
    >
      <SiteHeader />
      <main className={cn("flex-1", mainClassName)}>{children}</main>
      <SiteFooter />
    </div>
  );
}
