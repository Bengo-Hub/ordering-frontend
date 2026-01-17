# Shared Types Extraction Plan

Purpose: produce a small, actionable plan to extract canonical TypeScript types used across frontends and developer tooling into a `packages/shared` workspace inside the monorepo. This reduces duplication, avoids contract drift, and provides a single source of truth for client-side models.

Goals
- Extract the most commonly duplicated types first (orders, menu items, tenant/outlet ids, addresses, price/monetary types).
- Provide a generation/synchronization workflow from backend API contracts (OpenAPI or tRPC) so types remain accurate.
- Add CI checks ensuring the `packages/shared` types are used and up-to-date where applicable.

Recommended initial type list (priority order)
1. `TenantSlug` / `TenantId` (string union or opaque type)
2. `Outlet` / `OutletId` (id, name, location coords)
3. `MenuItem` / `CatalogItem` (id, sku, name, description, price, modifiers)
4. `Price` / `Money` (currency, amountMinor / amountMajor)
5. `OrderSummary` (id, status, total, placedAt, outletId, tenantSlug)
6. `OrderItem` (menuItemId, qty, modifiers, price)
7. `Customer` (id, displayName, email)
8. `Address` (lat, lng, label, street, city, postalCode)

Extraction & Implementation Steps
1. Create `packages/shared` (TypeScript package)
   - Add `package.json`, `tsconfig.json`, `README.md` and a minimal build script (tsc). Add export entry: `index.ts`.
2. Move or author the prioritized types above under `packages/shared/src/models/*`.
3. Publish internally (file: reference) via workspaces — add `"packages/shared"` to the repo workspaces (pnpm / npm / pnpm-workspace.yaml as appropriate).
4. Update frontend `tsconfig.paths` so `@bengobox/shared` (or similar) resolves to `packages/shared/src`.
5. Replace local duplicate types in `ordering-frontend` and other TS packages with imports from `@bengobox/shared`.
6. Add an integration test / type-check CI job that ensures packages consuming shared types re-check cleanly after changes.

Type Generation & Sync (recommended)
- Use contract-first generation where possible:
  - If backend exposes OpenAPI: use `openapi-typescript` to generate types and copy the generated output into `packages/shared/generated` (commit generated files) or publish an automated sync.
  - If backend uses tRPC: use `@trpc/cli` or repo-internal generation to export types into `packages/shared`.
- Add a small script in `scripts/` to fetch the backend OpenAPI and run `openapi-typescript --output packages/shared/src/generated/api.ts` and run `pnpm -w -F packages/shared build` as part of CI.

CI & Developer Experience
- Add a GitHub Action job `shared-types:check` that:
  - Runs generation script (if contract-first configured)
  - Runs `pnpm -w -F packages/shared build` and `pnpm -w -F ordering-frontend typecheck`
  - Fails if any downstream type usages break
- Add `yarn/pnpm` workspace references and a note in `CONTRIBUTING.md` to update `packages/shared` when changing any models

Rolling updates / Backward compatibility
- When type changes are breaking, follow a deprecation strategy:
  - Add new fields as optional first, update consumers, then make required in a later release.
  - For shape changes, publish migration notes in `packages/shared/CHANGELOG.md` and include codemods where useful.

Mapping to backend services
- Inventory Service: canonical SKU and stock types should remain in the backend; frontends import `MenuItem` shape generated from inventory OpenAPI.
- Ordering Backend (Go/ent): canonical Order schema remains the source-of-truth — derive TypeScript DTOs via OpenAPI generation.
- Logistics Service: logistics types (tasks, rider) are _not_ candidates for extraction into `packages/shared` unless frontends consume them directly; prefer `packages/logistics-types` only if necessary and generated from logistics OpenAPI.

Next immediate actions (small PR)
1. Create `packages/shared` with the minimal types in `src/models` and publish workspace references.
2. Replace `TenantSlug` and `MenuItem` types in `ordering-frontend` to import from the new package.
3. Add a CI typecheck job ensuring consumers compile after the change.

Acceptance criteria for initial roll-out
- `packages/shared` builds cleanly in CI
- `ordering-frontend` compiles with the imported types
- No runtime behaviour changes; only type imports updated

If you want, I can scaffold `packages/shared` and create the first PR that moves `TenantSlug` and `MenuItem` types into it, update imports in `ordering-frontend`, and add the CI job skeleton.
