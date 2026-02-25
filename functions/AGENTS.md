# AGENTS.md (functions/)

## Scope

- Applies to files under `functions/`.
- Inherits root rules from `/AGENTS.md`.

## Security and API rules

- Treat all auth/session logic as security-sensitive.
- Keep secret handling server-only; never mirror secrets to client.
- Preserve behavior contracts for:
  - admin cookie mint/verify (`functions/adminAuth.js`)
  - admin enablement checks
  - any endpoint tied to `/api/admin/*`

## Change checklist

1. Confirm endpoint contracts are unchanged unless intentionally versioned.
2. Preserve cookie flags and session TTL guarantees.
3. Update tests when route/auth behavior changes.

## Suggested skills

- `../skills/04_worker_api_and_security.md`
- `../skills/03_admin_auth_login_flow.md`
- `../skills/06_targeted_testing_strategy.md`

