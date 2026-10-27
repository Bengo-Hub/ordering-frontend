"use client";

// shared-ui-lib's bundled entries carry no 'use client' directive, so its client components are
// mounted from a client file like this one rather than straight from the server root layout.
// The footer's "Cookie settings" button (LegalLinks) reopens this notice.
import { CookieNotice } from "@bengo-hub/shared-ui-lib/legal";

export function CookieNoticeMount() {
  return <CookieNotice />;
}
