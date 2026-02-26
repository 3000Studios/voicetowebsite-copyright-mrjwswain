# Skill: Worker API and Security Changes

## Use when

- Modifying `worker.js` routes.
- Changing security-sensitive helper logic in `functions/`.
- Adding/removing auth-protected APIs.

## Security checks

- No secrets leaked to browser/runtime injection.
- Admin auth remains HttpOnly-cookie based.
- Unauthorized requests receive expected 401/redirect behavior.
- Route alias changes do not accidentally expose protected content.

## Test focus

- Update and run targeted tests in `tests/adminSecurityAndUiRoutes.test.js`.
- Exercise affected endpoints with direct `curl` where useful.

## Change discipline

1. Implement minimal route/auth delta.
2. Add/update tests in lockstep.
3. Verify no regressions in public/admin route handling.

## Exit criteria

- All changed auth/route contracts are covered by passing tests.
- No regression in unauthenticated admin access guarding.
