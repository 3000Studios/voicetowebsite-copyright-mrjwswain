# Project Progress Tracker

Source of truth: `ops/site/progress.json` (copied to `public/config/progress.json` during build).

## How to update

- Update `ops/site/progress.json` status fields for tasks you complete.
- Then sync this file to match any status changes.
- Use status values: `todo`, `in_progress`, `blocked`, `done`.
- Use ISO dates: `YYYY-MM-DD`.

## Current phase

Phase 1: Governance + Safety Rails (blocked on branch protection).

## Overall progress (auto-calculated in admin/progress.html)

- Done: 0.0% (see admin progress page for live calculation).

## Bot compliance checklist (required)

- Read MASTER WORKBOOK + UI LAYOUT before changes.
- Update `ops/site/progress.json` + `PROJECT_PROGRESS.md` after completing tasks.
- Run `npm run verify` before commit.
- No secrets in git; env vars only.

## Prompt list by phase (copy/paste into bots)

### Phase 1: Governance + Safety Rails

```
Enable branch protection for main: require PR + Verify check, block force push/deletion, require up-to-date branch. Update progress.json + PROJECT_PROGRESS.md.
```

### Phase 2: Master Workbook Core

```
Harden worker routing per Master Workbook Section R and SEO injection per Section E. Update progress.json and PROJECT_PROGRESS.md with status.
```

```
Implement allowlist + quotas + locks + idempotency + atomicity for /api/execute (Sections F,G,H,S). Update progress files.
```

```
Attach X-VTW-CONFIG-HASH and enforce mismatch handling per Section I. Update progress files.
```

### Phase 3: Monetization + Commerce

```
Move store/appstore content to ops/site/products.json + content slots. Ensure data-vtw slots and config fetch on pages. Update progress files.
```

```
Unify PayPal/Stripe checkout flow: consolidate worker endpoints, update store.html, store-products.js, Checkout.tsx, commerce utils, add tests/scripts. Update progress files.
```

### Phase 4: Admin Control Center

```
Implement admin control center layout + features per UI Layout Workbook Section 11. Update progress files.
```

### Phase 5: UI/UX Layout Workbook

```
Implement global shell: nav/footer/widgets/material stack across all public pages. Update progress files.
```

```
Implement Home layout per UI Layout Workbook Section 3. Update progress files.
```

```
Implement Store layout per UI Layout Workbook Section 7. Update progress files.
```

```
Implement Appstore layout per UI Layout Workbook Section 8. Update progress files.
```

### Phase 6: Verify + Tests + Deploy Gates

```
Expand verify to cover routing/SEO/locks/quotas/TTL/hash tests. Update progress files.
```

```
Implement smoke tests and promotion gate per Section P and V8. Update progress files.
```

## Progress snapshot (mirror of progress.json)

### Governance + Safety Rails

- Verify workflow installed: DONE
- Pre-commit verify hook installed: DONE
- Branch protection enabled: BLOCKED (owner action)

### Master Workbook Core

- Deterministic worker routing: IN_PROGRESS
- Worker SEO injection: IN_PROGRESS
- Execute API hardening: IN_PROGRESS
- Config hash integrity: IN_PROGRESS
- TTL overrides + sweeps: IN_PROGRESS

### Monetization + Commerce

- Store/Appstore contentization: IN_PROGRESS
- AdSense + affiliate IDs live: IN_PROGRESS
- Checkout unification (PayPal + Stripe + multi-item): IN_PROGRESS

### Admin Control Center

- Admin shell + nav + sentinel: IN_PROGRESS
- Control Center preview/apply/rollback/diff/audit: IN_PROGRESS

### UI/UX Layout Workbook

- Global shell (nav/footer/widgets/material stack): IN_PROGRESS
- Home layout (hero + steps + features + monetization + appstore + blog + CTA): IN_PROGRESS
- Store layout (filters + grid + cart drawer): IN_PROGRESS
- Appstore layout (hero + cards + tiers + demo CTA): IN_PROGRESS

### Verify + Tests + Deploy Gates

- Verify suite (routing/SEO/locks/quotas): IN_PROGRESS
- Smoke tests + promotion gate: TODO
