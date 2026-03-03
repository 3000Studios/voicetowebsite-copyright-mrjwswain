# Branches and pull requests

## Current state

- **Local:** Only `main` is checked out.
- **Remotes:** Only `origin/main`. Other remote branches have been deleted.

## Merging and cleanup

Merges and branch deletion must be done in GitHub (or your Git host):

1. **Pull requests:** In GitHub, open the PRs tab, review open PRs, and merge any that are ready.
   Dependabot PRs are often safe to merge if CI is green.
2. **Delete remote branches:** After merging, delete the remote branch from the PR page, or run:
   ```bash
   git push origin --delete <branch-name>
   ```
   Do **not** delete `main` or long-lived release branches. Only delete feature branches that are
   already merged.

## This repo

VoiceToWebsite uses `main` as the single primary branch. All deployment and verification (e.g.
`npm run verify`) run against `main`.
