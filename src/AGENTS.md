# AGENTS.md (src/)

## Scope

- Applies to files under `src/`.
- Inherits root rules from `/AGENTS.md`.

## Frontend consistency rules

- Keep shared nav definitions aligned with static shell/nav behavior:
  - `src/constants/navigation.ts`
  - `/nav.js`
- If menu item volume increases, keep dropdowns scrollable and keyboard accessible.
- Keep auth checks truthful:
  - Use admin session endpoints (`/api/config/status`) for admin auth state.
  - Do not use generic health endpoints for auth decisions.

## Testing guidance for `src/` changes

- Prefer targeted tests:
  - `src/App.a11y.test.tsx`
  - `src/App.perf.test.tsx`
- Run TypeScript checks when touching TS/TSX files:
  - `npm run type-check`

## Suggested skills

- `../skills/05_react_ui_and_shared_nav.md`
- `../skills/02_navigation_and_route_inventory.md`
- `../skills/06_targeted_testing_strategy.md`

