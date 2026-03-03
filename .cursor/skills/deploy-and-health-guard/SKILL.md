---
name: deploy-and-health-guard
description:
  Enforces the repo Deployment Lock Policy. Verify → ship → push → deploy on main only; Cloudflare
  Workers + Wrangler; never commit/deploy red; auto-fix breakages. Keeps Custom GPT, command center,
  checkouts, AdSense, UI/UX working. Use when making changes, deploying, or ensuring everything
  works.
---

# Deploy and Health Guard

## Lock Policy (Do Not Deviate)

This skill implements the **Deployment Lock Policy** in `AGENTS.md`. Do not deviate unless the user
explicitly says otherwise.

**Source of truth:** Cloudflare Workers + Wrangler. Deploy via `npm run deploy` and existing
Cloudflare config. Do not introduce a different deploy method, platform, or branch strategy.

**Branch:** Use `main` only. Keep local and remote in sync. Do not create side branches unless the
user explicitly requests it.

## Required Flow After Any Code Change

1. Run `npm run verify`.
2. If verify fails: fix issues immediately in the same session; re-run `npm run verify` until green.
3. When green: run `npm run ship` (or equivalent verify+commit flow).
4. Push with `npm run ship:push` (or equivalent).
5. Deploy with `npm run deploy` (or rely on CI deploy-on-push if configured and healthy).
6. Confirm deploy/build success and report result.

**Default behavior:** verify → ship → push → deploy.

## Hard Rules

- Never commit or deploy a red/broken state.
- Never skip verify before ship/deploy.
- Never change deploy pipeline/config unless required to fix a failure—then explain exactly what
  changed.
- Keep Custom GPT execute flow, auth, schema, and command center integration working.
- Keep checkout/pay links, previews, UI/UX requests, and AdSense readiness functional.
- If anything breaks (verify/test/build/deploy), auto-fix it in-session and continue to green.

## Command Center and Custom GPT

- **Command center** must be the place where changes are made: execute API and worker routes that
  apply user requests (content, theme, pages, store, media, deploy).
- **Custom GPT** listens for user requests in chat and calls the execute API (e.g. `executeCommand`
  with action `"auto"` or specific actions). Ensure:
  - Execute API schema and auth are correct (`ops/contracts/openapi.execute.json`, `ORCH_TOKEN`).
  - Deploy trigger is configured (`CF_DEPLOY_HOOK_URL` or Workers Builds on `main`).
- When the user says they want something in the Custom GPT chat, the agent should ensure the command
  center can fulfill it and that the Custom GPT instructions call the API correctly. See
  `CUSTOM_GPT_SETUP.md` and `UNIFIED_COMMAND_CENTER_SETUP.md`.

## Revenue, Checkouts, and Pay Links

- **Checkouts and pay links**: Verify they are working, verified, and usable. Run any
  project-specific checks or smoke tests for Stripe/checkout/payment links. Fix broken links or
  config.
- **Revenue stream**: Review code and config that affect revenue (ads, products, checkout,
  affiliate). Fix or create anything needed so a revenue stream is always possible. Proactively
  suggest improvements for the site and monetization.
- See [REFERENCE.md](REFERENCE.md) for the full revenue and payments checklist.

## AdSense and UI/UX

- **AdSense**: Keep the site AdSense-ready and verified for final review (required pages, meta tags,
  privacy disclosure, `public/config/adsense.json` and slot config). See `ADSENSE_READINESS.md`.
- **UI/UX**: All UI and UX requests must be deployed and working. After changes, confirm pages
  render, previews populate, and the site looks polished (layout, typography, responsiveness).
  Aggression-test critical flows.

## Crypto Bot and Apps

- **Crypto bot**: Keep a close eye on the crypto bot; test and aggression-test it. Ensure it and all
  apps are working and that everything displays properly.
- **All apps**: Test and aggression-test all apps so they work and display as expected (like a
  high-quality, professional site). If anything fails, auto-fix: fix, install, or create whatever is
  needed.

## Previews and User Requests

- **Previews**: Ensure all previews are populating (e.g. command center previews, page previews).
- **User requests**: Fulfill user requests fully—e.g. scraping or fetching media, updating inputs,
  animations, Bootstrap or other UI, so that everything works as designed and expected.

## Auto-Fix Rule

- If any step fails (verify, build, test, deploy, link check, etc.): **fix it in the same session**.
  Auto-fix, auto-install, or auto-create as needed. The agent has full access to fix the situation;
  do not leave broken state or hand off with “someone should fix this” without attempting the fix
  first.

## Commands Quick Reference

| Goal                                | Command                                    |
| ----------------------------------- | ------------------------------------------ |
| Full check (gate before commit)     | `npm run verify`                           |
| Commit (verify + add + commit)      | `npm run ship`                             |
| Commit and push                     | `npm run ship:push`                        |
| Deploy                              | `npm run deploy`                           |
| Production deploy (verify + guards) | `npm run deploy:prod`                      |
| Tests                               | `npm test`                                 |
| Build                               | `npm run build`                            |
| Type-check                          | `npm run type-check`                       |
| Worker types                        | `npm run types` then `npm run types:check` |

## Full Checklist

For the complete checklist (checkouts, pay links, AdSense, crypto bot, revenue, aggression testing),
see [REFERENCE.md](REFERENCE.md).

## Authority

The canonical **Deployment Lock Policy** is in repo root `AGENTS.md`. Stick to the current working
deployment path; only change this policy when the user explicitly instructs to.
