/**
 * Turns a tenant's brand colours into the CSS variables the storefront reads. Pure, so it is
 * unit tested and shared by BrandThemeSync.
 *
 * --brand-primary / --brand-emphasis are "r g b" triplets (Tailwind `brand` colours).
 * --primary / --ring are "h s% l%" (shadcn tokens behind bg-primary, text-primary, focus rings)
 * and are only set when white text on the colour reaches WCAG AA (4.5:1); otherwise the
 * platform plum stays so buttons remain readable.
 */

const HEX = /^#?([0-9a-fA-F]{6})$/;

export function parseHex(hex: string | undefined | null): [number, number, number] | null {
  const m = HEX.exec((hex ?? "").trim());
  if (!m) return null;
  const v = m[1];
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG contrast ratio of white text on this colour. */
export function contrastWithWhite([r, g, b]: [number, number, number]): number {
  const l = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return 1.05 / (l + 0.05);
}

export function toHslTriplet([r, g, b]: [number, number, number]): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function brandThemeVariables(
  primary?: string | null,
  secondary?: string | null,
): Record<string, string> {
  const vars: Record<string, string> = {};
  const p = parseHex(primary);
  if (p) {
    vars["--brand-primary"] = p.join(" ");
    if (contrastWithWhite(p) >= 4.5) {
      const hsl = toHslTriplet(p);
      vars["--primary"] = hsl;
      vars["--ring"] = hsl;
    }
  }
  const s = parseHex(secondary);
  if (s) vars["--brand-emphasis"] = s.join(" ");
  return vars;
}
