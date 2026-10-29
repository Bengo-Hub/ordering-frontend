/**
 * The cart fields for a product with (or without) a chosen variant, shared by the product page
 * and the quick add-to-cart modal so both build the same line:
 * - `id` is a client cart key (distinct per variant); checkout sends `inventorySku`, which for a
 *   variant is the variant's own SKU, and ordering-backend resolves it;
 * - the name reads "T-shirt, Red / M" (the variant's own name when it already says so);
 * - `metadata` carries the variant keys the backend re-stamps server side anyway.
 */

import { formatAttributes } from "@/lib/order-line";
import type { CatalogVariant } from "@/types/catalog";

export interface VariantCartFields {
  id: string;
  name: string;
  inventorySku?: string;
  metadata: Record<string, unknown>;
}

export function variantCartFields(
  item: { id: string; name: string },
  variant: CatalogVariant | null | undefined,
): VariantCartFields {
  if (!variant) return { id: item.id, name: item.name, metadata: {} };
  const label = formatAttributes(variant.attributes) || variant.name;
  const name =
    variant.name && variant.name.toLowerCase().startsWith(item.name.toLowerCase())
      ? variant.name
      : `${item.name}, ${label}`;
  const metadata: Record<string, unknown> = {
    variant_id: variant.id,
    variant_sku: variant.sku,
    variant_name: variant.name,
  };
  if (Object.keys(variant.attributes ?? {}).length > 0) metadata.variant_attributes = variant.attributes;
  return { id: `${item.id}::${variant.id}`, name, inventorySku: variant.sku, metadata };
}
