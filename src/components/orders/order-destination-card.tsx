"use client";

import { ExternalLink, MapPin, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/api/orders";
import { formatDateTime } from "@/lib/datetime";

/**
 * Where the order goes, on the customer's order pages: the delivery place, area, rider notes and
 * a map link for a delivery order, or the counter for a pickup order.
 */
export function OrderDestinationCard({ order }: { order: Order }) {
  const drop = order.dropoff;
  const eta = order.estimatedDeliveryAt
    ? formatDateTime(order.estimatedDeliveryAt, { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {drop ? <MapPin className="size-4 text-brand-emphasis" /> : <Store className="size-4 text-brand-emphasis" />}
          {drop ? "Delivery" : "Pickup"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {drop ? (
          <>
            <p className="font-medium">{drop.address || "Location pinned on the map"}</p>
            {drop.area && drop.area !== drop.address && <p className="text-muted-foreground">Delivery area: {drop.area}</p>}
            {drop.notes && <p className="whitespace-pre-line text-muted-foreground">{drop.notes}</p>}
            {drop.lat != null && drop.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${drop.lat},${drop.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Open in Maps <ExternalLink className="size-3" />
              </a>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Collect it at the counter. Show your collection code.</p>
        )}
        {eta && (
          <p className="text-xs text-muted-foreground">
            {drop ? "Expected by" : "Ready by"} {eta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
