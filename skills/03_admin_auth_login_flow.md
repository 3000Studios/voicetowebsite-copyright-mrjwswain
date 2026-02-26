# Skill: Admin Auth and Login Flow

## Use when

- Changing admin login/access pages.
- Changing admin session behavior.
- Fixing post-login navigation visibility.

## Required behavior

- Credentials are validated server-side via `/api/admin/login`.
- Auth status is read from `/api/config/status`.
- Session state in UI is a convenience layer only; server cookie remains source of truth.

## Validation sequence

1. Unauthenticated user can open `/admin/login` and `/admin/access`.
2. Valid access code signs user in.
3. User is redirected to admin shell route (for example `/admin/mission`).
4. Admin navigation/sub-navigation is visible.
5. Navigating to another admin module works.
6. Protected admin paths redirect unauthenticated users to access page.

## Implementation anchors

- `admin/login.html`
- `admin/access.html`
- `admin/access-guard.js`
- `src/admin-dashboard/AccessGuard.tsx`
- `worker.js`

## Exit criteria

- End-to-end login works from public nav to admin module page.
- Manual UI walkthrough artifact (video) exists for non-trivial auth/nav updates.
