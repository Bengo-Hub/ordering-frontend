import { api } from "@/lib/api/base";
import type {
  AuthResponse,
  OrderSummary,
  PreferencesUpdateInput,
  ProfileUpdateInput,
  SecurityUpdateInput,
  UserRole,
} from "./types";

export async function loginWithEmail(input: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("auth/login", input);
  return data;
}

export async function beginGoogleOAuth(input: {
  role: UserRole;
  redirectUri: string;
}): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>("auth/google/start", input);
  return data;
}

export async function completeGoogleOAuth(input: {
  code: string;
  state?: string | null;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("auth/google/complete", input);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("auth/logout");
}

export async function refreshSession(input: { refreshToken: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("auth/refresh", input);
  return data;
}

export async function fetchProfile(): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>("auth/me");
  return data;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<AuthResponse> {
  const { data } = await api.patch<AuthResponse>("users/profile", input);
  return data;
}

export async function updatePreferences(input: PreferencesUpdateInput): Promise<AuthResponse> {
  const { data } = await api.patch<AuthResponse>("users/preferences", input);
  return data;
}

export async function updateSecurity(input: SecurityUpdateInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("users/security", input);
  return data;
}

export async function fetchOrderSummary(): Promise<OrderSummary[]> {
  const { data } = await api.get<OrderSummary[]>("customers/orders/summary");
  return data;
}
