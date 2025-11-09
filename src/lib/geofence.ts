import type { LatLngTuple } from "leaflet";

export const BUSIA_BOUNDS = {
  minLat: -0.35,
  maxLat: 0.25,
  minLng: 33.95,
  maxLng: 34.75,
};

export function isWithinBusia([lat, lng]: LatLngTuple): boolean {
  return (
    lat >= BUSIA_BOUNDS.minLat &&
    lat <= BUSIA_BOUNDS.maxLat &&
    lng >= BUSIA_BOUNDS.minLng &&
    lng <= BUSIA_BOUNDS.maxLng
  );
}
