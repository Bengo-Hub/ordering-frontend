type PaletteKey = "primary" | "emphasis" | "contrast" | "muted" | "surface" | "dark";

const HEX_COLOR_REGEX = /^#?(?:[0-9a-fA-F]{6})$/;

// Codevertex palette (plum, gold, mist, night), the same as globals.css. Used for theme-color
// and the manifest; the page colours themselves come from the CSS tokens.
const defaultPalette: Record<PaletteKey, string> = {
  primary: "#9B2C6B",
  emphasis: "#C8963E",
  contrast: "#ffffff",
  muted: "#F8F0F4",
  surface: "#FDE7F1",
  dark: "#1E0F1B",
};

const sanitizeHex = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return fallback;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const hexToRgbTriplet = (hexValue: string): string => {
  const sanitized = sanitizeHex(hexValue, hexValue).replace("#", "");
  const red = parseInt(sanitized.slice(0, 2), 16);
  const green = parseInt(sanitized.slice(2, 4), 16);
  const blue = parseInt(sanitized.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
};

const getPalette = (): Record<PaletteKey, string> => {
  const entries = Object.entries(defaultPalette).map(([key, fallback]) => {
    const envKey = `NEXT_PUBLIC_BRAND_${key.toUpperCase()}`;
    const envValue = process.env[envKey as keyof NodeJS.ProcessEnv];
    return [key, sanitizeHex(envValue, fallback)];
  });

  return Object.fromEntries(entries) as Record<PaletteKey, string>;
};

const brandPalette = getPalette();

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Codevertex";
const brandShortName = process.env.NEXT_PUBLIC_BRAND_SHORT_NAME?.trim() || "Codevertex";
const brandTagline =
  process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() ||
  "Shop local stores, restaurants and services. Pay with M-Pesa and track your order to the door.";
const brandDescription =
  process.env.NEXT_PUBLIC_BRAND_DESCRIPTION?.trim() ||
  "Order from local shops, restaurants, pharmacies and service providers in one place, pay with M-Pesa or card, and follow your order until it arrives.";
const supportEmail =
  process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL?.trim() || "support@codevertexafrica.com";
const supportPhone = process.env.NEXT_PUBLIC_BRAND_SUPPORT_PHONE?.trim() || "+254 743 793 901";
const headquarters =
  process.env.NEXT_PUBLIC_BRAND_HQ?.trim() ||
  "Oginga Road, Pioneer House, Second Floor, Kisumu, Kenya";
// Platform marks (the Codevertex tick), NOT a tenant's logo. A tenant's own logo always comes
// from its branding record (TenantBrand.logoUrl); these brand the marketplace shell and are the
// last-resort default before a tenant has resolved. logoFull has the wordmark (light and dark).
const logo = process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim() || "/brand/logo-mark.png";
const logoFull = "/brand/logo-full.png";
const logoFullOnDark = "/brand/logo-full-light.png";

// Brand defaults are env-configurable per tenant. Backend-managed settings planned for post-MVP.
export const brand = {
  name: brandName,
  shortName: brandShortName,
  tagline: brandTagline,
  description: brandDescription,
  support: {
    email: supportEmail,
    phone: supportPhone,
    headquarters,
  },
  palette: brandPalette,
  cssVariables: {
    primary: hexToRgbTriplet(brandPalette.primary),
    emphasis: hexToRgbTriplet(brandPalette.emphasis),
    contrast: hexToRgbTriplet(brandPalette.contrast),
    muted: hexToRgbTriplet(brandPalette.muted),
    surface: hexToRgbTriplet(brandPalette.surface),
    dark: hexToRgbTriplet(brandPalette.dark),
  },
  metadata: {
    defaultTitle: `${brandShortName} ${process.env.NEXT_PUBLIC_BRAND_SUFFIX ?? "Marketplace"}`,
    template: "%s | " + `${brandShortName} ${process.env.NEXT_PUBLIC_BRAND_SUFFIX ?? "Marketplace"}`,
    applicationName: `${brandShortName} Platform`,
  },
  assets: {
    logo,
    logoFull,
    logoFullOnDark,
  },
} as const;

export type BrandConfig = typeof brand;
