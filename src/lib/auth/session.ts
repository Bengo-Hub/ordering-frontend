import { cookieMode } from "./session-mode";
import type { SessionTokens, UserProfile } from "./types";

/** localStorage key of the saved session; also watched for writes from other tabs. */
export const AUTH_STORAGE_KEY = "ordering.auth";
const STORAGE_KEY = AUTH_STORAGE_KEY;

interface AuthState {
  session: SessionTokens | null;
  user: UserProfile | null;
}

export function loadAuthState(): AuthState {
  if (typeof window === "undefined") return { session: null, user: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { session: null, user: null };
    const parsed = JSON.parse(raw) as AuthState;
    if (cookieMode()) {
      // Cookie session: a token an earlier build stored is dropped; the profile stays.
      if (parsed.session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: null, user: parsed.user ?? null }));
      return { session: null, user: parsed.user ?? null };
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to load auth state", error);
    return { session: null, user: null };
  }
}

export function persistAuthState(state: AuthState) {
  if (typeof window === "undefined") return;
  try {
    if (cookieMode()) {
      // Cookie session: the access token stays in memory, only the profile is saved.
      if (!state.session && !state.user) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: null, user: state.user }));
      return;
    }
    if (!state.session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist auth state", error);
  }
}
