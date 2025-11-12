import type { SessionTokens } from "./types";

const STORAGE_KEY = "food-delivery.session";

export function loadSession(): SessionTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionTokens;
  } catch (error) {
    console.warn("Failed to load auth session", error);
    return null;
  }
}

export function persistSession(session: SessionTokens | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("Failed to persist auth session", error);
  }
}
