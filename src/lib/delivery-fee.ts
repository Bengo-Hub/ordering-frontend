/**
 * The customer-facing label for an outlet's delivery fee code (from the logistics quote with the
 * customer's pin, or the cheapest area fee): "free", "free-nearby", a number, "from N" or
 * "not-deliverable". Shared by outlet cards and the storefront heroes.
 */
export function deliveryFeeLabel(fee: string, place?: string | null): string {
  const f = fee.toLowerCase();
  if (f === "free") return "Free delivery";
  if (f === "free-nearby") return "Free delivery nearby";
  // The shopper's chosen delivery location is outside every delivery zone of this store.
  if (f === "not-deliverable") return place ? `No delivery to ${place}` : "No delivery to your location";
  if (f.startsWith("from ")) return `Delivery from KES ${fee.slice(5)}`;
  if (/^\d+$/.test(fee)) return `KES ${fee} delivery`;
  return fee;
}

/**
 * The full note for a store that cannot deliver to the shopper's chosen location: which place is
 * out of reach and where the store does deliver, so the shopper knows to change the location or
 * pick up. `area` is the outlet's name and address ("Urban Loft Cafe Busia, Busia town").
 */
export function notDeliverableNote(place: string | null | undefined, area: string | null | undefined): string {
  const where = place ? `We don't deliver to ${place}.` : "We don't deliver to the location you chose.";
  return area ? `${where} Deliveries cover the area around ${area}.` : where;
}

/** "Urban Loft Cafe Busia (Busia town)" from an outlet's name and address, whichever it has. */
export function outletArea(outlet: { name?: string; address?: string } | null | undefined): string | null {
  const name = outlet?.name?.trim();
  const address = outlet?.address?.trim();
  if (name && address) return `${name} (${address})`;
  return name || address || null;
}
