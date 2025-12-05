"use client";

import { useState } from "react";

import {
  CheckCircle2,
  Clock,
  LineChartIcon,
  MapIcon,
  Package,
  SmartphoneIcon,
  Truck,
} from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { LocationMap } from "@/components/location/location-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const timelineIcons = [Package, Clock, Truck, MapIcon, CheckCircle2];

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
      <section className="border-b border-border bg-gradient-to-br from-brand-surface via-background to-brand-muted/30 py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm">
              <MapIcon className="size-3.5" aria-hidden />
              <span>Real-time Tracking</span>
            </span>
            <h1 className="mt-4 text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
              Delivery visibility, built into every screen
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {brand.shortName} unifies rider updates, notification signals, and treasury payouts,
              ensuring every delivery milestone stays in sync across customers, cafes, and
              administrators.
            </p>
          </div>
        </div>
      </section>
      <section className="border-b border-border bg-background py-16">
        <div className="mx-auto w-full max-w-7xl space-y-10 px-4">
          {/* Map Section - Large and Prominent */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  Live Delivery Tracking
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Watch your order in real-time as it makes its way to you
                </p>
              </div>
              <Card className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:w-auto sm:min-w-[320px]">
                <form
                  onSubmit={onTrack}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <Input
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="Enter order code"
                      aria-label="Tracking code"
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" size="default" className="w-full sm:w-auto">
                    Track
                  </Button>
                </form>
              </Card>
            </div>
            <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
              <LocationMap
                value={customerLocation}
                defaultCenter={customerLocation}
                polyline={routePolyline}
                markers={routeMarkers}
                interactive={true}
                height={500}
                zoom={14}
              />
            </Card>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Package className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Order Status</p>
                    <p className="text-sm font-semibold text-foreground">
                      {activeStep !== null ? demoTimeline[activeStep] : "Enter tracking code"}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Truck className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                    <p className="text-sm font-semibold text-foreground">15-20 min</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MapIcon className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-sm font-semibold text-foreground">2.3 km</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Clock className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Update</p>
                    <p className="text-sm font-semibold text-foreground">Just now</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Timeline Section - Below Map */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground sm:text-2xl">Delivery Timeline</h3>
            <div className="relative">
              {/* Horizontal connecting line for desktop */}
              <div className="absolute left-0 right-0 top-12 hidden h-1 lg:block">
                <div className="relative h-full w-full">
                  {demoTimeline.map((_, idx) => {
                    if (idx === demoTimeline.length - 1) return null;
                    const reached = activeStep !== null && idx < activeStep;
                    return (
                      <div
                        key={`line-${idx}`}
                        className="absolute h-full"
                        style={{
                          left: `${(idx * 100) / (demoTimeline.length - 1)}%`,
                          width: `${100 / (demoTimeline.length - 1)}%`,
                        }}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            reached ? "bg-primary" : "bg-border"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {demoTimeline.map((label, idx) => {
                  const reached = activeStep !== null && idx <= activeStep;
                  const isCurrent = reached && idx === activeStep;
                  const IconComponent = timelineIcons[idx];
                  const isLast = idx === demoTimeline.length - 1;

                  return (
                    <div key={label} className="relative">
                      <Card
                        className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                          reached
                            ? isCurrent
                              ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30"
                              : "border-primary/60 bg-primary/5 shadow-md"
                            : "border-border bg-card/50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3 text-center">
                          {/* Step Icon */}
                          <div
                            className={`relative z-10 flex size-12 items-center justify-center rounded-full transition-all duration-300 ${
                              reached
                                ? isCurrent
                                  ? "scale-110 bg-primary text-primary-foreground shadow-lg"
                                  : "bg-primary text-primary-foreground shadow-md"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {reached ? (
                              <CheckCircle2 className="size-6" aria-hidden />
                            ) : (
                              <IconComponent className="size-5" aria-hidden />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="space-y-1">
                            <p
                              className={`text-xs font-medium ${
                                reached
                                  ? isCurrent
                                    ? "text-primary"
                                    : "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              Step {idx + 1}
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                reached ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {label}
                            </p>
                          </div>

                          {/* Current Step Badge */}
                          {isCurrent && (
                            <span className="absolute right-2 top-2 animate-pulse rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                              Live
                            </span>
                          )}
                        </div>
                      </Card>

                      {/* Connecting line for mobile/tablet */}
                      {!isLast && (
                        <div className="absolute left-full top-12 hidden h-0.5 w-full translate-x-2 sm:block lg:hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              reached ? "bg-primary" : "bg-border"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
