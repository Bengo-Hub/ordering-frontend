"use client";

import { useEffect } from "react";
import { useBrandConfig } from "@/hooks/use-brand";
import { brandThemeVariables } from "@/lib/brand-theme";

/**
 * Applies a tenant's brand colours from GET /api/v1/{tenant}/config to the CSS variables on
 * <html>: the --brand-* tokens and, when the colour is dark enough for white text (WCAG AA),
 * the shadcn --primary/--ring tokens behind every primary button and link. A colour too light
 * for white text keeps the platform plum for those, so buttons stay readable. Client-side only;
 * the platform palette from globals.css shows until the config loads.
 */
export function BrandThemeSync() {
  const { data } = useBrandConfig();

  useEffect(() => {
    const vars = brandThemeVariables(data?.primaryColor, data?.secondaryColor);
    const root = document.documentElement;
    const names = Object.keys(vars);
    for (const name of names) root.style.setProperty(name, vars[name]);
    return () => {
      for (const name of names) root.style.removeProperty(name);
    };
  }, [data?.primaryColor, data?.secondaryColor]);

  return null;
}
