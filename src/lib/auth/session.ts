import type { SessionTokens, UserProfile } from "./types";

const STORAGE_KEY = "cafe.auth";

interface AuthState {
  session: SessionTokens | null;
  user: UserProfile | null;
}

export function loadAuthState(): AuthState {
  if (typeof window === "undefined") return { session: null, user: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { session: null, user: null };
    return JSON.parse(raw) as AuthState;
  } catch (error) {
    console.warn("Failed to load auth state", error);
    return { session: null, user: null };
  }
}

export function persistAuthState(state: AuthState) {
  if (typeof window === "undefined") return;
  try {
    if (!state.session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist auth state", error);
  }
}
