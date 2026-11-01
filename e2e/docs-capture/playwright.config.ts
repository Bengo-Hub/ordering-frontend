import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// The docs-capture suite reads only DOCS_* keys from .env.test (gitignored). The general e2e keys
// there may point at a real tenant, and pos-ui's pin-login helper (reused here) reads
// E2E_ORG_SLUG, so both are pinned to the demo tenant before any spec loads.
const envFile = path.resolve(__dirname, '../../.env.test');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim();
    const eq = t.indexOf('=');
    if (!t || t.startsWith('#') || eq < 0) continue;
    const key = t.slice(0, eq).trim();
    if (key.startsWith('DOCS_') && !process.env[key]) process.env[key] = t.slice(eq + 1).trim();
  }
}
process.env.DOCS_ORG_SLUG = process.env.DOCS_ORG_SLUG || 'codevertex-demo';
process.env.E2E_ORG_SLUG = process.env.DOCS_ORG_SLUG;
delete process.env.BASE_URL;

/** One worker, one browser, real pacing: the specs drive a live order through five apps. */
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: '../../test-results/docs-capture',
  use: {
    headless: process.env.CI === 'true',
    viewport: { width: 1366, height: 860 },
    deviceScaleFactor: 1,
    locale: 'en-KE',
    timezoneId: 'Africa/Nairobi',
    // Kisumu CBD, so the storefront's "use my location" lands inside the demo delivery areas.
    geolocation: { latitude: -0.0991973, longitude: 34.7626797 },
    permissions: ['geolocation'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } }],
  timeout: 240_000,
});
