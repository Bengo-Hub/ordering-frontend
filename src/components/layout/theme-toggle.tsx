"use client";

import { useEffect, useState } from "react";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = theme === "system" ? resolvedTheme : theme;

  if (!mounted) {
    return (
      <div
        className="flex items-center gap-1 rounded-full border border-border bg-card/60 p-1 opacity-0"
        aria-hidden
      >
        <Button type="button" size="icon" variant="ghost">
          <SunIcon className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost">
          <MoonIcon className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost">
          <LaptopIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur">
      <Button
        type="button"
        size="icon"
        variant={current === "light" ? "secondary" : "ghost"}
        onClick={() => setTheme("light")}
        aria-pressed={current === "light" ? true : undefined}
        aria-label="Activate light theme"
      >
        <SunIcon className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={current === "dark" ? "secondary" : "ghost"}
        onClick={() => setTheme("dark")}
        aria-pressed={current === "dark" ? true : undefined}
        aria-label="Activate dark theme"
      >
        <MoonIcon className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={theme === "system" ? "secondary" : "ghost"}
        onClick={() => setTheme("system")}
        aria-pressed={theme === "system" ? true : undefined}
        aria-label="Follow system theme"
      >
        <LaptopIcon className="size-4" />
      </Button>
    </div>
  );
}
