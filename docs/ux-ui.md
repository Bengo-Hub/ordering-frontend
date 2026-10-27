# Ordering Frontend – UI/UX Patterns

**Last Updated**: March 6, 2026

Design and interaction patterns for `ordering.codevertexafrica.com`. Mobile-first PWA targeting Kenyan customers ordering food delivery from the Busia outlet.

---

## Design System

### Stack

- **CSS**: Tailwind CSS with tokens in `tailwind.config.ts`
- **Component variants**: class-variance-authority (CVA)
- **Dark mode**: `next-themes` (light default, dark optional)
- **Icons**: Lucide React
- **Animations**: Tailwind `transition-*` utilities, Framer Motion for page transitions

### Typography (2026-10-27)

- Body: Figtree (`--font-body`, Tailwind `font-sans`). Headings, prices and big numbers: Bricolage Grotesque (`--font-display`, `font-display` class). Both through `next/font` in `app/layout.tsx`.
- Sentence case, no all-caps eyebrows. Prices use `tabular` (tabular figures).
- Body `text-sm` on mobile, `text-base` on desktop; interactive text never below `text-sm`.

### Color tokens (2026-10-27, the Codevertex palette of the website storefront scene)

Defined in `src/styles/globals.css` (`:root` and `.dark`) and mapped in `tailwind.config.ts`:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | plum `#9B2C6B` | `#D46AA4` | CTAs, links, focus ring (white text 7:1) |
| `background` | mist `#F8F0F4` | night `#1E0F1B` | Page |
| `card` | white | `#28161F` | Cards |
| `secondary` | `#FDE7F1` | | Pills, chips, quiet fills |
| `night`, `gold`, `mist`, `sale` | fixed | fixed | Dark hero panels, gold accents and CTAs on dark, page tone, discount badges |

- A tenant's colours replace `--brand-primary`/`--brand-emphasis`, and `--primary`/`--ring` too when white text on the colour reaches WCAG AA (`lib/brand-theme.ts`, applied by `BrandThemeSync` on `<html>`). A light tenant colour keeps plum for buttons. Before 2026-10-27 an inline style on `<body>` shadowed these, so tenant colours never showed.
- No gradients, glows, blurred backdrops, sparkle icons or decorative emoji (platform UI policy); photo overlays use a solid scrim (`bg-black/25` to `/45`).

### Storefront building blocks (`src/components/storefront/`)

`SectionHeader` + `Pill`, `StoreCard` (logo shown whole on white), `DealCard` (store badge, struck regular price, saving %, "Only N left" from real stock at 5 or fewer), `CountdownBoxes` / `CountdownText` (only from a promotion's real `end_at`). Images go through `ImageWithFallback` (edge-resized via `mediaLoaderProps`, use-case illustration when missing).

### Root marketplace (`/`, `components/marketplace/marketplace-landing.tsx`)

Header (Codevertex logo, store search, theme), hero, two tiles, "Shop by store" with chips for the store types present, deals, a three-point strip, footer with website links. Real data only: the hero counts down only to a live flash sale's end and otherwise invites browsing with store logos; tiles are live store banners, or plain facts (M-Pesa, tracking) when none exist; the deals section and its nav link appear only when a store runs a promotion. Location is asked only when the shopper taps "Use my location".

### Tenant home (`/[orgSlug]`)

`useOrderingConfig` picks the view from the tenant or outlet use case (`resolving` shows a neutral skeleton until the config loads, so no layout flashes): retail, pharmacy and wholesale get `RetailHomeView`; hospitality and quick service get `FoodHomeView` (filter bar now applies, rails hide while filtering); the rest get `ServicesHomeView`. Copy follows the same mapping (`getUseCaseCopy`). Deals match rules the way pos-api applies them: item rules by SKU, category rules by category name.

---

## Layout Architecture

### App Shell

```
┌──────────────────────────┐
│  Header (logo + outlet)  │
├──────────────────────────┤
│                          │
│      Page Content        │
│    (Suspense boundary    │
│     + skeleton loaders)  │
│                          │
├──────────────────────────┤
│  Bottom Nav (mobile)     │
│  Home | Menu | Cart |    │
│  Orders | Profile        │
└──────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav, full-width cards |
| Tablet | 640–1024px | Two-column grid, side cart panel |
| Desktop | > 1024px | Three-column, persistent cart sidebar |

Mobile is the primary design target — over 85% of Kenyan users access via mobile.

### Navigation

**Mobile**: Fixed bottom navigation bar with 5 items. Active item uses `primary` color. Cart icon shows item count badge.

**Desktop**: Top navigation bar with horizontal menu. Cart opens as a slide-over panel from the right.

---

## Page Patterns

### Menu Page (`/[orgSlug]/menu`)

- **Feed-first**: Land directly on menu items, no splash screen
- **Category tabs**: Horizontal scrollable tab bar pinned below header
- **Item cards**: Image (16:9 aspect ratio, lazy loaded), name, price, "Add" button
- **Search**: Expandable search input in header, debounced (300ms), filters items client-side first then falls back to API
- **Skeleton loading**: Show 6 placeholder cards while data loads (grey shimmer animation)
- **Empty state**: "No items available" with illustration when outlet has no menu items
- **Unavailable items**: Show with reduced opacity + "Unavailable" badge, non-interactive

### Item Detail (`/[orgSlug]/menu/[id]`)

- Full-bleed image at top (40vh on mobile)
- Variant selector: radio buttons for size, checkboxes for add-ons
- Quantity stepper: `-` / count / `+` with minimum 1
- Price updates live as variants change
- "Add to Cart" sticky bottom button (always visible on mobile)
- Dietary tags as colored badges below description

### Cart / Checkout (`/[orgSlug]/checkout`)

- **Cart review**: List of items with quantity steppers, swipe-to-delete on mobile
- **Subtotal bar**: Sticky at bottom showing total and "Proceed to Payment" CTA
- **Delivery address**: Saved addresses as selectable cards, "Add new" option with map pin selector
- **Payment method**: M-Pesa (primary), card (secondary), COD (if enabled)
- **Promo code**: Expandable input field, validates on blur
- **Order summary**: Itemized breakdown (subtotal, delivery fee, tax, discount, total)
- **Submit**: Single-tap with immediate disable. Show loading spinner. `idempotency_key` generated on render.

### Order Tracking (`/[orgSlug]/track/[orderId]`)

- **Status timeline**: Vertical stepper showing order progress (placed → confirmed → preparing → ready → out_for_delivery → delivered)
- **Active step**: Animated pulse indicator
- **ETA**: Displayed prominently when order is out for delivery
- **Map**: Embedded map showing rider location (when logistics data available). Falls back to static map with delivery address pin.
- **Auto-refresh**: Poll every 10 seconds via TanStack Query `refetchInterval`

### Auth (`/[orgSlug]/auth`)

- **Minimal friction**: Phone number + OTP as primary flow (Kenyan market)
- **Email fallback**: Email + password for users who prefer it
- **Social login**: Google OAuth button
- **Registration**: Inline on same page, toggled by "Create account" link
- **Loading state**: Disabled inputs + spinner during API call
- **Error display**: Inline field-level errors, toast for server errors

### Profile (`/[orgSlug]/profile`)

- Avatar, name, phone, email (read-only fields synced from auth-service marked with lock icon)
- Saved addresses list with edit/delete
- Notification preferences toggles (SMS, push, email)
- Loyalty points balance card
- "Log out" button at bottom

### Staff Dashboard (`/[orgSlug]/dashboard/staff`)

- Order list table with status filters (tabs: Pending, Preparing, Ready, Completed)
- Click-to-expand order detail with item list and customer info
- Status action buttons: "Confirm" → "Mark Preparing" → "Mark Ready"
- Real-time refresh (poll every 15 seconds)
- Basic metrics cards at top: orders today, revenue today, avg prep time

---

## Mobile-First Interaction Patterns

### Touch Targets

- Minimum size: 44x44px for all interactive elements
- Spacing between touch targets: minimum 8px
- Bottom navigation items: 48px height with icon + label

### Gestures

- Swipe left on cart item: reveal delete action
- Pull-to-refresh on menu page and order list
- Swipe between category tabs

### Loading States

Every data-dependent component has three states:

1. **Loading**: Skeleton with shimmer animation matching content shape
2. **Success**: Render data
3. **Error**: Error message with "Retry" button

Never show a blank white page during loading.

### Offline Behavior

- **Banner**: Amber bar at top: "You're offline. Some features unavailable."
- **Menu**: Serve from service worker cache (Stale-While-Revalidate)
- **Cart**: Persisted in IndexedDB, visible offline
- **Order placement**: Blocked with message "Internet required to place order"
- **Tracking**: Shows last known status with "Waiting for connection..." indicator

---

## PWA Install Prompt Strategy

### Trigger Conditions (MVP — Aggressive)

For the March 17 launch, prompt aggressively to maximize installs:

1. **First visit**: Show a dismissible bottom banner after 10 seconds on mobile
2. **Cart interaction**: Show install prompt when user adds first item to cart
3. **Post-order**: Show install prompt on order confirmation page
4. **Repeat visit**: Show again after 3 days if previously dismissed

### Banner Design

```
┌────────────────────────────────────┐
│ 📱 Install EatApp for faster       │
│    ordering and order tracking     │
│                                    │
│  [Install]           [Not now]     │
└────────────────────────────────────┘
```

- Fixed to bottom of viewport, above bottom nav
- Primary color background with white text
- Dismiss stores flag in `localStorage` with timestamp
- Track install rate via analytics events

### iOS Handling

iOS doesn't support `beforeinstallprompt`. Show a custom modal with step-by-step instructions:

1. Tap the Share button (↑)
2. Tap "Add to Home Screen"
3. Tap "Add"

Detect iOS via user agent and show this instead of the native prompt.

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| FCP | < 1.8s | Lighthouse mobile |
| LCP | < 2.5s | Lighthouse mobile |
| TTI | < 3.8s | Lighthouse mobile |
| CLS | < 0.1 | Lighthouse mobile |
| Bundle size (initial) | < 150KB gzipped | Build output |
| Image load | Lazy, WebP, < 100KB each | CDN config |

### Optimization Techniques

- Next.js App Router with Server Components for static shells
- Dynamic imports for heavy components (map, analytics)
- Image optimization via Next.js `<Image>` with CDN
- Font subsetting (only Latin + Swahili characters)
- Route-based code splitting (automatic with App Router)

---

## Accessibility (WCAG 2.1 AA)

- Color contrast ratio: minimum 4.5:1 for text, 3:1 for large text
- All images have `alt` text (menu item names as alt)
- Form inputs have associated `<label>` elements
- Focus indicators visible on all interactive elements
- Screen reader announcements for cart updates and order status changes
- `aria-live` regions for real-time status updates
- Keyboard navigation for all flows (Tab, Enter, Escape)
