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
    const visible = await emailInput.isVisible({ timeout: 10_000 }).catch(() => false);
    if (visible) {
      await emailInput.fill(email);
      await page.waitForTimeout(400);
      await page.locator('input[type="password"], input#password').first().fill(password);
      await page.waitForTimeout(400);
      await page.locator('button[type="submit"]').first().click();
    }
  }
  await page.waitForURL(backTo, { timeout: 45_000 });
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
