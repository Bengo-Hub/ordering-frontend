"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, RotateCcw, Truck } from "lucide-react";

import { usePosOutlet } from "@/hooks/use-pos-outlet";
import { fetchDeliveryCoverage, fetchDeliveryQuote, reachNote } from "@/lib/api/delivery";
import { notDeliverableNote, outletArea } from "@/lib/delivery-fee";
import { formatMoney } from "@/lib/list-price";
import { selectDeliveryPlace, useDiningModeStore } from "@/store/dining-mode";

interface DeliveryReturnsBoxProps {
  orgSlug: string;
  outlet: { id: string; name: string; address?: string } | null | undefined;
  /** Returns apply to goods (retail, pharmacy, wholesale), not to cooked food or bookings. */
  showReturns: boolean;
}

/**
 * The "Delivery & Returns" box beside a product, as large Kenyan shops show it: what delivery to the
 * shopper's chosen place costs (or that it is out of reach, and where the store does deliver),
 * where to pick up, and the store's returns window. Every line comes from live data
 * (logistics-api quote and coverage, pos-api outlet settings) and is hidden when unknown.
 */
export function DeliveryReturnsBox({ orgSlug, outlet, showReturns }: DeliveryReturnsBoxProps) {
  const location = useDiningModeStore((s) => s.deliveryLocation);
  const place = useDiningModeStore(selectDeliveryPlace);
  const modes = useDiningModeStore((s) => s.supportedModes);
  const posOutlet = usePosOutlet(orgSlug, outlet?.id);

  const quote = useQuery({
    queryKey: ["product-delivery-quote", orgSlug, outlet?.id, location?.latitude, location?.longitude],
    queryFn: () => fetchDeliveryQuote(orgSlug, { lat: location!.latitude, lng: location!.longitude, outletId: outlet?.id }),
    enabled: !!orgSlug && !!location && modes.includes("delivery"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const coverage = useQuery({
    queryKey: ["product-delivery-coverage", orgSlug, outlet?.id],
    queryFn: () => fetchDeliveryCoverage(orgSlug, outlet?.id),
    enabled: !!orgSlug && !location && modes.includes("delivery"),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  let delivery: string | null = null;
  if (modes.includes("delivery")) {
    const q = quote.data;
    if (q) {
      if (q.serviceable) {
        const fee = q.free || q.fee === 0 ? "free" : formatMoney(q.currency, Math.round(q.fee));
        const eta = q.eta_minutes ? `, about ${q.eta_minutes} min` : "";
        delivery = `Delivery to ${place ?? "your location"}: ${fee}${eta}.`;
      } else {
        delivery = [notDeliverableNote(place, outletArea(outlet)), reachNote(q)].filter(Boolean).join(" ");
      }
    } else if (coverage.data && coverage.data.zones.length > 0) {
      const c = coverage.data;
      delivery =
        c.has_free_zone && c.min_fee === 0
          ? "Free delivery nearby. Set your location at the top of the page for the exact fee."
          : `Delivery from ${formatMoney(c.currency, Math.round(c.min_fee))}. Set your location at the top of the page for the exact fee.`;
    }
  }

  const pickup = modes.includes("pickup") && outlet ? `Pick up at ${outletArea(outlet)}.` : null;
  const days = posOutlet?.returnWindowDays;
  const returns = showReturns && days ? `Return it within ${days} days of buying.` : null;

  if (!delivery && !pickup && !returns) return null;
  const rows: { key: string; icon: React.ReactNode; title: string; body: string }[] = [];
  if (delivery) rows.push({ key: "delivery", icon: <Truck className="size-5" aria-hidden />, title: "Delivery", body: delivery });
  if (pickup) rows.push({ key: "pickup", icon: <MapPin className="size-5" aria-hidden />, title: "Pickup", body: pickup });
  if (returns) rows.push({ key: "returns", icon: <RotateCcw className="size-5" aria-hidden />, title: "Returns", body: returns });

  return (
    <section aria-labelledby="delivery-returns-title" className="rounded-2xl border border-border bg-card">
      <h2 id="delivery-returns-title" className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        Delivery and returns
      </h2>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.key} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 text-brand-emphasis">{r.icon}</span>
            <span className="text-sm">
              <span className="block font-medium text-foreground">{r.title}</span>
              <span className="text-muted-foreground">{r.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
