import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface PaymentGateway {
  type: string;
  name: string;
  icon: string;
  enabled: boolean;
  reason?: string;
  /** One-line explanation shown under the option. */
  description?: string;
  /**
   * Manual M-Pesa ("mpesa_manual"): where to pay. Keys: till, paybill, account_reference, pochi.
   */
  instructions?: Record<string, string>;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  mask: string;
  provider: string;
  is_default: boolean;
}

export interface PaymentMethodsResponse {
  gateways: PaymentGateway[];
  wallet: { balance: number; currency: string } | null;
  saved_methods: SavedPaymentMethod[];
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getPaymentMethods(
  slug: string,
  fulfillmentType?: string,
  outletId?: string | null,
): Promise<PaymentMethodsResponse> {
  const params: Record<string, string> = {};
  if (fulfillmentType) params.fulfillment_type = fulfillmentType;
  // The outlet decides whether "pay to our M-Pesa and enter the code" is offered (its own Till/Paybill).
  if (outletId) params.outlet_id = outletId;
  const res = await api.get(`${slug}/payment-methods`, {
    params: Object.keys(params).length ? params : undefined,
  });
  return res.data;
}
