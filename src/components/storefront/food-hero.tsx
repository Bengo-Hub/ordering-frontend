"use client";

import Link from "next/link";
import { Clock, Phone, Star } from "lucide-react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { deliveryFeeLabel, notDeliverableNote, outletArea } from "@/lib/delivery-fee";
import { formatMoney } from "@/lib/list-price";
import { cn } from "@/lib/utils";
import { selectDeliveryPlace, useDiningModeStore, type DiningMode } from "@/store/dining-mode";
import type { Outlet } from "@/types/catalog";

export interface FoodHeroSpotlight {
  name: string;
  price: number;
  currency?: string | undefined;
  image?: string | undefined;
  href: string;
}

interface FoodHeroProps {
  brandName: string;
  tagline?: string | undefined;
  /** The outlet the storefront opens on (hours, delivery time and fee, rating). */
  outlet?: Outlet | undefined;
  /** A real featured menu item, shown like a "pick of the month". */
  spotlight?: FoodHeroSpotlight | undefined;
  menuHref: string;
  supportPhone?: string | undefined;
  useCase?: string | undefined;
}

const MODE_LABEL: Record<DiningMode, string> = { delivery: "Delivery", pickup: "Pickup" };

/** "Open until 22:00" / "Opens at 07:00" from today's hours, when the outlet publishes them. */
function hoursNote(outlet: Outlet): string | null {
  const today = outlet.openingHours?.find((h) => h.dayOfWeek === new Date().getDay());
  if (!today || today.isClosed) return outlet.isOpen ? null : "Closed today";
  return outlet.isOpen ? `until ${today.closeTime}` : `opens at ${today.openTime}`;
}

/**
 * Restaurant storefront hero, from what the big food apps in Kenya do best: Glovo's
 * order-mode-first opening (pick delivery or pickup straight away) and Java House's spotlight on
 * one dish. Every fact shown is the outlet's own: open state and hours, delivery time and fee,
 * rating; nothing is shown when the data is missing.
 */
export function FoodHero({ brandName, tagline, outlet, spotlight, menuHref, supportPhone, useCase }: FoodHeroProps) {
  const mode = useDiningModeStore((s) => s.mode);
  const modes = useDiningModeStore((s) => s.supportedModes);
  const setMode = useDiningModeStore((s) => s.setMode);
  // The delivery location the shopper picked in the header, named in the "no delivery" note.
  const place = useDiningModeStore(selectDeliveryPlace);
  const note = outlet ? hoursNote(outlet) : null;

  return (
    <section aria-labelledby="food-hero-title" className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-4 sm:pt-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-5 bg-brand p-6 text-brand-contrast sm:p-8">
          {outlet && (
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold">
              <span className={cn("size-2 rounded-full", outlet.isOpen ? "bg-emerald-400" : "bg-red-400")} aria-hidden />
              {outlet.isOpen ? "Open now" : "Closed now"}
              {note && <span className="font-normal opacity-90">· {note}</span>}
            </p>
          )}
          <div className="space-y-2">
            <h1 id="food-hero-title" className="font-display text-3xl font-bold leading-tight text-balance sm:text-4xl">
              {brandName}
            </h1>
            {tagline && <p className="max-w-prose text-sm opacity-90 sm:text-base">{tagline}</p>}
          </div>

          {modes.length > 1 && (
            <div role="radiogroup" aria-label="How do you want your order?" className="inline-flex w-fit rounded-full bg-black/15 p-1">
              {modes.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-10 rounded-full px-5 text-sm font-semibold transition",
                    mode === m ? "bg-white text-black shadow" : "opacity-90 hover:opacity-100",
                  )}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          )}

          {outlet && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {outlet.deliveryTime && mode === "delivery" && (
                <li className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden /> {outlet.deliveryTime}</li>
              )}
              {outlet.deliveryFee && mode === "delivery" && outlet.deliveryFee !== "not-deliverable" && (
                <li>{deliveryFeeLabel(outlet.deliveryFee, place)}</li>
              )}
              {mode === "pickup" && outlet.address && <li>Pick up at {outlet.address}</li>}
              {outlet.rating > 0 && (
                <li className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-current" aria-hidden /> {outlet.rating.toFixed(1)}
                  {outlet.reviewCount > 0 && <span className="opacity-80">({outlet.reviewCount})</span>}
                </li>
              )}
            </ul>
          )}

          {outlet?.deliveryFee === "not-deliverable" && mode === "delivery" && (
            <p role="status" className="max-w-prose rounded-xl bg-black/20 px-4 py-3 text-sm">
              {notDeliverableNote(place, outletArea(outlet))}{" "}
              {modes.includes("pickup") ? (
                <button type="button" onClick={() => setMode("pickup")} className="font-semibold underline underline-offset-4">
                  Pick up instead
                </button>
              ) : (
                "Change your delivery location at the top of the page."
              )}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-3">
            <Link
              href={menuHref}
              className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-black shadow transition hover:shadow-md"
            >
              See the menu
            </Link>
            {supportPhone && (
              <a
                href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-semibold"
              >
                <Phone className="size-4" aria-hidden /> Call to order
              </a>
            )}
          </div>
        </div>

        {spotlight ? (
          <Link href={spotlight.href} className="group relative block min-h-56 bg-muted md:min-h-full">
            <ImageWithFallback
              src={spotlight.image}
              alt={spotlight.name}
              useCase={useCase}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Popular right now</p>
                <p className="truncate text-lg font-bold">{spotlight.name}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-black">
                {formatMoney(spotlight.currency, spotlight.price)}
              </span>
            </div>
          </Link>
        ) : outlet?.image ? (
          <div className="relative hidden min-h-56 md:block">
            <ImageWithFallback src={outlet.image} alt={outlet.name} useCase={useCase} fill sizes="45vw" className="object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
