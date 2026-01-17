# Sprint 1.5 - Uber Eats-Style UI Revamp

**Duration**: Week 3-4
**Status**: In Progress
**Date**: January 2026

---

## Overview

This sprint focuses on revamping the ordering frontend UI to follow Uber Eats design patterns while tailoring it to our ordering microservice needs. The goal is to create a modern, intuitive food ordering experience with support for both delivery and pickup modes.

---

## Design Reference: Uber Eats Kenya

Based on analysis of Uber Eats Kenya (ubereats.com/ke), the following UI patterns will be implemented:

### Header Structure
1. **Left Section**: Hamburger menu + Brand logo
2. **Center Section**:
   - Delivery/Pickup toggle (pill-style buttons)
   - Location selector with pin icon + "Now" time indicator
   - Full-width search bar with dropdown results
3. **Right Section**: Cart icon with item count badge

### Category Navigation
- Horizontal scrollable carousel below header
- Each category has:
  - Emoji/icon (e.g., Pizza, Grocery, Chicken, Sushi)
  - Text label below icon
  - Circular or rounded containers
- Arrow buttons for desktop scroll navigation
- Categories include: Grocery, Pizza, Chicken, Sushi, Fast Food, Chinese, Indian, Wings, Burgers, Soup, Sandwich, Breakfast, Korean, Healthy, BBQ

### Filter Bar
Located below category carousel:
- Offers (tag icon)
- Delivery fee (dropdown)
- Under 30 min
- Highest rated
- Rating (dropdown with stars)
- Sort (dropdown)

### Promotional Banners
- Horizontal carousel with navigation arrows
- Cards contain:
  - Promotional image
  - Title (e.g., "Pizza Pleasures Await!")
  - Subtitle (e.g., "Classic Medium Everyday Offer!")
  - Price/offer badge (e.g., "Now at Ksh. 690!")
  - "Order Now" CTA button

### Restaurant/Outlet Cards
- **Image**: 16:10 aspect ratio with rounded corners
- **Badges**: "Top Offer", "Save on Select Items" overlays
- **Content below image**:
  - Restaurant name
  - Delivery fee badge (e.g., "KES100 Delivery Fee")
  - Rating + review count (e.g., "4.6★ (3,000+)")
  - Delivery time (e.g., "25 min")
- **Heart icon** for favorites (top-right of image)

### User Menu (Hamburger Drawer)
Left-side sliding drawer containing:
- User profile section (name + "Manage account" link)
- Menu items:
  - Orders (with icon)
  - Favorites
  - Wallet
  - Help
  - Get a ride (external link)
  - Promotions
  - Uber One (subscription upsell)
  - Invite friends (with reward text)
- Sign out button
- Footer links:
  - Create a business account
  - Add your restaurant
  - Sign up to deliver
- App download section (iPhone/Android buttons)

### Pickup Mode Differences
- Header shows "Map location" instead of delivery address
- "Pick up now" time indicator
- Restaurant list with map view on the side
- Cards show:
  - Distance (e.g., "0.6 km")
  - Pickup time (e.g., "28 min")
- Map with restaurant markers
- Filter options: Highest rated, Price, Sort
- Category filter chips (Pizza, Coffee and Tea, Japanese, Sushi, Burgers, Thai, Bubble Tea, Halal)

### Product Detail Page (from Quick Liquor example)
- Store header with:
  - Store name
  - Delivery time estimate
  - Rating + review count
  - Address
  - Delivery/Pickup toggle
- Left sidebar navigation:
  - Shop
  - Deals
  - Shop your list
  - Category sections (expandable)
- Product detail:
  - Large product image
  - Product name + price
  - Store info with delivery details
  - Add-ons/upsells section
  - Variant options (checkboxes)
  - Quantity selector
  - "Add to order" button with price
  - Product details/description
  - "Add note or edit replacement" option
- Similar items carousel
- "More to explore" section

---

## Implementation Plan

### Phase 1: Core Layout Components

#### 1.1 Header Revamp (`site-header.tsx`)
- [ ] Add Delivery/Pickup toggle (pill-style)
- [ ] Redesign location selector
- [ ] Improve search bar with full-width style
- [ ] Update cart icon with badge
- [ ] Mobile-responsive hamburger menu

#### 1.2 User Menu Drawer (`user-menu-drawer.tsx`)
- [ ] Match Uber Eats drawer structure
- [ ] Add profile section with avatar
- [ ] Add all menu items with icons
- [ ] Add footer links section
- [ ] Add app download section

#### 1.3 Category Carousel (`category-carousel.tsx`)
- [ ] Redesign with emoji icons
- [ ] Add more categories (Pizza, Grocery, Chicken, Sushi, etc.)
- [ ] Improve scroll navigation
- [ ] Active state styling

### Phase 2: Feed/Landing Page

#### 2.1 Filter Bar (new component)
- [ ] Create `FilterBar` component
- [ ] Implement filter dropdowns
- [ ] Add responsive design

#### 2.2 Promotional Banners (new component)
- [ ] Create `PromoBannerCarousel` component
- [ ] Add navigation arrows
- [ ] Support multiple banner types

#### 2.3 Outlet Cards (`outlet-card.tsx`)
- [ ] Redesign to match Uber Eats style
- [ ] Add offer badges
- [ ] Add favorite heart icon
- [ ] Update layout and typography

#### 2.4 Landing Page (`page.tsx`)
- [ ] Reorganize sections
- [ ] Add "Featured on [Brand]" section
- [ ] Add "Sponsored" section
- [ ] Improve responsive layout

### Phase 3: Pickup Mode

#### 3.1 Pickup Feed Layout
- [ ] Create split view (list + map)
- [ ] Show distance instead of delivery fee
- [ ] Update location selector text

#### 3.2 Map Integration
- [ ] Add outlet markers to map
- [ ] Implement map interactions
- [ ] Show outlet info on marker click

### Phase 4: Search & Discovery

#### 4.1 Search Dropdown
- [ ] Tabbed search results (All, Restaurants, Grocery, Alcohol)
- [ ] Category quick links
- [ ] Recent searches
- [ ] Popular items

---

## Component Architecture

```
src/components/
├── layout/
│   ├── site-header.tsx        # Revamped header
│   ├── user-menu-drawer.tsx   # Revamped drawer
│   ├── filter-bar.tsx         # NEW: Filter bar
│   └── dining-mode-toggle.tsx # NEW: Delivery/Pickup toggle
├── category/
│   └── category-carousel.tsx  # Revamped categories
├── outlet/
│   ├── outlet-card.tsx        # Revamped cards
│   ├── outlet-grid.tsx        # Grid layout
│   └── outlet-list.tsx        # List layout for pickup
├── promo/
│   ├── promo-banner.tsx       # NEW: Single banner
│   └── promo-carousel.tsx     # NEW: Banner carousel
├── search/
│   ├── search-bar.tsx         # NEW: Search input
│   └── search-dropdown.tsx    # NEW: Search results
└── pickup/
    ├── pickup-map.tsx         # NEW: Map view
    └── pickup-list.tsx        # NEW: Outlet list
```

---

## Data Models

### Category
```typescript
interface Category {
  id: string;
  name: string;
  emoji: string;        // e.g., "🍕"
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}
```

### Outlet (Restaurant/Store)
```typescript
interface Outlet {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;     // e.g., "25-35"
  deliveryFee: string;      // e.g., "KES100"
  distance?: string;        // For pickup mode
  cuisines: string[];
  isPromoted: boolean;
  offerBadge?: string;      // e.g., "Top Offer", "Save on Select Items"
  isFavorite: boolean;
}
```

### PromoBanner
```typescript
interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  priceBadge?: string;
  backgroundColor?: string;
}
```

### DiningMode
```typescript
type DiningMode = 'delivery' | 'pickup';

interface DiningModeState {
  mode: DiningMode;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  scheduledTime?: Date;     // null = "Now"
}
```

---

## API Integration

### Endpoints Used
- `GET /api/v1/menu/categories` - Fetch categories
- `GET /api/v1/menu/items` - Fetch menu items
- `GET /api/v1/outlets` - Fetch outlets/restaurants (planned)
- `GET /api/v1/promos/banners` - Fetch promotional banners (planned)

### Query Parameters
- `diningMode`: 'delivery' | 'pickup'
- `latitude`, `longitude`: User location
- `categoryId`: Filter by category
- `sort`: 'rating' | 'delivery_time' | 'delivery_fee' | 'distance'
- `filters`: Array of filter IDs (offers, under_30_min, highest_rated)

---

## Responsive Breakpoints

Following Uber Eats responsive design:
- **Mobile**: < 640px (single column, full-width cards)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: 1024px - 1280px (3 columns)
- **Large Desktop**: > 1280px (4 columns)

---

## Color Palette

Maintaining existing brand colors while adding Uber Eats-inspired accents:
- **Primary**: Brand color from config
- **Offers Badge**: Green (#00A36C)
- **Rating Star**: Yellow (#FFD700)
- **Delivery Badge**: Light gray background
- **Save Badge**: Red (#E60000)

---

## Dependencies

### Existing
- Next.js 15 (App Router)
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- Zustand (state management)
- TanStack Query

### New Dependencies (if needed)
- `embla-carousel-react` - For smooth carousels
- `react-use-measure` - For responsive measurements

---

## Testing Strategy

### Visual Testing
- Storybook stories for all new components
- Percy visual regression testing

### Functional Testing
- Vitest unit tests for components
- E2E tests for critical user flows

### Accessibility Testing
- WCAG 2.1 AA compliance
- Screen reader testing
- Keyboard navigation

---

## Success Metrics

1. **Visual Parity**: UI closely matches Uber Eats design patterns
2. **Performance**: Lighthouse score > 90
3. **Responsiveness**: Works well on all screen sizes
4. **Accessibility**: WCAG 2.1 AA compliant
5. **User Experience**: Intuitive navigation, fast interactions

---

## References

- Uber Eats Kenya: https://www.ubereats.com/ke/feed
- Design screenshots: Attached in task
- Backend API: [ordering-backend/docs/api-contracts.md](../../ordering-backend/docs/api-contracts.md)
- Service Boundaries: [SERVICE-BOUNDARIES.md](../SERVICE-BOUNDARIES.md)
