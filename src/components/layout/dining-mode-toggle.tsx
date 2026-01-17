"use client";

import { cn } from "@/lib/utils";
import { useDiningModeStore, type DiningMode } from "@/store/dining-mode";

interface DiningModeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function DiningModeToggle({ className, size = "md" }: DiningModeToggleProps) {
  const mode = useDiningModeStore((state) => state.mode);
  const setMode = useDiningModeStore((state) => state.setMode);

  const handleModeChange = (newMode: DiningMode) => {
    setMode(newMode);
  };

  const sizeClasses = {
    sm: "text-xs px-3 py-1",
    md: "text-sm px-4 py-1.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/30 p-0.5",
        className,
      )}
      role="tablist"
      aria-label="Dining mode"
    >
      <button
        role="tab"
        aria-selected={mode === "delivery"}
        aria-controls="delivery-content"
        onClick={() => handleModeChange("delivery")}
        className={cn(
          "rounded-full font-medium transition-all duration-200",
          sizeClasses[size],
          mode === "delivery"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Delivery
      </button>
      <button
        role="tab"
        aria-selected={mode === "pickup"}
        aria-controls="pickup-content"
        onClick={() => handleModeChange("pickup")}
        className={cn(
          "rounded-full font-medium transition-all duration-200",
          sizeClasses[size],
          mode === "pickup"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Pickup
      </button>
    </div>
  );
}
