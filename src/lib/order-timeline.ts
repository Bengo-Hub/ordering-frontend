import { Bike, Check, ChefHat, Clock, Package } from "lucide-react";

export type TimelineStep = {
  /** Order statuses that map to this step. The step lights up once the order
   *  reaches any of these statuses (or a later step's status). */
  keys: readonly string[];
  label: string;
  icon: typeof Clock;
};

// Delivery flow: …→ Ready → On the Way → Delivered.
export const DELIVERY_TIMELINE: readonly TimelineStep[] = [
  { keys: ["pending"], label: "Order Placed", icon: Clock },
  { keys: ["confirmed"], label: "Confirmed", icon: Check },
  { keys: ["preparing"], label: "Preparing", icon: ChefHat },
  { keys: ["ready"], label: "Ready", icon: Package },
  { keys: ["out_for_delivery"], label: "On the Way", icon: Bike },
  { keys: ["delivered", "completed"], label: "Delivered", icon: Check },
] as const;

// Pickup / dine-in flow: …→ Ready → Picked Up. No "On the Way"/"Delivered".
export const PICKUP_TIMELINE: readonly TimelineStep[] = [
  { keys: ["pending"], label: "Order Placed", icon: Clock },
  { keys: ["confirmed"], label: "Confirmed", icon: Check },
  { keys: ["preparing"], label: "Preparing", icon: ChefHat },
  { keys: ["ready"], label: "Ready for pickup", icon: Package },
  { keys: ["completed", "delivered"], label: "Picked Up", icon: Check },
] as const;

/** Delivery flow for "delivery" and legacy "scheduled" orders; pickup flow otherwise. */
export function isDeliveryFulfillment(fulfillmentType: string | undefined): boolean {
  return /deliver|scheduled/i.test(fulfillmentType ?? "");
}

export function timelineFor(fulfillmentType: string | undefined): readonly TimelineStep[] {
  return isDeliveryFulfillment(fulfillmentType) ? DELIVERY_TIMELINE : PICKUP_TIMELINE;
}

/** Index of the step whose keys include the status (-1 when none). */
export function timelineIndex(timeline: readonly TimelineStep[], status: string): number {
  return timeline.findIndex((s) => s.keys.includes(status));
}

/** Rider progress recorded on the order (metadata.delivery_status) in customer words. */
export const RIDER_PROGRESS: Record<string, string> = {
  rider_assigned: "A rider has been assigned",
  rider_accepted: "Your rider is heading to the restaurant",
  en_route_pickup: "Your rider is heading to the restaurant",
  arrived_pickup: "Your rider is collecting your order",
  picked_up: "Your rider has your order",
  en_route_dropoff: "Your rider is on the way to you",
  arrived_dropoff: "Your rider has arrived",
  needs_rider: "Finding you a new rider",
};
