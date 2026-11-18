/**
 * The cookie session for ordering-frontend (fleet plan G11; shared-ui-lib createCookieSession).
 *
 * The refresh token lives in auth-api's HttpOnly cookie on sso.codevertexafrica.com, out of reach
 * of page scripts. The access token lives in memory. The store's `session` stays the in-memory
 * mirror every caller already reads (refreshToken is always empty), and session.ts never writes
 * it to localStorage in this mode.
 */

import { createCookieSession, type CookieSession, type CookieSessionState } from "@bengo-hub/shared-ui-lib/auth";
import { serviceUrl } from "@/lib/service-urls";
import { useAuthStore } from "@/store/auth";
import type { SessionTokens } from "./types";

// The same sso host and client id as the code exchange (lib/auth/api.ts).
const SSO_BASE_URL = serviceUrl("sso");
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID ?? "ordering-ui";

let current: CookieSession | null = null;

/** The store's session shape for an in-memory access token. */
export function mirror(s: CookieSessionState): SessionTokens {
  return {
    accessToken: s.accessToken,
    refreshToken: "",
    expiresAt: new Date(s.expiresAt).toISOString(),
    sessionId: useAuthStore.getState().session?.sessionId ?? "",
  };
}

/**
 * Keeps the store in step with the cookie session, including a token or a sign-out another tab
 * shared. When a different person signs in elsewhere (one sso cookie serves every app), this tab
 * drops its profile and tenant choice and reloads as that person.
 */
function onChange(s: CookieSessionState | null) {
  const store = useAuthStore.getState();
  if (!s) {
    if (store.session || store.status === "authenticated") store.clearLocalSession();
    return;
  }
  const nextUserId = (s.payload.user as { id?: string } | undefined)?.id;
  if (store.user && nextUserId && nextUserId !== store.user.id) {
    store.clearLocalSession();
    window.location.reload();
    return;
  }
  useAuthStore.setState({ session: mirror(s) });
}

export function getCookieSession(): CookieSession {
  current ??= createCookieSession({ authBaseUrl: SSO_BASE_URL, clientId: SSO_CLIENT_ID, onChange });
  return current;
}

/**
 * A sign-in (SSO code exchange or passkey) hands its refresh token to the cookie. Returns the
 * in-memory session, or null when auth-api refused it.
 */
export async function adoptSignIn(refreshToken: string): Promise<SessionTokens | null> {
  // A new sign-in replaces whoever was stored, so it is not taken for a user switch.
  useAuthStore.setState({ user: null, session: null });
  const started = await getCookieSession().start(refreshToken);
  if (!("token" in started)) return null;
  return useAuthStore.getState().session;
}
