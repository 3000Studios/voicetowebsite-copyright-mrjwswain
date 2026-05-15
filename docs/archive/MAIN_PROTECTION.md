# Main Branch Protection (Safe Direct Mode)

This repo uses **no staging branch** and **no PR safety net**. Every commit is live history. These
settings keep `main` from accepting broken builds.

---

## 1. Build before every commit (CRITICAL)

- **File:** `.husky/pre-commit`
- **Runs:** `npm run build`
- If the build fails, the commit is aborted. Main stays clean.

Husky is already installed (`prepare` runs `scripts/husky-install.mjs`). To reinstall hooks:

```bash
npm install
npx husky install
```

---

## 2. Auto-push after commit

In `.vscode/settings.json`:

- `git.enableSmartCommit`: true
- `git.confirmSync`: false
- `git.autofetch`: true
- `git.postCommitCommand`: "push"

Flow: **Edit → Save → Auto commit → Auto push → Main updated.** No extra prompts.

---

## 3. Emergency rollback

If something lands on main and breaks production:

```bash
npm run rollback
```

Or manually:

```bash
git reset --hard HEAD~1
git push origin main --force
```

---

## 4. Deployment model

**You deploy with wrangler manually** (or via `npm run auto:ship` from your machine).

- **GitHub Actions does not deploy.** `scripts/guard-deploy.mjs` blocks any workflow that runs
  `wrangler deploy` or similar.
- Production deploy: `npm run deploy` (runs verify then `wrangler deploy --keep-vars`).

Because there is no CI deploy, **branch protection “Require status checks to pass before merging”
does not block direct pushes to main.** It would only apply if you merged via PRs. To add a safety
net without changing the direct-commit workflow, you can:

1. Add a GitHub Action that runs `npm run verify` on every push to `main`.
2. In **Settings → Branches → Branch protection → main**, enable **“Require status checks to pass
   before merging”** and require that Action.

That way, if you ever introduce a PR-based flow, CI must pass. For direct pushes, the main
protection is the **pre-commit hook** (build must pass before the commit is created).

---

## Summary

| Protection              | Mechanism                               |
| ----------------------- | --------------------------------------- |
| No broken build on main | `.husky/pre-commit` → `npm run build`   |
| Friction-free push      | `git.postCommitCommand`: "push"         |
| Instant revert          | `npm run rollback`                      |
| Deploy                  | Manual: `npm run deploy` or `auto:ship` |
