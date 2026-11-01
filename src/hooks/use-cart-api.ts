"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  checkout,
  guestCheckout,
  getFeeBreakdown,
  type CheckoutRequest,
  type CheckoutResponse,
  type GuestCheckoutRequest,
  type FeeBreakdown,
} from "@/lib/api/cart-api";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";

// ─── Query Keys ──────────────────────────────────────────────────────

export const cartApiKeys = {
  all: ["cart-api"] as const,
  feeBreakdown: (outletId: string, fulfillmentType: string, pinKey = "") =>
    [...cartApiKeys.all, "fee-breakdown", outletId, fulfillmentType, pinKey] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Fetch fee breakdown from the backend (authenticated).
 * Requires outletId to identify which cart/outlet to compute fees for.
 * Pass fulfillmentType to get accurate delivery vs pickup fees.
 */
export function useFeeBreakdown(
  outletId: string | null,
  fulfillmentType = "delivery",
  sessionId?: string,
  pin?: { lat: number; lng: number } | null,
) {
  const slug = useOrgSlug();
  const pinKey = pin ? `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}` : "";
  return useQuery<FeeBreakdown>({
    queryKey: cartApiKeys.feeBreakdown(outletId ?? "", fulfillmentType, pinKey),
    queryFn: () => getFeeBreakdown(slug, outletId!, fulfillmentType, sessionId, pin),
    enabled: !!outletId,
    staleTime: 60_000,
  });
}

/**
 * Running totals for the cart page and the cart drawer. The server prices the cart it holds for
 * this customer (the guest cart by session_id); while that cart does not hold the items yet
 * (item_total 0) the total is the items alone. Delivery is priced at checkout once a location is
 * picked, so it is never part of the running total here.
 */
export function useCartTotals(outletId: string | null, fulfillmentType: string, noFulfillment: boolean) {
  const sessionId = useCartStore((s) => s.sessionId);
  const subtotal = useCartStore((s) => s.subtotal)();
  const { data } = useFeeBreakdown(outletId, fulfillmentType, sessionId);
  const priced = !noFulfillment && data && data.item_total > 0 ? data : undefined;
  return {
    subtotal,
    serviceFee: priced?.service_fee ?? 0,
    total: priced ? priced.grand_total - priced.delivery_fee + priced.delivery_discount : subtotal,
  };
}

// ─── Mutations ───────────────────────────────────────────────────────

export function useCheckout() {
  const slug = useOrgSlug();
  return useMutation<CheckoutResponse, Error, CheckoutRequest>({
    mutationFn: (data) => checkout(slug, data),
  });
}

export function useGuestCheckout() {
  const slug = useOrgSlug();
  return useMutation<CheckoutResponse, Error, GuestCheckoutRequest>({
    mutationFn: (data) => guestCheckout(slug, data),
  });
}
