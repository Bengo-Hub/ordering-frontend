"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AdminShell } from "@/components/layout/admin-shell";

/**
 * The platform section is for platform owners only. RequireAuth treats platform owners and
 * superusers as elevated, so requiring "superuser" admits exactly them and sends everyone
 * else to sign in or the unauthorized page.
 */
export function PlatformLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["superuser"]}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
