/**
 * One place that turns ordering-backend order lines into what the storefront shows, used by the
 * customer, guest, tracking and admin order views:
 * - item fields: the backend sends `nameSnapshot` and `inventorySku` (domain OrderItem), not the
 *   `name`/`menuItemId` the views read;
 * - the variant ("Red / M") from `metadata.variant_attributes`, unless the name already ends with it
 *   (checkout names a variant line "T-shirt, Red / M");
 * - modifiers from `metadata.modifiers` (`[{group_name, option_name, price_adjustment}]`).
 */

import { formatMoney } from "@/lib/list-price";

export interface OrderLineView {
  /** Product id used for reorder (the line SKU; a variant line's SKU is the variant's). */
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  /** Variant label, e.g. "Red / M"; empty when the line has none or the name already shows it. */
  variantLabel?: string;
  /** Modifier labels, e.g. ["Extra cheese (+KES 50)"]. */
  modifiers?: string[];
  metadata?: Record<string, unknown>;
}

type Raw = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Axis order shared with checkout's variant names: colour, then size, then the rest A-Z. */
function axisRank(axis: string): number {
  const a = axis.toLowerCase();
  if (a === "colour" || a === "color") return 0;
  if (a === "size") return 1;
  return 2;
}

/** Variant axis names in display order (colour, size, then the rest A-Z); the variant picker,
 *  order lines and cart names all use this one order. */
export function orderAxes(keys: Iterable<string>): string[] {
  return [...keys].sort((a, b) => axisRank(a) - axisRank(b) || a.localeCompare(b));
}

/** "Red / M" from an attribute map, in the same axis order as the variant picker. */
export function formatAttributes(attrs: Record<string, unknown> | undefined): string {
  if (!attrs) return "";
  return orderAxes(Object.keys(attrs))
    .map((k) => str(attrs[k]))
    .filter(Boolean)
    .join(" / ");
}

/** Modifier labels from a line's metadata snapshot. */
export function modifierLabels(metadata: Raw | undefined, currency?: string): string[] {
  const mods = metadata?.modifiers;
  if (!Array.isArray(mods)) return [];
  return mods
    .map((m) => {
      const mod = (m ?? {}) as Raw;
      const name = str(mod.option_name) || str(mod.optionName);
      if (!name) return "";
      const adj = num(mod.price_adjustment ?? mod.priceAdjustment);
      return adj > 0 ? `${name} (+${formatMoney(currency, adj)})` : name;
    })
    .filter(Boolean);
}

/** Maps one backend order line (any known spelling) to the view shape. */
export function toOrderLineView(raw: unknown, currency?: string): OrderLineView {
  const it = (raw ?? {}) as Raw;
  const metadata = (it.metadata && typeof it.metadata === "object" ? it.metadata : undefined) as
    | Raw
    | undefined;
  const name = str(it.name) || str(it.nameSnapshot) || str(it.name_snapshot);
  const attrs = formatAttributes(metadata?.variant_attributes as Raw | undefined);
  const variantLabel = attrs && !name.endsWith(attrs) ? attrs : "";
  const modifiers = modifierLabels(metadata, currency);
  const notes = str(it.notes);
  return {
    menuItemId: str(it.menuItemId) || str(it.inventorySku) || str(it.inventory_sku) || str(it.id),
    name,
    quantity: num(it.quantity),
    unitPrice: num(it.unitPrice ?? it.unit_price),
    totalPrice: num(it.totalPrice ?? it.total_price),
    ...(notes ? { notes } : {}),
    ...(variantLabel ? { variantLabel } : {}),
    ...(modifiers.length > 0 ? { modifiers } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

/** One line of secondary text under the item name: variant, then modifiers. */
export function orderLineDetails(line: Pick<OrderLineView, "variantLabel" | "modifiers">): string {
  return [line.variantLabel, ...(line.modifiers ?? [])].filter(Boolean).join(", ");
}

/** The backend sends the saved address as an object; the views show one line of text. */
export function formatDeliveryAddress(addr: unknown): string {
  if (typeof addr === "string") return addr;
  if (!addr || typeof addr !== "object") return "";
  const a = addr as Raw;
  return [str(a.addressLine1), str(a.addressLine2), str(a.city)].filter(Boolean).join(", ");
}
