# Sprint 2 - Checkout & Payments UX

**Duration**: Weeks 4-5  
**Status**: ⏳ Not Started

---

## Overview

Sprint 2 focuses on building the checkout flow with address management, payment method selection, and order confirmation.

---

## Objectives

1. Checkout form implementation
2. Address management
3. Promo code and loyalty handling
4. Payment orchestration UI
5. Order confirmation
6. Payment status tracking

---

## Technology Stack

### Forms
- **Form Library**: React Hook Form
- **Validation**: Zod schemas
- **UI**: shadcn/ui form components

### Payment Integration
- **Treasury API**: Payment intent creation
- **M-Pesa**: STK Push integration (via treasury)
- **Payment Methods**: Tokenized payment methods

### State Management
- **Checkout State**: Zustand store
- **Payment State**: TanStack Query mutations

---

## User Stories

### US-F2.1: Checkout Form
**As a** customer  
**I want** to complete checkout  
**So that** I can place my order

**Acceptance Criteria**:
- [ ] Checkout page/form
- [ ] Delivery address selection
- [ ] Payment method selection
- [ ] Order summary display
- [ ] Form validation
- [ ] Error handling

### US-F2.2: Address Management
**As a** customer  
**I want** to manage my addresses  
**So that** I can save delivery locations

**Acceptance Criteria**:
- [ ] Address list display
- [ ] Add new address
- [ ] Edit address
- [ ] Delete address
- [ ] Set default address
- [ ] Address validation

### US-F2.3: Promo Codes
**As a** customer  
**I want** to apply promo codes  
**So that** I can get discounts

**Acceptance Criteria**:
- [ ] Promo code input
- [ ] Code validation
- [ ] Discount display
- [ ] Error messages
- [ ] Code removal

### US-F2.4: Loyalty Points
**As a** customer  
**I want** to redeem loyalty points  
**So that** I can get discounts

**Acceptance Criteria**:
- [ ] Points balance display
- [ ] Points redemption input
- [ ] Discount calculation
- [ ] Points transaction preview

### US-F2.5: Payment Processing
**As a** customer  
**I want** to pay for my order  
**So that** I can complete the purchase

**Acceptance Criteria**:
- [ ] Payment method selection
- [ ] M-Pesa STK Push initiation
- [ ] Payment status tracking
- [ ] Payment confirmation
- [ ] Error handling

### US-F2.6: Order Confirmation
**As a** customer  
**I want** to see order confirmation  
**So that** I know my order was placed

**Acceptance Criteria**:
- [ ] Order confirmation page
- [ ] Order details display
- [ ] Order number
- [ ] Estimated delivery time
- [ ] Track order button

---

## Component Structure

### Checkout Components

**Checkout Page** (`src/app/checkout/page.tsx`):
- Multi-step checkout form
- Address selection step
- Payment method step
- Review and confirm step

**Address Components** (`src/components/address/`):
- `address-list.tsx` - List of saved addresses
- `address-form.tsx` - Add/edit address form
- `address-selector.tsx` - Address selection component

**Payment Components** (`src/components/payment/`):
- `payment-method-selector.tsx` - Payment method selection
- `mpesa-stk-push.tsx` - M-Pesa STK Push component
- `payment-status.tsx` - Payment status display

**Order Components** (`src/components/order/`):
- `order-summary.tsx` - Order summary display
- `order-confirmation.tsx` - Order confirmation page

---

## State Management

### Checkout Store (Zustand)

**State**:
- `step` - Current checkout step
- `deliveryAddress` - Selected delivery address
- `paymentMethod` - Selected payment method
- `promoCode` - Applied promo code
- `loyaltyPointsRedeemed` - Redeemed points
- `order` - Created order object

**Actions**:
- `setStep` - Navigate between steps
- `setAddress` - Set delivery address
- `setPaymentMethod` - Set payment method
- `applyPromoCode` - Apply promo code
- `redeemPoints` - Redeem loyalty points
- `setOrder` - Set created order

---

## API Integration

### Checkout API

**Endpoints**:
- `POST /api/v1/{tenant}/checkout` - Initiate checkout
- `POST /api/v1/{tenant}/checkout/validate` - Validate checkout

**TanStack Query Hooks**:
- `useCheckout` - Checkout mutation
- `useValidateCheckout` - Validation query

### Address API

**Endpoints**:
- `GET /api/v1/{tenant}/addresses` - List addresses
- `POST /api/v1/{tenant}/addresses` - Create address
- `PUT /api/v1/{tenant}/addresses/{id}` - Update address
- `DELETE /api/v1/{tenant}/addresses/{id}` - Delete address

**TanStack Query Hooks**:
- `useAddresses` - Fetch addresses
- `useCreateAddress` - Create address mutation
- `useUpdateAddress` - Update address mutation
- `useDeleteAddress` - Delete address mutation

### Payment API

**Endpoints**:
- `POST /api/v1/{tenant}/payments/intents` - Create payment intent
- `GET /api/v1/{tenant}/payments/intents/{id}` - Get payment status

**TanStack Query Hooks**:
- `useCreatePaymentIntent` - Create payment intent mutation
- `usePaymentStatus` - Payment status query

### Promo Code API

**Endpoints**:
- `POST /api/v1/{tenant}/promo-codes/validate` - Validate promo code

**TanStack Query Hooks**:
- `useValidatePromoCode` - Validate promo code mutation

---

## Testing Strategy

### Unit Tests
- Checkout form validation tests
- Address form tests
- Payment component tests
- Promo code validation tests

### Integration Tests
- End-to-end checkout flow
- Address management flow
- Payment processing flow
- Order confirmation flow

---

## Deliverables

- [ ] Checkout form implementation
- [ ] Address management
- [ ] Promo code integration
- [ ] Loyalty points redemption
- [ ] Payment orchestration UI
- [ ] M-Pesa STK Push integration
- [ ] Order confirmation page
- [ ] Payment status tracking
- [ ] Error handling
- [ ] Unit tests
- [ ] Integration tests

---

## Dependencies

- Backend checkout API (Sprint 3)
- Backend payment API (Sprint 4)
- Treasury app for payment processing

---

## Critical Gaps Identified (January 2026 Audit)

### HIGH PRIORITY

**1. Auth-Service SSO Integration** (Status: ⚠️ Not Implemented)
- Current auth flows call ordering-backend directly
- Need to migrate to auth-service SSO for production

**Migration Steps**:
- [ ] Replace `beginGoogleOAuth` to redirect to auth-service `/oauth/authorize`
- [ ] Implement PKCE flow for SPA security
- [ ] Add tenant selection UI before login (optional, can default to `codevertex`)
- [ ] Handle auth-service response format: `{access_token, refresh_token, session_id, tenant, user}`
- [ ] Extract `tenant_id` from JWT claims for API calls
- [ ] Update baseapi to use auth-service token format

**2. Shared Types Extraction** (Status: ⚠️ Planned, Not Implemented)
- Menu types hard-coded locally
- Create `packages/shared` workspace with common types
- See `SHARED-TYPES-EXTRACTION_PLAN.md` for detailed plan

**3. Testing Coverage** (Status: ⚠️ Minimal)
- Unit tests not comprehensive
- MSW (Mock Service Workers) not integrated
- Playwright E2E tests not started
- Target: 80% statements/branches, 95% critical flows

### MEDIUM PRIORITY

**4. Multi-Tenant/Multi-Outlet Support**
- [ ] Implement outlet selector UI
- [ ] Add tenant-aware error messages
- [ ] Implement per-tenant branding via `look_and_feel` settings

**5. Observability & Monitoring**
- [ ] Configure structured logging (`@/lib/logger`)
- [ ] Set up Web Vitals collection
- [ ] Integrate Sentry/Highlight for error tracking
- [ ] Add analytics instrumentation

---

## Next Steps

- Sprint 3: Real-Time Tracking & Notifications
  - Live order status timeline
  - WebSocket integration
  - Notification preferences
  - Service worker push support

