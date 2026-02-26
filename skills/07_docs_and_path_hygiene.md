# Skill: Docs and Path Hygiene

## Use when

- Creating/updating governance docs (`AGENTS.md`, runbooks, instructions).
- Fixing stale file references or route/path mismatches.

## Path hygiene checklist

1. Every referenced file path actually exists.
2. Every referenced route maps to a real page or normalized alias.
3. If a file is newly introduced, add it to related indexes/docs.
4. If docs mention generated snapshots, run the generator.

## Repo-specific gotchas

- The folder `app Store apps to Sell` includes spaces.
- `GLOBAL_SYSTEM_INSTRUCTIONS.md` has an auto-generated section maintained by:
  - `scripts/update-global-system-doc.mjs`

## Exit criteria

- No broken references in edited docs.
- Governance snapshot is refreshed when needed.

