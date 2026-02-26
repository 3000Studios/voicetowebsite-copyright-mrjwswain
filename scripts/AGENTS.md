# AGENTS.md (scripts/)

## Scope

- Applies to files under `scripts/`.
- Inherits root rules from `/AGENTS.md`.

## Script hygiene rules

- Keep scripts deterministic and non-interactive by default.
- Prefer cross-platform Node implementations over shell-specific behavior.
- If a script discovers or emits route/doc inventories, keep path sources aligned with repo reality.

## Special governance script notes

- `scripts/update-global-system-doc.mjs` is treated as canonical for workbook snapshots.
- If you add/remove governance docs, run:
  - `npm run ops:global-doc:update`

## Suggested skills

- `../skills/07_docs_and_path_hygiene.md`
- `../skills/08_deploy_and_release_guardrails.md`
- `../skills/01_repo_bootstrap_and_ports.md`

