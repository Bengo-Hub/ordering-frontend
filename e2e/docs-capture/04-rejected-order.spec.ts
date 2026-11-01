import { expect, test } from '@playwright/test';

import { OUTLETS } from './lib/paths';
import { openOnlineOrders, orderCard, queueTab } from './lib/pos';
import { waitForReady } from './lib/ready';
import { callout, loadOrder, saveOrder, shot } from './lib/shots';
import { addItem, choosePayment, placeOrder, startGuestCheckout } from './lib/storefront';

// A real pickup order the outlet rejects, and what the customer then sees.
test.describe.serial('Rejected order', () => {
  test('customer places an order', async ({ page }) => {
    await addItem(page, OUTLETS.hotel.name, 'Hot Beverages', /^Espresso$/);
    await startGuestCheckout(page);
    await page.getByRole('button', { name: 'Close' }).click({ timeout: 3_000 }).catch(() => {});
    await page.getByRole('button', { name: /pickup/i }).filter({ hasText: /min/ }).first().click();
    await waitForReady(page, page.getByText('Pickup Location'));
    await page.getByRole('button', { name: OUTLETS.hotel.name }).first().click();
    await choosePayment(page, /pay at the counter/i);
    saveOrder('rejected', await placeOrder(page));
  });

  test('outlet rejects it with a reason', async ({ page }) => {
    const order = loadOrder('rejected')!;
    await openOnlineOrders(page, OUTLETS.hotel.name);
    await queueTab(page, /pickup & takeaway|click & collect/i);
    const card = await orderCard(page, order.number);
    // A new order waiting to be accepted looks the same whatever happens next; this is the
    // pickup guide's first screenshot too.
    await shot(page, 'pickup/01-new-order.png', {
      focus: card,
      callouts: [
        callout(card.getByText(/espresso/i), 1),
        callout(card.getByText(/pay at counter/i), 2),
        callout(card.getByRole('button', { name: /accept/i }), 3),
      ],
    });
    await card.getByRole('button', { name: /reject/i }).click();
    const dialog = page.getByRole('dialog');
    await waitForReady(page, dialog.getByText(/an item is out of stock/i));
    await dialog.getByText(/an item is out of stock/i).click();
    await shot(page, 'problems/01-reject.png', {
      focus: dialog,
      callouts: [callout(dialog.getByText(/an item is out of stock/i), 1), callout(dialog.getByRole('button', { name: /reject order/i }), 2)],
    });
    await dialog.getByRole('button', { name: /reject order/i }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
  });

  test('customer sees it called off', async ({ page }) => {
    const order = loadOrder('rejected')!;
    await page.goto(order.url);
    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/cancelled/i).first()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 90_000, intervals: [5_000, 10_000] });
    await shot(page, 'problems/02-cancelled.png', { callouts: [callout(page.getByText(/cancelled/i), 1)] });
  });
});
