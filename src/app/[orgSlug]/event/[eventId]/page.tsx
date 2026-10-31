"use client";

import { fetchPublicEvent, type PublicEvent } from "@/lib/api/events";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useCartStore } from "@/store/cart";
import { CalendarDays, Clock, Loader2, MapPin, Minus, Plus, Share2, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
// Centralized in shared-ui-lib (aliased to keep this file's existing call sites unchanged).
import { formatCurrency as formatMoney } from "@bengo-hub/shared-ui-lib";

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRange(start?: string, end?: string) {
  if (!start) return "";
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const s = new Date(start).toLocaleTimeString("en-KE", opts);
  if (!end) return s;
  return `${s} – ${new Date(end).toLocaleTimeString("en-KE", opts)}`;
}

function slugifyTier(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Guarantee every tier has a unique, stable id (mirrors inventory-api's derivation). Without this,
// tiers with a blank tier_id collapse to one shared quantity and overcharge the buyer.
function normalizeTiers(e: PublicEvent): PublicEvent {
  return {
    ...e,
    tiers: e.tiers.map((t, i) => ({
      ...t,
      tier_id: (t.tier_id && t.tier_id.trim()) || slugifyTier(t.name) || `tier-${i}`,
    })),
  };
}

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicEvent(orgSlug, eventId)
      .then((e) => {
        if (active) {
          setEvent(normalizeTiers(e));
          setError(false);
        }
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orgSlug, eventId]);

  const setTierQty = (tierId: string, delta: number, max: number) =>
    setQty((q) => ({ ...q, [tierId]: Math.max(0, Math.min(max, (q[tierId] ?? 0) + delta)) }));

  const total = useMemo(
    () => (event ? event.tiers.reduce((sum, t) => sum + (qty[t.tier_id] ?? 0) * t.price, 0) : 0),
    [event, qty],
  );
  const totalSeats = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty]);

  function handleAddToCart() {
    if (!event || totalSeats === 0) return;
    for (const tier of event.tiers) {
      const n = qty[tier.tier_id] ?? 0;
      if (n <= 0) continue;
      addItem({
        id: `${event.id}::${tier.tier_id}`,
        name: `${event.name}, ${tier.name}`,
        price: tier.price,
        quantity: n,
        inventorySku: event.sku,
        notes: `Event ticket · ${tier.name}`,
        metadata: {
          is_ticket: true,
          tier_id: tier.tier_id,
          tier_name: tier.name,
          event_item_id: event.id,
        },
        ...(event.image_url ? { image: event.image_url } : {}),
      });
    }
    router.push(`/${orgSlug}/cart`);
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/${orgSlug}/event/${eventId}` : "";
    const shareUrl = event?.share_url || url;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: event?.name ?? "Event", url: shareUrl });
        return;
      } catch {
        /* copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Event link copied to clipboard");
    } catch {
      /* noop */
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Ticket className="h-12 w-12 opacity-30" />
        <p>Event not found or no longer available.</p>
        <Link href={`/${orgSlug}`} className="text-sm text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const ticketPanel = (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-xl shadow-black/5 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Ticket className="h-4 w-4 text-primary" />
        <h2 className="font-bold tracking-tight">Get Tickets</h2>
      </div>

      <div className="space-y-3 p-4">
        {event.sold_out && (
          <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-semibold text-red-600 dark:text-red-400">
            This event is sold out
          </div>
        )}
        {event.tiers.length === 0 && !event.sold_out && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No ticket tiers available yet.
          </p>
        )}

        {event.tiers.map((tier) => {
          const n = qty[tier.tier_id] ?? 0;
          const disabled = tier.sold_out || tier.remaining <= 0;
          const lowStock = !disabled && tier.remaining <= 5;
          const selected = n > 0;
          return (
            <div
              key={tier.tier_id}
              className={`group relative rounded-2xl border p-4 transition-all duration-300 ${selected ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border/60 bg-background/40 hover:border-primary/40"} ${disabled ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{tier.name}</p>
                  <p className="mt-0.5 font-display text-lg font-extrabold text-primary">
                    {formatMoney(tier.price)}
                  </p>
                  {disabled ? (
                    <span className="mt-1 inline-block text-xs font-semibold text-red-500">
                      Sold out
                    </span>
                  ) : lowStock ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                      Only {tier.remaining} left
                    </span>
                  ) : (
                    <span className="mt-1 inline-block text-xs text-muted-foreground">
                      {tier.remaining} available
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setTierQty(tier.tier_id, -1, tier.remaining)}
                    disabled={disabled || n === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:scale-105 hover:bg-muted active:scale-95 disabled:opacity-30"
                    aria-label="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-bold tabular-nums">{n}</span>
                  <button
                    onClick={() => setTierQty(tier.tier_id, 1, tier.remaining)}
                    disabled={disabled || n >= tier.remaining}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-30"
                    aria-label="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary + CTA (desktop) */}
      {event.tiers.length > 0 && !event.sold_out && (
        <div className="hidden space-y-3 border-t border-border/60 p-4 lg:block">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalSeats} ticket{totalSeats !== 1 ? "s" : ""}
            </span>
            <span className="text-xl font-extrabold">{formatMoney(total)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={totalSeats === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Ticket className="h-4 w-4" />
            {totalSeats === 0 ? "Select tickets" : "Book now"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] shadow-2xl shadow-black/20 ring-1 ring-white/10 sm:aspect-[21/9]">
          {event.image_url ? (
            <ImageWithFallback
              src={event.image_url}
              alt={event.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-night">
              <Ticket className="h-20 w-20 text-primary/40" />
            </div>
          )}
          {/* Solid scrim so the title stays readable on any photo */}
          <div className="absolute inset-0 bg-black/45" />

          {/* Share (floating, glassy) */}
          <button
            onClick={handleShare}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>

          {/* Title + meta overlay */}
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
              <Ticket className="h-3 w-3" /> Event
            </span>
            <h1 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {event.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {event.event_start_at && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-md sm:text-sm">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.event_start_at)}
                </span>
              )}
              {event.event_start_at && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-md sm:text-sm">
                  <Clock className="h-3.5 w-3.5" />{" "}
                  {formatTimeRange(event.event_start_at, event.event_end_at)}
                </span>
              )}
              {event.venue && (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-md sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />{" "}
                  <span className="truncate">{event.venue}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Left: details */}
          <div className="min-w-0 space-y-6">
            {event.description && (
              <section className="rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
                  <CalendarDays className="h-4 w-4 text-primary" /> About this event
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base">
                  {event.description}
                </p>
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-2">
              {event.event_start_at && (
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      When
                    </p>
                    <p className="text-sm font-medium">{formatDate(event.event_start_at)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeRange(event.event_start_at, event.event_end_at)}
                    </p>
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Where
                    </p>
                    <p className="break-words text-sm font-medium">{event.venue}</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: sticky ticket panel */}
          <div className="lg:sticky lg:top-6">{ticketPanel}</div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      {totalSeats > 0 && (
        <div className="sticky inset-x-0 bottom-0 z-20 border-t border-border bg-background p-3 lg:hidden">
          <button
            onClick={handleAddToCart}
            className="flex w-full items-center justify-between gap-3 rounded-full bg-primary px-5 py-4 font-bold text-primary-foreground transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Ticket className="h-5 w-5" /> {totalSeats} ticket{totalSeats !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              {formatMoney(total)} <Ticket className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
