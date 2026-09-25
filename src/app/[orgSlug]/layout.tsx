import type { Metadata, Viewport } from "next";
import { BrandThemeSync } from "@/components/layout/brand-theme-sync";
import { appIconPath, getAppBranding } from "@/lib/app-branding";
import { MapProviderWrapper } from "@/providers/map-provider-wrapper";
import { OrgSlugProvider } from "@/providers/org-slug-provider";

// Browser tab, installed-app label and icons use the tenant's own name for the
// ordering app (e.g. "Urban Eats"), see lib/app-branding.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const branding = await getAppBranding(orgSlug);
  return {
    title: {
      default: branding.appName,
      template: `%s | ${branding.appName}`,
    },
    description: branding.description,
    applicationName: branding.appName,
    manifest: `/${orgSlug}/manifest.webmanifest`,
    icons: {
      icon: [
        { url: appIconPath(orgSlug, 32), sizes: "32x32", type: "image/png" },
        { url: appIconPath(orgSlug, 192), sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: appIconPath(orgSlug, 180), sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: branding.shortName,
    },
  };
}

export async function generateViewport({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Viewport> {
  const { orgSlug } = await params;
  const branding = await getAppBranding(orgSlug);
  return { themeColor: branding.themeColor };
}

export default async function OrgSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <OrgSlugProvider orgSlug={orgSlug}>
      <BrandThemeSync />
      <MapProviderWrapper>{children}</MapProviderWrapper>
    </OrgSlugProvider>
  );
}
