# AGENTS.md (tests/)

## Scope

- Applies to files under `tests/`.
- Inherits root rules from `/AGENTS.md`.

## Testing strategy

- Prefer focused suites tied to changed behavior.
- Avoid broad full-repo test runs unless explicitly required.
- Keep admin routing/auth coverage current in:
  - `tests/adminSecurityAndUiRoutes.test.js`

## Assertions to protect

- Unauthenticated users redirect to admin access page for protected admin routes.
- Public admin auth pages remain reachable without auth.
- Clean admin auth route aliases stay normalized.
- Admin login and signed cookie flow stays functional.

## Suggested skills

- `../skills/06_targeted_testing_strategy.md`
- `../skills/03_admin_auth_login_flow.md`
- `../skills/04_worker_api_and_security.md`
