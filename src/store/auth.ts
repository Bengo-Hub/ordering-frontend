import type { AxiosError } from "axios";
import { create } from "zustand";

import { attachAuthTokenGetter } from "@/lib/api/base";
import {
  logout as apiLogout,
  beginGoogleOAuth,
  completeGoogleOAuth,
  fetchOrderSummary,
  fetchProfile,
  loginWithEmail,
  refreshSession,
  updatePreferences,
  updateProfile,
  updateSecurity,
} from "@/lib/auth/api";
import { loadAuthState, persistAuthState } from "@/lib/auth/session";
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
import { toast } from "@/lib/toast";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthState {
  status: AuthStatus;
  error: string | null;
  session: SessionTokens | null;
  user: UserProfile | null;
  orders: OrderSummary[];
  initialize: () => Promise<void>;
  loginWithEmail: (input: {
    email: string;
    password: string;
    role: UserRole;
    tenantSlug?: string;
  }) => Promise<void>;
  beginGoogleOAuth: (input: { role: UserRole; redirectUri?: string }) => Promise<void>;
  completeGoogleOAuth: (input: { code: string; state?: string | null }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  updatePreferences: (input: PreferencesUpdateInput) => Promise<void>;
  updateSecurity: (input: SecurityUpdateInput) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

function applyAuthResponse(set: (value: Partial<AuthState>) => void, response: AuthResponse) {
  const newState = {
    status: "authenticated" as const,
    session: response.session,
    user: response.user,
    error: null,
  };
  persistAuthState(newState);
  set(newState);
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

function clearSession(set: (value: Partial<AuthState>) => void) {
  persistAuthState({ session: null, user: null });
  set({
    status: "idle",
    user: null,
    session: null,
    orders: [],
    error: null,
  });
}

async function tryRefreshSession(
  set: (value: Partial<AuthState>) => void,
  get: () => AuthState,
  error: unknown,
): Promise<boolean> {
  const status = extractStatus(error);
  // Only try refresh on 401 or 403
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
    clearSession(set);
    toast.error("Session expired. Please sign in again.");
    return true; // We handled it by clearing session
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadAuthState(), // Initialize from local storage
  status: "idle",
  error: null,
  orders: [],

  initialize: async () => {
    const { session, user } = get();
    // If we have a session but no user, or if we just want to verify session validity
    if (!session) {
      set({ status: "idle", user: null, error: null, orders: [] });
      return;
    }

    // Optimistically set authenticated if we have user and session
    if (user && session) {
      set({ status: "authenticated" });
      // Skip profile fetch to prevent session clearing on every page load
      // Hydrate orders in the background without blocking
      hydrateOrders(set);
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

      const status = extractStatus(error);
      // If it's a 401/403 and refresh failed (or wasn't tried), clear session
      if (status === 401 || status === 403) {
        console.warn("Auth initialization failed with 401/403", error);
        clearSession(set);
        toast.error("Session expired. Please sign in again.");
      } else {
        // For other errors (network, etc), keep the local session but maybe show a warning
        console.warn("Auth initialization failed (non-fatal)", error);
        // Don't clear session, allow "offline" access if data is cached
        if (user && session) {
          set({ status: "authenticated" }); // Fallback to authenticated
        } else {
          set({ status: "error", error: "Connection failed" });
        }
      }
    }
  },

  loginWithEmail: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await loginWithEmail(input);
      applyAuthResponse(set, response);
      await hydrateOrders(set);
      toast.success("Welcome back!");
    } catch (error) {
      console.error("Email login failed", error);
      set({ status: "error", error: "Unable to sign in with the provided credentials." });
      toast.error("Login failed. Please check your credentials.");
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
      set({ status: "error", error: "Unable to start Google sign-in." });
      toast.error("Failed to start Google sign-in.");
      throw error;
    }
  },

  completeGoogleOAuth: async ({ code, state }) => {
    set({ status: "loading", error: null });
    try {
      const response = await completeGoogleOAuth({ code, state: state ?? null });
      applyAuthResponse(set, response);
      await hydrateOrders(set);
      toast.success("Successfully signed in with Google.");
    } catch (error) {
      console.error("Google OAuth completion failed", error);
      set({ status: "error", error: "Google sign-in failed." });
      toast.error("Google sign-in failed. Please try again.");
      throw error; // Re-throw so UI can handle if needed
    }
  },

  logout: async () => {
    try {
      await apiLogout();
      toast.success("Signed out successfully.");
    } catch (error) {
      console.warn("Error during logout", error);
      // Force logout even if API call fails
      toast.info("Signed out.");
    } finally {
      clearSession(set);
    }
  },

  updateProfile: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updateProfile(input);
      applyAuthResponse(set, response);
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed", error);
      set({ status: "error", error: "Could not update profile right now." });
      toast.error("Failed to update profile.");
      throw error;
    }
  },

  updatePreferences: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updatePreferences(input);
      applyAuthResponse(set, response);
      toast.success("Preferences updated.");
    } catch (error) {
      console.error("Preferences update failed", error);
      set({ status: "error", error: "Could not update preferences right now." });
      toast.error("Failed to update preferences.");
      throw error;
    }
  },

  updateSecurity: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updateSecurity(input);
      applyAuthResponse(set, response);
      toast.success("Security settings updated.");
    } catch (error) {
      console.error("Security update failed", error);
      set({ status: "error", error: "Unable to update security settings." });
      toast.error("Failed to update security settings.");
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
