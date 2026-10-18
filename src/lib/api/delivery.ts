import axios from "axios";

/**
 * Delivery areas, quotes and place search come from logistics-api, the platform's single
 * owner of delivery zones and pricing. These endpoints are public (guest checkout) and
 * throttled per IP there. Ordering never computes distances or zone matches itself.
 */
const LOGISTICS_API_URL = (process.env.NEXT_PUBLIC_LOGISTICS_API_URL || "https://logisticsapi.codevertexafrica.com/api/v1").replace(/\/+$/, "");

const logistics = axios.create({ baseURL: `${LOGISTICS_API_URL}/`, timeout: 10_000 });

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ZoneRef {
  id: string;
  name: string;
}

export interface DeliveryQuote {
  serviceable: boolean;
  reason?: string;
  method?: "zone" | "per_km";
  fee: number;
  free: boolean;
  currency: string;
  zone?: ZoneRef;
  nearest_area?: ZoneRef;
  nearest_area_km?: number;
  /** Where an out-of-range pin sits against our delivery routes: nearest route (towards route_area), how far off it, compass direction and distance from the outlet. */
  route_area?: ZoneRef;
  route_off_km?: number;
  direction?: string;
  outlet_km?: number;
  /** A distance-priced fee: the customer is sent the area, distance and fee to confirm. */
  needs_confirmation?: boolean;
  distance_km: number;
  distance_type?: string;
  eta_minutes?: number;
  min_order: number;
  below_min_order?: boolean;
  outlet?: { id: string; name: string; location: LatLng };
  policy_version: string;
}

export interface DeliveryCoverage {
  zones: { id: string; name: string; zone_type: string; color: string; fee: number; free: boolean; center?: LatLng; aliases?: string[]; boundary: number[][] }[];
  outlets: { id: string; name: string; location: LatLng }[];
  bounds?: [number, number, number, number];
  center?: LatLng;
  min_fee: number;
  has_free_zone: boolean;
  currency: string;
}

export interface Place {
  name: string;
  display_name: string;
  location: LatLng;
  kind?: string;
  source: "zone" | "geocoder";
  area?: ZoneRef;
  area_km?: number;
}

/**
 * Tenant used to name places on pages that have no tenant yet (the marketplace landing).
 * Logistics geocoding is tenant-scoped; the platform tenant has no delivery areas, so
 * results are plain place names.
 */
export const PLATFORM_GEO_SLUG = process.env.NEXT_PUBLIC_PLATFORM_TENANT_SLUG || "codevertex";

/** Short place name for a pin, or null when the lookup fails. */
export async function shortPlaceName(slug: string, lat: number, lng: number): Promise<string | null> {
  try {
    const p = await reversePlace(slug || PLATFORM_GEO_SLUG, lat, lng);
    return p.name || null;
  } catch {
    return null;
  }
}

export const NOT_SERVICEABLE_TEXT: Record<string, string> = {
  excluded_area: "We don't deliver to this spot.",
  outside_delivery_area: "This location is outside our delivery area.",
  beyond_max_radius: "This location is too far from us.",
  no_outlet_location: "Delivery isn't set up yet.",
  no_delivery_coverage: "Delivery isn't set up yet.",
  invalid_location: "Pick a valid location.",
};

/** Why a pin is out of range: which way it lies and how far it is from our delivery routes. */
export function reachNote(q: Pick<DeliveryQuote, "route_area" | "route_off_km" | "direction" | "outlet_km">): string | null {
  if (!q.route_area || !q.route_off_km || !q.outlet_km || !q.direction) return null;
  return `This is about ${Math.round(q.outlet_km)} km ${q.direction} of the outlet, ${Math.round(q.route_off_km)} km away from our nearest delivery route (towards ${q.route_area.name}).`;
}

export async function fetchDeliveryCoverage(slug: string, outletId?: string): Promise<DeliveryCoverage> {
  const { data } = await logistics.get(`${slug}/zones/coverage`, { params: outletId ? { outlet_id: outletId } : undefined });
  return data;
}

export async function fetchDeliveryQuote(slug: string, p: { lat: number; lng: number; outletId?: string | null | undefined; orderTotal?: number | undefined }): Promise<DeliveryQuote> {
  const params: Record<string, string | number> = { lat: p.lat, lng: p.lng };
  if (p.outletId) params.outlet_id = p.outletId;
  if (p.orderTotal) params.order_total = p.orderTotal;
  const { data } = await logistics.get(`${slug}/zones/quote`, { params });
  return data;
}

export async function searchPlaces(slug: string, q: string): Promise<Place[]> {
  const { data } = await logistics.get(`${slug}/routing/geocode/search`, { params: { q } });
  return Array.isArray(data) ? data : [];
}

export async function reversePlace(slug: string, lat: number, lng: number): Promise<Place> {
  const { data } = await logistics.get(`${slug}/routing/geocode/reverse`, { params: { lat, lng } });
  return data;
}

/** Short label for a quote, e.g. "Free delivery", "KES 150 · Bugengi", "KES 230 · 4.6 km". */
export function quoteLabel(q: DeliveryQuote): string {
  if (!q.serviceable) return NOT_SERVICEABLE_TEXT[q.reason ?? ""] ?? "Not deliverable";
  const fee = q.free || q.fee === 0 ? "Free delivery" : `${q.currency} ${Math.round(q.fee).toLocaleString()}`;
  if (q.zone) return `${fee} · ${q.zone.name}`;
  return `${fee} · ${q.distance_km.toFixed(1)} km`;
}
