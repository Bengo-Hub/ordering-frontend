"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AdminShell } from "@/components/layout/admin-shell";
import { STAFF_ROLES } from "@/components/layout/admin-nav";

/** Every staff page needs a staff role; pages add stricter guards (admin-only settings). */
export function StaffLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={STAFF_ROLES} roleOperator="or">
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
