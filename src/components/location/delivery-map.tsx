"use client";

import { LocationPicker, type LatLng as MapLatLng, type ZoneShape } from "@bengo-hub/maps";

import type { LatLng } from "@/lib/api/delivery";

interface DeliveryMapProps {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  center?: LatLng | undefined;
  zones: ZoneShape[];
  locateOnMount: boolean;
  onLocateError: (message: string) => void;
  className?: string | undefined;
}

const toMap = (p: LatLng): MapLatLng => ({ latitude: p.lat, longitude: p.lng });

/** Map with one draggable pin over the tenant's delivery areas. Client only (WebGL). */
export default function DeliveryMap({ value, onChange, center, zones, locateOnMount, onLocateError, className }: DeliveryMapProps) {
  return (
    <LocationPicker
      {...(className ? { className } : {})}
      value={value ? toMap(value) : null}
      onChange={(p) => onChange({ lat: p.latitude, lng: p.longitude })}
      {...(center ? { defaultCenter: toMap(center) } : {})}
      zones={zones}
      zoom={16}
      locateOnMount={locateOnMount}
      onLocateError={onLocateError}
    />
  );
}
