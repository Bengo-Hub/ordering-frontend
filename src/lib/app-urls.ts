// Sibling app URLs, overridable per environment. One place so links never drift. Each app owns
// its data: ordering links to it rather than keeping a copy of its screens.
const appUrl = (env: string | undefined, fallback: string) => (env ?? fallback).replace(/\/+$/, "");

/** Riders, delivery areas, dispatch (logistics-ui). */
export const LOGISTICS_UI_URL = appUrl(process.env.NEXT_PUBLIC_LOGISTICS_UI_URL, "https://logistics.codevertexafrica.com");
/** Items, menu, recipes, prices and stock (inventory-ui). */
export const INVENTORY_UI_URL = appUrl(process.env.NEXT_PUBLIC_INVENTORY_UI_URL, "https://inventory.codevertexafrica.com");
/** Payment gateways, refunds and the books (treasury-ui). */
export const TREASURY_UI_URL = appUrl(process.env.NEXT_PUBLIC_TREASURY_UI_URL, "https://books.codevertexafrica.com");
/** Email, SMS and WhatsApp providers, templates and sender branding (notifications-ui). */
export const NOTIFICATIONS_UI_URL = appUrl(process.env.NEXT_PUBLIC_NOTIFICATIONS_UI_URL, "https://notifications.codevertexafrica.com");
/** Plans, add-ons and billing (subscriptions-ui). */
export const SUBSCRIPTIONS_UI_URL = appUrl(process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL, "https://pricing.codevertexafrica.com");
/** The online orders queue and KDS (pos-ui). */
export const POS_UI_URL = appUrl(process.env.NEXT_PUBLIC_POS_UI_URL, "https://pos.codevertexafrica.com");
