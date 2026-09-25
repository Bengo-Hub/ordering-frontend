import { type NextRequest, NextResponse } from 'next/server';

import { appIconPath, getAppBranding } from '@/lib/app-branding';

const DEFAULT_BG = '#ffffff';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  // App name and icon come from the tenant's service branding (e.g. urban-loft's
  // "Urban Eats"), else "<Business> Ordering" with the business logo, else
  // generated initials. Never another tenant's identity.
  const branding = await getAppBranding(orgSlug);

  // Icons are always square PNGs generated for this tenant, so installs work
  // whether the uploaded icon is an SVG, a wide logo or missing.
  const icons = [
    { src: appIconPath(orgSlug, 192), sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: appIconPath(orgSlug, 512), sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: appIconPath(orgSlug, 192, true), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: appIconPath(orgSlug, 512, true), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
  const shortcutIcon = [{ src: appIconPath(orgSlug, 96), sizes: '96x96', type: 'image/png' }];

  const manifest = {
    // id keeps each tenant's install distinct even though they share a host.
    id: `/${orgSlug}/`,
    name: branding.appName,
    short_name: branding.shortName,
    description: branding.description,
    start_url: `/${orgSlug}/?source=pwa`,
    scope: `/${orgSlug}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: DEFAULT_BG,
    theme_color: branding.themeColor,
    categories: ['shopping', 'food', 'lifestyle'],
    lang: 'en',
    icons,
    shortcuts: [
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View your recent orders',
        url: `/${orgSlug}/orders`,
        icons: shortcutIcon,
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        description: 'Track your active order',
        url: `/${orgSlug}/track`,
        icons: shortcutIcon,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
    },
  });
}
