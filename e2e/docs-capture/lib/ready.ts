import type { Locator, Page } from '@playwright/test';

/**
 * Waits until a page looks the way a person would see it after it finished loading: network
 * quiet, no spinners, no skeleton placeholders, no "Loading..." text, and (when given) the
 * element the screenshot is about visible and enabled. Every docs screenshot goes through this,
 * because a capture taken mid-load shows a half-drawn form or an empty list that is not real.
 */
export async function waitForReady(page: Page, target?: Locator, settleMs = 800) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  if (target) {
    await target.first().waitFor({ state: 'visible', timeout: 20_000 });
  }
  const busy = [
    page.locator('.animate-spin'),
    page.locator('.animate-pulse'),
    page.locator('[aria-busy="true"]'),
    page.getByText(/^loading\b/i),
  ];
  for (const loc of busy) {
    await loc.first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }
  if (target) {
    // A form field can be visible but still disabled while its options load.
    await page
      .waitForFunction(
        (el) => !el || !(el as HTMLInputElement).disabled,
        await target.first().elementHandle().catch(() => null),
        { timeout: 5_000 },
      )
      .catch(() => {});
  }
  // Fonts and images finish after network idle on slow connections.
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(settleMs);
}

/** Dismisses the "install this app" banner if it shows, so it never covers a screenshot. */
export async function dismissInstallPrompt(page: Page) {
  const close = page.getByRole('button', { name: /not now|dismiss|close|later/i }).filter({
    has: page.locator('xpath=ancestor::*[contains(@class,"fixed")]'),
  });
  if (await close.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
    await close.first().click().catch(() => {});
    await page.waitForTimeout(300);
  }
}
