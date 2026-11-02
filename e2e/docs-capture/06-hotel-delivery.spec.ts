import { expect, test } from '@playwright/test';

import { OUTLETS } from './lib/paths';
import { openOnlineOrders, orderCard, queueTab, sidebarTo } from './lib/pos';
import { waitForReady } from './lib/ready';
import { callout, loadOrder, saveOrder, shot } from './lib/shots';
import { addItem, chooseDeliveryPlace, choosePayment, placeOrder, startGuestCheckout } from './lib/storefront';

// What a restaurant does differently for a delivery order: the kitchen screen ticket and Ready
// there, then the card waiting for the rider. Everything from the rider on is the same as the
// shop journey (spec 03), so it is not repeated; the order is rejected at the end so no stray
// job is left for riders.
test.describe.serial('Hotel delivery order', () => {
  test('customer orders food for delivery', async ({ page }) => {
    await addItem(page, OUTLETS.hotel.name, 'Hot Beverages', /^Americano$/);
    await startGuestCheckout(page);
    await chooseDeliveryPlace(page, 'Kondele');
    await page.getByRole('button', { name: /deliver here/i }).click();
    await waitForReady(page);
    await choosePayment(page, /pay on delivery/i);
    saveOrder('hotelDelivery', { ...(await placeOrder(page)), delivery: true });
  });

  test('kitchen prepares it and it waits for the rider', async ({ page }) => {
    const order = loadOrder('hotelDelivery')!;
    await openOnlineOrders(page, OUTLETS.hotel.name);
    await queueTab(page, /^delivery/i);
    const card = await orderCard(page, order.number);
    const accept = card.getByRole('button', { name: /accept/i });
    if (await accept.isVisible({ timeout: 5_000 }).catch(() => false)) await accept.click();

    await sidebarTo(page, 'Display Board', 'KDS');
    // Delivery tickets carry the POS number DL- plus the online order number.
    const ticket = page
      .locator('div.rounded-2xl, div.rounded-xl')
      .filter({ hasText: `DL-${order.number}` })
      .filter({ has: page.getByRole('button') })
      .last();
    await expect(ticket).toBeVisible({ timeout: 90_000 });
    const start = ticket.getByRole('button', { name: 'Start' });
    if (await start.isVisible().catch(() => false)) {
      await shot(page, 'delivery/hotel-01-kds-ticket.png', {
        focus: ticket,
        callouts: [callout(ticket.getByText(/delivery/i), 1), callout(start, 2)],
      });
      await start.click();
    }
    const kdsReady = ticket.getByRole('button', { name: 'Ready' });
    await kdsReady.waitFor({ state: 'visible', timeout: 15_000 });
    await kdsReady.click();
    await page.waitForTimeout(1_500);

    await sidebarTo(page, 'Online Orders', /online orders queue/i);
    await queueTab(page, /^delivery/i);
    const ready = await orderCard(page, order.number);
    await expect(ready.getByText(/^ready$/i)).toBeVisible({ timeout: 60_000 });
    await shot(page, 'delivery/hotel-02-ready-for-rider.png', {
      focus: ready,
      callouts: [callout(ready.getByText(/^ready$/i), 1), callout(ready.getByRole('button', { name: /assign rider/i }), 2)],
    });

    // Clean up: reject so the job does not sit in riders' Available Work.
    await ready.getByRole('button', { name: /reject/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText(/too busy|out of stock/i).first().click();
    await dialog.getByRole('button', { name: /reject order/i }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
  });
});
