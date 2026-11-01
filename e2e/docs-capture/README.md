# docs-capture (Online Ordering guide)

Playwright specs that take the screenshots for the shared-docs Online Ordering guide
(`shared-docs/docs/user-guide/ordering/`). They follow real orders through every app an online
order passes: the storefront, the POS online orders queue and kitchen screen, the logistics
console and the rider app.

```
pnpm docs:capture                       # everything, in order
pnpm docs:capture 01-storefront         # one spec
```

Screenshots are written straight into the sibling shared-docs repo (`lib/paths.ts`), so both
repos must be checked out side by side, as must pos-service (the suite reuses pos-ui's
`annotate.ts` and `pin-login.ts` instead of keeping copies).

## Tenant and credentials

The suite always runs against `codevertex-demo`. Its config reads only `DOCS_*` keys from the
gitignored `.env.test` and forces `E2E_ORG_SLUG` to the demo tenant, because the general e2e keys
in that file may point at a real tenant and pos-ui's PIN helper reads `E2E_ORG_SLUG`.

| Key | Use |
|---|---|
| `DOCS_ADMIN_EMAIL`, `DOCS_ADMIN_PASSWORD` | Store dashboard and logistics console |
| `DOCS_RIDER_EMAIL`, `DOCS_RIDER_PASSWORD` | Rider app |
| `DOCS_CUSTOMER_EMAIL`, `DOCS_CUSTOMER_PHONE` | Guest checkout (defaults to the demo Test Customer) |
| `E2E_ADMIN_PIN` | POS PIN (default `0000`) |

## What a full run creates

Specs 02 to 04 place three real orders on the demo tenant (a hotel pickup, a supermarket delivery
to Kondele, a rejected pickup), all paid on delivery or at the counter, so no money moves. The
Test Customer receives their email and WhatsApp messages. The delivery is completed by the Demo
Rider (motorbike KDEMO 001), so the rider's cash ledger grows by the order total until someone
records a hand-in. Specs 01 and 05 only read.

## Writing more shots

- Every screenshot goes through `shot()` (`lib/shots.ts`), which waits for a fully loaded page
  (`lib/ready.ts`) and skips any callout that is not visible instead of hanging.
- Select by role, label, placeholder or visible text; the guide's screenshots then survive
  restyling.
- Run one suite at a time on this machine (several Chromium instances at once time out).
