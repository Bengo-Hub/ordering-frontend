# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **User menu drawer with hamburger navigation** (Dec 8, 2025):
  - `UserMenuDrawer` component (`src/components/layout/user-menu-drawer.tsx`) with Orders, Favorites, Wallet, Help, Promotions menu items
  - Account profile display with user avatar and email
  - Sign in/Sign out functionality integrated with auth store
  - Links to business account creation and rider signup
- **OpenStreetMap reverse geocoding** (Dec 8, 2025):
  - Geocoding utility (`src/lib/geocoding.ts`) using Nominatim API to convert coordinates to human-readable addresses
  - Location display now shows "Kinoo Road, Nairobi" instead of raw coordinates
  - Automatic reverse geocoding on geolocation consent
- **Dynamic category loading** (Dec 8, 2025):
  - Categories now fetched from API with fallback to mock data
  - Updated mock categories to reflect Urban Loft Cafe offerings (Cafe, Bakery, Breakfast, Lunch, Beverages, Desserts)
  - Added `fetchCategories()` function for API integration
- **Feed-first landing page** (Dec 8, 2025): Complete redesign aligned with PWA app-first UX principles:
  - Removed hero section with redundant search - navbar search is now primary
  - `OutletCard` component (`src/components/outlet/outlet-card.tsx`) for restaurant/outlet cards with image, rating, delivery time, distance, cuisine tags, and promotional badges
  - `CategoryCarousel` component (`src/components/category/category-carousel.tsx`) with horizontal scrolling, touch-friendly interactions, and scroll buttons for desktop  
  - Home page now shows available outlets immediately: Featured Outlets and All Outlets sections
  - Default outlets set to **Urban Loft Cafe Busia** and **Urban Loft Cafe Kiambu** as fallback data
  - Fully responsive grid layouts (1 column mobile, 2 columns tablet, 3-4 columns desktop)
  - Generic item-agnostic copy replacing food-specific language (aligned with ordering service scope)
- **Shopping cart system** (Dec 8, 2025):
  - Zustand-based global cart store (`src/store/cart.ts`) with add/remove/update operations
  - `CartDrawer` component (`src/components/cart/cart-drawer.tsx`) with item management, quantity controls, and pricing breakdown (subtotal, delivery, tax)
  - Cart integration in site header with item count badge
  - Menu discovery component updated with "Add to Cart" buttons
- **Landing page revamp** (Dec 2025): Modern, mobile-first responsive design with SEO optimization, engaging content sections (hero, stats, value props, how it works, categories, features, testimonials, FAQs), and conversion-focused CTAs.
- Reusable Leaflet map component with Busia geofence, location autocomplete, and Zustand stores for customer/rider default pins.
- Customer signup and menu flows with map-based delivery address selection and current-location detection.
- Rider onboarding defaults to current location with draggable map pin capture and coordinate submission.
- Configurable brand theming backed by CSS variables and default logo fallback.
- Marketing surface updates with riders and merchants landing flows, plus new rider/merchant/service pages.
- Rider onboarding form with KYC capture, Google OAuth entry point, and verification guidance.
- Merchant signup workflow with staff invitation scaffolding and dedicated staff portal sign-in.
- Role-aware authentication hub for riders, merchants, and staff.
- Role-gated dashboards for customer, rider, and staff roles with reusable authorization guards and metric cards.
- Full-stack user management module with RBAC-aware Zustand store, OAuth2 (Google) initiation/callback handlers, session persistence, and account/profile dashboards.
- Google-branded sign-in buttons with official iconography across customer and rider flows.
- Axios-based identity service wired to backend `/v1/auth`, `/v1/users`, and `/v1/customers/orders/summary` endpoints with refresh-token rotation and fallback mock data.
- Google OAuth callback handler with profile completion redirection for missing information.
- Frontend role standardization to `superuser` (aligning with backend).

### Changed

- **Site header navigation** (Dec 8, 2025): Hamburger menu now opens user account drawer instead of full-screen mobile menu, visible on all screen sizes (not just mobile)
- **Location display** (Dec 8, 2025): Updated geolocation handler to use reverse geocoding, showing place names instead of coordinates
- **Landing page copy** (Dec 8, 2025): Replaced food-specific terminology with generic item ordering language to support any product type (as per Urban Cafe system scope)
- **Home page structure** (Dec 8, 2025): Converted from server component to client component to support interactive features (category filtering), removed hero section search in favor of navbar search
- **Menu discovery** (Dec 8, 2025): Added cart functionality with "Add to Cart" buttons, item pricing, and outlet information
- **Site header** (Dec 8, 2025): Integrated cart store for real-time cart updates across all pages, removed local cart state in favor of global Zustand store
- **Component structure consolidation** (Dec 2025): Removed `components/primitives/` duplication, standardized all components to use `@/components/ui/` following shadcn/ui best practices. Updated all imports across the codebase.
- Overhauled landing, about, contact, menu, delivery, cafés, and loyalty pages with consistent light/dark theming and customer-first copy.
- Refined header/footer navigation, mobile drawer, and theme toggle for accessibility and responsiveness.
- Header now surfaces authenticated account shortcuts and logout, with profile page managing security, loyalty, and preferences.
- Authentication flows now rely exclusively on backend endpoints (email/password, OAuth, refresh, profile updates); mock fallbacks have been removed to keep environments aligned.

### Removed

- **HeroSection component** (Dec 8, 2025): Removed redundant hero section with search field from landing page; navbar search is now the primary search interface
- **Special Offers section** (Dec 8, 2025): Removed from landing page as discount property no longer exists on outlet models

- Deprecated merchant placeholder pages in favour of streamlined public sitemap.
- Legacy mock authentication utilities (`src/lib/auth/mock.ts`) and simulated API branches.
