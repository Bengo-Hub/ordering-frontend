import path from 'node:path';

// ordering-frontend/e2e/docs-capture/lib -> Codevertex root is 5 levels up (lib -> docs-capture ->
// e2e -> ordering-frontend -> ordering-service), then into the sibling shared-docs repo. Screenshots
// are written straight there, the same way pos-ui's and inventory-ui's docs-capture suites do.
export const ASSETS_DIR = path.resolve(
  __dirname,
  '../../../../../shared-docs/docs/user-guide/ordering/assets',
);

export function assetPath(...segments: string[]) {
  return path.join(ASSETS_DIR, ...segments);
}

const ORG = process.env.DOCS_ORG_SLUG || 'codevertex-demo';

// One order travels through five apps. Each origin can be overridden for a staging run.
export const APPS = {
  ordering: (process.env.ORDERING_URL || 'https://ordering.codevertexafrica.com').replace(/\/$/, ''),
  pos: (process.env.POS_URL || 'https://pos.codevertexafrica.com').replace(/\/$/, ''),
  logistics: (process.env.LOGISTICS_URL || 'https://logistics.codevertexafrica.com').replace(/\/$/, ''),
  rider: (process.env.RIDER_URL || 'https://riderapp.codevertexafrica.com').replace(/\/$/, ''),
} as const;

export function appUrl(app: keyof typeof APPS, route = '') {
  return `${APPS[app]}/${ORG}${route}`;
}

export const ORG_SLUG = ORG;

// codevertex-demo outlets that take online orders (auth-api cmd/seed/seed_tenants.go). Both
// delivery outlets share the Kisumu delivery areas (logistics-api cmd/seed-delivery-zones).
export const OUTLETS = {
  hotel: { id: 'b36c7ad2-927c-5ef0-a48b-18a09fa8ea1d', name: /Demo Grand Hotel/i },
  supermarket: { id: '5017479f-3bf1-532c-ae0e-3d0c9044eedc', name: /Demo City Supermarket/i },
  kiosk: { id: 'd64c0a43-6f1d-5450-8360-07e5e01cbb5b', name: /Demo Express Kiosk/i },
} as const;

// The designated demo customer (see e2e-testing-and-data-cleanup in the project memory): its email
// and phone reach a real inbox, so order messages can be checked as delivered.
export const TEST_CUSTOMER = {
  name: 'Test Customer',
  email: process.env.DOCS_CUSTOMER_EMAIL || 'tdbsoft0@gmail.com',
  phone: process.env.DOCS_CUSTOMER_PHONE || '0743793901',
};
