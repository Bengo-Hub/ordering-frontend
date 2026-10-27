import { mediaImageLoaderFor } from "@bengo-hub/shared-ui-lib/media";
import type { ImageLoader } from "next/image";

/**
 * next/image props for the shared Cloudflare-edge media loader. mediaImageLoaderFor returns
 * undefined for images it should not resize (SVG, other hosts); this returns no `loader` key at
 * all then, which is what next/image expects under exactOptionalPropertyTypes.
 * Usage: <Image src={src} {...mediaLoaderProps(src)} ... />
 */
export function mediaLoaderProps(src: string | null | undefined): { loader?: ImageLoader } {
  const loader = mediaImageLoaderFor(src);
  return loader ? { loader } : {};
}
