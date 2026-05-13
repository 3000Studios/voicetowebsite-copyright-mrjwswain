# Deploy from dashboard & fixing the 500 binding error

## "Static assets binding is missing on this Worker route"

**What it means:** The Worker script is running, but the **ASSETS** binding (static files from
`dist/`) is not attached to the Worker that is serving your domain. So the Worker cannot serve the
site’s HTML/JS/CSS.

**Why it happens:** The route (e.g. `voicetowebsite.com/*`) is either attached to a different Worker
that wasn’t deployed with your repo’s `wrangler.toml`, or the deploy that’s live didn’t include the
assets config (e.g. a build that only uploads script, not `assets`).

**How to fix it:**

1. **Redeploy from this repo so the same Worker gets the ASSETS binding**
   - From your machine: run `npm run build` then `npm run deploy` (or
     `npx wrangler deploy --keep-vars`) from the repo that has `wrangler.toml` with:
     ```toml
     assets = { directory = "dist", binding = "ASSETS" }
     ```
   - That deploy uploads both the Worker script and the `dist/` folder and attaches the ASSETS
     binding. After that, the Worker serving your route will have `env.ASSETS` and the error goes
     away.

2. **If you use Workers Builds (Git → Cloudflare)**
   - In **Workers & Pages** → **voicetowebsite** → **Builds**, open the build configuration.
   - Ensure the build command runs **both**:
     - A step that produces `dist/` (e.g. `npm ci && npm run build`).
     - A step that deploys with Wrangler (e.g. `npx wrangler deploy` or `npm run deploy`), using the
       **same** `wrangler.toml` that contains the `assets` block.
   - If the build only runs `wrangler deploy` without building first, or uses a config without
     `assets`, the deployed Worker will not have the ASSETS binding.

3. **Confirm the route points to this Worker**
   - **Workers & Pages** → **voicetowebsite** → **Settings** → **Triggers** (or **Routes**).
   - Ensure `voicetowebsite.com/*` and `www.voicetowebsite.com/*` are assigned to the
     **voicetowebsite** Worker (the one you deploy from this repo), not another Worker.

After a correct deploy from this repo, the Worker that has the route will also have the ASSETS
binding and the message will stop appearing.

---

## 500 "Could not find binding to _BINDING_ on this Worker route"

**What it means:** Cloudflare is telling you the Worker that serves `voicetowebsite.com` is missing
a **binding** (e.g. `ASSETS`, `D1`, `KV`, `R2`, or a Durable Object). The `_BINDING_` in the message
is a placeholder; in real errors Cloudflare substitutes the actual binding name.

**Why it matters:** Until this is fixed, the site can return 500 on the first request that needs
that binding (often the very first request if `ASSETS` is missing).

**How to fix it:**

1. **Confirm how the Worker is deployed**
   - If you use **Workers Builds** (Git → Cloudflare): the deploy command must use `wrangler deploy`
     (e.g. `npm run build && npx wrangler deploy` or `npm run deploy`) so the same `wrangler.toml`
     (and its bindings) are used. Then the route and bindings stay in sync.
   - If you deploy with **wrangler** from your machine: run `npm run deploy` from the repo that has
     the correct `wrangler.toml`. That attaches D1, KV, R2, ASSETS, Durable Objects, etc. to the
     Worker.

2. **Check the route**
   - In **Workers & Pages** → your Worker → **Settings** → **Triggers** (or **Routes**), ensure
     `voicetowebsite.com/*` (and `www.voicetowebsite.com/*` if used) points to **this** Worker (the
     one that has all bindings in `wrangler.toml`), not an old or different Worker.

3. **Do not remove bindings from `wrangler.toml`** The Worker expects: `ASSETS`, `D1`, `KV`, `R2`,
   `AI`, and Durable Objects (`BOT_HUB`, `DEPLOY_CONTROLLER`, `LIVE_ROOM`, `AUDIT_LOG`). If any are
   missing in production, you get the binding error.

---

## Deploy from dashboard and Custom GPT (Workers Builds API)

To have the **dashboard** or your **Custom GPT** trigger a new build/deploy (so changes go live on
voicetowebsite.com) when you don’t use a simple webhook URL:

1. **Set Worker secrets in Cloudflare**
   - **Workers & Pages** → **voicetowebsite** → **Settings** → **Variables and Secrets**.
   - Ensure **Variables**: `ALLOW_REMOTE_DEPLOY_TRIGGER` = `1` (already in `wrangler.toml`; override
     only if needed).
   - Add **Secret**: `CF_DEPLOY_HOOK_URL` = Cloudflare Builds API URL (see below).
   - Add **Secret**: `CLOUD_FLARE_API_TOKEN` = a Cloudflare API token with permissions to trigger
     builds (e.g. Workers Scripts edit, Account read).

2. **Use the Workers Builds API URL as deploy hook** Use this URL as the value of
   `CF_DEPLOY_HOOK_URL` (replace the account ID if yours is different):

   ```text
   https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/workers/services/voicetowebsite/builds
   ```

   Get **YOUR_ACCOUNT_ID** from the Cloudflare dashboard URL when you’re in Workers & Pages (e.g.
   `d6ec056b27a57bcf807a46b2e3379d60`).

3. **How it’s used**
   - When you click **Deploy** from the dashboard (or your Custom GPT triggers a deploy), the Worker
     calls this URL with `POST` and sends **Authorization: Bearer &lt;CLOUD_FLARE_API_TOKEN&gt;**.
   - That triggers a new Workers Build; when the build finishes, the latest code is deployed and
     your changes go live.

4. **Custom GPT / voice**
   - Your Custom GPT should call the execute API with a deploy-related command (e.g. apply +
     deploy). The backend uses `CF_DEPLOY_HOOK_URL` + `CLOUD_FLARE_API_TOKEN` to trigger the build.
     No need to paste Gemini’s script into the Worker; the repo already supports this when the two
     secrets are set.

**Summary:** Set `CF_DEPLOY_HOOK_URL` to the Cloudflare Builds API URL above and set
`CLOUD_FLARE_API_TOKEN` in the Worker’s Variables and Secrets. Then dashboard and Custom GPT deploys
can trigger builds without breaking your current deployment.
