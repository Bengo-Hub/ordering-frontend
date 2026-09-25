"use client";

import { useQuery } from "@tanstack/react-query";

import { getPaymentMethods, type PaymentMethodsResponse } from "@/lib/api/payment-methods";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const paymentMethodKeys = {
  all: ["payment-methods"] as const,
  list: (fulfillmentType?: string, outletId?: string | null) =>
    [...paymentMethodKeys.all, fulfillmentType, outletId ?? null] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** Checkout payment options for the order's fulfilment and outlet (the outlet's own M-Pesa numbers). */
export function usePaymentMethods(fulfillmentType?: string, outletId?: string | null) {
  const slug = useOrgSlug();
  return useQuery<PaymentMethodsResponse>({
    queryKey: paymentMethodKeys.list(fulfillmentType, outletId),
    queryFn: () => getPaymentMethods(slug, fulfillmentType, outletId),
    staleTime: 60_000,
  });
}
