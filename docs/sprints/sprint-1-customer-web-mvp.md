# Sprint 1 - Customer Web MVP

**Duration**: Weeks 2-3  
**Status**: 🚧 In Progress

---

## Overview

Sprint 1 focuses on building the customer-facing web application with menu browsing, product details, cart functionality, and customer signup flows.

---

## Objectives

1. Marketing pages (landing, about, contact, delivery, menu, loyalty, cafés)
2. Menu browsing with filters
3. Product detail view
4. Cart functionality
5. Customer signup flow
6. Location-aware features

---

## Technology Stack

### UI Components
- **Component Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### State Management
- **Server State**: TanStack Query
- **Client State**: Zustand
- **Cart State**: Zustand store

### Data Fetching
- **API Client**: Axios via baseapi
- **Query Hooks**: TanStack Query hooks

### Maps & Location
- **Maps**: Leaflet with React Leaflet
- **Geocoding**: Mapbox/Google Maps API
- **Geofence**: Custom Busia geofence validation

---

## User Stories

### US-F1.1: Marketing Pages
**As a** visitor  
**I want** to view marketing pages  
**So that** I can learn about the cafe

**Acceptance Criteria**:
- [x] Landing page with hero section
- [x] About page
- [x] Contact page with form
- [x] Delivery information page
- [x] Menu preview page
- [x] Loyalty program page
- [x] Cafés listing page

### US-F1.2: Menu Browsing
**As a** customer  
**I want** to browse the menu  
**So that** I can see available items

**Acceptance Criteria**:
- [ ] Menu listing with categories (not implemented - menu page exists but no API integration)
- [ ] Category filtering (not implemented)
- [ ] Search functionality (not implemented)
- [ ] Dietary tag filtering (not implemented)
- [ ] Availability filtering (not implemented)
- [x] Responsive design (marketing pages are responsive)

### US-F1.3: Product Details
**As a** customer  
**I want** to view product details  
**So that** I can make informed choices

**Acceptance Criteria**:
- [ ] Product detail page
- [ ] Variant selection
- [ ] Image gallery
- [ ] Dietary information
- [ ] Add to cart button
- [ ] Related items

### US-F1.4: Shopping Cart
**As a** customer  
**I want** to manage my cart  
**So that** I can prepare my order

**Acceptance Criteria**:
- [ ] Add items to cart
- [ ] Update quantities
- [ ] Remove items
- [ ] Cart drawer/sidebar
- [ ] Cart persistence
- [ ] Price calculation

### US-F1.5: Customer Signup
**As a** new user  
**I want** to create an account  
**So that** I can place orders

**Acceptance Criteria**:
- [x] Signup form (customer signup page exists at `/customers/signup`)
- [ ] **Auth-Service Integration**: Update signup to call auth-service `/api/v1/auth/register` with `tenant_slug`
- [ ] **Tenant Selection**: Add tenant selection UI (required for registration)
- [ ] Email validation (form exists but validation not fully implemented)
- [ ] Password requirements (form exists but validation not fully implemented)
- [x] OAuth signup options (Google OAuth integration exists - needs update to use auth-service)
- [ ] Email verification flow (not implemented - handled by auth-service)
- [ ] Welcome onboarding (not implemented)

### US-F1.6: Location Features
**As a** customer  
**I want** location-aware features  
**So that** I can see relevant content

**Acceptance Criteria**:
- [x] Location picker component (`src/components/location/customer-location-picker.tsx`)
- [x] Geofence validation (`src/lib/geofence.ts` - Busia geofence)
- [x] Address autocomplete (`src/components/location/location-search-input.tsx`)
- [x] Map integration (`src/components/location/location-map.tsx` with Leaflet)
- [x] Location persistence (Zustand store at `src/store/location.ts`)

---

## Component Structure

### Pages

**Marketing Pages** (`src/app/`):
- `page.tsx` - Landing page
- `about/page.tsx` - About page
- `contact/page.tsx` - Contact page
- `delivery/page.tsx` - Delivery information
- `menu/page.tsx` - Menu listing
- `loyalty/page.tsx` - Loyalty program
- `cafes/page.tsx` - Cafés listing

**Customer Pages** (`src/app/`):
- `menu/[id]/page.tsx` - Product detail
- `cart/page.tsx` - Cart page
- `customers/signup/page.tsx` - Customer signup

### Components

**Menu Components** (`src/components/menu/`):
- `menu-discovery.tsx` - Menu listing with filters
- `menu-item-card.tsx` - Menu item card
- `menu-category-filter.tsx` - Category filter
- `menu-search.tsx` - Search component
- `dietary-filter.tsx` - Dietary tag filter

**Cart Components** (`src/components/cart/`):
- `cart-drawer.tsx` - Cart sidebar
- `cart-item.tsx` - Cart item component
- `cart-summary.tsx` - Cart totals

**Location Components** (`src/components/location/`):
- `location-picker.tsx` - Location selection
- `location-map.tsx` - Map display
- `location-search-input.tsx` - Address search

---

## State Management

### Cart Store (Zustand)

**State**:
- `items` - Cart items array
- `subtotal` - Cart subtotal
- `discount` - Applied discount
- `deliveryFee` - Delivery fee
- `total` - Grand total

**Actions**:
- `addItem` - Add item to cart
- `updateQuantity` - Update item quantity
- `removeItem` - Remove item from cart
- `clearCart` - Clear all items
- `applyPromo` - Apply promo code
- `calculateTotals` - Recalculate totals

### Location Store (Zustand)

**State**:
- `currentLocation` - Current coordinates
- `selectedAddress` - Selected delivery address
- `geofenceValid` - Geofence validation status

**Actions**:
- `setLocation` - Set current location
- `setAddress` - Set delivery address
- `validateGeofence` - Validate against geofence

---

## API Integration

### Menu API

**Endpoints**:
- `GET /api/v1/public/{tenant_slug}/menu` - Public menu
- `GET /api/v1/{tenant}/catalog/items` - Menu items (authenticated)
- `GET /api/v1/{tenant}/catalog/items/{id}` - Product details

**TanStack Query Hooks**:
- `useMenuItems` - Fetch menu items
- `useMenuItem` - Fetch single item
- `useMenuCategories` - Fetch categories

### Cart API

**Endpoints**:
- `GET /api/v1/{tenant}/carts/current` - Get current cart
- `POST /api/v1/{tenant}/carts/items` - Add item
- `PUT /api/v1/{tenant}/carts/items/{id}` - Update item
- `DELETE /api/v1/{tenant}/carts/items/{id}` - Remove item

**TanStack Query Hooks**:
- `useCart` - Fetch cart
- `useAddToCart` - Add item mutation
- `useUpdateCartItem` - Update item mutation
- `useRemoveFromCart` - Remove item mutation

---

## Testing Strategy

### Unit Tests
- Component rendering tests
- Cart store logic tests
- Location store logic tests
- Form validation tests

### Integration Tests
- Menu browsing flow
- Add to cart flow
- Customer signup flow
- Location picker flow

---

## Deliverables

- [x] Marketing pages (landing, about, contact, delivery, menu, loyalty, cafés)
- [x] **Landing page revamp** - Modern, mobile-responsive, SEO-optimized (Dec 2025)
- [ ] Menu browsing with filters (menu page exists but no backend API integration)
- [ ] Product detail page (not implemented)
- [ ] Cart functionality (not implemented)
- [x] Customer signup flow (signup page exists at `/customers/signup`, OAuth integration)
- [x] Location-aware components (location picker, map, geofence validation, address autocomplete)
- [x] Responsive design (all marketing pages are responsive, mobile-first approach)
- [x] API integration (auth API integrated via baseapi, menu/catalog APIs pending backend)
- [x] Component structure consolidation (removed primitives duplication, standardized on `ui/`)
- [ ] Unit tests
- [ ] Integration tests

## Implementation Notes

**Completed:**
- ✅ All marketing pages (landing, about, contact, delivery, menu preview, loyalty, cafés)
- ✅ **Landing page completely revamped** (Dec 2025):
  - Modern, mobile-first responsive design optimized for phones, tablets, POS gadgets
  - SEO-optimized with comprehensive metadata (title, description, keywords, OpenGraph, Twitter cards)
  - Engaging content sections: hero, stats, value props, how it works, categories, features, testimonials, FAQs
  - Professional design with smooth transitions, gradients, and consistent spacing
  - Conversion-focused with multiple CTAs and clear value propositions
- ✅ Location components (picker, map, geofence, address autocomplete)
- ✅ Customer signup page with OAuth integration
- ✅ Auth integration with backend (login, OAuth, session management)
- ✅ Responsive design across all pages (mobile-first, breakpoints: xs, sm, md, lg, xl, 2xl)
- ✅ Base API client setup with axios
- ✅ Component structure cleaned up (removed `primitives/` duplication, all components use `@/components/ui/`)

**Not Implemented:**
- Menu browsing with backend API (menu page exists but no data fetching)
- Product detail pages
- Shopping cart functionality
- Menu filtering, search, dietary tags
- Email verification flow

---

## Dependencies

- Backend catalog API (Sprint 2)
- Backend cart API (Sprint 3)
- Backend auth API (Sprint 0)

---

## Next Steps

- Sprint 2: Checkout & Payments UX
  - Checkout form
  - Address management
  - Payment method selection
  - Order confirmation

