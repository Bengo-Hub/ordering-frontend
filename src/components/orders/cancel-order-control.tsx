"use client";

import { Loader2, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCancelOrder } from "@/hooks/use-orders";
import { apiErrorMessage } from "@/lib/api/error-message";
import { toast } from "@/lib/toast";

/** Statuses a customer may still cancel from (the server enforces the same rule). */
export function customerMayCancel(status: string | undefined): boolean {
  return status === "pending" || status === "confirmed";
}

/**
 * The customer's Cancel order button and reason form, shared by the signed-in and guest order
 * pages. Guests pass their checkout session; the server refuses once the outlet has started.
 */
export function CancelOrderControl({
  orderId,
  status,
  guest,
  sessionId,
}: {
  orderId: string;
  status: string;
  guest?: boolean;
  sessionId?: string;
}) {
  const cancel = useCancelOrder(guest ? { guest: true, sessionId } : undefined);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!customerMayCancel(status)) return null;

  const submit = () => {
    if (!reason.trim()) return;
    cancel.mutate(
      { orderId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Order cancelled");
          setOpen(false);
        },
        onError: async (err) => toast.error(await apiErrorMessage(err, "Could not cancel the order")),
      },
    );
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        className="min-h-11 w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <XCircle className="size-4" />
        Cancel order
      </Button>
    );
  }

  return (
    <Card className="w-full border-destructive/50">
      <CardContent className="flex flex-col gap-3 py-4">
        <p className="text-sm font-medium text-foreground">Why are you cancelling this order?</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Changed my mind, ordered by mistake..."
          className="min-h-[80px] w-full rounded-md border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={!reason.trim() || cancel.isPending} onClick={submit}>
            {cancel.isPending ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Confirm cancel
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Keep order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
