import { expect, type Locator, type Page } from '@playwright/test';

// pos-ui's own docs-capture login helpers, reused rather than copied (see lib/shots.ts).
import { expandSidebarGroup, pinLogin } from '../../../../../pos-service/pos-ui/e2e/docs-capture/lib/pin-login';
import { waitForReady } from './ready';

/**
 * Signs in to the POS at one outlet with the demo admin PIN and opens the online orders queue.
 * Every move after the PIN sign-in goes through the sidebar: a hard reload re-runs the SSO probe
 * before the PIN session is restored and leaves plan-gated pages (the KDS) blank.
 */
export async function openOnlineOrders(page: Page, outlet: RegExp) {
  await pinLogin(page, { outletName: outlet });
  await page.waitForTimeout(2_500);
  await sidebarTo(page, 'Online Orders', /online orders queue/i);
  await waitForReady(page, page.getByRole('heading', { name: 'Online Orders' }));
  await expect(page.getByTitle('Switch outlet')).toContainText(outlet, { timeout: 10_000 });
}

/** Opens a sidebar page (expanding its group first), never by URL. */
export async function sidebarTo(page: Page, group: string, link: RegExp | string) {
  await expandSidebarGroup(page, group);
  await page.getByRole('navigation').getByRole('link', { name: link }).first().click();
  await waitForReady(page);
}

/** Switches the queue to a tab (Click & Collect, Delivery, History). */
export async function queueTab(page: Page, name: RegExp) {
  await page.getByRole('tab', { name }).or(page.getByRole('button', { name })).first().click();
  await waitForReady(page);
}

/**
 * The queue card of one online order, found by its order number, waiting up to two minutes for
 * it to arrive (the order reaches the POS through ordering's events, and the queue refreshes on
 * its own).
 */
export async function orderCard(page: Page, orderNumber: string): Promise<Locator> {
  const card = page
    .locator('div.rounded-2xl, div.rounded-xl, article')
    .filter({ hasText: orderNumber })
    .filter({ has: page.getByRole('button') })
    .last();
  // The queue refreshes on its own; no reloads (see openOnlineOrders).
  await expect(card).toBeVisible({ timeout: 120_000 });
  return card;
}
