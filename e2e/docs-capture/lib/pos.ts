import { expect, type Locator, type Page } from '@playwright/test';

// pos-ui's own docs-capture login helpers, reused rather than copied (see lib/shots.ts).
import { pinLogin } from '../../../../../pos-service/pos-ui/e2e/docs-capture/lib/pin-login';
import { appUrl } from './paths';
import { waitForReady } from './ready';

/** Signs in to the POS at one outlet with the demo admin PIN and opens the online orders queue. */
export async function openOnlineOrders(page: Page, outlet: RegExp) {
  await pinLogin(page, { outletName: outlet });
  await page.goto(appUrl('pos', '/online-orders'));
  await waitForReady(page, page.getByRole('heading', { name: 'Online Orders' }));
  await expect(page.getByTitle('Switch outlet')).toContainText(outlet, { timeout: 10_000 });
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
  await expect(async () => {
    if (!(await card.isVisible())) {
      await page.reload();
      await waitForReady(page);
    }
    await expect(card).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 120_000, intervals: [5_000, 10_000] });
  return card;
}
