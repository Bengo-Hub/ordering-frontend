"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { TreasuryPaymentModal } from "@/components/checkout/treasury-payment-modal";
import { Button } from "@/components/ui/button";
import { useRetryOrderPayment } from "@/hooks/use-orders";
import { apiErrorMessage } from "@/lib/api/error-message";
import type { Order, PaymentRetryResult } from "@/lib/api/orders";
import { canRetryPayment, formatTimeLeft, retryMsLeft } from "@/lib/payment-retry";
import { toast } from "@/lib/toast";

const TREASURY_API_URL = process.env.NEXT_PUBLIC_TREASURY_API_URL || "http://localhost:4201";

/**
 * "Payment not completed" for an online-payment order that is still unpaid. While the retry
 * window is open the customer can pay again and pick a gateway (the shared treasury payment
 * modal); the order keeps its stock until the window closes, then it is cancelled.
 */
export function PaymentRetryPanel({
  order,
  orgSlug,
  guest,
  sessionId,
  autoOpen,
  onPaid,
}: {
  order: Order;
  orgSlug: string;
  /** Use the public guest route (order page opened from an email or after guest checkout). */
  guest?: boolean | undefined;
  sessionId?: string | undefined;
  /** Start the retry straight away (email "Pay now" link with ?pay=1). */
  autoOpen?: boolean | undefined;
  onPaid?: (() => void) | undefined;
}) {
  const info = order.paymentRetry;
  const [now, setNow] = useState(() => Date.now());
  const [intent, setIntent] = useState<PaymentRetryResult | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const retry = useRetryOrderPayment({ guest, sessionId });

  const open = canRetryPayment(info, now);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const start = () => {
    retry.mutate(order.id, {
      onSuccess: (result) => setIntent(result),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Could not start the payment")),
    });
  };

  useEffect(() => {
    if (autoOpen && open && !autoStarted) {
      setAutoStarted(true);
      start();
    }
    // start is stable enough for a one-shot auto start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, open, autoStarted]);

  if (!info) return null;

  const left = formatTimeLeft(retryMsLeft(info, now));
  const payTenant = order.tenantId || orgSlug;
  const initiateUrl =
    intent?.initiateUrl ||
    (intent
      ? `${TREASURY_API_URL}/api/v1/pay/${encodeURIComponent(payTenant)}/intents/${intent.paymentIntentId}/initiate`
      : "");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Payment not completed</p>
          {open ? (
            <p className="text-xs text-amber-800">
              Your order is held for you. Complete the payment within{" "}
              <span className="font-semibold tabular-nums">{left}</span> or it will be cancelled.
            </p>
          ) : (
            <p className="text-xs text-amber-800">
              The time to complete this payment has passed. The order will be cancelled shortly.
            </p>
          )}
          {info.lastFailureReason && (
            <p className="mt-1 text-xs text-amber-700">Last attempt: {info.lastFailureReason}</p>
          )}
        </div>
      </div>
      {open && (
        <Button type="button" className="w-full gap-2" onClick={start} disabled={retry.isPending}>
          {retry.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Retry payment ({order.currency ?? "KES"} {(intent?.amount ?? order.grandTotal).toLocaleString()})
        </Button>
      )}

      <TreasuryPaymentModal
        open={!!intent}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIntent(null);
            onPaid?.();
          }
        }}
        paymentIntentId={intent?.paymentIntentId ?? ""}
        initiateUrl={initiateUrl}
        tenantSlug={orgSlug}
        amount={intent?.amount ?? order.grandTotal}
        currency={intent?.currency ?? order.currency ?? "KES"}
        description={`Order ${order.orderNumber}`}
        referenceId={order.id}
        referenceType="order"
        onPaymentConfirmed={() => {
          setIntent(null);
          onPaid?.();
        }}
      />
    </div>
  );
}
