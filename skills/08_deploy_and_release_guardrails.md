# Skill: Deploy and Release Guardrails

## Use when

- Changing deploy docs, release scripts, or operational workflows.
- Updating policy references for production shipping.

## Guardrails

- Deploy authority is local Wrangler flow (`npm run deploy`), not CI workflow injection.
- `npm run verify` is a mandatory gate before commit/deploy.
- Preserve `wrangler.toml` runtime/asset binding assumptions.

## Checklist

1. Confirm command references match `package.json`.
2. Confirm docs do not contradict deploy policy.
3. Confirm no accidental introduction of forbidden deploy workflows.

## Exit criteria

- Deploy docs and script references are aligned and internally consistent.
- No contradiction between `DEPLOYMENT.md`, `SYSTEM_OPERATIONS.md`, and `AGENTS.md`.
