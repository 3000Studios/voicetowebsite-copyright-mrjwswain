# Skill: Navigation and Route Inventory

## Use when

- Adding/removing public pages.
- Updating menu structures in React or static nav shell.
- Fixing path inconsistencies between files and extensionless routes.

## Steps

1. Update React shared nav (`src/constants/navigation.ts`) for app-driven menus.
2. Update static/global nav (`nav.js`) for non-React pages.
3. If route aliases are affected, update `worker.js` route normalization.
4. If nav shell assets changed, sync to public:
   - `node ./scripts/sync-public-assets.mjs`
5. Validate route discoverability manually in UI.

## Path conventions

- Public canonical route format: `/page` (served from `page.html`).
- Admin auth pages support both:
  - `/admin/login` and `/admin/login.html`
  - `/admin/access` and `/admin/access.html`
- Admin module shell routes are path-based (`/admin/mission`, `/admin/analytics`, etc.).

## Exit criteria

- Public pages are visible in nav where expected.
- `Admin Login` is reachable in public nav.
- Authenticated admin views expose admin module navigation.

