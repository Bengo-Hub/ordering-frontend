# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Changed
- Overhauled landing, about, contact, menu, delivery, cafés, and loyalty pages with consistent light/dark theming and customer-first copy.
- Refined header/footer navigation, mobile drawer, and theme toggle for accessibility and responsiveness.
- Header now surfaces authenticated account shortcuts and logout, with profile page managing security, loyalty, and preferences.

### Removed
- Deprecated merchant placeholder pages in favour of streamlined public sitemap.
