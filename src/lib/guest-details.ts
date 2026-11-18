/**
 * Guest details kept on this device, only when the guest ticks "Save my details" after an
 * order. One entry per store. Never holds a password. Storage can be missing or blocked
 * (private windows), so every call is wrapped and failure means "nothing saved".
 */

export interface SavedGuestAddress {
  address: string;
  lat: number;
  lng: number;
  placeName?: string;
}

export interface SavedGuestDetails {
  name: string;
  phone: string;
  email: string;
  /** The last delivery address; absent after a pickup order. */
  address?: SavedGuestAddress;
}

const detailsKey = (orgSlug: string) => `ordering:guest-details:${orgSlug}`;
const dismissedKey = (orgSlug: string) => `ordering:guest-details-prompt-done:${orgSlug}`;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readAddress(v: unknown): SavedGuestAddress | undefined {
  if (!v || typeof v !== "object") return undefined;
  const a = v as Record<string, unknown>;
  if (typeof a.address !== "string" || typeof a.lat !== "number" || typeof a.lng !== "number") return undefined;
  const out: SavedGuestAddress = { address: a.address, lat: a.lat, lng: a.lng };
  if (typeof a.placeName === "string" && a.placeName) out.placeName = a.placeName;
  return out;
}

export function loadGuestDetails(orgSlug: string): SavedGuestDetails | null {
  if (!orgSlug || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(detailsKey(orgSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const details: SavedGuestDetails = { name: str(parsed.name), phone: str(parsed.phone), email: str(parsed.email) };
    const address = readAddress(parsed.address);
    if (address) details.address = address;
    if (!details.name && !details.phone && !details.email) return null;
    return details;
  } catch {
    return null;
  }
}

export function saveGuestDetails(orgSlug: string, details: SavedGuestDetails): boolean {
  if (!orgSlug || typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(detailsKey(orgSlug), JSON.stringify(details));
    return true;
  } catch {
    return false;
  }
}

/** "Not you? Clear": forgets the details, and lets the next person be asked once. */
export function clearGuestDetails(orgSlug: string): void {
  if (!orgSlug || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(detailsKey(orgSlug));
    window.localStorage.removeItem(dismissedKey(orgSlug));
  } catch {
    /* nothing saved, nothing to clear */
  }
}

/** True once the guest saved or said no, so the card is not shown again on this device. */
export function isSavePromptDone(orgSlug: string): boolean {
  if (!orgSlug || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(dismissedKey(orgSlug)) === "1";
  } catch {
    return false;
  }
}

export function markSavePromptDone(orgSlug: string): void {
  if (!orgSlug || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(dismissedKey(orgSlug), "1");
  } catch {
    /* the card may show again next time; harmless */
  }
}
