import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display as PlayfairDisplay } from "next/font/google";
import type { CSSProperties } from "react";

import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = PlayfairDisplay({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: brand.metadata.defaultTitle,
    template: brand.metadata.template,
  },
  description: brand.description,
  applicationName: brand.metadata.applicationName,
  authors: [{ name: brand.name }],
  keywords: [
    "food delivery",
    brand.shortName.toLowerCase(),
    "next.js",
    "react",
    "pwa",
    "tanstack query",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: brand.palette.dark },
    { color: brand.palette.primary },
  ],
};

const brandCssVariables = {
  "--brand-primary": brand.cssVariables.primary,
  "--brand-emphasis": brand.cssVariables.emphasis,
  "--brand-contrast": brand.cssVariables.contrast,
  "--brand-muted": brand.cssVariables.muted,
  "--brand-surface": brand.cssVariables.surface,
  "--brand-dark": brand.cssVariables.dark,
} satisfies Record<string, string>;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={brandCssVariables as CSSProperties}
        className={cn(inter.variable, display.variable, "font-sans antialiased")}
      >
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
