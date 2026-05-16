# Firebase access for future Claude Code turns

This folder contains everything I need to read and write Firebase config for
the `voicetowebsite-3000` project across future Claude sessions.

There are **two complementary tools** because the official Firebase MCP can't
manage Auth config (authorized domains, provider toggles) — that gap is
filled by the gcloud-based PowerShell scripts.

---

## Right now: confirm Auth config is correct

### One-time setup (5 minutes)

1. **Install Google Cloud SDK** (gives you `gcloud` CLI):
   - Download: <https://cloud.google.com/sdk/docs/install#windows>
   - Run the installer with defaults. Restart your PowerShell after.

2. **Log in once:**
   ```powershell
   gcloud auth login
   ```
   Use **mr.jwswain@gmail.com** (the account that owns the Firebase project).

3. **Set the active project:**
   ```powershell
   gcloud config set project voicetowebsite-3000
   ```

### Audit (read-only — run any time)

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\Servi\voicetowebsite-copyright-mrjwswain\scripts\check-firebase-auth.ps1
```

Output tells you exactly:
- Whether `voicetowebsite.com` is in authorized domains
- Whether Email/Password is enabled
- Whether "Email link (passwordless)" is on
- Whether Google OAuth, Phone, etc. are enabled
- A verdict on whether magic-link signup will work in prod

### Fix (idempotent — only changes what's wrong)

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\Servi\voicetowebsite-copyright-mrjwswain\scripts\set-firebase-auth.ps1
```

Adds `voicetowebsite.com` + `www.voicetowebsite.com` to authorized domains
(preserving existing entries) and enables Email/Password + email-link if
they're off. Then auto-runs the audit script to confirm.

---

## For future sessions: install the official Firebase MCP

The official MCP gives me programmatic access to Firestore reads, user
management, hosting deploys, and more — across every Claude session, no
script-writing needed.

### Install

1. Open `C:\Users\Servi\.claude.json` in a text editor (it's your global
   Claude Code config).

2. Find a good place to add a top-level `mcpServers` key. If the file has no
   `mcpServers` block yet, add this block somewhere near the top-level
   (sibling of `installMethod`, `autoUpdates`):

   ```json
   "mcpServers": {
     "firebase": {
       "command": "npx",
       "args": [
         "-y",
         "firebase-tools@latest",
         "experimental:mcp",
         "--dir",
         "C:\\Users\\Servi\\voicetowebsite-copyright-mrjwswain"
       ]
     }
   }
   ```

3. Save the file. Make sure it's still valid JSON (no trailing commas).

4. One-time Firebase CLI auth (uses your Google account, NOT a service key):
   ```powershell
   npx firebase login
   ```

5. Restart Claude Code so it picks up the new MCP server.

### Confirm

Next time you open Claude Code in this repo, you should see firebase tools
available. Common ones the official MCP exposes:

- `firebase__firestore_query` — read Firestore collections
- `firebase__firestore_get_documents`
- `firebase__auth_get_users` — list users
- `firebase__auth_update_user`
- `firebase__hosting_deploy_get_link`
- `firebase__rules_get` — read security rules

### What the MCP CANNOT do (use the scripts above instead)

- List or modify authorized domains
- Toggle sign-in providers (Email/Password, Email link, OAuth)
- Read or change identity platform config

For those, run the gcloud-based scripts above. Different tools, different
strengths.

---

## Security notes

- **No service-account JSON is involved.** Both the gcloud scripts and the
  Firebase MCP use your *user* Google account auth. Revokable with
  `gcloud auth revoke` or `firebase logout`.
- **Nothing here is committed with secrets in plaintext.** The scripts read
  from your gitignored local state.
- **If you ever sign out**, both tools will prompt to re-auth on next run.
- **If you regret installing the MCP**, delete the `mcpServers.firebase`
  block from `.claude.json` and restart Claude Code. No other cleanup needed.

---

## Quick reference

| Task | Tool |
|---|---|
| Check Auth config is right | `scripts/check-firebase-auth.ps1` |
| Fix Auth config | `scripts/set-firebase-auth.ps1` |
| Push site env vars to Cloudflare Pages | `scripts/push-prod-env.ps1` |
| Read Firestore data in chat (future sessions) | Official Firebase MCP |
| Manage Auth users in chat (future sessions) | Official Firebase MCP |
