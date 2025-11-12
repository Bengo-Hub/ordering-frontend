"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth";
import type { Permission, UserRole } from "@/lib/auth/types";
import { userCanAccess } from "@/lib/auth/permissions";

interface RequireAuthProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  roleOperator?: "and" | "or";
  permissionOperator?: "and" | "or";
  redirectTo?: string;
  loadingFallback?: ReactNode;
  denialFallback?: ReactNode;
}

export function RequireAuth({
  children,
  roles,
  permissions,
  roleOperator,
  permissionOperator,
  redirectTo,
  loadingFallback = (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
      Preparing your workspace…
    </div>
  ),
  denialFallback = (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
      You don&apos;t have access to this area.
    </div>
  ),
}: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (status === "authenticated" && user) {
      const permitted = userCanAccess(user, {
        roles,
        permissions,
        roleOperator,
        permissionOperator,
      });
      if (!permitted) {
        router.replace(redirectTo ?? "/");
      }
      return;
    }

    if ((status === "idle" || status === "error") && !user) {
      const params = new URLSearchParams({
        redirectTo: redirectTo ?? pathname ?? "/",
      });
      router.replace(`/auth?${params.toString()}`);
    }
  }, [
    status,
    user,
    roles,
    permissions,
    roleOperator,
    permissionOperator,
    router,
    pathname,
    redirectTo,
  ]);

  if (status === "loading") {
    return <>{loadingFallback}</>;
  }

  if (!user) {
    return null;
  }

  const canAccess = userCanAccess(user, { roles, permissions, roleOperator, permissionOperator });
  if (!canAccess) {
    return <>{denialFallback}</>;
  }

  return <>{children}</>;
}
