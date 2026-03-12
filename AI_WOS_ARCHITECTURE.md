# AI-WOS Architecture

## Purpose

AI-WOS is the operating model for this repository: a production website that can be inspected,
changed, generated, and deployed through natural-language and voice commands without introducing a
second control plane.

This repo does **not** use the generic Express + Next.js + Vercel stack that many AI website
blueprints assume. The live production architecture here is:

- Cloudflare Worker API and routing
- React + Vite public UI
- React admin dashboard
- D1, KV, R2, and Durable Objects when bound
- Wrangler deployment from `main`

The system is therefore implemented as an AI operating layer on top of the current Cloudflare stack.

## Runtime Map

User input flows through these layers:

1. User text or voice request
2. Command surface: `POST /api/execute`
3. Intent and operation planning: `functions/execute.js` + `functions/orchestrator.js`
4. Content and file mutation:
   - runtime JSON under `public/config/*`
   - content modules under `src/content/*`
   - generated site workspace in `functions/siteGenerator.js`
5. Verification and deployment:
   - `npm run verify`
   - `npm run ship`
   - `npm run deploy:live`
6. Live site served from Cloudflare Worker + assets

## AI-WOS Modules

- AI Command Router: canonical execution API, auth, idempotency, rollback hooks
- Intent Interpreter: AI and fallback parsing into structured operations
- Content Engine: JSON-backed runtime content, source inventory, safe overrides
- Page Generator: site generation, style packs, persisted generated layouts
- Design Engine: theme packs, design system, wallpapers, motion layers
- Media Engine: images, video, audio, embeds, live stream surfaces
- Voice Control: browser speech capture routed into the same command system
- Deployment Engine: locked verify -> ship -> deploy policy
- Analytics Engine: traffic, commerce, operational telemetry
- Multi-site Foundation: generated site persistence for future tenant expansion

## Live vs Foundation vs Planned

AI-WOS intentionally distinguishes three maturity levels:

- `live`: working in production today
- `foundation`: code or persistence exists, but full self-serve productization is not finished
- `planned`: defined target, not yet a live end-user workflow

This prevents the admin surface from claiming more than the system actually does.

## Command Surface

The canonical action schema is `ops/contracts/openapi.execute.json`.

Preferred command flow:

- `action: "auto"` for normal site changes
- `action: "list_pages"` to inspect routes
- `action: "read_page"` to inspect content
- `action: "status"` for runtime health
- `preview` -> `apply` -> `deploy` only for review-heavy structural work
- `ops:` commands for backend operations such as deploy, env audit, and governance checks

## Content Model

The safest editable surfaces are structured sources:

- `public/config/home.json`
- `public/config/products.json`
- `public/config/blog.json`
- `public/config/nav.json`
- other `public/config/*` runtime files

TypeScript-backed content and layout code remain part of the operating system, but JSON-backed
content should be preferred whenever a request can be satisfied without arbitrary code surgery.

## Automated Site Creation

`functions/siteGenerator.js` is the current foundation for automated site creation. It can:

- generate layout and style-pack combinations
- persist generated site records into D1
- index generated assets
- prepare vertical-specific site blueprints

Current blueprint directions:

- restaurant
- dentist
- SaaS
- creator / streamer
- local service

## Voice Control

Voice capture is already present in:

- `admin/voice-commands.html`
- `src/webforge/components/VoiceInput.tsx`

Voice input should remain a thin layer over the same execute API used by the admin dashboard and
Custom GPT action callers.

## Deployment Policy

The deploy path is locked by repository policy:

1. Use Node 20
2. Run `npm run verify`
3. Run `npm run ship`
4. Push `main`
5. Run `npm run deploy:live`

No alternate branch strategy or deployment platform should be introduced unless the repo policy is
explicitly changed.

## Security Model

- Custom GPT / remote operator auth: `x-orch-token`
- Browser admin auth: access code + signed `vtw_admin` cookie
- Request validation: schema validation
- Sensitive mutation protection: confirmation tokens / confirmation phrases
- Request safety: rate limiting, page target validation, event logging

## Near-Term Build Priorities

1. Move more customer-editable copy into JSON-backed runtime sources.
2. Add first-class blueprint provisioning workflows for generated site workspaces.
3. Add scheduled SEO and conversion autopilot jobs on top of the existing execute surface.
4. Add tenant-aware site registry and signup flow once the generation workspace is hardened.
