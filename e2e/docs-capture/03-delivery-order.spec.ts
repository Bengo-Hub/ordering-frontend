import { expect, test, type Page } from '@playwright/test';

import { appUrl, OUTLETS } from './lib/paths';
import { openOnlineOrders, orderCard, queueTab } from './lib/pos';
import { waitForReady } from './lib/ready';
import { callout, loadOrder, saveOrder, shot } from './lib/shots';
import { DEMO_ADMIN, DEMO_RIDER, ssoSignIn } from './lib/sso';
import { addItem, chooseDeliveryPlace, choosePayment, placeOrder, readHandoverCode, startGuestCheckout } from './lib/storefront';

// A real pay-on-delivery order from Demo City Supermarket to Kondele (KES 150): checkout, POS
// accept and pack, the logistics board, the rider app from Available Work to proof of delivery,
// and the cash the rider hands in.
test.describe.serial('Delivery order', () => {
  test('customer places a delivery order', async ({ page }) => {
    await addItem(page, OUTLETS.supermarket.name, 'Retail', /^Shampoo 400ml$/);
    await startGuestCheckout(page);
    await chooseDeliveryPlace(page, 'Kondele');
    await page.getByRole('button', { name: /deliver here/i }).click();
    await waitForReady(page);
    await choosePayment(page, /pay on delivery/i);
    const order = await placeOrder(page);
    await page.goto(order.url);
    await waitForReady(page, page.getByText(/delivery code/i));
    order.code = await readHandoverCode(page);
    expect(order.code, 'delivery code on the order page').toMatch(/^\d{6}$/);
    saveOrder('delivery', { ...order, delivery: true });
  });

  test('outlet accepts and packs it', async ({ page }) => {
    const order = loadOrder('delivery')!;
    await openOnlineOrders(page, OUTLETS.supermarket.name);
    await queueTab(page, /delivery/i);
    const card = await orderCard(page, order.number);
    // On a re-run the order may already be accepted; the new-order shot is only taken while it
    // still waits for Accept.
    const accept = card.getByRole('button', { name: /accept/i });
    if (await accept.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await shot(page, 'delivery/01-new-order.png', {
        focus: card,
        callouts: [callout(card.getByText(/kondele/i), 1), callout(card.getByText(/pay on delivery/i), 2), callout(accept, 3)],
      });
      await accept.click();
    }
    // A shop has no kitchen: the accepted order is a pick list the counter packs, then marks
    // Ready (the retail-only step; everything after it is shared with restaurants).
    const ready = card.getByRole('button', { name: /packed & ready|^ready$/i });
    const assign = card.getByRole('button', { name: /assign rider/i });
    await expect(ready.or(card.getByText(/^ready$/i))).toBeVisible({ timeout: 60_000 });
    if (await ready.isVisible()) {
      await shot(page, 'delivery/01b-pack-and-ready.png', {
        focus: card,
        callouts: [callout(card.getByText(/to pick & pack/i), 1), callout(card.getByText(/\d+×/), 2), callout(ready, 3)],
      });
      await ready.click();
    }
    // Ready for the rider: logistics already has the job; Assign rider picks one by hand.
    await expect(card.getByText(/^ready$/i)).toBeVisible({ timeout: 60_000 });
    await shot(page, 'delivery/01c-ready-for-rider.png', {
      focus: card,
      callouts: [callout(card.getByText(/^ready$/i), 1), callout(assign, 2)],
    });
    await expect(card.getByText(/waiting for a rider|rider/i).first()).toBeVisible({ timeout: 60_000 });
  });

  test('the job appears in logistics', async ({ page }) => {
    const order = loadOrder('delivery')!;
    await page.goto(appUrl('logistics', '/tasks'));
    await ssoSignIn(page, DEMO_ADMIN.email, DEMO_ADMIN.password, /logistics\.codevertexafrica\.com/);
    await page.goto(appUrl('logistics', '/tasks'));
    await waitForReady(page);
    await logisticsBranch(page, OUTLETS.supermarket.name);
    // Each job is a row button; opening it shows the stops, the customer and Assign.
    // The job exists as soon as the outlet marks the order ready; a reload mid-load only restarts
    // the (slow) first fetch, so wait for the list instead.
    await expect(page.getByText(/loading deliveries/i)).toBeHidden({ timeout: 90_000 });
    const row = page.getByRole('button').filter({ hasText: /kondele/i }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await shot(page, 'delivery/02-logistics-job.png', {
      focus: row,
      callouts: [callout(row.getByText(/kondele/i), 1), callout(row.getByText(/needs a rider/i), 2)],
    });
    expect(order.number).toBeTruthy();
  });

  test('rider takes it, picks it up and delivers it', async ({ browser }) => {
    const order = loadOrder('delivery')!;
    const ctx = await browser.newContext({
      viewport: { width: 412, height: 860 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      geolocation: { latitude: -0.1042583, longitude: 34.7523637 },
      permissions: ['geolocation'],
    });
    const rider = await ctx.newPage();
    await rider.goto(appUrl('rider'));
    await ssoSignIn(rider, DEMO_RIDER.email, DEMO_RIDER.password, /riderapp\.codevertexafrica\.com/);
    await rider.goto(appUrl('rider'));
    // Signing in syncs the rider profile first; a reload during that only starts it again.
    await expect(rider.getByText(/^(online|offline)$/i).first()).toBeVisible({ timeout: 120_000 });
    await waitForReady(rider);

    const toggle = rider.getByRole('button', { pressed: false }).filter({ hasText: /offline/i });
    if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await toggle.click();
      await expect(rider.getByText(/^online$/i).first()).toBeVisible({ timeout: 15_000 });
    }
    await shot(rider, 'delivery/03-rider-online.png', { callouts: [callout(rider.getByText(/^online$/i), 1)] });

    // Available Work refreshes on its own once the rider is online.
    const take = rider.getByRole('button', { name: /take job/i }).first();
    // A re-run finds the job already taken by this rider: carry on from the active job.
    if (await take.isVisible({ timeout: 60_000 }).catch(() => false)) {
      await shot(rider, 'delivery/04-rider-open-jobs.png', {
        focus: rider.getByText('Available Work'),
        callouts: [callout(rider.getByText('Available Work'), 1), callout(take, 2)],
      });
      await take.click();
      // The app opens the active job itself once the claim succeeds; navigating away earlier
      // cancels the claim request. A refused claim shows the reason in a toast.
      const refused = rider.locator('[data-sonner-toast][data-type="error"]');
      await Promise.race([
        rider.waitForURL(/\/active/, { timeout: 30_000 }),
        refused.waitFor({ state: 'visible', timeout: 30_000 }).then(async () => {
          throw new Error(`Take job refused: ${await refused.innerText()}`);
        }),
      ]);
    } else {
      await rider.goto(appUrl('rider', '/active'));
    }
    await waitForReady(rider, rider.getByText(/current status/i));

    // One button per leg: accept, on the way, at the outlet, picked up, driving, at the customer.
    const customer = await (await browser.newContext()).newPage();
    const complete = rider.getByRole('button', { name: /complete delivery/i });
    let activeShot = false;
    for (let step = 0; step < 6; step++) {
      if (await rider.getByPlaceholder('Enter 6-digit code').isVisible().catch(() => false)) break;
      if (await complete.isVisible().catch(() => false)) break;
      const next = rider.getByRole('button', { name: /accepted|en route|at pickup|picked up|driving|at drop-off/i }).first();
      await next.waitFor({ state: 'visible', timeout: 30_000 });
      const label = (await next.innerText()).trim();
      await next.click();
      await rider.waitForTimeout(2_000);
      if (/picked up/i.test(label)) {
        await activeShot_(rider);
        activeShot = true;
        await customerOnTheWay(customer, order.url);
      }
    }
    if (!activeShot) {
      await activeShot_(rider);
    }

    // At the customer the rider opens the proof form with Complete Delivery.
    if (await complete.isVisible({ timeout: 10_000 }).catch(() => false)) await complete.click();
    const code = rider.getByPlaceholder('Enter 6-digit code');
    await waitForReady(rider, code);
    await code.fill(order.code!);
    await rider.getByPlaceholder('Who received the order?').fill('Test Customer');
    await rider.getByRole('button', { name: /^cash$/i }).click().catch(() => {});
    await shot(rider, 'delivery/06-rider-proof.png', {
      focus: rider.getByText('Proof of Delivery'),
      callouts: [
        callout(code, 1),
        callout(rider.getByText(/collect payment at the door/i), 2),
        callout(rider.getByRole('button', { name: /confirm & complete/i }), 3),
      ],
    });
    await rider.getByRole('button', { name: /confirm & complete/i }).click();
    await expect(rider.getByText(/delivered|completed|no active/i).first()).toBeVisible({ timeout: 30_000 });
    await ctx.close();
  });

  test('rider cash in logistics', async ({ page }) => {
    await page.goto(appUrl('logistics', '/cash'));
    await ssoSignIn(page, DEMO_ADMIN.email, DEMO_ADMIN.password, /logistics\.codevertexafrica\.com/);
    await page.goto(appUrl('logistics', '/cash'));
    await waitForReady(page, page.getByRole('heading', { name: /rider cash/i }));
    await logisticsBranch(page, OUTLETS.supermarket.name);
    await shot(page, 'delivery/07-rider-cash.png', {
      callouts: [callout(page.getByText(/demo rider/i), 1), callout(page.getByRole('button', { name: /record hand-in/i }), 2)],
    });
  });
});

/** Logistics lists only the working branch's jobs; switch it with the header chip. */
async function logisticsBranch(page: Page, outlet: RegExp) {
  const chip = page.getByTitle('Switch branch');
  // The chip preselects the main branch once its list loads, which can undo an early pick.
  await expect(async () => {
    if (!outlet.test(await chip.innerText())) {
      await chip.click();
      await page.getByRole('button').filter({ hasText: outlet }).last().click({ timeout: 5_000 });
    }
    await page.waitForTimeout(1_500);
    expect(await chip.innerText()).toMatch(outlet);
  }).toPass({ timeout: 60_000, intervals: [2_000, 5_000] });
  await waitForReady(page);
}

async function customerOnTheWay(page: Page, url: string) {
  await page.goto(url);
  await waitForReady(page, page.getByText(/order progress/i));
  await shot(page, 'delivery/08-customer-on-the-way.png', {
    callouts: [callout(page.getByText(/on the way/i), 1), callout(page.getByText(/open in maps/i), 2)],
  });
  await shot(page, 'customer/12-order-on-the-way.png');
}

/** The active job, from the top: the status card sits under a sticky header once the page has
 *  scrolled down to the step button, which would put the callout on the page title. */
async function activeShot_(rider: Page) {
  await rider.evaluate(() => window.scrollTo(0, 0));
  await rider.waitForTimeout(400);
  const status = rider.getByText(/current status/i);
  await shot(rider, 'delivery/05-rider-active.png', {
    callouts: [callout(status, 1), callout(rider.getByRole('button', { name: /accepted|en route|at pickup|picked up|driving|at drop-off|complete delivery/i }).first(), 2)],
  });
}
