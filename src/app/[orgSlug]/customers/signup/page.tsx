"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";
import { PhoneInputField } from "@bengo-hub/shared-ui-lib/contact";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { DeliveryLocationPicker, type DeliveryPoint } from "@/components/location/delivery-location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { useCreateAddress } from "@/hooks/use-addresses";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useDiningModeStore } from "@/store/dining-mode";

export default function CustomerSignupPage() {
  return (
    <RequireAuth>
      <SaveDeliveryAddressPage />
    </RequireAuth>
  );
}

function SaveDeliveryAddressPage() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((state) => state.user);
  const createAddress = useCreateAddress();

  const [label, setLabel] = useState("Home");
  const [contactName, setContactName] = useState(user?.fullName ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  useEffect(() => {
    setContactName(user?.fullName ?? "");
    setContactPhone(user?.phone ?? "");
  }, [user?.fullName, user?.phone]);

  // Start from the location the customer already browses with (header), if any.
  const browsing = useDiningModeStore((state) => state.deliveryLocation);
  const [point, setPoint] = useState<DeliveryPoint | null>(
    browsing && (browsing.latitude !== 0 || browsing.longitude !== 0)
      ? { lat: browsing.latitude, lng: browsing.longitude, address: browsing.address, placeName: browsing.placeName }
      : null,
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!point) {
      setLocationFeedback("Pick your delivery point on the map or search for your area.");
      return;
    }
    setLocationFeedback(null);
    try {
      await createAddress.mutateAsync({
        label: label.trim() || "Home",
        addressLine1: point.address,
        country: "KE",
        latitude: point.lat,
        longitude: point.lng,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        isDefault: true,
      });
      setSubmitted(true);
    } catch {
      // useCreateAddress surfaces its own error via isError below
    }
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 text-center">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Save your delivery address
          </h1>
          <p className="text-base text-muted-foreground">
            Add your delivery point so checkout is one tap next time you order from{" "}
            {brand.shortName}.
          </p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-foreground">Delivery details</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll use these to reach you and find your door faster.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contactName"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Contact name
                    </label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      placeholder="Mary Atieno"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addressLabel"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Label
                    </label>
                    <Input
                      id="addressLabel"
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder="Home"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                  >
                    Phone number
                  </label>
                  <PhoneInputField
                    value={contactPhone}
                    onChange={setContactPhone}
                    placeholder="07xx xxx xxx"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Delivery point</p>
                  {point && (
                    <p className="text-sm">
                      Saved point: <span className="font-medium">{point.address}</span>
                    </p>
                  )}
                  <DeliveryLocationPicker
                    value={point}
                    confirmLabel={point ? "Update this point" : "Use this point"}
                    onConfirm={(p) => {
                      setPoint(p);
                      setLocationFeedback(null);
                    }}
                  />
                  {locationFeedback && <p className="text-sm text-destructive">{locationFeedback}</p>}
                </div>
                {createAddress.isError ? (
                  <p className="text-sm text-destructive">
                    We couldn&apos;t save that address. Please try again.
                  </p>
                ) : null}
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={createAddress.isPending || submitted}>
                    {submitted
                      ? "Address saved"
                      : createAddress.isPending
                        ? "Saving…"
                        : "Save delivery address"}
                  </Button>
                  <Button variant="outline" className="w-full justify-center" asChild>
                    <Link href={orgRoute(orgSlug, "/profile")}>Skip for now</Link>
                  </Button>
                </div>
                {submitted ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="mt-1 size-4 text-primary" aria-hidden />
                    <p>
                      Saved as your default delivery address.{" "}
                      <Link href={orgRoute(orgSlug, "/profile")} className="font-semibold text-primary">
                        Go to your profile
                      </Link>{" "}
                      or{" "}
                      <Link href={orgRoute(orgSlug, "/")} className="font-semibold text-primary">
                        start ordering
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-brand-muted/40">
              <CardHeader className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">What you&apos;ll enjoy</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Save multiple delivery addresses for quick checkout</li>
                  <li>• Earn rewards and personalised offers every time you order</li>
                  <li>• Get instant push and email updates as your rider makes progress</li>
                </ul>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Need help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for assistance, or manage your account from your{" "}
                  <Link href={orgRoute(orgSlug, "/profile")} className="font-semibold text-primary">
                    profile
                  </Link>
                  .
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <ShieldCheckIcon className="size-6 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold text-foreground">Your data stays protected</h3>
                <p className="text-sm text-muted-foreground">
                  {brand.shortName} uses secure authentication, encryption at rest, and
                  privacy-first defaults. Only you and authorised staff can access your profile.
                </p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

