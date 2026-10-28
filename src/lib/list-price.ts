/**
 * One place for how the storefront states a product's price, so every card, rail, deal and the
 * product page say the same thing:
 * - a product with variants at different prices reads "From KES 900" on cards and
 *   "KES 900 - KES 1,100" on the product page (as large retail stores do);
 * - everything else reads "KES 900".
 * priceFrom/priceTo come from ordering-backend (active, priced variants only).
 */

export interface ListPriced {
  price?: number | undefined;
  priceFrom?: number | undefined;
  priceTo?: number | undefined;
}

/** Whole-number money in the storefront's style ("KES 1,250"). */
export function formatMoney(currency: string | undefined, amount: number): string {
  return `${currency || "KES"} ${Math.round(amount).toLocaleString()}`;
}

/** The price a listing sorts, filters and adds to cart on: the lowest variant price, else price. */
export function listPrice(item: ListPriced): number {
  return item.priceFrom ?? item.price ?? 0;
}

/** True when the variants are not all the same price. */
export function hasPriceRange(item: ListPriced): boolean {
  return item.priceFrom != null && item.priceTo != null && item.priceTo > item.priceFrom;
}

/** Card label: "From KES 900" for a ranged product, else "KES 900". */
export function formatListPrice(item: ListPriced, currency?: string): string {
  const base = formatMoney(currency, listPrice(item));
  return hasPriceRange(item) ? `From ${base}` : base;
}

/** Product page label before a variant is chosen: "KES 900 - KES 1,100", else "KES 900". */
export function formatPriceRange(item: ListPriced, currency?: string): string {
  if (!hasPriceRange(item)) return formatMoney(currency, listPrice(item));
  return `${formatMoney(currency, item.priceFrom ?? 0)} - ${formatMoney(currency, item.priceTo ?? 0)}`;
}
