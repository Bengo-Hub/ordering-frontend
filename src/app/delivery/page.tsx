"use client";

import { useState } from "react";

import { LineChartIcon, MapIcon, SmartphoneIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { LocationMap } from "@/components/location/location-map";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { brand } from "@/config/brand";
import type { LatLngTuple } from "leaflet";

const deliveryHighlights = [
  {
    title: "Realtime tracking",
    description:
      "See live status updates from order to delivery with clear timelines and map views.",
    icon: <MapIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Great rider experience",
    description:
      "Riders get seamless navigation and proof‑of‑delivery tools so your orders arrive reliably.",
    icon: <SmartphoneIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Operational visibility",
    description:
      "Stay confident with on‑time delivery insights and proactive notifications for customers.",
    icon: <LineChartIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

const demoTimeline = [
  "Order placed",
  "Being prepared",
  "Picked up by rider",
  "En route",
  "Delivered",
];

const cafeLocation: LatLngTuple = [-0.0612, 34.2851];
const customerLocation: LatLngTuple = [-0.0569, 34.2915];
const routePolyline: LatLngTuple[] = [
  cafeLocation,
  [-0.0605, 34.2868],
  [-0.0592, 34.2889],
  [-0.0581, 34.2899],
  customerLocation,
];
const routeMarkers = [
  { position: cafeLocation, label: "Urban Café" },
  { position: customerLocation, label: "Customer" },
];

export default function DeliveryPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const onTrack = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trackingCode) return;
    // Simulate a tracking result. In production this would query the backend.
    const simulatedStep = Math.min(
      demoTimeline.length - 1,
      Math.max(0, trackingCode.length % demoTimeline.length),
    );
    setActiveStep(simulatedStep);
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-muted/60 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Delivery visibility, built into every screen.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-muted-foreground">
            {brand.shortName} unifies rider updates, notification signals, and treasury payouts,
            ensuring every delivery milestone stays in sync across customers, cafes, and
            administrators.
          </p>
          <form onSubmit={onTrack} className="mx-auto flex w-full max-w-xl items-center gap-3">
            <Input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Enter your order code (e.g. A9X4)"
              aria-label="Tracking code"
            />
            <Button type="submit">Track</Button>
          </form>
        </div>
      </section>
      <section className="bg-card py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Track your order</h2>
            <ol className="space-y-3">
              {demoTimeline.map((label, idx) => {
                const reached = activeStep !== null && idx <= activeStep;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-sm transition ${
                      reached
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                        reached
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden
                    >
                      {idx + 1}
                    </span>
                    <span>{label}</span>
                    {reached && idx === activeStep ? (
                      <span className="ml-auto text-xs font-medium text-brand-emphasis">
                        Current
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
          <aside className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <LocationMap
              value={customerLocation}
              defaultCenter={customerLocation}
              polyline={routePolyline}
              markers={routeMarkers}
              interactive={false}
              height={260}
              zoom={15}
            />
            <p className="text-sm text-muted-foreground">
              Follow every hand-off. The live rider location, current ETA, and courier details
              display here once your order is en route.
            </p>
            <div className="text-xs text-muted-foreground">
              Tip: Keep notifications enabled to get proactive updates when your rider is nearby.
            </div>
          </aside>
        </div>
      </section>
      <section className="border-t border-border bg-background py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {deliveryHighlights.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {highlight.icon}
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{highlight.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
