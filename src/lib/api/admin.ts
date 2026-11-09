import { orderDropoff, toOrderLineView } from "@/lib/order-line";
import { api } from "./base";
import type { PaymentRetryInfo } from "./orders";

// ─── Types ───────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;
  customerId?: string;
  // Resolved customer info (from metadata for guests, from user for auth)
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  outletId: string;
  items: AdminOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  instructions: string;
  deliveryAddress: string;
  channel: string;
  source?: string;
  metadata?: Record<string, unknown>;
  riderName?: string;
  riderPhone?: string;
  estimatedDeliveryAt?: string;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
  /** Online-payment order still waiting for its money; never accepted before it is paid. */
  paymentRetry?: PaymentRetryInfo;
}

export interface AdminOrderItem {
  id: string;
  inventorySku: string;
  nameSnapshot: string;
  /** Alias for nameSnapshot — used by UI components */
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  /** Variant and modifier labels from the line metadata (lib/order-line). */
  variantLabel?: string;
  modifiers?: string[];
}

export interface AdminOrderFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}

// ─── Admin Order API ────────────────────────────────────────────────

export async function listAdminOrders(
  slug: string,
  filters?: AdminOrderFilters,
  signal?: AbortSignal,
): Promise<{ orders: AdminOrder[]; total: number }> {
  // ordering-backend reads snake_case query keys (payment_status, date_from, date_to); sending the
  // camelCase field names silently dropped those filters.
  const { paymentStatus, dateFrom, dateTo, ...rest } = filters ?? {};
  const params = {
    ...rest,
    ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  };
  const res = await api.get(`${slug}/admin/orders`, { params, ...(signal ? { signal } : {}) });
  const raw = res.data;
  // Backend returns { data: [...], total, limit, page } — normalize to { orders, total }
  const orders: AdminOrder[] = (raw.data ?? raw.orders ?? []).map(normalizeOrder);
  return { orders, total: raw.total ?? orders.length };
}

/** Map backend Order (or AdminOrderSummary) JSON to AdminOrder. */
function normalizeOrder(o: Record<string, unknown>): AdminOrder {
  const meta = (o.metadata ?? {}) as Record<string, unknown>;
  const isGuest = !!meta.guest;

  // Resolve customer contact — top-level fields take priority (set by backend
  // for both auth and guest orders). Fall back to metadata for older responses.
  const customerName =
    ((o.customerName as string) || (isGuest ? (meta.contactName as string) : "")) ?? "";
  const customerEmail =
    ((o.customerEmail as string) || (isGuest ? (meta.contactEmail as string) : "")) ?? "";
  const customerPhone =
    ((o.customerPhone as string) || (isGuest ? (meta.contactPhone as string) : "")) ?? "";

  // The admin summary sends the drop-off as a string; a full order keeps it in instructions or a
  // saved address. Both go through the storefront's one rule (orderDropoff).
  const deliveryAddress =
    (typeof o.deliveryAddress === "string" && o.deliveryAddress) || orderDropoff(o)?.address || "";

  return {
    ...o,
    customerName,
    customerEmail,
    customerPhone,
    items: ((o.items as unknown[]) ?? []).map((item: unknown) => {
      const it = item as Record<string, unknown>;
      const line = toOrderLineView(it, (o.currency as string | undefined) ?? "KES");
      return {
        ...(line.variantLabel ? { variantLabel: line.variantLabel } : {}),
        ...(line.modifiers ? { modifiers: line.modifiers } : {}),
        id: (it.id ?? "") as string,
        inventorySku: (it.inventorySku ?? "") as string,
        nameSnapshot: (it.nameSnapshot ?? it.name ?? "") as string,
        name: (it.nameSnapshot ?? it.name ?? "") as string,
        quantity: (it.quantity ?? 0) as number,
        unitPrice: (it.unitPrice ?? 0) as number,
        totalPrice: (it.totalPrice ?? 0) as number,
        notes: (it.notes ?? "") as string,
      };
    }),
    discountTotal: (o.discountTotal ?? o.discount ?? 0) as number,
    instructions: (o.instructions ?? "") as string,
    deliveryAddress,
  } as AdminOrder;
}

export async function getAdminOrder(slug: string, orderId: string): Promise<AdminOrder> {
  const res = await api.get(`${slug}/admin/orders/${orderId}`);
  return normalizeOrder(res.data as Record<string, unknown>);
}

export async function updateOrderStatus(
  slug: string,
  orderId: string,
  status: string,
): Promise<AdminOrder> {
  const res = await api.put(`${slug}/admin/orders/${orderId}/status`, { status });
  return res.data;
}

export async function cancelAdminOrder(
  slug: string,
  orderId: string,
  reason: string,
): Promise<void> {
  await api.post(`${slug}/admin/orders/${orderId}/cancel`, { reason });
}

/** Confirm a manual M-Pesa payment (the code matched on the business's M-Pesa statement). */
export async function verifyOrderPayment(
  slug: string,
  orderId: string,
  reference?: string,
): Promise<void> {
  await api.post(`${slug}/admin/orders/${orderId}/payment/verify`, { reference });
}

/** Open orders per status (pending through out_for_delivery), counted by the server. */
export async function getAdminOrderCounts(slug: string): Promise<Record<string, number>> {
  const res = await api.get(`${slug}/admin/orders/counts`);
  return res.data ?? {};
}

export async function deleteAdminOrder(slug: string, orderId: string): Promise<void> {
  await api.delete(`${slug}/admin/orders/${orderId}`);
}

export interface DeliveryTaskAssignment {
  id: string;
  order_id: string;
  logistics_task_id: string;
  status: string;
}

export async function createDeliveryTask(
  slug: string,
  orderId: string,
): Promise<DeliveryTaskAssignment> {
  const res = await api.post(`${slug}/orders/${orderId}/delivery/create-task`, {});
  return res.data;
}

export async function getDeliveryTask(
  slug: string,
  orderId: string,
): Promise<DeliveryTaskAssignment | null> {
  try {
    const res = await api.get(`${slug}/orders/${orderId}/delivery/task`);
    return res.data;
  } catch {
    return null;
  }
}

// assignOrderRider assigns a rider via the canonical ordering-backend admin endpoint, which
// auto-creates the logistics delivery task if missing and assigns the rider. The order stays
// "ready" until the rider picks it up; the rider's pickup moves it to out_for_delivery.
export async function assignOrderRider(
  slug: string,
  orderId: string,
  riderId: string,
): Promise<AdminOrder> {
  const res = await api.put(`${slug}/admin/orders/${orderId}/rider`, { rider_id: riderId });
  return res.data;
}

// Menu items, categories, prices and availability are managed in inventory-ui; the staff
// dashboard links there instead of editing a copy.

// ─── Outlet Booking Deposit ─────────────────────────────────────────

export interface OutletBookingDeposit {
  outletId: string;
  bookingDepositPercent: number;
}

/**
 * Set an outlet's booking-deposit percentage (0-100; 0 = pay full). Requires auth
 * + orders.manage. NOTE: ordering-frontend has no per-outlet admin surface (outlets
 * are managed in the outlet-management app — pos-ui/inventory-ui/auth "My
 * Organization"). This client + its mutation hook exist so the control is ready to
 * wire wherever outlets are edited.
 */
export async function setOutletBookingDeposit(
  slug: string,
  outletId: string,
  percent: number,
): Promise<OutletBookingDeposit> {
  const res = await api.put(`${slug}/admin/outlets/${outletId}/booking-deposit`, { percent });
  return {
    outletId: (res.data?.outletId ?? res.data?.outlet_id ?? outletId) as string,
    bookingDepositPercent: (res.data?.bookingDepositPercent ??
      res.data?.booking_deposit_percent ??
      percent) as number,
  };
}
