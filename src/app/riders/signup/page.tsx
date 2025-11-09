"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import type { LatLngTuple } from "leaflet";
import { ClipboardCheckIcon, FileCheckIcon, MapPinnedIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { LocationMap } from "@/components/location/location-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { useUserLocation } from "@/hooks/use-user-location";
import { isWithinBusia } from "@/lib/geofence";

const BUSIA_CENTER: LatLngTuple = [-0.0607, 34.2855];

export default function RiderSignupPage(): JSX.Element {
  const [submitted, setSubmitted] = useState(false);
  const [pin, setPin] = useState<LatLngTuple>(BUSIA_CENTER);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  const { coords, status, error, requestLocation } = useUserLocation({ fallback: BUSIA_CENTER });

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (status === "resolved") {
      setPin(coords);
    }
  }, [coords, status]);

  const pinLabel = useMemo(() => `${pin[0].toFixed(4)}, ${pin[1].toFixed(4)}`, [pin]);

  const handlePinChange = (coords: LatLngTuple) => {
    if (!isWithinBusia(coords)) {
      setPinFeedback("Please keep the default pin within Busia County.");
      return;
    }
    setPinFeedback(null);
    setPin(coords);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 text-center">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">Join the {brand.shortName} rider network</h1>
          <p className="text-base text-muted-foreground">
            Complete the onboarding request to deliver meals across Busia. Our operations team verifies every rider to keep customers confident and deliveries reliable.
          </p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-foreground">Start your application</h2>
              <p className="text-sm text-muted-foreground">
                Share your personal, vehicle, and availability details. We&apos;ll review and invite you to training if everything checks out.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      First name
                    </label>
                    <Input id="firstName" name="firstName" placeholder="Brian" required />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Last name
                    </label>
                    <Input id="lastName" name="lastName" placeholder="Ouma" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Email
                    </label>
                    <Input id="email" name="email" type="email" placeholder="rider@example.com" required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Phone number
                    </label>
                    <Input id="phone" name="phone" type="tel" placeholder="07xx xxx xxx" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="nationalId" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    National ID number
                  </label>
                  <Input id="nationalId" name="nationalId" placeholder="ID number" required />
                </div>
                <div>
                  <label htmlFor="residence" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Residence / preferred operating area
                  </label>
                  <Textarea id="residence" name="residence" placeholder="Estate, town, or routes you prefer" rows={3} required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="bikeModel" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Motorbike make & model
                    </label>
                    <Input id="bikeModel" name="bikeModel" placeholder="TVS HLX, Boxer 150, ..." required />
                  </div>
                  <div>
                    <label htmlFor="plateNumber" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Registration / plate number
                    </label>
                    <Input id="plateNumber" name="plateNumber" placeholder="KDH 123A" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="insurance" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Insurance provider & expiry
                    </label>
                    <Input id="insurance" name="insurance" placeholder="Madison, expires 31/12/2024" required />
                  </div>
                  <div>
                    <label htmlFor="availability" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Weekly availability
                    </label>
                    <Input id="availability" name="availability" placeholder="Mon-Sat, 8am-6pm" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="notes" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Anything else we should know?
                  </label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="e.g. Delivery experience, extra languages, or if you have insulated storage"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2 rounded-3xl border border-border bg-card/80 p-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">Default delivery pin</p>
                      <Button size="sm" variant="ghost" onClick={() => requestLocation()} disabled={status === "loading"}>
                        {status === "loading" ? "Locating…" : "Use current location"}
                      </Button>
                    </div>
                    <p className="text-xs">Drag the marker or tap the map to refine the rider&apos;s default drop-off zone.</p>
                    {error ? <p className="text-xs text-red-500">{error}</p> : null}
                    <LocationMap value={pin} onChange={handlePinChange} height={240} />
                    <div className="text-xs text-muted-foreground">Pin coordinates: {pinLabel}</div>
                    {pinFeedback ? <p className="text-xs text-red-500">{pinFeedback}</p> : null}
                  </div>
                </div>

                <input type="hidden" name="latitude" value={pin[0]} />
                <input type="hidden" name="longitude" value={pin[1]} />

                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={submitted}>
                    {submitted ? "Application received" : "Submit onboarding request"}
                  </Button>
                  <Button variant="outline" className="w-full justify-center" asChild>
                    <Link href="/auth#rider">Already approved? Sign in</Link>
                  </Button>
                </div>
                {submitted ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-muted-foreground">
                    <ClipboardCheckIcon className="mt-1 size-4 text-primary" aria-hidden />
                    <p>
                      Thanks for registering. Our operations team will review your documents and reach out within 48 hours with next steps.
                    </p>
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-brand-muted/40">
              <CardHeader className="space-y-3">
                <FileCheckIcon className="size-5 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold text-foreground">What to prepare</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Copy of national ID (front & back)</li>
                  <li>• Motorbike logbook or signed lease agreement</li>
                  <li>• Valid motorcycle insurance and recent inspection report</li>
                  <li>• Passport photo in helmet and safety gear</li>
                </ul>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-3">
                <MapPinnedIcon className="size-5 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold text-foreground">Where you&apos;ll ride</h3>
                <p className="text-sm text-muted-foreground">
                  {brand.shortName} currently serves Busia town, Korinda, Mondika, and Alupe. We assign deliveries within your preferred zones to keep routes efficient.
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Need help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact the operations desk via <Link href="mailto:ops@urbancafe.com" className="font-semibold text-primary">ops@urbancafe.com</Link> or speak to your depot lead.
                </p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
