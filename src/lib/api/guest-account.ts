import { api } from "./base";

/**
 * A guest's optional account after an order (ordering-backend POST /{tenant}/guest/account).
 * The backend takes the name, email and phone from the order itself; only the order, the
 * checkout session and, in step 2, the password and the emailed code are sent. The password
 * goes to this endpoint only and is never stored.
 */

export type GuestAccountStatus = "code_sent" | "created" | "exists";

export interface GuestAccountResult {
  status: GuestAccountStatus;
  message?: string;
}

interface GuestAccountBody {
  order_id: string;
  session_id: string;
  password?: string;
  email_code?: string;
}

/** Step 1: email a sign-up code to the address on the order. */
export async function requestGuestAccountCode(
  tenantSlug: string,
  orderId: string,
  sessionId: string,
): Promise<GuestAccountResult> {
  const body: GuestAccountBody = { order_id: orderId, session_id: sessionId };
  const res = await api.post<GuestAccountResult>(`${tenantSlug}/guest/account`, body);
  return res.data;
}

/** Step 2: create the account with the password and the emailed code. */
export async function createGuestAccount(
  tenantSlug: string,
  orderId: string,
  sessionId: string,
  password: string,
  emailCode: string,
): Promise<GuestAccountResult> {
  const body: GuestAccountBody = { order_id: orderId, session_id: sessionId, password, email_code: emailCode };
  const res = await api.post<GuestAccountResult>(`${tenantSlug}/guest/account`, body);
  return res.data;
}

/** The form field a 400 points at ("password", "email_code", "email"), if any. */
export function guestAccountErrorField(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { field?: unknown } } })?.response?.data;
  return typeof data?.field === "string" ? data.field : undefined;
}
