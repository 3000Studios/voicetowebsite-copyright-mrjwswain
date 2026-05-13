# Security Policy

## Scope

This repository powers production workloads on Cloudflare Workers. Security issues are treated as
production-impacting by default.

## Reporting

- Do not open public issues for exploitable vulnerabilities.
- Report privately to the project owner through the repository security contact channel.
- Include:
  - impact summary
  - reproduction steps
  - affected routes/files
  - proof-of-concept payload (if available)

## Response Targets

- Initial acknowledgement: within 72 hours
- Triage decision: within 7 days
- Hotfix target for critical vulnerabilities: as soon as practical after validation

## Baseline Controls

- Edge-enforced security headers in `worker.js`
- Token-gated orchestration endpoints (`x-orch-token` or authenticated admin cookie)
- Confirm-token signing/verification for apply/deploy flows
- Rate-limiting and abuse controls in API handlers
- No secrets committed to git (`.env*` ignored)

## Operational Requirements

- Run `npm run verify` before release.
- Deploy through local `wrangler deploy` flow (`npm run deploy`).
- Rotate compromised credentials immediately in provider dashboards.
- Re-deploy after credential rotation to invalidate stale runtime state.

## Secret Handling

- Store secrets in Cloudflare Worker secrets/environment variables.
- Keep local secrets in `.env.local` only.
- Never commit API keys, tokens, passwords, or private keys.

## Dependency Hygiene

- Audit dependencies regularly (`npm audit`).
- Upgrade vulnerable dependencies promptly.
- Keep lockfile changes reviewed in PR/commit history.
