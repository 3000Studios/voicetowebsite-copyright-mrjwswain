# UI/UX Backlog (Jules)

## P0 — Showpiece polish

- Unify typography across site + admin (pick 2 fonts + mono).
- Standardize button/card/table components and spacing scale.
- Tighten hero: clearer value prop + primary CTA + secondary “watch demo”.
- Add “trust strip” (status, uptime, security, terms) above footer on key pages.

## P0 — Accessibility

- Ensure every page has a `<main id="main">` anchor for skip link.
- Audit keyboard flow for opener (“Enter / Ignite / Start”) and admin lock screen.
- Confirm focus rings are visible for all interactive controls on dark video backgrounds.

## P1 — Admin experience

- Add responsive subnav (collapse to menu on <900px).
- Add “system health” panel (Worker online, R2, D1, KV, AI bindings).
- Improve tables: sticky headers, filter/search, empty states, loading skeleton.

## P1 — Performance

- Remove Tailwind CDN unless actively used.
- Defer non-critical effects (bottom waves, parallax) until idle.
- Reduce video bandwidth (poster + reduced-motion fallback).
