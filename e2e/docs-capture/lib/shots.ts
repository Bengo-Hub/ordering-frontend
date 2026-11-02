import type { Locator, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Reused from pos-ui's docs-capture suite (itself the inventory-ui original) instead of a third copy.
import { screenshotWithCallouts, type Callout } from '../../../../../pos-service/pos-ui/e2e/docs-capture/lib/annotate';
import { assetPath } from './paths';
import { waitForReady } from './ready';

export type { Callout };

/**
 * Takes one guide screenshot: waits until the page has fully loaded (and the element the shot is
 * about is visible and enabled), scrolls that element into view, then captures the viewport with
 * numbered callouts. `name` is the file under docs/user-guide/ordering/assets/, e.g.
 * "customer/03-checkout.png".
 */
export async function shot(page: Page, name: string, opts: { focus?: Locator; callouts?: Callout[] } = {}) {
  // A fresh browser shows the storefront's cookie notice over the page; decline optional cookies.
  const reject = page.getByRole('button', { name: 'Reject optional' });
  if (await reject.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await reject.click();
    await page.waitForTimeout(300);
  }
  await waitForReady(page, opts.focus);
  // A toast ("Status updated", "Job taken") can sit over the very thing a callout points at;
  // wait for it to leave, and close any that stays.
  const toasts = page.locator('[data-sonner-toast]');
  if (await toasts.first().isVisible().catch(() => false)) {
    await toasts.first().waitFor({ state: 'hidden', timeout: 8_000 }).catch(async () => {
      await page.keyboard.press('Escape').catch(() => {});
      await page.locator('[data-sonner-toast] [data-close-button]').first().click({ timeout: 1_000 }).catch(() => {});
    });
    await page.waitForTimeout(300);
  }
  if (opts.focus) {
    await opts.focus.first().scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(400);
  }
  // A callout whose element is not on screen would make boundingBox() wait forever; leave it out
  // and say so, rather than hang the run or draw an arrow at nothing.
  const visible: Callout[] = [];
  for (const c of opts.callouts ?? []) {
    const shown = await c.locator.first().waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    // Also inside the viewport and not covered (a sticky header or a toast over it would put the
    // marker on the wrong thing).
    const onScreen =
      shown &&
      (await c.locator
        .first()
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) return false;
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
        })
        .catch(() => false));
    if (onScreen) visible.push(c);
    else console.warn(`[docs-capture] ${name}: callout ${c.number} not on screen, skipped`);
  }
  await screenshotWithCallouts(page, assetPath(name), visible);
}

/** A numbered callout on the first match of a locator. */
export function callout(locator: Locator, number: number): Callout {
  return { locator: locator.first(), number };
}

// The specs run in order (01 to 05) and hand each other the orders they placed. Kept outside
// Playwright's output folder, which is emptied at the start of every run.
const STATE_FILE = path.resolve(__dirname, '../../../test-results/docs-capture-journey.json');

export interface JourneyOrder {
  id: string;
  number: string;
  /** The customer's order page (guest link with the cart session). */
  url: string;
  /** Collection or delivery code shown to the customer. */
  code?: string;
  /** True for a delivery order (it rings under Delivery in the POS queue). */
  delivery?: boolean;
}

export function saveOrder(key: string, order: JourneyOrder) {
  const all = loadAll();
  all[key] = order;
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(all, null, 2));
}

export function loadOrder(key: string): JourneyOrder | undefined {
  return loadAll()[key];
}

function loadAll(): Record<string, JourneyOrder> {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}
