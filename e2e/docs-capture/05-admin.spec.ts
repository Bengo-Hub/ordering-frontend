import { test } from '@playwright/test';

import { appUrl } from './lib/paths';
import { waitForReady } from './lib/ready';
import { callout, shot } from './lib/shots';
import { DEMO_ADMIN, ssoSignIn } from './lib/sso';
import { openStore } from './lib/storefront';

// Setup screens: the store's own settings and, in Logistics, delivery areas, riders and dispatch
// settings. Read-only: nothing is saved.
test.describe.serial('Setting up', () => {
  test('store settings', async ({ page }) => {
    await openStore(page);
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await ssoSignIn(page, DEMO_ADMIN.email, DEMO_ADMIN.password, /ordering\.codevertexafrica\.com/);
    await page.goto(appUrl('ordering', '/dashboard/staff/settings'));
    await waitForReady(page, page.getByRole('heading', { name: 'Settings' }));
    await shot(page, 'admin/01-settings.png', { callouts: [callout(page.getByText('Order acceptance'), 1)] });
    await shot(page, 'admin/02-order-acceptance.png', {
      focus: page.getByText('Order acceptance'),
      callouts: [callout(page.getByText('Manual (recommended)'), 1), callout(page.getByText('Automatic', { exact: true }), 2)],
    });
    await shot(page, 'admin/03-linked-apps.png', {
      focus: page.getByText('Managed in other apps'),
      callouts: [callout(page.getByText('Payment methods'), 1), callout(page.getByText('Menu, prices and stock'), 2)],
    });
  });

  test('delivery areas, riders and dispatch settings', async ({ page }) => {
    await page.goto(appUrl('logistics', '/zones'));
    await ssoSignIn(page, DEMO_ADMIN.email, DEMO_ADMIN.password, /logistics\.codevertexafrica\.com/);
    await page.goto(appUrl('logistics', '/zones'));
    await waitForReady(page, page.getByText('Kisumu CBD'));
    await page.waitForTimeout(2_000); // map tiles
    await shot(page, 'admin/04-delivery-areas.png', {
      callouts: [callout(page.getByText('Kisumu CBD'), 1), callout(page.getByRole('button', { name: /add area/i }), 2)],
    });

    const tester = page.getByRole('tab', { name: /test a location/i }).or(page.getByRole('button', { name: /test a location/i }));
    if (await tester.first().isVisible().catch(() => false)) {
      await tester.first().click();
      await page.waitForTimeout(2_000);
      await shot(page, 'admin/05-test-location.png');
    }

    await page.goto(appUrl('logistics', '/riders'));
    await waitForReady(page, page.getByText('Demo Rider'));
    await page.getByText('Demo Rider').first().click();
    await page.waitForTimeout(1_500);
    await shot(page, 'admin/06-riders.png', { callouts: [callout(page.getByText(/KDEMO 001/i), 1)] });

    await page.goto(appUrl('logistics', '/settings'));
    await waitForReady(page, page.getByText('Dispatch and delivery'));
    await shot(page, 'admin/07-dispatch-settings.png', {
      focus: page.getByText('Dispatch and delivery'),
      callouts: [
        callout(page.getByText('Auto-assign new deliveries'), 1),
        callout(page.getByText('Riders can take open jobs'), 2),
        callout(page.getByText('Require proof of delivery'), 3),
      ],
    });
  });
});
