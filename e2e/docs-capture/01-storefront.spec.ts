import { expect, test } from '@playwright/test';

import { OUTLETS } from './lib/paths';
import { waitForReady } from './lib/ready';
import { callout, shot } from './lib/shots';
import { addItem, chooseDeliveryPlace, openStore, startGuestCheckout } from './lib/storefront';

// The customer's side up to placing an order: storefront, menu, item, cart, checkout (delivery and
// pickup), delivery location and payment. Nothing is ordered here (02 to 04 place real orders).
test.describe.serial('Storefront and checkout', () => {
  test('store home and menu', async ({ page }) => {
    await openStore(page);
    await shot(page, 'customer/01-store-home.png', {
      callouts: [
        callout(page.getByText('Delivery', { exact: true }), 1),
        callout(page.getByRole('button', { name: /now/i }).filter({ hasText: /now/i }), 2),
        callout(page.getByRole('link', { name: /see the menu/i }), 3),
      ],
    });

    await openStore(page, '/catalog');
    await page.getByRole('button', { name: OUTLETS.hotel.name }).first().click();
    await waitForReady(page);
    await page.getByRole('button', { name: 'Hot Beverages', exact: true }).first().click();
    await shot(page, 'customer/02-menu.png', {
      focus: page.getByText('Americano').first(),
      callouts: [
        callout(page.getByRole('button', { name: 'Hot Beverages', exact: true }), 1),
        callout(page.getByRole('button', { name: OUTLETS.hotel.name }), 2),
        callout(page.getByText('Americano'), 3),
      ],
    });
  });

  test('item, cart and checkout', async ({ page }) => {
    await addItem(page, OUTLETS.hotel.name, 'Hot Beverages', /^Americano$/);
    await shot(page, 'customer/03-item.png', {
      callouts: [
        callout(page.getByRole('heading', { name: 'Delivery and returns' }).or(page.getByText('Delivery and returns')), 1),
        callout(page.getByRole('button', { name: /add to (order|cart)/i }), 2),
      ],
    });

    await page.getByRole('link', { name: /cart/i }).or(page.getByRole('button', { name: /cart/i })).first().click().catch(() => {});
    await page.goto(page.url().replace(/\/catalog.*$/, '/cart'));
    const total = page.getByText('Total', { exact: true }).first();
    await shot(page, 'customer/04-cart.png', {
      focus: page.getByText('Order Summary'),
      callouts: [callout(page.getByText(/request utensils/i), 1), callout(total, 2), callout(page.getByRole('button', { name: /proceed to checkout/i }), 3)],
    });

    await startGuestCheckout(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Close' }).click({ timeout: 2_000 }).catch(() => {});
    await shot(page, 'customer/05-checkout-contact.png', {
      focus: page.getByText('Contact Information'),
      callouts: [
        callout(page.getByPlaceholder(/email address/i), 1),
        callout(page.locator('input[type="tel"]'), 2),
        callout(page.getByText('Delivery location').first(), 3),
      ],
    });

    await chooseDeliveryPlace(page, 'Kondele');
    await shot(page, 'customer/06-delivery-location.png', {
      focus: page.getByPlaceholder('Search an area, street or landmark'),
      callouts: [
        callout(page.getByPlaceholder('Search an area, street or landmark'), 1),
        callout(page.getByText(/KES 150 · Kondele/), 2),
        callout(page.getByRole('button', { name: /deliver here/i }), 3),
      ],
    });
    await page.getByRole('button', { name: /deliver here/i }).click();
    await waitForReady(page);

    const payment = page.getByRole('radiogroup', { name: 'Payment method' });
    await shot(page, 'customer/07-fulfilment.png', {
      focus: page.getByText('Delivery Notes'),
      callouts: [
        callout(page.getByText('Kondele').first(), 1),
        callout(page.getByRole('button', { name: /delivery/i }).filter({ hasText: /min/ }), 2),
        callout(page.getByRole('button', { name: /pickup/i }).filter({ hasText: /min/ }), 3),
      ],
    });
    await shot(page, 'customer/08-payment.png', {
      focus: payment,
      callouts: [callout(payment, 1), callout(page.getByRole('button', { name: /slide to confirm|place order/i }), 2)],
    });

    // A place outside every area is refused with the nearest area named.
    await chooseDeliveryPlace(page, 'Kakamega');
    await shot(page, 'customer/09-outside-area.png', {
      focus: page.getByPlaceholder('Search an area, street or landmark'),
      callouts: [callout(page.getByText(/outside our delivery area/i), 1)],
    });
    await page.getByRole('button', { name: 'Close' }).click();

    // Pickup: choose the outlet, pay at the counter.
    await page.getByRole('button', { name: /pickup/i }).filter({ hasText: /min/ }).first().click();
    await waitForReady(page);
    await expect(page.getByText('Pickup Location')).toBeVisible();
    await shot(page, 'customer/10-pickup.png', {
      focus: page.getByText('Pickup Location'),
      callouts: [callout(page.getByText('Pickup Location'), 1), callout(page.getByRole('radio', { name: /pay at the counter/i }), 2)],
    });
  });
});
