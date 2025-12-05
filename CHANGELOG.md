# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Changed

- **Component structure consolidation** (Dec 2025): Removed `components/primitives/` duplication, standardized all components to use `@/components/ui/` following shadcn/ui best practices. Updated all imports across the codebase.
- **Landing page completely revamped** (Dec 2025): Mobile-first responsive design optimized for all devices (phones, tablets, POS gadgets, laptops, dektops), comprehensive SEO metadata, engaging content with smooth animations, and professional design.
- Overhauled landing, about, contact, menu, delivery, cafés, and loyalty pages with consistent light/dark theming and customer-first copy.
- Refined header/footer navigation, mobile drawer, and theme toggle for accessibility and responsiveness.
- Header now surfaces authenticated account shortcuts and logout, with profile page managing security, loyalty, and preferences.
- Authentication flows now rely exclusively on backend endpoints (email/password, OAuth, refresh, profile updates); mock fallbacks have been removed to keep environments aligned.

### Removed

- Deprecated merchant placeholder pages in favour of streamlined public sitemap.
- Legacy mock authentication utilities (`src/lib/auth/mock.ts`) and simulated API branches.
