import { formatDeliveryAddress, toOrderLineView, type OrderLineView } from "@/lib/order-line";

import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  outletId: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryNotes?: string;
  paymentMethod: "mpesa" | "cod";
  promoCode?: string;
  scheduledAt?: string;
  /** Client-generated UUID for idempotent order creation (prevents duplicates on retry/double-click). */
  idempotencyKey?: string;
}

export interface Order {
  id: string;
  tenantId?: string;
  orderNumber: string;
  status: string;
  paymentIntentId?: string;
  /** Normalised lines (see normalizeOrder): name, variant label and modifiers resolved. */
  items: OrderLineView[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  /** How the order is fulfilled: "delivery" | "pickup" | "dine_in" | "scheduled". */
  fulfillmentType?: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  estimatedDeliveryAt?: string;
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
  /** 6-digit code the customer gives the rider at the door (delivery orders). */
  podCode?: string;
  /** Promised time of a scheduled order. */
  scheduledFor?: string;
  /** Order metadata: delivery_status (rider progress), payment_channel/mpesa_code, order notes. */
  metadata?: Record<string, unknown>;
  /** Set while an online-payment order waits for its money (see PaymentRetryInfo). */
  paymentRetry?: PaymentRetryInfo;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retry state of an unpaid online-payment order. The order stays open (stock held) until
 * `until`; after that it is cancelled. Staff cannot accept it before it is paid.
 */
export interface PaymentRetryInfo {
  open: boolean;
  until: string;
  attempts: number;
  retries: number;
  lastFailureReason?: string;
  lastAttemptAt?: string;
}

/** What the retry endpoint returns: the intent to pay and its treasury initiate URL. */
export interface PaymentRetryResult {
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
  initiateUrl?: string;
  amount: number;
  currency: string;
  retryUntil: string;
  /** True when the order's current intent was never completed and is offered again. */
  reused: boolean;
}

export interface PaymentIntent {
  id: string;
  status: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  checkoutRequestId?: string;
}

export interface MpesaPaymentRequest {
  orderId: string;
  phoneNumber: string;
}

// ─── Normalisation ───────────────────────────────────────────────────

/**
 * ordering-backend returns the domain Order: lines carry nameSnapshot/inventorySku and line
 * metadata, the discount is discountTotal and the saved delivery address is an object. Every
 * order read goes through here so the views get names, variants, modifiers, the discount and a
 * one-line address without reading backend spellings themselves.
 */
export function normalizeOrder(raw: unknown): Order {
  const o = (raw ?? {}) as Record<string, unknown>;
  const currency = typeof o.currency === "string" ? o.currency : "KES";
  const discount = Number(o.discount ?? o.discountTotal ?? 0) || 0;
  return {
    ...(o as unknown as Order),
    currency,
    discount,
    items: ((o.items as unknown[]) ?? []).map((it) => toOrderLineView(it, currency)),
    deliveryAddress: formatDeliveryAddress(o.deliveryAddress),
  };
}

// ─── API Functions ───────────────────────────────────────────────────

export async function createOrder(tenantSlug: string, data: CreateOrderRequest): Promise<Order> {
  const res = await api.post(`${tenantSlug}/orders`, data);
  return normalizeOrder(res.data);
}

export async function getOrder(tenantSlug: string, orderId: string): Promise<Order> {
  const res = await api.get(`${tenantSlug}/orders/${orderId}`);
  return normalizeOrder(res.data);
}

export async function getGuestOrder(tenantSlug: string, orderId: string, sessionId?: string): Promise<Order> {
  const params = sessionId ? { session_id: sessionId } : undefined;
  const res = await api.get(`${tenantSlug}/orders/guest/${orderId}`, { params });
  return normalizeOrder(res.data);
}

export async function listOrders(
  tenantSlug: string,
  params?: { status?: string; limit?: number; offset?: number },
): Promise<{ orders: Order[]; total: number }> {
  const res = await api.get(`${tenantSlug}/orders`, { params });
  return { orders: ((res.data.data ?? []) as unknown[]).map(normalizeOrder), total: res.data.total ?? 0 };
}

export async function cancelOrder(tenantSlug: string, orderId: string, reason: string): Promise<void> {
  await api.post(`${tenantSlug}/orders/${orderId}/cancel`, { reason });
}

export async function rateOrder(
  tenantSlug: string,
  orderId: string,
  rating: number,
  comment: string,
): Promise<Order> {
  const res = await api.post(`${tenantSlug}/orders/${orderId}/rate`, { rating, comment });
  return normalizeOrder(res.data);
}

export async function rateGuestOrder(
  tenantSlug: string,
  orderId: string,
  body: { rating: number; comment?: string; riderRating?: number; riderComment?: string },
): Promise<Order> {
  const res = await api.post(`${tenantSlug}/orders/guest/${orderId}/rate`, body);
  return normalizeOrder(res.data);
}

/**
 * Starts another payment for an unpaid online order while its retry window is open. Signed-in
 * customers use the owner route; the public order page uses the guest route (order id as the
 * capability, plus the guest session id when known).
 */
export async function retryOrderPayment(
  tenantSlug: string,
  orderId: string,
  opts?: { guest?: boolean | undefined; sessionId?: string | undefined },
): Promise<PaymentRetryResult> {
  const path = opts?.guest
    ? `${tenantSlug}/orders/guest/${orderId}/payment/retry`
    : `${tenantSlug}/orders/${orderId}/payment/retry`;
  const params = opts?.guest && opts.sessionId ? { session_id: opts.sessionId } : undefined;
  const res = await api.post(path, {}, { params });
  return res.data;
}

export async function initiateMpesaPayment(
  tenantSlug: string,
  data: MpesaPaymentRequest,
): Promise<PaymentIntent> {
  const res = await api.post(`${tenantSlug}/payments/mpesa/stk-push`, data);
  return res.data;
}

export async function getPaymentStatus(
  tenantSlug: string,
  paymentIntentId: string,
): Promise<PaymentIntent> {
  const res = await api.get(`${tenantSlug}/payments/intents/${paymentIntentId}`);
  return res.data;
}

export interface PromoValidateLine {
  sku: string;
  category?: string;
  quantity: number;
  unitPrice: number;
}

export async function applyPromoCode(
  tenantSlug: string,
  code: string,
  cafeId: string,
  items: PromoValidateLine[],
  subtotal: number,
): Promise<{ valid: boolean; discount: number; message: string }> {
  const res = await api.post(`${tenantSlug}/promo-codes/validate`, { code, cafeId, items, subtotal });
  // Normalize pos-api's ordering.PromoValidationResult shape ({valid, discountAmount,
  // errorMessage}) into this function's stable {valid, discount, message} contract — the two
  // never matched (a pre-existing bug: the caller read result.discount/.message, which were
  // always undefined, meaning a successfully-validated code never actually showed its amount).
  const data = res.data as { valid?: boolean; discountAmount?: number; errorMessage?: string };
  return {
    valid: !!data.valid,
    discount: Number(data.discountAmount) || 0,
    message: data.errorMessage || (data.valid ? 'Promo code applied' : 'Invalid promo code'),
  };
}

export async function getOrderTracking(
  tenantSlug: string,
  orderId: string,
): Promise<{
  status: string;
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
  eta?: string;
  updatedAt: string;
}> {
  // The backend route is /delivery/tracking and answers in snake_case (fulfilment.TrackingInfo).
  const res = await api.get(`${tenantSlug}/orders/${orderId}/delivery/tracking`);
  const d = res.data as {
    status: string;
    rider_name?: string;
    rider_phone?: string;
    rider_latitude?: number;
    rider_longitude?: number;
    eta_minutes?: number;
    last_updated_at: string;
  };
  return {
    status: d.status,
    updatedAt: d.last_updated_at,
    ...(d.rider_name ? { riderName: d.rider_name } : {}),
    ...(d.rider_phone ? { riderPhone: d.rider_phone } : {}),
    ...(d.rider_latitude != null ? { riderLat: d.rider_latitude } : {}),
    ...(d.rider_longitude != null ? { riderLng: d.rider_longitude } : {}),
    ...(d.eta_minutes != null ? { eta: `${d.eta_minutes} min` } : {}),
  };
}

export async function payOrderWithWallet(
  tenantSlug: string,
  orderId: string,
): Promise<{ success: boolean; payment_status: string; order_status: string }> {
  const res = await api.post(`${tenantSlug}/orders/${orderId}/pay/wallet`, {});
  return res.data;
}
