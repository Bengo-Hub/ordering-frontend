# Ordering Frontend – Integration Guide

**Last Updated**: March 6, 2026

How the ordering frontend (`ordering.codevertexafrica.com`) connects to backend APIs and external services.

---

## Primary Backend: Ordering API

**Base URL**: `https://orderingapi.codevertexafrica.com`  
**Config**: `NEXT_PUBLIC_API_BASE_URL` environment variable  
**Client**: Axios instance in `src/lib/baseapi.ts`

### Axios Client Setup

The `baseapi` client is the single HTTP client for all backend calls. It provides:

- **Base URL**: From `NEXT_PUBLIC_API_BASE_URL`
- **Auth interceptor**: Attaches `Authorization: Bearer {token}` from auth store
- **Refresh interceptor**: On 401, attempts token refresh, queues concurrent requests
- **Request ID**: Generates `X-Request-ID` (UUIDv4) for every request
- **Tenant scoping**: All API calls include `{tenant}` in the URL path, read from the `[orgSlug]` route parameter

### TanStack Query Integration

All data fetching uses TanStack Query hooks wrapping `baseapi` calls:

| Hook | Location | Endpoint | Stale Time |
|------|----------|----------|------------|
| `useOutlets()` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/outlets` | 30 min |
| `useMenuCategories()` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/menu-categories` | 5 min |
| `useMenuItems()` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/menu-items` | 5 min |
| `useMenuItem(id)` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/menu-items/{id}` | 5 min |
| `useBrand()` | `src/hooks/use-brand.ts` | `GET /v1/{tenant}/config` | 30 min |
| `useOrders()` | `src/hooks/use-orders.ts` | `GET /v1/{tenant}/orders` | 30 sec |
| `useOrder(id)` | `src/hooks/use-orders.ts` | `GET /v1/{tenant}/orders/{id}` | 10 sec |
| `useCart()` | `src/hooks/use-cart.ts` | `GET /v1/{tenant}/carts/{id}` | 0 (always fresh) |

Mutations use `useMutation` with optimistic updates for cart operations and `onSuccess` invalidation for order operations.

---

## Authentication: Auth Service (SSO)

**Auth Service URL**: `https://sso.codevertexafrica.com`  
**Config**: `NEXT_PUBLIC_AUTH_SERVICE_URL`

### Auth Flow

The frontend does NOT call auth-service directly. All auth requests go through the ordering backend proxy:

```
Frontend → orderingapi.codevertexafrica.com/v1/{tenant}/auth/login
           → proxies to → sso.codevertexafrica.com/api/v1/auth/login
```

### Endpoints (via Backend Proxy)

| Action | Frontend Calls | Backend Proxies To |
|--------|---------------|-------------------|
| Login | `POST /v1/{tenant}/auth/login` | `POST /api/v1/auth/login` on SSO |
| Register | `POST /v1/{tenant}/auth/register` | `POST /api/v1/auth/register` on SSO |
| Refresh | `POST /v1/{tenant}/auth/refresh` | `POST /api/v1/auth/refresh` on SSO |
| Google OAuth | Redirect to SSO `/oauth/google` | SSO handles callback |

### Token Storage

| Token | Storage | Reason |
|-------|---------|--------|
| `access_token` | Zustand store (in-memory) | Short-lived, no persistence needed |
| `refresh_token` | `httpOnly` cookie or `localStorage` | Survives page refresh |
| `session_id` | Zustand store | For session tracking |

### Role-Based Routing

After auth, the frontend inspects JWT claims and routes accordingly:

```typescript
// src/lib/auth-redirect.ts
const roles = decodedToken.roles;

if (roles.includes('rider')) {
  window.location.href = `${LOGISTICS_UI_URL}/${tenantSlug}/dashboard`;
} else if (roles.includes('staff') || roles.includes('admin')) {
  window.location.href = `${CAFE_WEBSITE_URL}/${tenantSlug}/admin`;
} else {
  router.push(`/${tenantSlug}/menu`);
}
```

---

## Payments: Treasury Service (via Backend)

**Integration**: Indirect — frontend calls ordering backend, backend calls treasury-service.

**Payment workflow (invoice-first)**: Backend creates a payment intent via treasury-api with `payment_method: "pending"`, returns intent_id and details. Frontend opens the **shared treasury-ui pay page** (`/pay`) in `TreasuryPaymentModal` (`@bengo-hub/shared-ui-lib`). See [shared-docs/payment-workflow.md](../../../shared-docs/payment-workflow.md).

**Checkout payment options (2026-10-05)** (`hooks/use-checkout-state.ts`), built from `GET /payment-methods` (ordering-backend's aggregate of treasury's `/pay/{tenant}/gateways`):

| Option | Shown when the gateway list has | `paymentMethod` sent | Pay now |
|---|---|---|---|
| Pay now, Card (Paystack) | `paystack` | `paystack` | yes |
| Pay now, PayHero (M-Pesa, Airtel Money and more) | `payhero` | `payhero` | yes |
| Pay now, M-Pesa (STK) | `mpesa` (the outlet's own Daraja paybill or till) | `mpesa` | yes |
| Wallet | signed in, balance covers the amount | `wallet` | no |
| M-Pesa to our Till/Paybill (enter code) | `mpesa_manual` | `mpesa_manual` | no |
| Pay at the counter / on delivery | `cod` | `cod` | no |

For a pay-now option the modal gets `allowedMethods` set to the chosen gateway, so the pay page opens it directly (PayHero opens its own checkout with M-PESA, Airtel and the other rails). Since 2026-10-05 treasury reports PayHero as `payhero`, not `mpesa`; before this option a PayHero-only outlet had no pay-now M-Pesa at checkout. The guest order page's "Pay" opens the modal without `allowedMethods`, listing every gateway. Provider logos (wallet top-up page) come from shared-ui-lib (v0.1.96+).

### Payment not completed: retry window

When an online payment is declined, cancelled or times out the order is not cancelled. The order
API returns `paymentRetry` (`open`, `until`, `attempts`, `lastFailureReason`) while the order waits
for its money. Both order pages (signed-in `orders/[orderId]` and the public `orders/guest/[orderId]`)
render `components/orders/payment-retry-panel.tsx`: "Payment not completed" with the time left and
a "Retry payment" button. The button calls `useRetryOrderPayment` (owner route
`POST orders/{id}/payment/retry`, or the guest route `orders/guest/{id}/payment/retry` with the
session id when known), then opens the shared `TreasuryPaymentModal` with the returned intent and
initiate URL, so the customer can pick any gateway again. The email `?pay=1` link starts the retry
on the guest page. Once the window closes the backend cancels the order and releases the stock.

The staff dashboard shows these orders as "Awaiting payment (retry open until HH:MM)" with the
failed attempt count and never offers Accept for an unpaid online order. Time-left and label
helpers live in `lib/payment-retry.ts` (unit tested).

### Order creation and payment flow

The frontend currently sends `POST /v1/{tenant}/orders` with body `{ outletId, items, deliveryAddress, paymentMethod }`. The ordering-backend exposes `POST /checkout` with `{ cartId, deliveryAddressId, ... }` (cart-based). Ensure backend either supports a direct create-order-from-items endpoint matching the frontend contract or frontend is updated to use cart API (`POST /cart/items`, then `POST /checkout` with `cartId`). See e2e-gap-analysis.md.

### Payment Flow

```
1. Frontend: POST /v1/{tenant}/orders (with paymentMethod: "paystack", "payhero", "mpesa", "mpesa_manual", "wallet" or "cod")
2. Backend: Creates order → calls treasury POST /api/v1/{tenant}/payments/intents with payment_method: "pending" (invoice-only), returns intent_id + order_id
3. Frontend: Redirects to treasury-ui /pay with intent_id, amount, tenant, initiate_url, redirect_url, button_text
4. Pay page opens the chosen gateway (or lists them); its form POSTs to initiate_url (Paystack → authorization_url; M-Pesa → Daraja STK push with gateway "daraja"; PayHero → the chosen rail with gateway "payhero")
5. Frontend: For M-Pesa, polls GET /v1/{tenant}/orders/{id}; for Paystack, user returns to callback page then redirect_url
6. Treasury: Webhook updates intent → backend updates order payment_status: "paid"
7. Frontend: Poll or callback detects status → shows "Payment Confirmed"
```

### Payment Status Polling

```typescript
const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => baseapi.get(`/v1/${tenant}/orders/${orderId}`),
  refetchInterval: (query) => {
    const status = query.state.data?.payment_status;
    if (status === 'paid' || status === 'failed') return false;
    return 3000; // poll every 3s while pending
  },
});
```

### Timeout Handling

- After 2 minutes of polling with no resolution: show "Payment taking longer than expected"
- Offer "Retry Payment" and "Cancel Order" buttons
- Track payment timeout events for analytics

---

## Logistics: Live Tracking (via Backend + Direct)

**Logistics UI URL**: `https://logistics.codevertexafrica.com`  
**Config**: `NEXT_PUBLIC_LOGISTICS_UI_URL`

### Order Tracking (Centralized in Logistics Service)

All live delivery tracking — rider location, ETA, status timeline, map display — is **owned and rendered by the logistics-service**.

When a customer clicks "Track Order", the ordering-frontend redirects to:

```
https://logistics.codevertexafrica.com/track/{orderId}
```

The ordering-frontend does **not** render any tracking UI, maps, or rider location data. The order detail from backend includes only reference data:

```json
{
  "id": "order-uuid",
  "status": "out_for_delivery",
  "logistics_task_id": "task-uuid",
  "tracking_code": "CV-20260320-A3F8K2"
}
```

> **Note:** Delivery tracking data (`rider_name`, `rider_phone`, location, ETA) is fetched by the logistics-service from its own database at request time. The ordering-backend stores only `logistics_task_id` and `rider_id` references per [CROSS-SERVICE-DATA-OWNERSHIP.md](../../shared-docs/CROSS-SERVICE-DATA-OWNERSHIP.md).

### Rider Redirects

Users with `rider` role are redirected to the rider-app (`riderapp.codevertexafrica.com`) after auth. No rider features exist in the ordering frontend.

---

## Notifications: Push & In-App

**Config**: `NEXT_PUBLIC_VAPID_KEY` for Web Push

### Push Notification Registration

```
1. User grants notification permission (prompted after first order)
2. Frontend: Subscribe to push via service worker
3. Frontend: POST /v1/{tenant}/push/subscribe  (subscription object)
4. Backend: Stores subscription, forwards to notifications-service
```

### Notification Types Received

| Event | Push Title | Action |
|-------|-----------|--------|
| Order confirmed | "Order Confirmed!" | Open order tracking |
| Order preparing | "Your order is being prepared" | Open order tracking |
| Order out for delivery | "Your order is on the way!" | Open order tracking |
| Order delivered | "Order delivered!" | Open order detail |
| Promo available | "New offer available" | Open menu |

### In-App Notifications

Not implemented for MVP. Post-launch: notification bell in header with unread count and dropdown.

---

## External Service Redirects

| Service | Env Variable | URL | When Used |
|---------|-------------|-----|-----------|
| Logistics UI | `NEXT_PUBLIC_LOGISTICS_UI_URL` | `logistics.codevertexafrica.com` | Rider role redirect, rider onboarding |
| Cafe Website | `NEXT_PUBLIC_CAFE_WEBSITE_URL` | `theurbanloftcafe.com` | Staff/admin role redirect |
| Auth Service | `NEXT_PUBLIC_AUTH_SERVICE_URL` | `sso.codevertexafrica.com` | OAuth callbacks |

All redirects preserve `tenant_slug` in the URL and include `return_url` for navigation back.

---

## Environment Variables

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://orderingapi.codevertexafrica.com` | Yes | Ordering backend |
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | `https://sso.codevertexafrica.com` | Yes | OAuth redirects |
| `NEXT_PUBLIC_LOGISTICS_UI_URL` | `https://logistics.codevertexafrica.com` | Yes | Rider redirects |
| `NEXT_PUBLIC_CAFE_WEBSITE_URL` | `https://theurbanloftcafe.com` | Yes | Staff redirects |
| `NEXT_PUBLIC_VAPID_KEY` | `BEl62i...` | Yes | Web Push subscription |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ...` | No | Map display (tracking page) |
| `NEXT_PUBLIC_DEFAULT_TENANT` | `urban-loft` | No | Fallback tenant slug |

---

## Error Handling Strategy

### Global Error Boundary

Wraps the entire app. On unhandled error: shows "Something went wrong" with "Reload" button. Logs error to console (production: forward to error tracking service).

### API Error Handling

The `baseapi` interceptor transforms backend errors into a consistent shape:

```typescript
interface ApiError {
  code: string;        // e.g. "VALIDATION_ERROR"
  message: string;     // human-readable
  details?: Array<{ field: string; message: string }>;
  status: number;
}
```

Components use this to:

- Show field-level validation errors on forms
- Show toast notifications for server errors
- Redirect to auth on 401 after failed refresh
- Show "Service unavailable" banner on 503

### Offline Detection

Network status monitored via `navigator.onLine` and `online`/`offline` events. When offline:

- Show amber banner at top
- Disable order submission
- Serve cached menu data
- Queue cart mutations for sync on reconnect

---

## Data Flow Summary

```
┌─────────────┐     baseapi (Axios)      ┌──────────────────┐
│  Ordering    │ ───────────────────────► │  Ordering Backend │
│  Frontend    │ ◄─────────────────────── │  (Go / chi)       │
│  (Next.js)   │                          └──────┬───────────┘
│              │                                  │
│  TanStack    │                          ┌──────▼───────────┐
│  Query +     │                          │  Auth Service     │
│  Zustand     │                          │  (JWT / JWKS)     │
│              │                          ├──────────────────┤
│  Service     │                          │  Treasury         │
│  Worker      │                          │  (M-Pesa / Cards) │
│  (Workbox)   │                          ├──────────────────┤
└──────────────┘                          │  Logistics        │
                                          │  (Delivery tasks) │
                                          ├──────────────────┤
                                          │  Inventory        │
                                          │  (Stock checks)   │
                                          ├──────────────────┤
                                          │  Notifications    │
                                          │  (SMS / Push)     │
                                          └──────────────────┘
```

The frontend only talks to the ordering backend. The backend handles all cross-service communication.
