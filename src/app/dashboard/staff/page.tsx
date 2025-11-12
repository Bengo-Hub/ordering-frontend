"use client";

import { BanknoteIcon, ClipboardCheckIcon, MegaphoneIcon, UsersIcon } from "lucide-react";

import { AuthorizationGate } from "@/components/auth/authorization-gate";
import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { useAuthStore } from "@/store/auth";

const mockStaffActivity = [
  {
    id: "SUP-1001",
    actor: "Grace (Admin)",
    action: "Approved rider KYC",
    at: "2025-11-09T10:12:00Z",
  },
  {
    id: "ORD-2044",
    actor: "Kevin (Staff)",
    action: "Issued refund to customer",
    at: "2025-11-09T09:55:00Z",
  },
  {
    id: "LOY-12",
    actor: "Amelia (Admin)",
    action: "Published new loyalty campaign",
    at: "2025-11-08T16:34:00Z",
  },
];

export default function StaffDashboardPage(): JSX.Element {
  const user = useAuthStore((state) => state.user);

  return (
    <RequireAuth roles={["staff", "admin", "superadmin"]} permissions={["orders:view"]}>
      <SiteShell>
        <div className="mx-auto my-12 flex w-full max-w-6xl flex-col gap-8 px-4">
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              Staff workspace
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Good day, {user?.fullName ?? "team member"}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor orders, loyalty programs, and rider onboarding performance across Urban Cafe
              operations.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Orders today"
              value="312"
              deltaLabel="Vs. yesterday"
              deltaValue="+8%"
              icon={<ClipboardCheckIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
            <MetricCard
              title="Pending rider KYCs"
              value="5"
              deltaLabel="Approvals in SLA"
              deltaValue="92%"
              icon={<UsersIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
            <MetricCard
              title="Loyalty redemptions"
              value="87"
              deltaLabel="Week-to-date"
              deltaValue="+11%"
              icon={<MegaphoneIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
            <AuthorizationGate permissions={["admin:manage"]}>
              <MetricCard
                title="Outstanding payouts"
                value="KES 254K"
                deltaLabel="Clears in treasury"
                deltaValue="24h"
                icon={<BanknoteIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheckIcon className="size-5 text-brand-emphasis" aria-hidden />
                Latest workspace activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockStaffActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{activity.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(activity.at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.actor} · Reference {activity.id}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
