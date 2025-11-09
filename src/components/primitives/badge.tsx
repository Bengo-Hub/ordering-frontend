import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  variant?: "default" | "outline" | "soft";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles =
    variant === "default"
      ? "inline-flex items-center rounded-full bg-brand-emphasis px-3 py-1 text-xs font-semibold text-brand-contrast"
      : variant === "soft"
        ? "inline-flex items-center rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand"
        : "inline-flex items-center rounded-full border border-brand-emphasis px-3 py-1 text-xs font-semibold text-brand-emphasis";
  return <span className={cn(styles, className)} {...props} />;
}

