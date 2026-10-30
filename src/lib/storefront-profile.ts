/**
 * The kind of shop a retail store is (beauty, auto parts, electronics, supermarket, fashion,
 * hardware), worked out from its own category names. Tenants only record "retail", so the
 * categories are the honest signal: "Skin care" and "Hair" make a beauty shop, "Brake pads" and
 * "Engine" an auto parts shop. A store whose categories match no kind clearly stays general.
 *
 * The kind changes section order and copy on the retail home (for example, shoppers of
 * electronics and parts look for the brand first). It never adds claims.
 */

export type RetailKind = "beauty" | "auto_parts" | "electronics" | "supermarket" | "fashion" | "hardware";

// Word starts, so plurals match ("Brakes", "Filters", "Speakers").
const KEYWORDS: Record<RetailKind, RegExp> = {
  beauty: /\b(beauty|cosmetic|skin ?care|make ?up|hair|fragrance|perfume|nail|lotion|serum|salon|braid)/i,
  auto_parts: /\b(auto|spare|engine|brake|filter|suspension|tyre|tire|lubricant|clutch|gearbox|exhaust|gasket|bearing|spark plug|wiper|bush|stabili[sz]er|cv joint)/i,
  electronics: /\b(electronic|phone|smart ?phone|mobile|laptop|computer|tv\b|television|audio|speaker|sound ?bar|camera|charger|gadget|usb|memory|flash|radio|satel+ite)/i,
  supermarket: /\b(grocer|beverage|drink|snack|dairy|bakery|cereal|cleaning|toiletr|food ?stuff|cooking|confectioner)/i,
  fashion: /\b(fashion|cloth|apparel|shoe|footwear|dress|shirt|jewel|wear\b)/i,
  hardware: /\b(hardware|tool|plumbing|paint|cement|building|construction|timber)/i,
};

/** The kind most of the store's categories point to, or null when none stands out. */
export function retailKind(categoryNames: string[]): RetailKind | null {
  if (categoryNames.length === 0) return null;
  const counts = new Map<RetailKind, number>();
  for (const name of categoryNames) {
    for (const [kind, re] of Object.entries(KEYWORDS) as [RetailKind, RegExp][]) {
      if (re.test(name)) counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  }
  let best: RetailKind | null = null;
  let bestCount = 0;
  for (const [kind, n] of counts) {
    if (n > bestCount) {
      best = kind;
      bestCount = n;
    }
  }
  // At least two matching categories and a quarter of the catalogue, so one stray "Bags" row
  // does not turn a general store into a fashion shop.
  return bestCount >= 2 && bestCount / categoryNames.length >= 0.25 ? best : null;
}

export interface RetailKindLayout {
  /** Show "Shop by brand" right after the hero (shoppers search by make or brand first). */
  brandsFirst: boolean;
  /** Heading for the brand row. */
  brandsTitle: string;
  /** Subtitle under "Top deals". */
  topDealsSubtitle: string;
}

export function retailKindLayout(kind: RetailKind | null, itemsLabel: string): RetailKindLayout {
  switch (kind) {
    case "auto_parts":
      return { brandsFirst: true, brandsTitle: "Shop by brand", topDealsSubtitle: "Parts our customers buy most" };
    case "electronics":
      return { brandsFirst: true, brandsTitle: "Shop by brand", topDealsSubtitle: "Our best-selling devices and accessories" };
    case "beauty":
      return { brandsFirst: true, brandsTitle: "Shop by brand", topDealsSubtitle: "Our customers' favourites" };
    case "supermarket":
      return { brandsFirst: false, brandsTitle: "Shop by brand", topDealsSubtitle: "What our customers buy most often" };
    default:
      return { brandsFirst: false, brandsTitle: "Shop by brand", topDealsSubtitle: `Our best-selling ${itemsLabel}` };
  }
}
