# Sprint 0 - Foundations & Design System

**Duration**: Week 1  
**Status**: ✅ Completed (Nov 2025)

---

## Overview

Sprint 0 establishes the foundational infrastructure, design system, and core identity management capabilities for the Cafe frontend application.

---

## Objectives

1. Set up Next.js project with App Router
2. Configure design system (shadcn/ui, Tailwind CSS)
3. Implement theming (light/dark mode)
4. Set up state management (Zustand, TanStack Query)
5. Create base layout components
6. Implement authentication flows
7. Set up internationalization (i18n)

---

## Technology Stack

### Core Framework

**Framework**: Next.js 15 (App Router)  
**Language**: TypeScript 5+  
**Package Manager**: pnpm

**Project Structure**:
```
cafe-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── [other-routes]/     # Other routes
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   ├── auth/               # Auth components
│   │   └── [feature]/          # Feature components
│   ├── lib/                    # Utilities and helpers
│   │   ├── api/                # API client (baseapi)
│   │   ├── auth/               # Auth utilities
│   │   └── utils/              # General utilities
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand stores
│   ├── providers/              # Context providers
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── docs/                       # Documentation
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

### UI & Styling

**Component Library**: shadcn/ui  
**CSS Framework**: Tailwind CSS  
**Icons**: Lucide React  
**Theme**: CSS variables for light/dark mode

**Theme Configuration**:
- CSS variables for colors (primary, secondary, accent, etc.)
- Dark mode support via `prefers-color-scheme` and manual toggle
- Brand colors: chocolate brown, orange, white

### State Management

**Server State**: TanStack Query (React Query)  
**Client State**: Zustand  
**Form State**: React Hook Form + Zod validation

**Store Structure**:
- `auth.ts` - Authentication state (user, token, session)
- `location.ts` - User location and geofence state
- `cart.ts` - Shopping cart state (future)
- `theme.ts` - Theme preferences

### Data Fetching

**API Client**: Axios via `baseapi` wrapper  
**Base URL**: Environment variable (`NEXT_PUBLIC_API_URL`)

**API Client Setup**:
- Axios instance with base URL
- Request interceptors for auth tokens
- Response interceptors for error handling
- Automatic token refresh

### Internationalization

**Library**: next-intl  
**Languages**: English (en), Swahili (sw)  
**Locale Detection**: Browser language + user preference

**i18n Structure**:
- Translation files in `messages/` directory
- Locale routing (`/en/...`, `/sw/...`)
- Date/number formatting per locale

### Maps & Geolocation

**Library**: Leaflet (web), React Leaflet  
**Geocoding**: Mapbox/Google Maps API  
**Geofence**: Custom Busia geofence validation

---

## User Stories

### US-F0.1: Project Setup
**As a** developer  
**I want** a well-structured Next.js project  
**So that** I can easily navigate and extend the codebase

**Acceptance Criteria**:
- [x] Next.js 15 project with App Router
- [x] TypeScript configuration
- [x] ESLint and Prettier setup
- [x] pnpm package manager
- [x] Git repository initialized

### US-F0.2: Design System
**As a** UI developer  
**I want** a consistent design system  
**So that** I can build cohesive user interfaces

**Acceptance Criteria**:
- [x] shadcn/ui components installed
- [x] Tailwind CSS configured
- [x] Theme tokens defined
- [x] Base components (Button, Card, Input, etc.)
- [x] Storybook setup (optional)

### US-F0.3: Theming
**As a** user  
**I want** to toggle between light and dark themes  
**So that** I can use the app in my preferred mode

**Acceptance Criteria**:
- [x] CSS variables for theme colors
- [x] Dark mode toggle component
- [x] Theme persistence (localStorage)
- [x] System preference detection

### US-F0.4: Authentication Flow
**As a** user  
**I want** to authenticate using OAuth2 (Google)  
**So that** I can access the cafe platform

**Acceptance Criteria**:
- [x] OAuth2 initiation flow
- [x] OAuth2 callback handler
- [x] JWT token storage
- [x] Session management
- [x] Protected route guards

### US-F0.5: Base Layout
**As a** user  
**I want** consistent navigation and layout  
**So that** I can navigate the application easily

**Acceptance Criteria**:
- [x] Site header with navigation
- [x] Site footer
- [x] Responsive layout
- [x] Mobile navigation menu

### US-F0.6: Internationalization
**As a** user  
**I want** content in my preferred language  
**So that** I can understand the application

**Acceptance Criteria**:
- [x] i18n setup with next-intl
- [x] English and Swahili translations
- [x] Language switcher component
- [x] Locale-aware routing

---

## Component Structure

### Layout Components

**SiteHeader** (`src/components/layout/site-header.tsx`):
- Navigation menu
- User menu (when authenticated)
- Theme toggle
- Language switcher

**SiteFooter** (`src/components/layout/site-footer.tsx`):
- Footer links
- Copyright information
- Social media links

**SiteShell** (`src/components/layout/site-shell.tsx`):
- Wrapper component for consistent layout
- Header and footer integration

### Auth Components

**RequireAuth** (`src/components/auth/require-auth.tsx`):
- Route guard for protected pages
- Redirects to login if not authenticated

**AuthorizationGate** (`src/components/auth/authorization-gate.tsx`):
- Permission-based component rendering
- Shows/hides content based on user permissions

### UI Components

**Button** (`src/components/ui/button.tsx`):
- Variants: default, destructive, outline, ghost, link
- Sizes: sm, md, lg
- Loading state support

**Card** (`src/components/ui/card.tsx`):
- Card container with header, content, footer

**Input** (`src/components/ui/input.tsx`):
- Text input with validation
- Error state display

---

## State Management

### Auth Store (Zustand)

**State**:
- `user` - Current user object
- `token` - JWT access token
- `refreshToken` - Refresh token
- `isAuthenticated` - Authentication status

**Actions**:
- `login` - Set user and tokens
- `logout` - Clear user and tokens
- `refreshToken` - Refresh access token
- `updateUser` - Update user data

### Location Store (Zustand)

**State**:
- `currentLocation` - User's current location
- `selectedAddress` - Selected delivery address
- `geofenceValid` - Geofence validation status

**Actions**:
- `setLocation` - Set current location
- `setAddress` - Set selected address
- `validateGeofence` - Validate against Busia geofence

---

## API Integration

### Base API Client

**Configuration**:
- Base URL from environment variable
- Request timeout: 30 seconds
- Automatic token injection from auth store
- Error handling and retry logic

### Auth API

**Endpoints**:
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/oauth/{provider}` - OAuth initiation
- `GET /api/v1/auth/oauth/{provider}/callback` - OAuth callback
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout

---

## Testing Strategy

### Unit Tests
- Component tests with React Testing Library
- Hook tests with @testing-library/react-hooks
- Utility function tests

### Integration Tests
- Authentication flow tests
- API integration tests
- Theme switching tests

### E2E Tests (Future)
- Playwright for PWA testing
- User journey tests

---

## Deliverables

- [x] Next.js project structure
- [x] Design system with shadcn/ui
- [x] Theming (light/dark mode)
- [x] Authentication flows
- [x] Base layout components
- [x] Internationalization setup
- [x] State management (Zustand, TanStack Query)
- [x] API client setup
- [x] Responsive design
- [x] PWA configuration

---

## Dependencies

- Next.js 15
- React 18+
- TypeScript 5+
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- React Hook Form + Zod
- next-intl
- Leaflet
- Axios

---

## Next Steps

- Sprint 1: Customer Web MVP
  - Marketing pages (landing, about, contact)
  - Menu browsing
  - Product detail view
  - Cart functionality
  - Customer signup flow

