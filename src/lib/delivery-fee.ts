/**
 * The customer-facing label for an outlet's delivery fee code (from the logistics quote with the
 * customer's pin, or the cheapest area fee): "free", "free-nearby", a number, "from N" or
 * "not-deliverable". Shared by outlet cards and the storefront heroes.
 */
export function deliveryFeeLabel(fee: string): string {
  const f = fee.toLowerCase();
  if (f === "free") return "Free delivery";
  if (f === "free-nearby") return "Free delivery nearby";
  if (f === "not-deliverable") return "Doesn't deliver to you";
  if (f.startsWith("from ")) return `Delivery from KES ${fee.slice(5)}`;
  if (/^\d+$/.test(fee)) return `KES ${fee} delivery`;
  return fee;
}
