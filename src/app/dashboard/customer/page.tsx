"use client";

import { BikeIcon, GiftIcon, MapPinIcon, UtensilsIcon } from "lucide-react";

import { AuthorizationGate } from "@/components/auth/authorization-gate";
import { RequireAuth } from "@/components/auth/require-auth";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { useAuthStore } from "@/store/auth";

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const orders = useAuthStore((state) => state.orders);

  return (
    <RequireAuth roles={["customer"]}>
      <SiteShell>
        <div className="mx-auto my-12 flex w-full max-w-6xl flex-col gap-8 px-4">
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              Customer dashboard
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Hello {user?.fullName ?? "there"}, ready to dine?
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your delivery pipeline, loyalty journey, and saved delivery preferences from one
              place.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AuthorizationGate permissions={["orders:view"]}>
              <MetricCard
                title="Active orders"
                value={
                  orders.filter((order) =>
                    ["pending", "preparing", "enroute"].includes(order.status),
                  ).length
                }
                deltaLabel="Last 30 days"
                deltaValue={orders.length.toString()}
                icon={<UtensilsIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
            <AuthorizationGate permissions={["loyalty:view"]}>
              <MetricCard
                title="Loyalty points"
                value={user?.loyaltyPoints ?? 0}
                deltaLabel="Tier"
                deltaValue={user?.loyaltyPoints && user.loyaltyPoints > 2000 ? "Gold" : "Explorer"}
                icon={<GiftIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
            <AuthorizationGate permissions={["loyalty:redeem"]}>
              <MetricCard
                title="Available offers"
                value={user?.availableCoupons ?? 0}
                deltaLabel="Redeem via loyalty tab"
                deltaValue="Tap to view menu"
                icon={<GiftIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
            <AuthorizationGate permissions={["profile:update"]}>
              <MetricCard
                title="Saved address"
                value={user?.defaultLocationLabel ?? "Add default"}
                deltaLabel="Quick access"
                deltaValue="Edit in profile"
                icon={<MapPinIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
          </section>

          <AuthorizationGate permissions={["orders:view"]}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BikeIcon className="size-5 text-brand-emphasis" aria-hidden />
                  Latest deliveries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Place your first order to see real-time delivery updates!
                  </p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-foreground">Order {order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          Placed{" "}
                          {formatDateTime(order.placedAt, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Status
                        </p>
                        <p className="text-sm font-medium text-brand-emphasis">{order.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </AuthorizationGate>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
