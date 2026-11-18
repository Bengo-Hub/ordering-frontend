import { cookieSessionAllowed } from "@bengo-hub/shared-ui-lib/auth";

/**
 * Whether this page uses the cookie session (fleet plan G11): the build flag
 * NEXT_PUBLIC_COOKIE_SESSION is on and the page is on a *.codevertexafrica.com host. A tenant's
 * storefront on its own domain (alphachinamarket.co.ke and the self-service domains) keeps the
 * stored-token flow with the same build. No store import here: session.ts and the store import it.
 */
export function cookieMode(): boolean {
  return cookieSessionAllowed(process.env.NEXT_PUBLIC_COOKIE_SESSION);
}
