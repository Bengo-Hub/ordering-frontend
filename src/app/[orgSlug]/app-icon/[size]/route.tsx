import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getAppBranding } from "@/lib/app-branding";

// Square PNG app icons for the PWA manifest, apple-touch-icon and favicon,
// generated from the tenant's ordering-app icon (SVG or raster, often a wide
// logo) so installs get properly sized icons whatever was uploaded. Falls back
// to the app's initials on the theme colour when there is no usable image.

const MIN_SIZE = 16;
const MAX_SIZE = 1024;
const MAX_REMOTE_BYTES = 1024 * 1024;

function clampSize(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 192;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "O").slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Real image type from the file's first bytes. Declared types are often wrong
 * (urban-loft's logo is a JPEG served as image/png) and the renderer silently
 * draws nothing when the declared type does not match. Only types the
 * renderer can draw are returned; anything else (WebP, ...) gets initials.
 */
function sniffMime(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const head = bytes.subarray(0, 512).toString("utf8").replace(/^﻿/, "").trimStart();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml";
  return null;
}

function decodeDataUri(uri: string): Buffer | null {
  const comma = uri.indexOf(",");
  if (comma < 0) return null;
  const meta = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  try {
    return meta.includes(";base64") ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");
  } catch {
    return null;
  }
}

/** Returns the icon as a correctly typed data URI the renderer can embed, or null when it is unusable. */
async function loadIcon(iconUrl: string | null): Promise<string | null> {
  if (!iconUrl) return null;
  let bytes: Buffer | null = null;
  if (iconUrl.startsWith("data:image/")) {
    bytes = decodeDataUri(iconUrl);
  } else if (iconUrl.startsWith("https://")) {
    try {
      const res = await fetch(iconUrl, { next: { revalidate: 3600 } });
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_REMOTE_BYTES) return null;
      bytes = Buffer.from(buf);
    } catch {
      return null;
    }
  }
  if (!bytes) return null;
  const mime = sniffMime(bytes);
  return mime ? `data:${mime};base64,${bytes.toString("base64")}` : null;
}

function render(size: number, background: string, content: React.ReactElement) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
        }}
      >
        {content}
      </div>
    ),
    { width: size, height: size },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; size: string }> },
) {
  const { orgSlug, size: rawSize } = await params;
  const size = clampSize(rawSize);
  // Maskable icons get cropped to a circle by Android, so keep the artwork in
  // the central safe zone.
  const maskable = request.nextUrl.searchParams.get("maskable") === "1";
  const branding = await getAppBranding(orgSlug);
  const headers = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  };

  const icon = await loadIcon(branding.iconUrl);
  if (icon) {
    const inner = Math.round(size * (maskable ? 0.68 : 0.86));
    try {
      const res = render(
        size,
        maskable ? branding.themeColor : "#ffffff",
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} width={inner} height={inner} style={{ objectFit: "contain" }} alt="" />,
      );
      // Render eagerly so an image the renderer cannot draw falls back below
      // instead of failing mid-response.
      const png = await res.arrayBuffer();
      return new Response(png, { headers });
    } catch {
      // fall through to initials
    }
  }

  const res = render(
    size,
    branding.themeColor,
    <div
      style={{
        display: "flex",
        color: "#ffffff",
        fontSize: Math.round(size * (maskable ? 0.34 : 0.42)),
        fontWeight: 700,
        letterSpacing: -1,
      }}
    >
      {initials(branding.appName)}
    </div>,
  );
  return new Response(await res.arrayBuffer(), { headers });
}
