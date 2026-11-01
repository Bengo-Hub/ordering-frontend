import { expect, test } from '@playwright/test';

import { appUrl, OUTLETS } from './lib/paths';
import { openOnlineOrders, orderCard, queueTab } from './lib/pos';
import { waitForReady } from './lib/ready';
import { callout, loadOrder, saveOrder, shot } from './lib/shots';
import { addItem, choosePayment, placeOrder, readHandoverCode, startGuestCheckout } from './lib/storefront';

// A real pay-at-counter pickup order at Demo Grand Hotel & Restaurant, from checkout to hand-over:
// storefront, POS online orders queue, kitchen screen, hand-over with the collection code.
test.describe.serial('Pickup order', () => {
  test('customer places a pickup order', async ({ page }) => {
    await addItem(page, OUTLETS.hotel.name, 'Hot Beverages', /^Americano$/);
    await startGuestCheckout(page);
    await page.getByRole('button', { name: 'Close' }).click({ timeout: 3_000 }).catch(() => {});
    await page.getByRole('button', { name: /pickup/i }).filter({ hasText: /min/ }).first().click();
    await waitForReady(page, page.getByText('Pickup Location'));
    await page.getByRole('button', { name: OUTLETS.hotel.name }).first().click();
    await choosePayment(page, /pay at the counter/i);
    const order = await placeOrder(page);

    await page.goto(order.url);
    await waitForReady(page, page.getByText(/collection code/i));
    order.code = await readHandoverCode(page);
    expect(order.code, 'collection code on the order page').toMatch(/^\d{6}$/);
    saveOrder('pickup', order);
    await shot(page, 'customer/11-order-page.png', {
      callouts: [callout(page.getByText(/order progress/i), 1), callout(page.getByText(/collection code/i), 2)],
    });
  });

  test('counter accepts it', async ({ page }) => {
    const order = loadOrder('pickup')!;
    await openOnlineOrders(page, OUTLETS.hotel.name);
    await queueTab(page, /click & collect/i);
    const card = await orderCard(page, order.number);
    await card.scrollIntoViewIfNeeded();
    await shot(page, 'pickup/01-new-order.png', {
      focus: card,
      callouts: [
        callout(card.getByText(/americano/i), 1),
        callout(card.getByText(/pay at counter/i), 2),
        callout(card.getByRole('button', { name: /accept/i }), 3),
      ],
    });
    await card.getByRole('button', { name: /accept/i }).click();
    await expect(card.getByText(/new · accept\?/i)).toBeHidden({ timeout: 30_000 });
  });

  test('kitchen starts and finishes it', async ({ page }) => {
    const order = loadOrder('pickup')!;
    await openOnlineOrders(page, OUTLETS.hotel.name);
    await page.goto(appUrl('pos', '/kds'));
    const ticket = page
      .locator('div.rounded-2xl, div.rounded-xl')
      .filter({ hasText: /americano/i })
      .filter({ has: page.getByRole('button', { name: 'Start' }) })
      .last();
    await expect(async () => {
      if (!(await ticket.isVisible())) await page.reload();
      await expect(ticket).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 90_000, intervals: [5_000] });
    await shot(page, 'pickup/02-kds-ticket.png', {
      focus: ticket,
      callouts: [callout(ticket.getByText(/online/i), 1), callout(ticket.getByRole('button', { name: 'Start' }), 2)],
    });
    await ticket.getByRole('button', { name: 'Start' }).click();
    await ticket.getByRole('button', { name: 'Ready' }).click({ timeout: 20_000 });
    await page.waitForTimeout(1_500);

    await page.goto(appUrl('pos', '/online-orders'));
    await queueTab(page, /click & collect/i);
    const card = await orderCard(page, order.number);
    await expect(card.getByRole('button', { name: /hand over/i })).toBeVisible({ timeout: 60_000 });
    await shot(page, 'pickup/03-ready.png', {
      focus: card,
      callouts: [callout(card.getByText(/^ready$/i), 1), callout(card.getByRole('button', { name: /hand over/i }), 2)],
    });
  });

  test('counter hands it over with the code', async ({ page }) => {
    const order = loadOrder('pickup')!;
    await openOnlineOrders(page, OUTLETS.hotel.name);
    await queueTab(page, /click & collect/i);
    const card = await orderCard(page, order.number);
    await card.getByRole('button', { name: /hand over/i }).click();
    const dialog = page.getByRole('dialog');
    await waitForReady(page, dialog.getByPlaceholder('6 digits'));
    await dialog.getByPlaceholder('6 digits').pressSequentially(order.code!, { delay: 80 });
    await dialog.getByRole('button', { name: /^cash$/i }).click().catch(() => {});
    await shot(page, 'pickup/04-hand-over.png', {
      focus: dialog,
      callouts: [
        callout(dialog.getByPlaceholder('6 digits'), 1),
        callout(dialog.getByRole('button', { name: /^cash$/i }), 2),
        callout(dialog.getByRole('button', { name: /handed over/i }), 3),
      ],
    });
    await dialog.getByRole('button', { name: /handed over/i }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
  });

  test('customer sees it completed', async ({ page }) => {
    const order = loadOrder('pickup')!;
    await page.goto(order.url);
    await expect(async () => {
      await page.reload();
      await expect(page.getByText(/completed|collected/i).first()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 90_000, intervals: [5_000, 10_000] });
    await shot(page, 'pickup/05-customer-completed.png', {
      callouts: [callout(page.getByText(/order progress/i), 1)],
    });
  });
});
