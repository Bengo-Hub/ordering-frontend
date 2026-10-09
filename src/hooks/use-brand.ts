"use client";

import { useQuery } from "@tanstack/react-query";
import { serviceAppName } from "@bengo-hub/shared-ui-lib/branding";
import { api } from "@/lib/api/base";
import { brand as staticBrand } from "@/config/brand";
import { useOrgSlug } from "@/providers/org-slug-provider";

/** Backend response shape: GET /api/v1/{tenant}/config (ordering-backend) */
interface TenantBrandConfig {
  name: string;
  short_name?: string;
  tagline?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  support_email?: string;
  support_phone?: string;
  brand_palette?: Record<string, string>;
  features?: Record<string, boolean>;
  use_case?: string;
  use_cases?: string[];
  app_name?: string;
  app_short_name?: string;
  app_icon_url?: string;
  app_theme_color?: string;
}

export const brandKeys = {
  all: ["brand"] as const,
  config: (tenantSlug: string) => [...brandKeys.all, "config", tenantSlug] as const,
};

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  primaryColor: string;
  secondaryColor: string;
  features: Record<string, boolean>;
  useCase: string | undefined;
  useCases: string[];
  /** Tenant's own name for this app (e.g. "Urban Eats"); undefined uses the default. */
  appName: string | undefined;
  /** Tenant's own icon for this app; undefined uses the business logo. */
  appIconUrl: string | undefined;
}

function staticBrandConfig(): BrandConfig {
  return {
    name: staticBrand.name,
    shortName: staticBrand.shortName,
    tagline: staticBrand.tagline,
    logoUrl: staticBrand.assets.logo,
    supportEmail: staticBrand.support.email,
    supportPhone: staticBrand.support.phone,
    primaryColor: staticBrand.palette.primary,
    secondaryColor: staticBrand.palette.emphasis,
    features: {},
    useCase: undefined,
    useCases: [],
    appName: undefined,
    appIconUrl: undefined,
  };
}

/** App name for headers and install prompts, by the shared rule (shared-ui-lib branding): the
 *  tenant's own app name ("Urban Eats", service_branding.ordering via ordering-backend's
 *  app_name), else "<brand word> <fallback>" ("The Urban OrderApp"). */
export function appDisplayName(config: BrandConfig | undefined, fallback: string): string {
  return serviceAppName(config?.name, fallback, undefined, config?.appName ? { name: config.appName } : null);
}

export function useBrandConfig() {
  const orgSlug = useOrgSlug();
  const slug = orgSlug || (process.env.NEXT_PUBLIC_TENANT_SLUG as string) || "";

  return useQuery({
    queryKey: brandKeys.config(slug),
    queryFn: async (): Promise<BrandConfig> => {
      if (!slug) return staticBrandConfig();
      try {
        const { data } = await api.get<TenantBrandConfig>(`${slug}/config`);
        return {
          name: data.name || staticBrand.name,
          shortName: data.short_name || data.name || staticBrand.shortName,
          tagline: data.tagline || staticBrand.tagline,
          logoUrl: data.logo_url || staticBrand.assets.logo,
          supportEmail: data.support_email || staticBrand.support.email,
          supportPhone: data.support_phone || staticBrand.support.phone,
          primaryColor: data.primary_color || data.brand_palette?.primary || staticBrand.palette.primary,
          secondaryColor: data.secondary_color || data.brand_palette?.secondary || staticBrand.palette.emphasis,
          features: data.features ?? {},
          useCase: data.use_case,
          useCases: data.use_cases ?? [],
          appName: data.app_name || undefined,
          appIconUrl: data.app_icon_url || undefined,
        };
      } catch {
        return staticBrandConfig();
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 minutes — brand config rarely changes
    retry: false, // Don't retry — fall back to static config
  });
}
