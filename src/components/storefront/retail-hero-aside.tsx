"use client";

import Link from "next/link";
import { MapPin, PackageSearch, Phone, Truck } from "lucide-react";

import { deliveryFeeLabel, notDeliverableNote, outletArea } from "@/lib/delivery-fee";
import { orgRoute } from "@/lib/routes";
import { selectDeliveryPlace, useDiningModeStore } from "@/store/dining-mode";
import type { Outlet } from "@/types/catalog";

interface RetailHeroAsideProps {
  orgSlug: string;
  supportPhone?: string | undefined;
  /** The store the shop opens on (delivery time and fee, address). */
  outlet?: Outlet | undefined;
}

/** Kenyan numbers to the international form WhatsApp links need (07xx / 01xx to 2547xx / 2541xx). */
function whatsappNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) return `254${d.slice(1)}`;
  return d;
}

/**
 * The service column beside the hero, as on Jumia ("Call or WhatsApp to order") and Kilimall:
 * short tiles that answer how to buy, how it arrives and where to collect, each shown only when
 * the store has that fact.
 */
export function RetailHeroAside({ orgSlug, supportPhone, outlet }: RetailHeroAsideProps) {
  const place = useDiningModeStore(selectDeliveryPlace);
  const tiles: { key: string; icon: React.ReactNode; title: string; body: React.ReactNode }[] = [];
  if (supportPhone) {
    tiles.push({
      key: "phone",
      icon: <Phone className="size-5" aria-hidden />,
      title: "Call or WhatsApp to order",
      body: (
        <span className="flex flex-wrap gap-x-3">
          <a className="font-semibold text-brand-emphasis hover:underline" href={`tel:${supportPhone.replace(/\s+/g, "")}`}>
            {supportPhone}
          </a>
          <a
            className="font-semibold text-brand-emphasis hover:underline"
            href={`https://wa.me/${whatsappNumber(supportPhone)}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </span>
      ),
    });
  }
  if (outlet && (outlet.deliveryTime || outlet.deliveryFee)) {
    tiles.push({
      key: "delivery",
      icon: <Truck className="size-5" aria-hidden />,
      title: "Delivery",
      body:
        outlet.deliveryFee === "not-deliverable"
          ? notDeliverableNote(place, outletArea(outlet))
          : [outlet.deliveryTime, outlet.deliveryFee ? deliveryFeeLabel(outlet.deliveryFee, place) : ""].filter(Boolean).join(", "),
    });
  }
  if (outlet?.address) {
    tiles.push({
      key: "pickup",
      icon: <MapPin className="size-5" aria-hidden />,
      title: "Pick up in store",
      body: outlet.address,
    });
  }
  tiles.push({
    key: "track",
    icon: <PackageSearch className="size-5" aria-hidden />,
    title: "Track your order",
    body: (
      <Link className="font-semibold text-brand-emphasis hover:underline" href={orgRoute(orgSlug, "/orders")}>
        See your orders
      </Link>
    ),
  });

  return (
    <ul className="grid h-full gap-3" aria-label="How to shop with us">
      {tiles.slice(0, 4).map((t) => (
        <li key={t.key} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis">{t.icon}</span>
          <span className="min-w-0 text-sm">
            <span className="block font-semibold text-foreground">{t.title}</span>
            <span className="block break-words text-muted-foreground">{t.body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
