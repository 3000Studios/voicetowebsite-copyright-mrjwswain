# AGENTS.md (admin/)

## Scope

- Applies to files under `admin/`.
- Inherits root rules from `/AGENTS.md`.

## Admin architecture rules

- Public auth pages:
  - `admin/login.html`
  - `admin/access.html`
- Authenticated admin shell:
  - `admin/integrated-dashboard.html`
  - `admin/ccos.js`
- Route aliases are normalized by `worker.js` (for example `/admin/login` -> `/admin/login.html`).

## Navigation/auth expectations

- After sign-in, admin modules must be accessible through visible admin navigation.
- Keep login/access flows server-validated (`/api/admin/login`, `/api/config/status`).
- Do not implement client-side secret validation.

## Change checklist

1. Update HTML/JS/CSS in this directory.
2. Validate route aliases and auth guards still work.
3. Confirm navigation remains accessible on smaller screens.
4. If new admin routes are introduced, update:
   - `admin/ccos.js` route map
   - `worker.js` route handling if needed
   - docs in `AGENTS.md`/`skills/`

## Suggested skills

- `../skills/03_admin_auth_login_flow.md`
- `../skills/02_navigation_and_route_inventory.md`
- `../skills/06_targeted_testing_strategy.md`

