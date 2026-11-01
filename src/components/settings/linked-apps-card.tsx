"use client";

import { Bell, Bike, CreditCard, ExternalLink, Package, UtensilsCrossed, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  INVENTORY_UI_URL,
  LOGISTICS_UI_URL,
  NOTIFICATIONS_UI_URL,
  SUBSCRIPTIONS_UI_URL,
  TREASURY_UI_URL,
} from "@/lib/app-urls";

interface LinkedApp {
  title: string;
  body: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Settings the online store depends on but other apps own. Ordering keeps no copy of them; each
 * row opens the owning app on the right page for this business.
 */
export function LinkedAppsCard({ orgSlug }: { orgSlug: string }) {
  const apps: LinkedApp[] = [
    {
      title: "Menu, prices and stock",
      body: "Items, photos, modifiers, prices and what is in stock. Inventory.",
      href: `${INVENTORY_UI_URL}/${orgSlug}/catalog`,
      icon: UtensilsCrossed,
    },
    {
      title: "Payment methods",
      body: "M-Pesa, PayHero, card and cash on delivery. Treasury.",
      href: `${TREASURY_UI_URL}/${orgSlug}/settings?tab=payments`,
      icon: CreditCard,
    },
    {
      title: "Customer messages",
      body: "Email, SMS and WhatsApp senders, templates and branding. Notifications.",
      href: `${NOTIFICATIONS_UI_URL}/settings`,
      icon: Bell,
    },
    {
      title: "Riders and delivery areas",
      body: "Delivery areas and fees, riders, dispatch and rider cash. Logistics.",
      href: `${LOGISTICS_UI_URL}/${orgSlug}/zones`,
      icon: Bike,
    },
    {
      title: "Plan and add-ons",
      body: "Your plan, add-ons and invoices. Subscriptions.",
      href: `${SUBSCRIPTIONS_UI_URL}/billing`,
      icon: Package,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Managed in other apps</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {apps.map(({ title, body, href, icon: Icon }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-medium">
                {title} <ExternalLink className="size-3 text-muted-foreground" />
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{body}</span>
            </span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
