import type { Page } from '@playwright/test';

import { waitForReady } from './ready';

/**
 * Signs in on the shared SSO page (accounts.codevertexafrica.com) after an app sent the browser
 * there. Every Codevertex web app uses this same page, so one helper serves the ordering staff
 * dashboard, the logistics console and the rider app. Already signed in (SSO cookie from an
 * earlier app in the same context) is fine: the app comes straight back.
 */
export async function ssoSignIn(page: Page, email: string, password: string, backTo: RegExp) {
  const onSso = await page
    .waitForURL(/accounts\.codevertexafrica\.com|sso\.codevertexafrica\.com/, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (onSso) {
    const emailInput = page.locator('input[type="email"], input#email').first();
    // The form can take a while on a cold page; an SSO cookie skips it and leaves the page instead.
    const visible = await emailInput
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (visible) {
      await emailInput.fill(email);
      await page.waitForTimeout(400);
      await page.locator('input[type="password"], input#password').first().fill(password);
      await page.waitForTimeout(400);
      // On a phone-sized page the cookie notice sits over the submit button.
      await page.getByRole('button', { name: /^(accept|got it|ok|allow)/i }).first().click({ timeout: 2_000 }).catch(() => {});
      await page.locator('button[type="submit"]').first().click();
    }
  }
  // Match the host, not the whole URL: the SSO page carries the app's address in return_to.
  // While still on the sign-in page, decline the passkey offer whenever it appears (it can take
  // a while; declining creates nothing).
  const later = page.getByRole('button', { name: /maybe later/i });
  const deadline = Date.now() + 60_000;
  while (!backTo.test(new URL(page.url()).host)) {
    if (Date.now() > deadline) throw new Error(`sign-in did not return to ${backTo} (still on ${page.url()})`);
    if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
    await page.waitForTimeout(1_000);
  }
  await waitForReady(page);
}

export const DEMO_ADMIN = {
  email: process.env.DOCS_ADMIN_EMAIL || 'admin@demo.codevertexafrica.com',
  password: process.env.DOCS_ADMIN_PASSWORD || '',
};

export const DEMO_RIDER = {
  email: process.env.DOCS_RIDER_EMAIL || 'rider@demo.codevertexafrica.com',
  password: process.env.DOCS_RIDER_PASSWORD || '',
};
