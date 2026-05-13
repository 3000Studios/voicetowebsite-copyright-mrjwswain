# Clean Restore Point

## Baseline Tag

- Tag: `v1.0-clean-production`

## Baseline Metadata

- Date: 2026-02-21
- Branch: `main`
- Purpose: post-stabilization restore anchor

## Validation Snapshot

- Full gate command: `npm run verify`
- Deploy command: `npm run deploy`
- Required for release: both commands successful

## Recorded State

- Commit hash: reference the tag target (`git rev-parse v1.0-clean-production`)
- CI status: verify pipeline passes locally
- Deploy state: production deploy succeeded in this session
- Worker version ID: `386be1d5-a49c-41a8-acae-56de7dc80110`

## Dependency Baseline

- Locked by `package-lock.json`
- Security audit command used: `npm audit --omit=dev --json`

## Recovery Procedure

1. Checkout baseline tag:
   - `git checkout v1.0-clean-production`
2. Install dependencies:
   - `npm ci --no-audit --no-fund`
3. Validate:
   - `npm run verify`
4. Redeploy:
   - `npm run deploy`

## Notes

- This restore marker captures repository stability intent and deployment readiness for rollback
  operations.
