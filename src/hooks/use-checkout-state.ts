"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAddresses } from "@/hooks/use-addresses";
import { useCheckout, useGuestCheckout, useFeeBreakdown } from "@/hooks/use-cart-api";
import { useOutlet } from "@/hooks/use-catalog";
import { useApplyPromoCode } from "@/hooks/use-orders";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useDeliveryQuote } from "@/hooks/use-delivery";
import type { DeliveryPoint } from "@/components/location/delivery-location-picker";
import { apiErrorMessage } from "@/lib/api/error-message";
import { api } from "@/lib/api/base";
import { payOrderWithWallet } from "@/lib/api/orders";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore, type CartItem } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";
import type { PaymentResult } from "@/components/checkout/treasury-payment-modal";
import type { CheckoutItemModifier } from "@/lib/api/cart-api";

/** Flattens a cart line's grouped modifier selections into the one-entry-per-option
 *  wire shape the backend expects (mirrors the persisted-cart AddItemRequest.modifiers
 *  contract), so a selected modifier survives checkout instead of being dropped. */
function flattenModifiers(item: CartItem): CheckoutItemModifier[] | undefined {
  if (!item.modifiers?.length) return undefined;
  const flat: CheckoutItemModifier[] = [];
  for (const group of item.modifiers) {
    for (const option of group.options) {
      flat.push({
        groupId: group.groupId,
        groupName: group.groupName,
        optionId: option.id,
        optionName: option.name,
        priceAdjustment: option.price,
      });
    }
  }
  return flat.length > 0 ? flat : undefined;
}

export type FulfillmentMode = "delivery" | "pickup" | "schedule";
export type CheckoutStep = "review" | "processing" | "payment" | "success";

/**
 * Stable identifier for a selectable checkout payment option. Several options can
 * map to the same backend `method` (e.g. pay-now M-Pesa vs M-Pesa-on-collection
 * both send `mpesa`), so the UI tracks the OPTION id to drive post-place behavior.
 */
export type CheckoutPaymentOptionId =
  | "paystack_now"
  | "payhero_now"
  | "mpesa_now"
  | "mpesa_manual"
  | "wallet"
  | "cod_collection";

/** M-Pesa confirmation codes are 10 letters and digits, e.g. SGH7K2L9QP. */
export const MPESA_CODE_PATTERN = /^[A-Z0-9]{10}$/;

/** A payment method the customer can select at checkout. */
export interface CheckoutPaymentOption {
  /** Stable option identifier; distinguishes pay-now vs pay-on-collection. */
  id: CheckoutPaymentOptionId;
  /** Backend method key sent as `paymentMethod` (e.g. "mpesa", "paystack", "cod", "wallet"). */
  method: string;
  /** Human-readable label shown in the selector (adapts to delivery/pickup). */
  label: string;
  /**
   * Pay-now options open the treasury payment modal so the customer pays
   * immediately. Pay-on-collection options place the order pending and settle
   * later (cash at handover / staff STK / guest order page).
   */
  payNow: boolean;
  /** One-line explanation under the label. */
  description?: string | undefined;
  /** Manual M-Pesa: the outlet's Till / Paybill (+ account) / Pochi numbers to pay to. */
  instructions?: Record<string, string> | undefined;
}

const SMALL_ORDER_THRESHOLD = 500;

export function useCheckoutState() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clear);
  const orderNotes = useCartStore((s) => s.orderNotes);
  const requestUtensils = useCartStore((s) => s.requestUtensils);
  const sessionId = useCartStore((s) => s.sessionId);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const diningMode = useDiningModeStore((s) => s.mode);
  const setDiningMode = useDiningModeStore((s) => s.setMode);
  const isScheduled = useDiningModeStore((s) => s.isScheduled);
  const setIsScheduled = useDiningModeStore((s) => s.setIsScheduled);
  const scheduledTime = useDiningModeStore((s) => s.scheduledTime);
  const setScheduledTime = useDiningModeStore((s) => s.setScheduledTime);

  // Event tickets check out on their own (no delivery/pickup/fees/preferences). A cart is
  // ticket-only when every line carries metadata.is_ticket (enforced by the cart mixing guard).
  const isTicketOnly = useMemo(
    () => items.length > 0 && items.every((i) => (i.metadata as { is_ticket?: boolean } | undefined)?.is_ticket === true),
    [items],
  );

  // Appointment/service carts (salon/spa/services vertical) are booked for a date+time —
  // the date/time is captured on the product page into each line's metadata.is_service.
  // Like tickets, they have no delivery/pickup/address/delivery-fee: the customer visits
  // the provider at the chosen time. Detected the same metadata-driven way as isTicketOnly.
  const isAppointmentOnly = useMemo(
    () => items.length > 0 && items.every((i) => (i.metadata as { is_service?: boolean } | undefined)?.is_service === true),
    [items],
  );

  // Booking carts (tickets or appointments) skip the whole delivery/pickup fulfillment flow.
  const noFulfillment = isTicketOnly || isAppointmentOnly;

  // Step & fulfillment
  const [step, setStep] = useState<CheckoutStep>("review");
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>(
    isScheduled ? "schedule" : diningMode,
  );

  // Promo
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  // Delivery
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [initiateUrl, setInitiateUrl] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCurrency, setPaymentCurrency] = useState("KES");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Guest
  const [checkoutMode, setCheckoutMode] = useState<"choose" | "guest" | "authenticated">(
    status === "authenticated" ? "authenticated" : "choose",
  );
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  // A pin picked on the map (guests always; signed-in customers when not using a saved address).
  const [deliveryLocation, setDeliveryLocationState] = useState<DeliveryPoint | null>(() =>
    toDeliveryPoint(useDiningModeStore.getState().deliveryLocation),
  );
  // The header's browsing location (set from the customer's current position on first visit)
  // preselects the checkout pin; a pin confirmed at checkout becomes the browsing location.
  const browsingLocation = useDiningModeStore((s) => s.deliveryLocation);
  const setBrowsingLocation = useDiningModeStore((s) => s.setDeliveryLocation);
  const setDeliveryLocation = useCallback(
    (loc: DeliveryPoint | null) => {
      setDeliveryLocationState(loc);
      if (loc) setBrowsingLocation({ address: loc.address, latitude: loc.lat, longitude: loc.lng, placeName: loc.placeName });
    },
    [setBrowsingLocation],
  );

  // Wallet payment state
  const [walletPaymentPending, setWalletPaymentPending] = useState(false);

  // Selected payment OPTION id (distinguishes pay-now vs pay-on-collection even
  // when two options share the same backend `paymentMethod`).
  const [selectedOptionId, setSelectedOptionId] = useState<
    CheckoutPaymentOptionId | undefined
  >(undefined);
  // Manual M-Pesa: the confirmation code from the customer's payment message.
  const [mpesaCode, setMpesaCodeRaw] = useState("");
  const setMpesaCode = useCallback(
    (v: string) => setMpesaCodeRaw(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)),
    [],
  );

  // Queries & mutations
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const checkoutMutation = useCheckout();
  const guestCheckoutMutation = useGuestCheckout();
  const applyPromo = useApplyPromoCode();

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // The pin being delivered to: a saved address with coordinates, else the picked location.
  const deliveryPin = useMemo(() => {
    if (fulfillmentMode === "pickup") return null;
    if (selectedAddress?.latitude != null && selectedAddress?.longitude != null) {
      return { lat: selectedAddress.latitude, lng: selectedAddress.longitude };
    }
    return deliveryLocation ? { lat: deliveryLocation.lat, lng: deliveryLocation.lng } : null;
  }, [fulfillmentMode, selectedAddress, deliveryLocation]);
  const hasDeliveryAddress = !!(selectedAddress || deliveryLocation);

  // Preselect the browsing location once it is known, unless a saved address is in use.
  useEffect(() => {
    if (deliveryLocation || selectedAddressId) return;
    const p = toDeliveryPoint(browsingLocation);
    if (p) setDeliveryLocationState(p);
  }, [browsingLocation, deliveryLocation, selectedAddressId]);

  // Resolve outlet ID — from cart item or fetch first outlet as fallback
  const cartOutletId = items[0]?.outletId || null;
  const { data: outlets = [] } = useQuery({
    queryKey: ["checkout-outlets", orgSlug],
    queryFn: async () => {
      const res = await api.get(`${orgSlug}/outlets?limit=10`);
      return res.data?.data ?? [];
    },
    enabled: !cartOutletId, // only fetch if cart items don't have outletId
    staleTime: 5 * 60_000,
  });
  const outletId = cartOutletId || outlets[0]?.id || null;
  const [selectedPickupOutletId, setSelectedPickupOutletId] = useState<string | null>(null);
  // Booking carts are "pickup" for payment purposes (the customer comes to the outlet).
  const { data: paymentMethodsData } = usePaymentMethods(
    noFulfillment ? "pickup" : fulfillmentMode,
    selectedPickupOutletId || outletId,
  );

  const { data: remoteFees, isLoading: feesLoading } = useFeeBreakdown(outletId, fulfillmentMode, sessionId, deliveryPin);

  const cartSubtotal = subtotal();
  // Delivery is priced by logistics for the pin (areas, geofence, distance rate).
  const { data: deliveryQuote, isFetching: quoteLoading, isError: quoteError } = useDeliveryQuote(
    deliveryPin,
    outletId,
    cartSubtotal,
  );
  const isOutsideDeliveryZone =
    fulfillmentMode !== "pickup" && !!deliveryPin && !!deliveryQuote && !quoteLoading && !deliveryQuote.serviceable;
  const isDeliveryPricingUnavailable = fulfillmentMode !== "pickup" && !!deliveryPin && quoteError && !deliveryQuote;
  const deliveryFee = deliveryQuote?.serviceable ? deliveryQuote.fee : remoteFees?.delivery_fee ?? 0;

  // Use backend fee breakdown when available and non-zero; otherwise compute locally
  const feeBreakdown: import("@/lib/api/cart-api").FeeBreakdown | undefined =
    noFulfillment && cartSubtotal > 0
      ? {
          item_total: cartSubtotal,
          discount,
          packaging_fee: 0,
          subtotal: cartSubtotal - discount,
          small_order_fee: 0,
          service_fee: 0,
          delivery_fee: 0,
          delivery_discount: 0,
          tax_total: 0,
          grand_total: cartSubtotal - discount,
        }
      : remoteFees && remoteFees.item_total > 0
      ? remoteFees
      : cartSubtotal > 0
        ? {
            item_total: cartSubtotal,
            discount,
            packaging_fee: 0,
            subtotal: cartSubtotal - discount,
            small_order_fee: 0,
            service_fee: 0,
            delivery_fee: fulfillmentMode === "pickup" ? 0 : deliveryFee,
            delivery_discount: 0,
            tax_total: 0,
            grand_total: cartSubtotal - discount + (fulfillmentMode === "pickup" ? 0 : deliveryFee),
          }
        : undefined;

  const grandTotal = feeBreakdown?.grand_total ?? cartSubtotal - discount;

  // ─── Per-outlet booking deposit (tickets / appointments only) ──────────
  // Resolve the checkout outlet via the existing outlet hook to read its
  // bookingDepositPercent. For a BOOKING cart with a deposit % > 0 the customer
  // pays only the deposit now; the backend independently charges the same amount
  // (round2(total * pct/100)) and records deposit_amount/balance_due on the order.
  const { data: checkoutOutlet } = useOutlet(orgSlug, outletId ?? "");
  const bookingDepositPercent = checkoutOutlet?.bookingDepositPercent ?? 0;
  const hasBookingDeposit = noFulfillment && bookingDepositPercent > 0 && grandTotal > 0;
  // round2: multiply then round to 2dp — MUST match the backend's deposit formula.
  const depositAmount = hasBookingDeposit
    ? Math.round(grandTotal * bookingDepositPercent) / 100
    : 0;
  const balanceDue = hasBookingDeposit ? Math.round((grandTotal - depositAmount) * 100) / 100 : 0;
  // The amount actually collected now (deposit for booking-deposit carts, else full).
  const amountDueNow = hasBookingDeposit ? depositAmount : grandTotal;
  const depositBreakdown = hasBookingDeposit
    ? {
        percent: bookingDepositPercent,
        depositAmount,
        balanceDue,
        balanceLabel: isTicketOnly ? "Balance due at event" : "Balance due at appointment",
      }
    : null;

  const estimatedTime = deliveryQuote?.eta_minutes
    ? `${deliveryQuote.eta_minutes}-${deliveryQuote.eta_minutes + 15} min`
    : "35-50 min";

  const isGuestMode = checkoutMode === "guest" && status !== "authenticated";

  // ─── Payment method options (from the payment-methods aggregate) ───────
  const walletBalance = paymentMethodsData?.wallet?.balance ?? null;
  const walletCurrency = paymentMethodsData?.wallet?.currency ?? "KES";

  // Classify backend gateway `type` values. COD / cash variants enable the
  // pay-on-collection options; an M-Pesa STK gateway (the outlet's own Daraja paybill or till)
  // enables pay-now M-Pesa. PayHero is its own gateway on treasury's pay page (M-Pesa, Airtel,
  // card and more in its modal); since 2026-10-05 treasury no longer reports it as "mpesa".
  const isCodGateway = (t: string) => /cash|cod|on_delivery|on_pickup|on_collection/i.test(t);
  const isMpesaGateway = (t: string) => t === "mpesa" || t === "stk" || t === "mpesa_stk";
  const isPaystackGateway = (t: string) => t === "paystack" || t === "card";
  const isPayHeroGateway = (t: string) => t === "payhero";

  const paymentOptions = useMemo<CheckoutPaymentOption[]>(() => {
    const gateways = paymentMethodsData?.gateways ?? [];
    const opts: CheckoutPaymentOption[] = [];

    // Pickup (and bookings) are paid at the outlet; delivery (and schedule, which is a delivery)
    // at the customer's door. Labels adapt to the channel.
    const isPickup = noFulfillment || fulfillmentMode === "pickup";

    let hasMpesa = false;
    let hasPaystack = false;
    let hasPayHero = false;
    let codGateway: (typeof gateways)[number] | undefined;
    let manualMpesa: (typeof gateways)[number] | undefined;

    for (const g of gateways) {
      if (!g.enabled) continue;
      const t = g.type.toLowerCase();
      if (t === "mpesa_manual") manualMpesa = g;
      else if (isMpesaGateway(t)) hasMpesa = true;
      else if (isPaystackGateway(t)) hasPaystack = true;
      else if (isPayHeroGateway(t)) hasPayHero = true;
      else if (isCodGateway(t)) codGateway = g;
    }

    // ── Pay now ───────────────────────────────────────────────────────
    if (hasPaystack) {
      opts.push({
        id: "paystack_now",
        method: "paystack",
        label: "Pay now — Card (Paystack)",
        payNow: true,
      });
    }
    if (hasPayHero) {
      opts.push({
        id: "payhero_now",
        method: "payhero",
        label: "Pay now — PayHero",
        description: "M-Pesa, Airtel Money and more",
        payNow: true,
      });
    }
    if (hasMpesa) {
      opts.push({
        id: "mpesa_now",
        method: "mpesa",
        label: "Pay now — M-Pesa (STK)",
        payNow: true,
      });
    }

    // Wallet — authenticated users only, and only when the balance covers the amount
    // due now (the deposit for booking-deposit carts, otherwise the full total).
    if (!isGuestMode && walletBalance !== null && walletBalance >= amountDueNow && amountDueNow > 0) {
      opts.push({
        id: "wallet",
        method: "wallet",
        label: `Wallet (balance ${walletCurrency} ${walletBalance.toLocaleString()})`,
        payNow: false,
      });
    }

    // ── Manual M-Pesa: pay the outlet's own Till/Paybill now, then type the code ──
    // Offered when the outlet has its own M-Pesa numbers. The order goes to the kitchen at once
    // and the outlet checks the code before handing it over.
    if (manualMpesa) {
      opts.push({
        id: "mpesa_manual",
        method: "mpesa_manual",
        label: hasMpesa ? "M-Pesa to our Till/Paybill (enter code)" : "Pay with M-Pesa (enter code)",
        description: manualMpesa.description,
        instructions: manualMpesa.instructions,
        payNow: false,
      });
    }

    // ── Pay on delivery / at the counter (cash or M-Pesa at handover) ──
    // One option: the rider or cashier records whether it was cash or M-Pesa (with the code).
    // A separate "M-Pesa on delivery" option used to place an unpaid M-Pesa order that never
    // reached the kitchen.
    if (codGateway) {
      opts.push({
        id: "cod_collection",
        method: "cod",
        label: codGateway.name || (isPickup ? "Pay at the counter" : "Pay on delivery"),
        description:
          codGateway.description ||
          (isPickup ? "Cash or M-Pesa when you collect your order." : "Cash or M-Pesa to the rider when your order arrives."),
        payNow: false,
      });
    }

    return opts;
  }, [paymentMethodsData, fulfillmentMode, noFulfillment, isGuestMode, walletBalance, walletCurrency, amountDueNow]);

  // The currently selected option object (derived from the tracked id).
  const selectedOption = useMemo(
    () => paymentOptions.find((o) => o.id === selectedOptionId) ?? null,
    [paymentOptions, selectedOptionId],
  );
  // Backend method key sent as `paymentMethod` for the current selection.
  const selectedMethod = selectedOption?.method;

  // Keep a valid selection: default to the first option, and clear/repair the
  // selection if the available options change (e.g. wallet drops off the list,
  // or the fulfillment channel switches so labels/ids change).
  useEffect(() => {
    if (paymentOptions.length === 0) {
      if (selectedOptionId !== undefined) setSelectedOptionId(undefined);
      return;
    }
    if (!selectedOptionId || !paymentOptions.some((o) => o.id === selectedOptionId)) {
      setSelectedOptionId(paymentOptions[0].id);
    }
  }, [paymentOptions, selectedOptionId]);

  // Auto-select default address
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default);
      setSelectedAddressId(defaultAddr?.id ?? addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Sync mode when auth status changes
  useEffect(() => {
    if (status === "authenticated") setCheckoutMode("authenticated");
  }, [status]);

  const handleFulfillmentChange = useCallback(
    (mode: FulfillmentMode) => {
      setFulfillmentMode(mode);
      if (mode === "schedule") {
        setIsScheduled(true);
        setDiningMode("delivery");
      } else {
        setIsScheduled(false);
        setScheduledTime(null);
        setDiningMode(mode as "delivery" | "pickup");
      }
    },
    [setDiningMode, setIsScheduled, setScheduledTime],
  );

  const handleScheduleSelect = useCallback(
    (date: Date) => {
      setScheduledTime({
        date,
        label: date.toLocaleString("en-US", {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
    },
    [setScheduledTime],
  );

  const handleSignInForCheckout = useCallback(() => {
    const checkoutUrl = orgRoute(orgSlug, "/checkout");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sso_return_to", checkoutUrl);
    }
    void redirectToSSO(checkoutUrl, orgSlug);
  }, [orgSlug, redirectToSSO]);

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    if (!outletId) {
      toast.error('Select an outlet before applying a promo code');
      return;
    }
    try {
      // Real cart lines (not just the subtotal) so the code is scoped/scheduled/BOGO-checked
      // identically to the POS terminal — see pos-api's ApplyPromoCode doc comment.
      const promoLines = items.map((item) => ({
        sku: item.inventorySku || item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      }));
      const result = await applyPromo.mutateAsync({ code: promoCode, cafeId: outletId, items: promoLines, subtotal: cartSubtotal });
      if (result.valid) {
        setDiscount(result.discount);
        setPromoMessage(result.message);
        toast.success("Promo code applied!");
      } else {
        setPromoMessage(result.message);
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to apply promo code"));
    }
  }, [promoCode, cartSubtotal, applyPromo, outletId, items]);

  const handleWalletPayment = useCallback(
    async (explicitOrderId?: string) => {
      const targetOrderId = explicitOrderId ?? orderId;
      if (!targetOrderId) return;
      setWalletPaymentPending(true);
      try {
        await payOrderWithWallet(orgSlug, targetOrderId);
        setShowPaymentModal(false);
        clearCart();
        setStep("success");
        toast.success("Payment successful!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error ?? (err instanceof Error ? err.message : "Wallet payment failed");
        toast.error(msg);
        // Fall back to the standard payment flow so the user isn't stuck.
        setStep("payment");
        setShowPaymentModal(true);
      } finally {
        setWalletPaymentPending(false);
      }
    },
    [orderId, orgSlug, clearCart],
  );

  const handlePlaceOrder = useCallback(async () => {
    if (isGuestMode) {
      if (!guestEmail.trim() && !guestPhone.trim()) {
        toast.error("Please provide an email or phone number");
        return;
      }
      if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
      // A bad phone means the rider/outlet can't reach the customer — validate the format
      // (optional leading +, 8–15 digits, spaces/dashes allowed) when one is provided.
      if (guestPhone.trim() && !/^\+?\d[\d\s-]{7,14}$/.test(guestPhone.trim())) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    // Delivery/pickup/schedule validations don't apply to booking carts (tickets/appointments).
    if (!noFulfillment) {
      // Every delivery needs a pin so it can be priced and a rider sent to it.
      if (fulfillmentMode !== "pickup" && !deliveryPin) {
        toast.error(
          selectedAddressId
            ? "That saved address has no map location. Pick your location on the map."
            : "Please choose your delivery location",
        );
        return;
      }
      if (isOutsideDeliveryZone) {
        toast.error("We don't deliver to the selected location. Please choose a different one.");
        return;
      }
      if (isDeliveryPricingUnavailable) {
        toast.error("Delivery pricing is unavailable right now. Try again shortly or choose pickup.");
        return;
      }
      if (deliveryQuote?.below_min_order) {
        toast.error(
          `Orders to ${deliveryQuote.zone?.name ?? "this area"} need at least ${deliveryQuote.currency} ${Math.round(deliveryQuote.min_order)}.`,
        );
        return;
      }
      if (fulfillmentMode === "schedule" && !scheduledTime) {
        toast.error("Please select a scheduled time");
        return;
      }
    }

    // Manual M-Pesa: the customer must have paid and typed the code from the M-Pesa message.
    if (selectedOption?.id === "mpesa_manual" && !MPESA_CODE_PATTERN.test(mpesaCode)) {
      toast.error("Pay to the M-Pesa number shown, then enter the 10-character code from the M-Pesa message");
      return;
    }

    // Booking carts (tickets/appointments) have no fulfillment — send pickup so no
    // delivery address/fee is required. Deposits (per-outlet bookingDepositPercent)
    // and per-ticket attendees are handled here: the backend charges the deposit and
    // reads metadata.attendees off each ticket line — both flow through untouched on
    // the line metadata below.
    const effectiveFulfillment: FulfillmentMode = noFulfillment ? "pickup" : fulfillmentMode;

    setStep("processing");
    setOrderError(null);

    try {
      const checkoutOutletId = outletId || selectedPickupOutletId || items[0]?.outletId || "";
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      let result;

      if (isGuestMode) {
        const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
        const guestPayload: Parameters<typeof guestCheckoutMutation.mutateAsync>[0] = {
          outletId: checkoutOutletId,
          sessionId,
          fulfillmentType: effectiveFulfillment,
          idempotencyKey,
          items: items.map((item) => {
            const modifiers = flattenModifiers(item);
            return {
              inventorySku: item.inventorySku || item.id,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.total,
              ...(item.metadata ? { metadata: item.metadata } : {}),
              ...(modifiers ? { modifiers } : {}),
            };
          }),
        };
        if (guestEmail.trim()) guestPayload.contactEmail = guestEmail.trim();
        if (guestPhone.trim()) guestPayload.contactPhone = guestPhone.trim();
        if (guestName.trim()) guestPayload.contactName = guestName.trim();
        // Delivery address from saved address or guest-picked location
        if (selectedAddr) {
          guestPayload.deliveryAddress = selectedAddr.address_line1 ?? "";
          guestPayload.deliveryLat = selectedAddr.latitude ?? 0;
          guestPayload.deliveryLng = selectedAddr.longitude ?? 0;
        } else if (deliveryLocation) {
          guestPayload.deliveryAddress = deliveryLocation.address;
          guestPayload.deliveryLat = deliveryLocation.lat;
          guestPayload.deliveryLng = deliveryLocation.lng;
          if (deliveryLocation.placeName) guestPayload.deliveryPlaceName = deliveryLocation.placeName;
        }
        if (deliveryNotes) guestPayload.deliveryNotes = deliveryNotes;
        if (scheduledTime) guestPayload.scheduledAt = scheduledTime.date.toISOString();
        if (selectedMethod) guestPayload.paymentMethod = selectedMethod;
        if (selectedMethod === "mpesa_manual") guestPayload.mpesaCode = mpesaCode;
        if (orderNotes) guestPayload.orderNotes = orderNotes;
        if (requestUtensils) guestPayload.requestUtensils = requestUtensils;
        result = await guestCheckoutMutation.mutateAsync(guestPayload);
      } else {
        const payload: Parameters<typeof checkoutMutation.mutateAsync>[0] = {
          outletId: checkoutOutletId,
          fulfillmentType: effectiveFulfillment,
          items: items.map((item) => {
            const modifiers = flattenModifiers(item);
            return {
              inventorySku: item.inventorySku || item.id,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.total,
              ...(item.metadata ? { metadata: item.metadata } : {}),
              ...(modifiers ? { modifiers } : {}),
            };
          }),
          idempotencyKey,
        };
        // Attach authenticated user contact details so orders show customer info
        if (user?.email) payload.contactEmail = user.email;
        if (user?.fullName) payload.contactName = user.fullName;
        if (user?.phone != null) payload.contactPhone = user.phone;
        if (fulfillmentMode !== "pickup") {
          if (selectedAddressId) {
            payload.deliveryAddressId = selectedAddressId;
          } else if (deliveryLocation) {
            payload.deliveryAddress = deliveryLocation.address;
            payload.deliveryLat = deliveryLocation.lat;
            payload.deliveryLng = deliveryLocation.lng;
            if (deliveryLocation.placeName) payload.deliveryPlaceName = deliveryLocation.placeName;
          }
        }
        if (deliveryNotes) payload.deliveryNotes = deliveryNotes;
        if (promoCode) payload.promoCode = promoCode;
        if (orderNotes) payload.orderNotes = orderNotes;
        if (requestUtensils) payload.requestUtensils = requestUtensils;
        if (scheduledTime) payload.scheduledAt = scheduledTime.date.toISOString();
        if (selectedMethod) payload.paymentMethod = selectedMethod;
        if (selectedMethod === "mpesa_manual") payload.mpesaCode = mpesaCode;
        result = await checkoutMutation.mutateAsync(payload);
      }

      setOrderId(result.orderId);
      setPaymentAmount(result.amount);
      setPaymentCurrency(result.currency || "KES");

      // Pay-on-collection options (cash / deferred M-Pesa at handover) place the
      // order pending and settle later — never open the pay-now modal for them.
      const isPayOnCollection = selectedOption != null && !selectedOption.payNow && selectedOption.method !== "wallet";

      if (result.paymentError && !isPayOnCollection) {
        // Treasury unavailable — order was created but the pay-now intent failed.
        // (Pay-on-collection orders don't need an intent, so ignore this.)
        setStep("review");
        setOrderError(result.paymentError);
        toast.error(`Order #${result.orderNumber || result.orderId.slice(0, 8)} created but payment gateway is unavailable. Please retry.`);
        const orderUrl = isGuestMode
          ? `${orgRoute(orgSlug, `/orders/guest/${result.orderId}`)}?session_id=${sessionId}`
          : orgRoute(orgSlug, `/orders/${result.orderId}`);
        router.push(orderUrl);
      } else if (selectedOption?.method === "wallet") {
        // Wallet chosen (authed + balance covers total) — pay the freshly created
        // order straight from the wallet instead of the treasury modal.
        // Prime the modal state first so the catch-fallback can recover gracefully.
        setPaymentIntentId(result.paymentIntentId || null);
        setInitiateUrl(result.initiateUrl || null);
        await handleWalletPayment(result.orderId);
      } else if (isPayOnCollection) {
        // Cash on collection / M-Pesa on collection — the order is placed pending
        // and paid at handover (cash) or via the guest order page / staff STK.
        // No modal: treat as success.
        clearCart();
        setStep("success");
      } else if (!result.paymentIntentId) {
        // Zero-amount or backend reports nothing to pay — no payment modal needed.
        clearCart();
        setStep("success");
      } else {
        // Pay now (Paystack / M-Pesa STK) — show the treasury payment modal.
        setPaymentIntentId(result.paymentIntentId);
        setInitiateUrl(result.initiateUrl);
        setStep("payment");
        setShowPaymentModal(true);
      }
    } catch (error: unknown) {
      setStep("review");
      const message =
        error instanceof Error ? error.message : "Failed to place order. Please try again.";
      setOrderError(message);
      toast.error(message);
    }
  }, [
    isGuestMode, guestEmail, guestPhone, guestName, deliveryLocation, deliveryPin, deliveryQuote,
    isDeliveryPricingUnavailable, fulfillmentMode, selectedAddressId, isOutsideDeliveryZone, scheduledTime,
    items, sessionId, deliveryNotes, promoCode, orderNotes, requestUtensils, isTicketOnly, noFulfillment,
    checkoutMutation, guestCheckoutMutation, orgSlug, router, clearCart,
    selectedMethod, selectedOption, handleWalletPayment, mpesaCode,
  ]);

  const handlePaymentConfirmed = useCallback(
    async (_result: PaymentResult) => {
      setStep("success");
      clearCart();
      setShowPaymentModal(false);
      const orderUrl = isGuestMode
        ? `${orgRoute(orgSlug, `/orders/guest/${orderId}`)}?session_id=${sessionId}`
        : orgRoute(orgSlug, `/orders/${orderId}`);
      router.push(orderUrl);
    },
    [clearCart, orgSlug, orderId, isGuestMode, sessionId, router],
  );

  const handlePaymentFailed = useCallback((error: string) => {
    toast.error(error || "Payment failed. You can try again.");
  }, []);

  const handlePaymentModalClose = useCallback(
    (open: boolean) => {
      setShowPaymentModal(open);
      if (!open && step === "payment") {
        if (orderId) {
          // Order was created — clear cart and redirect to order page
          // so the user can track or complete payment there.
          clearCart();
          const orderUrl = isGuestMode
            ? `${orgRoute(orgSlug, `/orders/guest/${orderId}`)}?session_id=${sessionId}`
            : orgRoute(orgSlug, `/orders/${orderId}`);
          router.push(orderUrl);
        } else {
          setStep("review");
        }
      }
    },
    [step, orderId, isGuestMode, orgSlug, sessionId, router, clearCart],
  );

  return {
    // Core
    orgSlug,
    router,
    step,
    items,
    user,
    status,

    // Fulfillment
    fulfillmentMode,
    isTicketOnly,
    isAppointmentOnly,
    noFulfillment,
    estimatedTime,
    scheduledTime,
    handleFulfillmentChange,
    handleScheduleSelect,

    // Address
    addresses,
    addressesLoading,
    selectedAddressId,
    selectedAddress,
    setSelectedAddressId,
    isOutsideDeliveryZone,
    deliveryQuote,
    deliveryPin,
    isDeliveryPricingUnavailable,

    // Fees
    feeBreakdown,
    feesLoading,
    cartSubtotal,
    grandTotal,

    // Booking deposit (tickets/appointments) — null/0 for non-booking carts
    bookingDepositPercent,
    hasBookingDeposit,
    depositAmount,
    balanceDue,
    /** Amount collected now: deposit for booking-deposit carts, else grandTotal. */
    amountDueNow,
    /** Ready-to-render deposit split for FeeBreakdownCard; null when no deposit. */
    depositBreakdown,

    // Promo
    promoCode,
    setPromoCode,
    discount,
    promoMessage,
    promoIsPending: applyPromo.isPending,
    handleApplyPromo,

    // Delivery notes
    deliveryNotes,
    setDeliveryNotes,

    // Order
    orderError,
    handlePlaceOrder,
    isPlacingOrder: step === "processing" || checkoutMutation.isPending || guestCheckoutMutation.isPending,

    // Guest
    checkoutMode,
    setCheckoutMode,
    isGuestMode,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    guestName,
    setGuestName,
    deliveryLocation,
    setDeliveryLocation,
    handleSignInForCheckout,
    hasDeliveryAddress,
    outlets,
    outletId,
    selectedPickupOutletId,
    setSelectedPickupOutletId,

    // Payment
    showPaymentModal,
    paymentIntentId,
    initiateUrl,
    paymentAmount,
    paymentCurrency,
    orderId,
    handlePaymentConfirmed,
    handlePaymentFailed,
    handlePaymentModalClose,

    // Payment method selection
    paymentOptions,
    selectedOptionId,
    setSelectedOptionId,
    selectedOption,
    /** Derived backend method key for the current selection (mpesa/paystack/cod/wallet). */
    selectedMethod,
    /** Manual M-Pesa confirmation code typed by the customer. */
    mpesaCode,
    setMpesaCode,

    // Wallet
    walletBalance,
    walletCurrency,
    walletPaymentPending,
    handleWalletPayment,
  };
}

/** The header's browsing location as a delivery point (null when unset or a 0,0 placeholder). */
function toDeliveryPoint(loc: { address: string; latitude: number; longitude: number; placeName?: string | undefined } | null): DeliveryPoint | null {
  if (!loc || (loc.latitude === 0 && loc.longitude === 0)) return null;
  return { lat: loc.latitude, lng: loc.longitude, address: loc.address, placeName: loc.placeName };
}
