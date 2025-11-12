import { create } from "zustand";
import type { AxiosError } from "axios";

import { attachAuthTokenGetter } from "@/lib/api/base";
import {
  beginGoogleOAuth,
  completeGoogleOAuth,
  fetchOrderSummary,
  fetchProfile,
  loginWithEmail,
  logout as apiLogout,
  refreshSession,
  updatePreferences,
  updateProfile,
  updateSecurity,
} from "@/lib/auth/api";
import { loadSession, persistSession } from "@/lib/auth/session";
import type {
  AuthResponse,
  OrderSummary,
  PreferencesUpdateInput,
  ProfileUpdateInput,
  SecurityUpdateInput,
  SessionTokens,
  UserProfile,
  UserRole,
} from "@/lib/auth/types";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthState {
  status: AuthStatus;
  error: string | null;
  session: SessionTokens | null;
  user: UserProfile | null;
  orders: OrderSummary[];
  initialize: () => Promise<void>;
  loginWithEmail: (input: { email: string; password: string; role: UserRole }) => Promise<void>;
  beginGoogleOAuth: (input: { role: UserRole; redirectUri?: string }) => Promise<void>;
  completeGoogleOAuth: (input: { code: string; state?: string | null }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  updatePreferences: (input: PreferencesUpdateInput) => Promise<void>;
  updateSecurity: (input: SecurityUpdateInput) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

function applyAuthResponse(set: (value: Partial<AuthState>) => void, response: AuthResponse) {
  persistSession(response.session);
  set({
    status: "authenticated",
    session: response.session,
    user: response.user,
    error: null,
  });
}

async function hydrateOrders(set: (value: Partial<AuthState>) => void) {
  try {
    const orders = await fetchOrderSummary();
    set({ orders });
    return orders;
  } catch (error) {
    console.warn("Failed to hydrate orders", error);
    set({ orders: [] });
    return [];
  }
}

function isAxiosAuthError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && (error as AxiosError).isAxiosError === true;
}

function extractStatus(error: unknown): number | undefined {
  if (isAxiosAuthError(error)) {
    return error.response?.status;
  }
  return undefined;
}

async function tryRefreshSession(
  set: (value: Partial<AuthState>) => void,
  get: () => AuthState,
  error: unknown,
): Promise<boolean> {
  const status = extractStatus(error);
  if (status !== 401 && status !== 403) {
    return false;
  }

  const session = get().session;
  if (!session?.refreshToken) {
    return false;
  }

  try {
    set({ status: "loading", error: null });
    const refreshed = await refreshSession({ refreshToken: session.refreshToken });
    applyAuthResponse(set, refreshed);
    await hydrateOrders(set);
    return true;
  } catch (refreshError) {
    console.error("Session refresh failed", refreshError);
    persistSession(null);
    set({
      status: "idle",
      user: null,
      session: null,
      orders: [],
      error: "Session expired. Please sign in again.",
    });
    return true;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  error: null,
  session: loadSession(),
  user: null,
  orders: [],

  initialize: async () => {
    const session = get().session;
    if (!session) {
      set({ status: "idle", user: null, error: null, orders: [] });
      return;
    }
    try {
      set({ status: "loading", error: null });
      const response = await fetchProfile();
      applyAuthResponse(set, response);
      await hydrateOrders(set);
    } catch (error) {
      if (await tryRefreshSession(set, get, error)) {
        return;
      }
      console.warn("Auth initialization failed", error);
      persistSession(null);
      set({
        status: "idle",
        user: null,
        session: null,
        error: "Session expired. Please sign in again.",
        orders: [],
      });
    }
  },

  loginWithEmail: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await loginWithEmail(input);
      applyAuthResponse(set, response);
      await hydrateOrders(set);
    } catch (error) {
      console.error("Email login failed", error);
      set({ status: "error", error: "Unable to sign in with the provided credentials." });
      throw error;
    }
  },

  beginGoogleOAuth: async ({ role, redirectUri }) => {
    set({ status: "loading", error: null });
    try {
      const redirect =
        redirectUri ??
        (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "");
      const { url } = await beginGoogleOAuth({ role, redirectUri: redirect });
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to initiate Google OAuth", error);
      set({ status: "error", error: "Unable to start Google sign-in. Try again later." });
      throw error;
    }
  },

  completeGoogleOAuth: async ({ code, state }) => {
    set({ status: "loading", error: null });
    try {
      const response = await completeGoogleOAuth({ code, state });
      applyAuthResponse(set, response);
      await hydrateOrders(set);
    } catch (error) {
      console.error("Google OAuth completion failed", error);
      set({ status: "error", error: "Google sign-in failed. Try another method." });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.warn("Error during logout", error);
    } finally {
      persistSession(null);
      set({ user: null, session: null, status: "idle", error: null, orders: [] });
    }
  },

  updateProfile: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updateProfile(input);
      applyAuthResponse(set, response);
    } catch (error) {
      console.error("Profile update failed", error);
      set({ status: "error", error: "Could not update profile right now." });
      throw error;
    }
  },

  updatePreferences: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updatePreferences(input);
      applyAuthResponse(set, response);
    } catch (error) {
      console.error("Preferences update failed", error);
      set({ status: "error", error: "Could not update preferences right now." });
      throw error;
    }
  },

  updateSecurity: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updateSecurity(input);
      applyAuthResponse(set, response);
    } catch (error) {
      console.error("Security update failed", error);
      set({ status: "error", error: "Unable to update security settings." });
      throw error;
    }
  },

  refreshOrders: async () => {
    try {
      const orders = await fetchOrderSummary();
      set({ orders });
    } catch (error) {
      console.warn("Failed to refresh orders", error);
    }
  },
}));

attachAuthTokenGetter(() => useAuthStore.getState().session?.accessToken ?? null);
