# Jules Directives — Ultimate UI/UX (Site + Admin)

## Mission

Upgrade VoiceToWebsite into a “showpiece” UI/UX while keeping it fast, accessible, and deploy-safe.

## Non‑negotiables (Sentinel rules)

- **No secrets in client code**: never inject passwords/signing keys into `window.__ENV` (see `.Jules/sentinel.md`).
- **Keyboard-first gatekeeping**: any “Enter / Start / Ignite” interaction must be reachable and usable via keyboard (see `.Jules/palette.md`).
- **Focus visibility**: strong `:focus-visible` styles everywhere (especially if custom cursor / heavy motion exists).
- **No autoplay audio**: video may autoplay **muted** only.
- **Admin isolation**:
  - Admin pages must be `noindex` and not discoverable via public nav unless authenticated.
  - Admin UI should not leak privileged data in the DOM.

## UI/UX Targets

- **One design language**: shared tokens (color, spacing, typography), consistent components (buttons, cards, tables).
- **Performance**: avoid layout shift, reduce JS-driven animation where CSS can do it, honor reduced motion.
- **Clarity**: strong hierarchy, fewer competing fonts, consistent CTAs.

## Pages to audit

From `JULES.system.json`: `/`, `/features`, `/demo`, `/pricing`, `/appstore`, `/live`, `/support`, `/admin`.

## Acceptance checklist (ship gate)

- `npm run verify` passes
- No console errors on key pages
- Mobile nav + admin nav are usable
- `:focus-visible` clearly visible on all interactive controls
- Reduced motion mode is respected
