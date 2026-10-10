"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, Loader2, MapPin, Navigation, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { ZoneShape } from "@bengo-hub/maps";

import { Button } from "@/components/ui/button";
import { useDeliveryCoverage, useDeliveryQuote, usePlaceSearch, useReversePlace } from "@/hooks/use-delivery";
import { NOT_SERVICEABLE_TEXT, quoteLabel, type DeliveryQuote, type LatLng } from "@/lib/api/delivery";
import { cn } from "@/lib/utils";

const DeliveryMap = dynamic(() => import("./delivery-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/50" />,
});

/** A chosen delivery point: coordinates plus the place name shown to the customer and rider. */
export interface DeliveryPoint {
  lat: number;
  lng: number;
  /** Human label, e.g. "Alupe Market, Alupe" or "Near Alupe". */
  address: string;
  placeName?: string | undefined;
}

interface DeliveryLocationPickerProps {
  /** Current choice; when empty the picker locates the customer and preselects that pin. */
  value: DeliveryPoint | null;
  onConfirm: (point: DeliveryPoint, quote: DeliveryQuote | undefined) => void;
  outletId?: string | null | undefined;
  orderTotal?: number | undefined;
  confirmLabel?: string;
  /** Allow confirming a point outside the delivery area (e.g. browsing location in the header). */
  allowOutside?: boolean;
  className?: string | undefined;
}

/**
 * The one delivery location picker for the storefront (checkout, header, sign-up).
 * Search a place or drag the pin; the place name and the delivery fee update live from
 * logistics, and points outside the delivery area cannot be confirmed for delivery.
 */
export function DeliveryLocationPicker({
  value,
  onConfirm,
  outletId,
  orderTotal,
  confirmLabel = "Deliver here",
  allowOutside = false,
  className,
}: DeliveryLocationPickerProps) {
  const [point, setPoint] = useState<LatLng | null>(value ? { lat: value.lat, lng: value.lng } : null);
  const [query, setQuery] = useState("");
  const [locateError, setLocateError] = useState<string | null>(null);
  // A searched place keeps its own name; a dragged or located pin uses the reverse lookup.
  const [pickedName, setPickedName] = useState<string | null>(value?.placeName ?? null);

  const coverage = useDeliveryCoverage(outletId);
  const places = usePlaceSearch(query);
  const reverse = useReversePlace(point);
  const quote = useDeliveryQuote(point, outletId, orderTotal);

  const zones = useMemo<ZoneShape[]>(
    () =>
      (coverage.data?.zones ?? []).map((z) => ({
        id: z.id,
        name: z.name,
        boundary: z.boundary,
        color: z.color,
        zoneType: z.zone_type,
      })),
    [coverage.data],
  );

  const placeName = pickedName ?? reverse.data?.name ?? null;
  const areaHint = reverse.data?.area && reverse.data.area.name !== placeName ? reverse.data.area.name : null;
  const address =
    [placeName, areaHint].filter(Boolean).join(", ") || (point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : "");

  const q = quote.data;
  const quoting = !!point && quote.isFetching && !q;
  const outside = !!q && !q.serviceable && !allowOutside;
  const blocked = !point || quoting || outside;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an area, street or landmark"
          className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query.trim().length >= 3 && (
          <div className="absolute inset-x-0 top-12 z-20 max-h-64 overflow-y-auto rounded-xl border bg-background shadow-lg">
            {places.isFetching && (
              <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Searching...
              </p>
            )}
            {!places.isFetching && (places.data ?? []).length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No places found. Drag the pin instead.</p>
            )}
            {(places.data ?? []).map((p, i) => (
              <button
                key={`${p.display_name}-${i}`}
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setPoint(p.location);
                  setPickedName(p.name);
                  setQuery("");
                }}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="font-medium">{p.name}</span>
                  {p.source === "zone" && (
                    <span className="ml-2 rounded bg-primary/10 px-1.5 text-[10px] text-primary">Delivery area</span>
                  )}
                  <span className="block truncate text-xs text-muted-foreground">{p.display_name}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-72 overflow-hidden rounded-xl border sm:h-80">
        <DeliveryMap
          className="absolute inset-0"
          value={point}
          onChange={(p) => {
            setPoint(p);
            setPickedName(null);
            setLocateError(null);
          }}
          center={coverage.data?.center}
          zones={zones}
          locateOnMount={!value}
          onLocateError={setLocateError}
        />
      </div>
      {locateError && !point && (
        <p className="text-xs text-muted-foreground">{locateError} Search above or tap the map to set your location.</p>
      )}

      {point && (
        <div className="rounded-xl border p-3 text-sm">
          <p className="flex items-start gap-2">
            <Navigation className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block font-medium">{reverse.isFetching && !placeName ? "Finding the place..." : address}</span>
              <span className="block text-xs text-muted-foreground">
                {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </span>
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {quoting ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Checking delivery...
              </span>
            ) : q ? (
              q.serviceable ? (
                <span className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-4" /> {quoteLabel(q)}
                  {q.eta_minutes ? <span className="font-normal text-muted-foreground">about {q.eta_minutes} min</span> : null}
                </span>
              ) : (
                <span className="flex flex-wrap items-center gap-2 text-destructive">
                  <XCircle className="size-4" />
                  {NOT_SERVICEABLE_TEXT[q.reason ?? ""] ?? "We cannot deliver here yet."}
                  {q.nearest_area && <span className="text-muted-foreground">Nearest area: {q.nearest_area.name}</span>}
                </span>
              )
            ) : quote.isError ? (
              <span className="text-amber-600">Delivery pricing is unavailable right now.</span>
            ) : null}
          </div>
          {q?.below_min_order && (
            <p className="mt-1 text-xs text-amber-600">
              Orders to {q.zone?.name ?? "this area"} need at least {q.currency} {Math.round(q.min_order).toLocaleString()}.
            </p>
          )}
        </div>
      )}

      <Button
        className="w-full"
        disabled={blocked}
        onClick={() => point && onConfirm({ lat: point.lat, lng: point.lng, address, placeName: placeName ?? undefined }, q)}
      >
        {quoting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MapPin className="mr-2 size-4" />}
        {outside ? "Outside the delivery area" : confirmLabel}
      </Button>
    </div>
  );
}
