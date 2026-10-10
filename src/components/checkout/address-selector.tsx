"use client";

import { BookmarkPlus, Calendar, Check, Clock, Loader2, MapPin, Plus, X } from "lucide-react";
import { useState } from "react";

import { useCreateAddress } from "@/hooks/use-addresses";
import { toast } from "@/lib/toast";

import { DeliveryLocationPicker, type DeliveryPoint } from "@/components/location/delivery-location-picker";
import { Button } from "@/components/ui/button";
import type { Address } from "@/lib/api/addresses";
import type { DeliveryQuote } from "@/lib/api/delivery";
import { quoteLabel } from "@/lib/api/delivery";
import { cn } from "@/lib/utils";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** A location picked on the map (any customer). Clears the saved address choice. */
  onLocationSelect: (location: DeliveryPoint | null) => void;
  /** The currently picked map location, shown when no saved address is selected. */
  pickedLocation: DeliveryPoint | null;
  /** Live quote for the current delivery pin (shown under the address). */
  quote?: DeliveryQuote | undefined;
  outletId?: string | null | undefined;
  orderTotal?: number | undefined;
  isGuest?: boolean;
  scheduledTime?: { date: Date; label: string } | null;
  onSchedule?: (date: Date) => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onLocationSelect,
  pickedLocation,
  quote,
  outletId,
  orderTotal,
  isGuest = false,
  scheduledTime,
  onSchedule,
}: AddressSelectorProps) {
  const selectedAddress = addresses.find((a) => a.id === selectedId);
  // First visit: open the picker straight away so the customer's location is preselected.
  const [showModal, setShowModal] = useState(!selectedAddress && !pickedLocation);
  const hasAddress = !!(selectedAddress || pickedLocation);
  const displayLabel = selectedAddress?.label ?? pickedLocation?.placeName ?? "Delivery location";
  const displayAddress = selectedAddress?.address_line1 ?? pickedLocation?.address ?? "";

  // Signed-in customers can keep a picked location for next time.
  const createAddress = useCreateAddress();
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const pickedKey = pickedLocation ? `${pickedLocation.lat.toFixed(5)},${pickedLocation.lng.toFixed(5)}` : null;
  const canSave = !isGuest && !selectedAddress && !!pickedLocation && savedKey !== pickedKey;
  const savePicked = async () => {
    if (!pickedLocation) return;
    try {
      await createAddress.mutateAsync({
        label: pickedLocation.placeName || "Saved place",
        addressLine1: pickedLocation.address,
        latitude: pickedLocation.lat,
        longitude: pickedLocation.lng,
        isDefault: addresses.length === 0,
      });
      setSavedKey(pickedKey);
      toast.success("Saved to your addresses");
    } catch {
      toast.error("Could not save this address");
    }
  };

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <MapPin className="size-4 text-primary" />
        <span>Delivery location</span>
      </div>

      {hasAddress ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{displayLabel}</p>
            <p className="truncate text-xs text-muted-foreground">{displayAddress}</p>
            {quote && <p className="text-xs text-muted-foreground">{quoteLabel(quote)}</p>}
          </div>
          <span className="text-xs text-primary">Change</span>
        </button>
      ) : (
        <div className="py-3 text-center">
          <p className="mb-3 text-sm text-muted-foreground">Choose where we should deliver.</p>
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)} className="gap-1.5">
            <Plus className="size-4" />
            Choose delivery location
          </Button>
        </div>
      )}

      {(canSave || (savedKey !== null && savedKey === pickedKey)) && (
        <div className="mt-2 flex justify-end">
          {savedKey === pickedKey ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3.5" /> Saved to your addresses
            </span>
          ) : (
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={savePicked} disabled={createAddress.isPending}>
              {createAddress.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <BookmarkPlus className="size-3.5" />}
              Save to my addresses
            </Button>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold">Delivery location</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <DeliveryLocationPicker
                value={pickedLocation}
                outletId={outletId}
                orderTotal={orderTotal}
                onConfirm={(point) => {
                  onLocationSelect(point);
                  setShowModal(false);
                }}
              />

              {onSchedule && (
                <div>
                  <p className="mb-2 text-sm font-medium">Time preference</p>
                  <div className="flex gap-2">
                    <Button variant={!scheduledTime ? "default" : "outline"} size="sm" className="flex-1 gap-1.5">
                      <Clock className="size-4" />
                      Deliver now
                    </Button>
                    <Button
                      variant={scheduledTime ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => onSchedule(new Date())}
                    >
                      <Calendar className="size-4" />
                      Schedule
                    </Button>
                  </div>
                </div>
              )}

              {!isGuest && addresses.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Saved addresses</p>
                  <div className="space-y-2">
                    {addresses.map((addr) => {
                      const selected = selectedId === addr.id;
                      const pinned = addr.latitude != null && addr.longitude != null;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          disabled={!pinned}
                          onClick={() => {
                            onSelect(addr.id);
                            onLocationSelect(null);
                            setShowModal(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50",
                            selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                          )}
                        >
                          <MapPin className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{addr.label}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {pinned ? addr.address_line1 : "No map location, pick it on the map above"}
                            </p>
                          </div>
                          {addr.is_default && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Default
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
