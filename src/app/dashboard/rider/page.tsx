"use client";

import { AlertTriangleIcon, ClockIcon, MapPinIcon, RouteIcon, TrophyIcon } from "lucide-react";

import { AuthorizationGate } from "@/components/auth/authorization-gate";
import { RequireAuth } from "@/components/auth/require-auth";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/datetime";
import { useAuthStore } from "@/store/auth";

const mockShiftAssignments = [
  { id: "SHIFT-1", start: "2025-11-09T08:00:00Z", end: "2025-11-09T17:00:00Z", status: "active" },
  { id: "SHIFT-2", start: "2025-11-10T10:00:00Z", end: "2025-11-10T16:00:00Z", status: "upcoming" },
];

const mockRouteAlerts = [
  {
    id: "ALT-1",
    message: "Heavy rains expected near Busia Market between 4-6pm.",
    severity: "medium",
  },
  { id: "ALT-2", message: "Road maintenance on Kisoko Rd. Expect detours.", severity: "high" },
];

export default function RiderDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <RequireAuth roles={["rider"]}>
      <SiteShell>
        <div className="mx-auto my-12 flex w-full max-w-6xl flex-col gap-8 px-4">
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              Rider console
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back, {user?.fullName ?? "Rider"}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Stay on top of assigned routes, delivery KPIs, and safety alerts for Busia township.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="On-time deliveries"
              value="96%"
              deltaLabel="Last 30 shifts"
              deltaValue="+2%"
              icon={<ClockIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
            <MetricCard
              title="Routes today"
              value="8"
              deltaLabel="Completed this week"
              deltaValue="42"
              icon={<RouteIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
            <MetricCard
              title="Customer rating"
              value="4.9"
              deltaLabel="Feedback trend"
              deltaValue="Great job!"
              icon={<TrophyIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
            <MetricCard
              title="Base location"
              value={user?.defaultLocationLabel ?? "Busia Township"}
              deltaLabel="Tap to update in profile"
              deltaValue=""
              icon={<MapPinIcon className="size-4 text-brand-emphasis" aria-hidden />}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RouteIcon className="size-5 text-brand-emphasis" aria-hidden />
                  Shift assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockShiftAssignments.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{shift.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(shift.start)} · {shift.status}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-brand-emphasis">
                      Busia central
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <AuthorizationGate roles={["rider"]}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangleIcon className="size-5 text-brand-emphasis" aria-hidden />
                    Route alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockRouteAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      <p className="font-semibold capitalize">{alert.severity} priority</p>
                      <p>{alert.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </AuthorizationGate>
          </section>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
