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
  await waitForReady(page, opts.focus);
  if (opts.focus) {
    await opts.focus.first().scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(400);
  }
  // A callout whose element is not on screen would make boundingBox() wait forever; leave it out
  // and say so, rather than hang the run or draw an arrow at nothing.
  const visible: Callout[] = [];
  for (const c of opts.callouts ?? []) {
    const ok = await c.locator.first().waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (ok) visible.push(c);
    else console.warn(`[docs-capture] ${name}: callout ${c.number} not visible, skipped`);
  }
  await screenshotWithCallouts(page, assetPath(name), visible);
}

/** A numbered callout on the first match of a locator. */
export function callout(locator: Locator, number: number): Callout {
  return { locator: locator.first(), number };
}

// The specs run in order (01 to 05) and hand each other the orders they placed.
const STATE_FILE = path.resolve(__dirname, '../../../test-results/docs-capture/journey.json');

export interface JourneyOrder {
  id: string;
  number: string;
  /** The customer's order page (guest link with the cart session). */
  url: string;
  /** Collection or delivery code shown to the customer. */
  code?: string;
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
