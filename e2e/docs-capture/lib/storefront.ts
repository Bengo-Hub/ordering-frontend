import { expect, type Page } from '@playwright/test';

import { appUrl, TEST_CUSTOMER } from './paths';
import { waitForReady } from './ready';
import { type JourneyOrder } from './shots';

/** Opens the demo storefront as a first-time visitor and declines optional cookies. */
export async function openStore(page: Page, route = '') {
  await page.goto(appUrl('ordering', route));
  await waitForReady(page);
  const reject = page.getByRole('button', { name: 'Reject optional' });
  if (await reject.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await reject.click();
    await page.waitForTimeout(400);
  }
}

/** Filters the menu to one outlet and category, then adds the named item from its page. */
export async function addItem(page: Page, outlet: RegExp, category: string, item: RegExp) {
  await openStore(page, '/catalog');
  await page.getByRole('button', { name: outlet }).first().click();
  await waitForReady(page);
  await page.getByRole('button', { name: category, exact: true }).first().click();
  await waitForReady(page);
  await page.getByText(item).first().click();
  const add = page.getByRole('button', { name: /add to (order|cart)/i });
  await waitForReady(page, add);
  await add.first().click();
  await expect(page.getByText(/added .* to cart/i).first()).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(800);
}

/** Opens checkout and continues as a guest with the designated demo customer. */
export async function startGuestCheckout(page: Page) {
  await page.goto(appUrl('ordering', '/checkout'));
  await waitForReady(page);
  const guest = page.getByRole('button', { name: /continue as guest/i });
  if (await guest.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await guest.click();
  }
  const email = page.getByPlaceholder(/email address/i);
  await waitForReady(page, email);
  await email.fill(TEST_CUSTOMER.email);
  await page.waitForTimeout(300);
  await page.locator('input[type="tel"]').first().fill(TEST_CUSTOMER.phone);
  await page.waitForTimeout(300);
  await page.getByPlaceholder(/your name/i).fill(TEST_CUSTOMER.name);
  await page.waitForTimeout(400);
}

/** Picks a delivery place by searching the location dialog (delivery areas are listed first). */
export async function chooseDeliveryPlace(page: Page, place: string) {
  const heading = page.getByRole('heading', { name: 'Delivery location' });
  if (!(await heading.isVisible({ timeout: 2_000 }).catch(() => false))) {
    await page.getByRole('button', { name: /change|choose delivery location/i }).first().click();
  }
  const search = page.getByPlaceholder('Search an area, street or landmark');
  await waitForReady(page, search);
  await search.fill(place);
  const area = page.getByRole('button', { name: new RegExp(place, 'i') }).filter({ hasText: /delivery area/i });
  const any = page.getByRole('button', { name: new RegExp(place, 'i') });
  const target = (await area.first().isVisible({ timeout: 8_000 }).catch(() => false)) ? area : any;
  await target.first().click();
  // The live quote appears under the map once logistics answers.
  await expect(page.getByText(/free delivery|delivery · KES|KES \d+ delivery|cannot deliver|don't deliver/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

/** Selects a payment option by its label. */
export async function choosePayment(page: Page, label: RegExp) {
  const option = page.getByRole('radio', { name: label });
  await option.first().scrollIntoViewIfNeeded();
  await option.first().click();
  await page.waitForTimeout(400);
}

/** The guest cart's session id: the guest order page is opened with it. Read before placing. */
export async function cartSession(page: Page): Promise<string> {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('ordering-cart-storage') ?? '')?.state?.sessionId ?? '';
    } catch {
      return '';
    }
  });
}

/** Confirms the order with the slide control (Enter is its keyboard path) and returns it. */
export async function placeOrder(page: Page): Promise<JourneyOrder> {
  const session = await cartSession(page);
  const slider = page.getByRole('button', { name: /slide to confirm/i });
  await slider.scrollIntoViewIfNeeded();
  const created = page.waitForResponse(
    (r) => /\/checkout(\/guest)?$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST',
    { timeout: 45_000 },
  );
  await slider.focus();
  await page.keyboard.press('Enter');
  const res = await created;
  const body = await res.json().catch(() => ({}));
  expect(res.ok(), `checkout failed: ${JSON.stringify(body).slice(0, 400)}`).toBeTruthy();
  const data = body.data ?? body;
  const id: string = data.orderId ?? data.order_id ?? data.id;
  const number: string = data.orderNumber ?? data.order_number ?? '';
  return { id, number, url: appUrl('ordering', `/orders/guest/${id}${session ? `?session_id=${session}` : ''}`) };
}

/** Reads the 6-digit collection or delivery code from the customer's order page. */
export async function readHandoverCode(page: Page): Promise<string | undefined> {
  await page.getByText(/collection code|delivery code/i).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
  const text = await page.locator('body').innerText();
  return text.match(/(?:collection|delivery) code[^\d]{0,60}(\d{6})/i)?.[1];
}
