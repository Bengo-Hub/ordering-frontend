import withPWA from "@ducanh2912/next-pwa";

import { serviceRewrites } from "./src/lib/service-urls.config.mjs";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "urban-loft";

/** The app's own host (and local dev hosts), as a `has: host` pattern. */
const APP_HOST_PATTERN = (() => {
  let host = "ordering.codevertexafrica.com";
  try {
    host = new URL(process.env.NEXT_PUBLIC_APP_URL || `https://${host}`).hostname;
  } catch {
    // keep the default
  }
  return `(?:${host.replace(/\./g, "\\.")}|localhost|127\\.0\\.0\\.1)`;
})();

const nextConfig = {
  // On a tenant's own domain the browser calls the platform APIs through these same-origin
  // paths (src/lib/service-urls.ts), so new tenant domains never need API CORS changes.
  async rewrites() {
    return serviceRewrites();
  },
  ...(process.env.SKIP_STANDALONE !== 'true' && { output: 'standalone' }),
  reactStrictMode: true,
  images: {
    // Enable Next.js image optimization for automatic resizing, format conversion
    // (WebP/AVIF), and lazy loading. This significantly reduces page load times.
    remotePatterns: [
      // ordering-backend (this service's own media, e.g. outlet photos) — local dev port is
      // 4005 per .env.local's NEXT_PUBLIC_API_URL; 4000 kept too for other local setups.
      ...["4000", "4005"].flatMap((port) => [
        { protocol: "http", hostname: "localhost", port, pathname: "/media/**" },
        { protocol: "http", hostname: "127.0.0.1", port, pathname: "/media/**" },
      ]),
      // inventory-api (item/category images) — local dev port is 4001 per its own .env.
      { protocol: "http", hostname: "localhost", port: "4001", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4001", pathname: "/media/**" },
      {
        protocol: "https",
        hostname: "orderingapi.codevertexafrica.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "inventoryapi.codevertexafrica.com",
        pathname: "/media/**",
      },
      // auth-service's tenant-branding logo storage — every tenant's real logo_url
      // (e.g. urban-loft's) is hosted here. Missing this entry made next/image's
      // optimizer 400 on every real tenant logo, silently falling back to the
      // generic mark even once tenant branding data itself resolved correctly.
      {
        protocol: "https",
        hostname: "accounts.codevertexafrica.com",
        pathname: "/images/**",
      },
      // The shared public media bucket (Cloudflare R2): tenant logos and app icons from
      // auth-api, item and menu images, avatars. Since the 2026-10-17 move to object storage,
      // a missing entry here made the optimizer 400 on urban-loft's "Urban Eats" icon and
      // TenantLogo fell back to the default mark.
      {
        protocol: "https",
        hostname: "media.codevertexafrica.com",
        pathname: "/**",
      },
    ],
    // Serve optimized images in modern formats with quality 80
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800, // 7 days: upload names are content-unique
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
    // The webpack build type-checks generated .next/types route validators (Next 16 PageProps
    // shape); app code is checked via `tsc --noEmit`.
    ignoreBuildErrors: true,
  },
  turbopack: {},
  async redirects() {
    // Slug-less paths go to the default store only on the app's own host. On a tenant's domain the
    // proxy serves "/catalog" from that tenant's store (redirects run before the proxy, so without
    // the host condition every tenant domain was sent to the default store).
    const onAppHost = [{ type: "host", value: APP_HOST_PATTERN }];
    const slugless = [
      ["/catalog", "/catalog", false],
      ["/catalog/:id", "/catalog/:id", false],
      ["/menu", "/catalog", true],
      ["/menu/:id", "/catalog/:id", true],
      ["/checkout", "/checkout", false],
      ["/auth", "/auth", false],
      ["/auth/callback", "/auth/callback", false],
      ["/track/:orderId", "/track/:orderId", false],
      ["/dashboard/:path*", "/dashboard/:path*", false],
      ["/profile", "/profile", false],
      ["/admin/:path*", "/admin/:path*", false],
      ["/customers/:path*", "/customers/:path*", false],
      ["/outlet/:id", "/outlet/:id", false],
    ].map(([source, dest, permanent]) => ({
      source,
      destination: `/${DEFAULT_SLUG}${dest}`,
      permanent,
      has: onAppHost,
    }));
    return [
      ...slugless,
      { source: "/:orgSlug/menu", destination: `/:orgSlug/catalog`, permanent: true },
      { source: "/:orgSlug/menu/:id", destination: `/:orgSlug/catalog/:id`, permanent: true },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // Fleet-uniform: built with `next build --webpack` so next-pwa regenerates the SW every build
  // (always current; browser detects updates → PwaUpdater banner). Disabled only in dev.
  disable: true,
  workboxOptions: {
    skipWaiting: false,
    clientsClaim: true,
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  },
});

export default pwaConfig(nextConfig);
