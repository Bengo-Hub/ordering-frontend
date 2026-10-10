"use client";

import {
  BarChart3,
  Bell,
  Bike,
  ClipboardList,
  FileLock,
  Gauge,
  type LucideIcon,
  MapPin,
  MapPinned,
  RotateCcw,
  Settings,
  Shield,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import { useSubscription } from "@/hooks/use-subscription";
import { LOGISTICS_UI_URL } from "@/lib/app-urls";
import { userCanAccess, userHasRole } from "@/lib/auth/permissions";
import type { Permission, UserRole } from "@/lib/auth/types";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Opens a sibling app (logistics owns riders and delivery areas). */
  external?: boolean;
  /** True when the plan lacks the item's feature: it stays visible with a lock. */
  locked?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

/** Roles that may open the staff dashboard. */
export const STAFF_ROLES: UserRole[] = ["staff", "admin", "superuser", "manager", "member"] as UserRole[];

/** True for platform owners and superusers (the /platform section). */
export function useIsPlatformOwner(): boolean {
  const user = useAuthStore((s) => s.user);
  return !!(user?.is_platform_owner || user?.isSuperUser || user?.roles?.includes("superuser"));
}

/**
 * The staff and platform navigation in one place: the admin sidebar renders it and the
 * customer menu only links into it. Each item uses the same role or permission rule its
 * page enforces; plan-gated items stay visible with a lock instead of disappearing.
 */
export function useAdminNav(): AdminNavGroup[] {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((s) => s.user);
  const { hasFeature } = useSubscription();
  const isPlatformOwner = useIsPlatformOwner();
  const isStaff = userHasRole(user, STAFF_ROLES);
  const isAdmin = userHasRole(user, ["admin", "superuser"] as UserRole[]);
  const can = (permissions: string[], roles: string[] = ["admin", "superuser", "manager"]) =>
    userCanAccess(user, {
      roles: roles as UserRole[],
      permissions: permissions as Permission[],
      permissionOperator: "or",
    });

  const groups: AdminNavGroup[] = [];

  if (isPlatformOwner) {
    groups.push({ label: "Platform", items: [{ label: "Platform admin", href: "/platform", icon: Shield }] });
  }
  if (!isStaff) return groups;

  const operations: AdminNavItem[] = [
    { label: "Order queue", href: "/dashboard/staff", icon: ClipboardList },
    { label: "Menu", href: "/dashboard/staff/menu", icon: UtensilsCrossed },
  ];
  if (can(["ordering.orders.delete"], ["admin", "superuser"])) {
    operations.push({ label: "Refunds", href: "/dashboard/staff/refunds", icon: RotateCcw });
  }
  operations.push({ label: "Notifications", href: "/dashboard/staff/notifications", icon: Bell });
  groups.push({ label: "Operations", items: operations });

  if (can(["ordering.analytics.view"])) {
    groups.push({
      label: "Insights",
      items: [
        {
          label: "Analytics",
          href: "/dashboard/staff/analytics",
          icon: BarChart3,
          locked: !hasFeature("advanced_analytics"),
        },
        { label: "SLA performance", href: "/dashboard/staff/sla", icon: Gauge },
      ],
    });
  }

  groups.push({
    label: "Delivery",
    items: [
      { label: "Riders", href: `${LOGISTICS_UI_URL}/${orgSlug}/riders`, icon: Bike, external: true },
      { label: "Delivery areas", href: `${LOGISTICS_UI_URL}/${orgSlug}/zones`, icon: MapPinned, external: true },
    ],
  });

  const admin: AdminNavItem[] = [];
  if (isAdmin) admin.push({ label: "Settings", href: "/dashboard/staff/settings", icon: Settings });
  admin.push({ label: "Roles and permissions", href: "/dashboard/staff/roles", icon: ShieldCheck });
  if (can(["ordering.config.manage"])) {
    admin.push({ label: "Google Business", href: "/dashboard/staff/integrations", icon: MapPin });
  }
  if (isAdmin) admin.push({ label: "Compliance", href: "/dashboard/staff/compliance", icon: FileLock });
  groups.push({ label: "Administration", items: admin });

  return groups;
}
