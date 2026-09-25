"use client";

import { Bike, CalendarClock, KeyRound, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@/lib/api/orders";
import { formatDateTime } from "@/lib/datetime";
import { isDeliveryFulfillment, RIDER_PROGRESS } from "@/lib/order-timeline";

/**
 * OrderStatusPanel shows the customer what they need while the order is on its way: the delivery
 * code to give the rider at the door, what the rider is doing, a pending manual M-Pesa check, and
 * the promised time of a scheduled order. Renders nothing when none applies.
 */
export function OrderStatusPanel({ order }: { order: Order }) {
  const meta = order.metadata ?? {};
  const delivery = isDeliveryFulfillment(order.fulfillmentType);
  const finished = ["delivered", "completed", "cancelled", "refunded", "failed"].includes(order.status);
  const riderProgress = RIDER_PROGRESS[String(meta.delivery_status ?? "")];
  const awaitingMpesaCheck = meta.payment_channel === "mpesa_manual" && order.paymentStatus !== "paid";
  const showCode = delivery && !finished && !!order.podCode;
  const scheduledFor = order.scheduledFor;

  if (!showCode && !riderProgress && !awaitingMpesaCheck && !(scheduledFor && !finished)) return null;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        {scheduledFor && !finished && (
          <p className="flex items-center gap-2 text-sm">
            <CalendarClock className="size-4 text-primary" />
            Scheduled for{" "}
            <span className="font-semibold">
              {formatDateTime(scheduledFor, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        )}
        {awaitingMpesaCheck && (
          <p className="flex items-start gap-2 text-sm">
            <ShieldCheck className="mt-0.5 size-4 text-amber-600" />
            <span>
              We are confirming your M-Pesa payment
              {typeof meta.mpesa_code === "string" ? ` (${meta.mpesa_code})` : ""}. Your order is being
              prepared in the meantime.
            </span>
          </p>
        )}
        {delivery && riderProgress && !finished && (
          <p className="flex items-center gap-2 text-sm">
            <Bike className="size-4 text-primary" />
            {riderProgress}
          </p>
        )}
        {showCode && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Delivery code</p>
                <p className="text-xs text-muted-foreground">Give this code to the rider when you receive your order.</p>
              </div>
            </div>
            <span className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">{order.podCode}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
