# Ordering Service Frontend - PWA Requirements

**Status**: ✅ **IMPLEMENTED** (December 2025)

## Overview

The Ordering Service Frontend is a Progressive Web Application (PWA) designed for customers to place **online delivery/shipping orders only**. It provides a native app-like experience on mobile devices with offline support, push notifications, and seamless installation.

**Service Boundaries**: This PWA focuses on customer-facing ordering features. Rider and staff/admin features redirect to logistics-service and cafe-website respectively.

---

## PWA Core Requirements

### 1. Installation Prompt

**Auto-prompt Strategy**:
- Trigger install prompt after user engagement (scrolls 25%, interacts with menu, adds item to cart)
- Show custom install banner for mobile users
- "Add to Home Screen" instructions for iOS (manual)

**Install Criteria**:
- User visits site at least 2 times
- User spends at least 30 seconds on site
- User interacts with ordering features (adds item to cart)

**Implementation**:
```typescript
// Listen for beforeinstallprompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

// Show custom install button
const handleInstall = async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    trackInstallEvent();
  }
  
  deferredPrompt = null;
  hideInstallBanner();
};
```

---

### 2. Web App Manifest

**Manifest Configuration** (Implemented in `public/manifest.json`):
```json
{
  "name": "Oders EatApp",
  "short_name": "EatApp",
  "description": "Order online with real-time tracking, secure payments, and flexible delivery options.",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#8B4513",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-menu.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/mobile-cart.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Order Again",
      "short_name": "Reorder",
      "description": "Quick access to your recent orders",
      "url": "/orders/recent",
      "icons": [{ "src": "/icons/reorder-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Track Order",
      "short_name": "Track",
      "description": "Track your active orders",
      "url": "/orders/track",
      "icons": [{ "src": "/icons/track-96x96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["food", "lifestyle", "shopping"],
  "prefer_related_applications": false
}
```

---

### 3. Service Worker & Caching

**Caching Strategies**:

1. **Static Assets** (Cache First):
   - Images, CSS, JS bundles
   - Cache forever, update on version change

2. **Menu Data** (Stale While Revalidate):
   - Menu items, categories
   - Cache for 1 hour
   - Serve stale data while fetching fresh

3. **Cart Data** (Network First):
   - Shopping cart
   - Try network first, fallback to cache
   - Store in IndexedDB for offline

4. **Order Status** (Network Only):
   - Real-time order tracking
   - No caching, always fetch fresh

**Service Worker Implementation**:
```typescript
// service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache menu data (stale-while-revalidate)
registerRoute(
  ({ url }) => url.pathname.includes('/api/v1/') && url.pathname.includes('/menu'),
  new StaleWhileRevalidate({
    cacheName: 'menu-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 3600, // 1 hour
      }),
    ],
  })
);

// Network-first for cart (with cache fallback)
registerRoute(
  ({ url }) => url.pathname.includes('/api/v1/') && url.pathname.includes('/cart'),
  new NetworkFirst({
    cacheName: 'cart-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 300, // 5 minutes
      }),
    ],
  })
);

// Network-only for order tracking
registerRoute(
  ({ url }) => url.pathname.includes('/api/v1/') && url.pathname.includes('/orders'),
  new NetworkOnly()
);
```

---

### 4. Offline Support

**Offline Features**:
- ✅ Browse cached menu items
- ✅ View cart (if cached)
- ✅ View order history (if cached)
- ✅ Display offline banner
- ⚠️ Cannot place new orders (requires network)
- ⚠️ Cannot track orders (requires real-time data)

**Offline Indicator**:
```typescript
// Show offline banner
window.addEventListener('online', () => {
  hideOfflineBanner();
  syncPendingActions();
});

window.addEventListener('offline', () => {
  showOfflineBanner('You are offline. Some features may be unavailable.');
});

// Queue actions for when online
const queueAction = (action: PendingAction) => {
  const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  pendingActions.push(action);
  localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
};

// Sync when back online
const syncPendingActions = async () => {
  const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  
  for (const action of pendingActions) {
    try {
      await executeAction(action);
      removePendingAction(action.id);
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
};
```

**IndexedDB for Offline Cart**:
```typescript
// Store cart in IndexedDB for offline access
import { openDB } from 'idb';

const db = await openDB('ordering-app', 1, {
  upgrade(db) {
    db.createObjectStore('cart', { keyPath: 'id' });
    db.createObjectStore('orders', { keyPath: 'id' });
  },
});

// Save cart offline
await db.put('cart', cartData);

// Retrieve cart offline
const cart = await db.get('cart', cartId);
```

---

### 5. Push Notifications

**Notification Types**:
- Order confirmation
- Order status updates (preparing, out for delivery, delivered)
- Promo codes and offers
- Loyalty points updates

**Push Notification Setup**:
```typescript
// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await subscribeToPushNotifications();
    }
  }
};

// Subscribe to push notifications
const subscribeToPushNotifications = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY,
  });
  
  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
};

// Handle push notifications in service worker
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
```

---

### 6. Mobile-First Responsive Design

**Breakpoints**:
- Mobile: < 640px (primary focus)
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Key Mobile Considerations**:
- Touch-friendly buttons (min 44x44px)
- Swipe gestures for navigation
- Bottom navigation bar (easy thumb reach)
- Fast loading (< 3 seconds on 3G)
- Optimized images (WebP, lazy loading)
- Simplified forms (minimal input, autocomplete)

**Performance Targets**:
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1

---

### 7. App Shell Architecture

**App Shell**:
- Header (logo, navigation)
- Bottom navigation (Home, Menu, Cart, Orders, Profile)
- Loading skeleton screens
- Error boundaries

**Implementation**:
```typescript
// App shell with skeleton loading
const AppShell = () => {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <Suspense fallback={<SkeletonLoader />}>
          <Routes />
        </Suspense>
      </main>
      <BottomNavigation />
    </div>
  );
};
```

---

## Testing Checklist

### Installation
- ✅ Install prompt appears on mobile Chrome
- ✅ Install prompt appears on mobile Safari (iOS 16.4+)
- ✅ App installs correctly
- ✅ App icon appears on home screen
- ✅ App opens in standalone mode

### Offline Functionality
- ✅ Menu items load from cache when offline
- ✅ Cart data persists when offline
- ✅ Offline banner displays correctly
- ✅ Queue actions for when online

### Push Notifications
- ✅ Notification permission request works
- ✅ Push notifications received
- ✅ Notification click opens correct page
- ✅ Notification badge updates

### Performance
- ✅ Meets Core Web Vitals targets
- ✅ Fast loading on 3G network
- ✅ Smooth animations (60fps)
- ✅ No layout shifts

---

## Browser Support

- ✅ Chrome/Edge (Android, Desktop) - Full support
- ✅ Safari (iOS 16.4+, Desktop) - Full support
- ✅ Firefox (Android, Desktop) - Full support
- ⚠️ Samsung Internet - Full support
- ⚠️ Opera - Full support

---

## References

- [Ordering Service Plan](../../ordering-backend/docs/plan.md)
- [PWA Best Practices](https://web.dev/pwa/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

