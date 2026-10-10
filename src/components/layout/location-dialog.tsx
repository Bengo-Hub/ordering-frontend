"use client";

import { Clock, MapPin, Star } from "lucide-react";

import { DeliveryLocationPicker } from "@/components/location/delivery-location-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAddresses } from "@/hooks/use-addresses";
import { cn } from "@/lib/utils";
import { useDiningModeStore } from "@/store/dining-mode";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The header's "deliver to" location. Uses the same picker as checkout (map pin, place
 * search, live delivery fee) so the location a customer browses with is the one their
 * checkout starts from.
 */
export function LocationDialog({ open, onOpenChange }: LocationDialogProps) {
  const diningMode = useDiningModeStore((state) => state.mode);
  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);
  const setDeliveryLocation = useDiningModeStore((state) => state.setDeliveryLocation);
  const isScheduled = useDiningModeStore((state) => state.isScheduled);
  const setIsScheduled = useDiningModeStore((state) => state.setIsScheduled);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();

  const current =
    deliveryLocation && (deliveryLocation.latitude !== 0 || deliveryLocation.longitude !== 0)
      ? {
          lat: deliveryLocation.latitude,
          lng: deliveryLocation.longitude,
          address: deliveryLocation.address,
          placeName: deliveryLocation.placeName,
        }
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Delivery location</DialogTitle>
        </DialogHeader>

        {open && (
          <DeliveryLocationPicker
            value={current}
            allowOutside
            confirmLabel="Use this location"
            onConfirm={(p) => {
              setDeliveryLocation({ address: p.address, latitude: p.lat, longitude: p.lng, placeName: p.placeName });
              onOpenChange(false);
            }}
          />
        )}

        <div className="mt-2 flex gap-2">
          <Button variant={!isScheduled ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setIsScheduled(false)}>
            {diningMode === "pickup" ? "Pick up now" : "Deliver now"}
          </Button>
          <Button variant={isScheduled ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setIsScheduled(true)}>
            <Clock className="mr-1.5 size-4" />
            Schedule
          </Button>
        </div>

        {(addressesLoading || addresses.length > 0) && (
          <div className="mt-2">
            <h3 className="mb-2 text-sm font-semibold">Saved addresses</h3>
            {addressesLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading addresses...</p>
            ) : (
              <div className="space-y-1">
                {addresses.map((a) => {
                  const pinned = a.latitude != null && a.longitude != null;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={!pinned}
                      onClick={() => {
                        setDeliveryLocation({ address: a.address_line1, latitude: a.latitude!, longitude: a.longitude! });
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted disabled:opacity-50",
                        deliveryLocation?.address === a.address_line1 && "bg-muted",
                      )}
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-foreground">
                        <MapPin className="size-4 text-background" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium">
                          {a.label}
                          {a.is_default && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              <Star className="size-2.5" />
                              Default
                            </span>
                          )}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{pinned ? a.address_line1 : "No map location"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
