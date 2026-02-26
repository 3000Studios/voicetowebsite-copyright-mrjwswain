# Custom GPT: Make Changes and Deploy Live

This repo supports **immediate deploy** from your Custom GPT without using GitHub Actions.

For **how the GPT should behave** (UI/UX transformation engine, media architect, animation and
performance rules), see **`CUSTOM_GPT_UI_UX_BRIEF.md`** in this folder. Use that brief as the GPT’s
role and capability instructions; use this doc for the deploy flow. The GPT edits the site, pushes
to `main`, then triggers a deploy hook so the change goes live.

## One-time setup (you)

1. **Deploy runner** Something must run `wrangler deploy` when triggered. Two options:
   - **Option A – Your own machine** Run a tiny HTTP server that, on POST, runs the deploy script
     (e.g. `node scripts/remote-deploy.mjs`). Expose it with ngrok or similar and use that URL as
     the deploy hook.

   - **Option B – External service** Use a serverless function (e.g. Vercel, Netlify, Railway) or a
     VPS that:
     - Receives POST at a URL you choose.
     - In that handler: clone or pull this repo, then run `node scripts/remote-deploy.mjs` (see
       below). The script does `git pull`, `npm ci`, `npm run build`,
       `npx wrangler deploy --keep-vars`. Set env on the runner: `CF_API_TOKEN`, `CF_ACCOUNT_ID` (or
       `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

2. **Worker env (Cloudflare)** In the Worker’s env / secrets:
   - `ALLOW_REMOTE_DEPLOY_TRIGGER=1`
   - `CF_DEPLOY_HOOK_URL=<your deploy runner URL>` Example:
     `https://your-ngrok-or-serverless-url.com/deploy`

3. **Auth for the GPT** The GPT must call your site with admin auth. Use one of:
   - **x-orch-token (recommended)** Set `ORCH_TOKEN` or `X_ORCH_TOKEN` in the Worker (secret). In
     the GPT’s Actions → Authentication → API Key, set the key value to that token. The same token
     works for both `/api/execute` and `/api/admin/trigger-deploy`.
   - **Bearer token** Set `ADMIN_BEARER_TOKEN` in the Worker (secret). The GPT sends
     `Authorization: Bearer <token>` (often via a second auth or instruction).
   - **Admin cookie** After logging in to the admin once in a browser (fragile if it expires).

## What the Custom GPT must do

1. **Make the change** Edit the right files (e.g. home page, `index.html` or React entry, add a
   video embed).

2. **Commit and push to `main`** Use the GitHub API (with a token you give the GPT that has
   `contents: write` on this repo):
   - Create a commit with the changes.
   - Push to `main` (or open a PR and merge; either way, `main` should get the new commit).

3. **Trigger deploy** Call your site:

   ```http
   POST https://voicetowebsite.com/api/admin/trigger-deploy
   Authorization: Bearer <ADMIN_BEARER_TOKEN>
   Content-Type: application/json
   ```

   (If using cookie auth, send the same cookie the browser gets after admin login.)
   - Success (200): the Worker called your deploy hook; your runner will pull, build, and deploy.
   - 401: auth failed (wrong or missing token/cookie).
   - 503: `ALLOW_REMOTE_DEPLOY_TRIGGER` or `CF_DEPLOY_HOOK_URL` not set.

4. **Tell the user** e.g. “Change is committed and pushed; deploy has been triggered. It should be
   live in a minute or two once the runner finishes.”

## Copy-paste instructions for your Custom GPT

Put this in your Custom GPT’s instructions (and fill in the placeholders):

```text
When the user asks you to change their VoiceToWebsite site (e.g. add a video, edit the home page, change content):

1. Edit the repo files as needed (you have access via the GitHub API / repo context).
2. Commit the changes and push to the `main` branch using the GitHub API and the token the user provided.
3. Trigger an immediate deploy by sending a POST request to:
   https://voicetowebsite.com/api/admin/trigger-deploy
   with header: Authorization: Bearer <user's ADMIN_BEARER_TOKEN>
   and Content-Type: application/json.
4. Confirm to the user: "Changes are pushed to main and deploy has been triggered; the site will update in about 1–2 minutes."
```

Replace `https://voicetowebsite.com` with your real domain if different. The user must give the GPT:

- A GitHub token (repo write).
- The value of `ADMIN_BEARER_TOKEN` (as a secret instruction) so the GPT can call
  `/api/admin/trigger-deploy`.

## Deploy runner script

The repo includes `scripts/remote-deploy.mjs`. It:

- Assumes it’s run from the repo root or from `scripts/`.
- Runs: `git fetch origin main && git checkout main && git pull origin main`, then `npm ci`,
  `npm run build`, `npx wrangler deploy --keep-vars`.
- Requires env: `CF_API_TOKEN` (or `CLOUDFLARE_API_TOKEN`) and `CF_ACCOUNT_ID` (or
  `CLOUDFLARE_ACCOUNT_ID`).

Your deploy runner (serverless or small server) should run this script when it receives the POST
from the Worker (when the GPT calls `/api/admin/trigger-deploy`).

## Summary

| Step | Who         | What                                                                                                                              |
| ---- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1    | You         | Set up deploy runner; set `ALLOW_REMOTE_DEPLOY_TRIGGER=1` and `CF_DEPLOY_HOOK_URL`; give GPT GitHub token + `ADMIN_BEARER_TOKEN`. |
| 2    | GPT         | Edits repo, commits, pushes to `main`.                                                                                            |
| 3    | GPT         | POSTs to `https://voicetowebsite.com/api/admin/trigger-deploy` with Bearer token.                                                 |
| 4    | Worker      | POSTs to your `CF_DEPLOY_HOOK_URL`.                                                                                               |
| 5    | Your runner | Runs `scripts/remote-deploy.mjs` → pull, build, wrangler deploy → site is live.                                                   |

No GitHub Actions are required; deploy is triggered by the API call and your runner.
