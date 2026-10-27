import "@bengo-hub/shared-ui-lib/contact/style.css";
import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Geist_Mono } from "next/font/google";

import { CookieNoticeMount } from "@/components/legal/cookie-notice-mount";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/app-providers";

// Figtree for reading, Bricolage Grotesque for headings and prices (the Codevertex type pair).
const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: brand.metadata.defaultTitle,
    template: brand.metadata.template,
  },
  description: brand.description,
  applicationName: brand.metadata.applicationName,
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  authors: [{ name: brand.name }],
  manifest: "/api/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.shortName,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    "online ordering",
    "delivery",
    "marketplace",
    brand.shortName.toLowerCase(),
    "pwa",
    "real-time tracking",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: brand.palette.dark },
    { color: brand.palette.primary },
  ],
};

// The platform palette lives in globals.css (:root). It is not repeated as an inline style here:
// an inline style on <body> redeclared the brand variables below <html>, so the tenant colours
// BrandThemeSync writes on <html> never reached the page.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          body.variable,
          display.variable,
          geistMono.variable,
          "font-sans antialiased min-h-[100dvh] overflow-x-hidden",
        )}
      >
        <AppProviders>
          {children}
          <Toaster />
          <CookieNoticeMount />
        </AppProviders>
      </body>
    </html>
  );
}
