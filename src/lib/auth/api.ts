import { api } from "@/lib/api/base";

import { mockLogin, mockOrders, mockPreferencesUpdate, mockProfileUpdate, mockSecurityUpdate } from "./mock";
import type {
  AuthResponse,
  OrderSummary,
  PreferencesUpdateInput,
  ProfileUpdateInput,
  SecurityUpdateInput,
  UserRole,
} from "./types";

const API_ENABLED = Boolean(process.env.NEXT_PUBLIC_API_URL);

function simulate<T>(value: T, delay = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export async function loginWithEmail(input: { email: string; password: string; role: UserRole }): Promise<AuthResponse> {
  if (!API_ENABLED) {
    return simulate(mockLogin(input.role, input.email, "Urban Café Guest"));
  }

  const { data } = await api.post<AuthResponse>("/v1/auth/login", input);
  return data;
}

export async function beginGoogleOAuth(input: {
  role: UserRole;
  redirectUri: string;
}): Promise<{ url: string }> {
  if (!API_ENABLED) {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "demo-google-client-id",
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: input.role,
    });
    return simulate({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  }

  const { data } = await api.post<{ url: string }>("/v1/auth/google/start", input);
  return data;
}

export async function completeGoogleOAuth(input: {
  code: string;
  state?: string | null;
}): Promise<AuthResponse> {
  if (!API_ENABLED) {
    const role = (input.state as UserRole) || "customer";
    return simulate(mockLogin(role, "google-user@example.com", "Google User"));
  }

  const { data } = await api.post<AuthResponse>("/v1/auth/google/complete", input);
  return data;
}

export async function logout(): Promise<void> {
  if (!API_ENABLED) {
    return simulate(undefined);
  }
  await api.post("/v1/auth/logout");
}

export async function fetchProfile(): Promise<AuthResponse> {
  if (!API_ENABLED) {
    return simulate(mockLogin("customer", "customer@example.com", "Urban Café Guest"));
  }
  const { data } = await api.get<AuthResponse>("/v1/auth/me");
  return data;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<AuthResponse> {
  if (!API_ENABLED) {
    const current = mockLogin("customer", "customer@example.com", "Urban Café Guest");
    return simulate({ ...current, user: mockProfileUpdate(current.user, input) });
  }
  const { data } = await api.patch<AuthResponse>("/v1/users/profile", input);
  return data;
}

export async function updatePreferences(input: PreferencesUpdateInput): Promise<AuthResponse> {
  if (!API_ENABLED) {
    const current = mockLogin("customer", "customer@example.com", "Urban Café Guest");
    return simulate({ ...current, user: mockPreferencesUpdate(current.user, input) });
  }
  const { data } = await api.patch<AuthResponse>("/v1/users/preferences", input);
  return data;
}

export async function updateSecurity(input: SecurityUpdateInput): Promise<AuthResponse> {
  if (!API_ENABLED) {
    const current = mockLogin("customer", "customer@example.com", "Urban Café Guest");
    return simulate({ ...current, user: mockSecurityUpdate(current.user, input) });
  }
  const { data } = await api.post<AuthResponse>("/v1/users/security", input);
  return data;
}

export async function fetchOrderSummary(): Promise<OrderSummary[]> {
  if (!API_ENABLED) {
    return simulate(mockOrders());
  }
  const { data } = await api.get<OrderSummary[]>("/v1/customers/orders/summary");
  return data;
}

