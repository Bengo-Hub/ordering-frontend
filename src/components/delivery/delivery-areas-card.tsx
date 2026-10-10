"use client";

import { ExternalLink, Loader2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeliveryCoverage } from "@/hooks/use-delivery";
import { useOrgSlug } from "@/providers/org-slug-provider";

const LOGISTICS_UI_URL = (process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexafrica.com").replace(/\/+$/, "");

/** Where to manage delivery areas, pricing and geofencing (logistics-ui owns them). */
export function logisticsZonesUrl(orgSlug: string): string {
  return `${LOGISTICS_UI_URL}/${orgSlug}/zones`;
}

/**
 * Read-only summary of the tenant's delivery areas. Areas, fees, the distance rate and
 * the geofence are managed in logistics-ui, which every service prices deliveries from.
 */
export function DeliveryAreasCard({ orgSlug: slugProp }: { orgSlug?: string }) {
  const ctxSlug = useOrgSlug();
  const orgSlug = slugProp || ctxSlug;
  const { data, isLoading, isError } = useDeliveryCoverage();
  const zones = (data?.zones ?? []).filter((z) => z.zone_type === "delivery");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="size-5" /> Delivery areas
        </CardTitle>
        <Button size="sm" variant="outline" asChild>
          <a href={logisticsZonesUrl(orgSlug)} target="_blank" rel="noreferrer">
            Manage in Logistics <ExternalLink className="ml-1.5 size-3.5" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Delivery fees, areas, the distance rate for nearby pins and how far you deliver are set once in Logistics and
          used by checkout, POS deliveries and riders.
        </p>
        {isLoading ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading areas...
          </p>
        ) : isError ? (
          <p className="py-4 text-sm text-muted-foreground">Delivery areas could not be loaded.</p>
        ) : zones.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No delivery areas yet. Customers cannot order delivery until one is added.</p>
        ) : (
          <div className="divide-y">
            {zones.map((z) => (
              <div key={z.id} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                  {z.name}
                </span>
                <Badge variant={z.free ? "default" : "outline"}>
                  {z.free ? "Free" : `${data?.currency ?? "KES"} ${Math.round(z.fee).toLocaleString()}`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
