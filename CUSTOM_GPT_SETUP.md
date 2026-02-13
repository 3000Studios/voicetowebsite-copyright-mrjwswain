# Custom GPT Setup (Execute API v2)

## 1. Deploy Worker

Run:

```powershell
npm run deploy
```

## 2. Configure GPT Action Schema

In your Custom GPT settings:

1. Go to **Configure → Actions → Create new action**.
2. Paste the contents of `ops/contracts/openapi.execute.json` into the schema field.
3. Under **Authentication**, select **API Key**, header name `x-orch-token`, and paste your `ORCH_TOKEN` secret value.
4. The schema already points to `https://voicetowebsite.com/api` — no URL changes needed.

## 3. Configure Deployment Trigger (Required for voice → live deploy)

Set one of these Worker environment options:

- `CF_DEPLOY_HOOK_URL` (preferred explicit deploy hook), or
- `CF_WORKERS_BUILDS_AUTO_DEPLOY=1` (if Cloudflare Workers Builds is connected to `main`).

Without one of these, apply/deploy can commit but deployment status will be `skipped`.

If using Workers Builds auto-deploy, also set Build settings in Cloudflare:

- Worker → Settings → Build → API token: select a valid token named `VOICETOWEBSITE_WORKERS_BUILD_TOKEN`.
- Build variable `CLOUDFLARE_ACCOUNT_ID` must be set to your Cloudflare account id.
- Keep production branch set to `main`.

## 4. Required Instruction Block in Custom GPT

Paste this into your Custom GPT's **Instructions** field:

```
You are the VoiceToWebsite operator. You manage voicetowebsite.com through the executeCommand action.

RULES:
1. For ANY user request to change the site, IMMEDIATELY call executeCommand with action="auto". Do NOT ask for confirmation. Do NOT preview first. Just do it.
2. The "auto" action plans, applies, and deploys in ONE call. No confirmToken needed.
3. Always generate a unique idempotencyKey for each request (format: auto-description-YYYYMMDD-NN).
4. After every change, briefly confirm what was done and mention the deployment status.
5. Use action="list_pages" to see what pages exist.
6. Use action="read_page" with page="filename.html" to inspect current content.
7. Use action="status" to check deployment health.
8. Use action="rollback" only if the user asks to undo (requires a confirmToken from a preview call).
9. For page-specific changes, set the "page" field (e.g. "store.html", "pricing.html").
10. For site-wide changes, set page="all".
11. Put the full natural-language description of the change in the "command" field. Be specific with exact text, URLs, CSS, theme names.
12. Never ask the user to confirm before making changes — they want instant execution.

SUPPORTED CHANGES (use in command field):
- Update headline/subhead/cta text
- Change theme (ember/ocean/volt/midnight)
- Add new pages
- Insert sections, videos, images, livestreams
- Add products
- Inject custom CSS
- Update background video, wallpaper, avatar
- Update meta title/description
- Change fonts

EXAMPLES:
- User: "Change the headline to Welcome Home" → call auto with command="Update headline to Welcome Home"
- User: "Make the site dark" → call auto with command="Change theme to midnight"
- User: "Add an about page" → call auto with command="Add page About with headline About Us and body Learn more about our mission."
- User: "What pages do I have?" → call list_pages
- User: "What's on the homepage?" → call read_page with page="index.html"
```

## 5. How It Works (v2 Auto Mode)

The `auto` action is the key improvement. When ChatGPT sends:

```json
{
  "action": "auto",
  "idempotencyKey": "auto-headline-20260211-01",
  "command": "Update homepage hero headline to Build Faster on the Edge",
  "target": "site",
  "actor": "custom-gpt"
}
```

The API will:

1. Parse the command using AI or fallback regex
2. Generate a plan (what files to change, what actions to take)
3. Apply the changes via GitHub API (commit to main)
4. Trigger deployment (via deploy hook or Workers Builds)
5. Return the result with `autoMode: true` and deployment status

All in **one single API call** — no preview, no confirmToken, no multi-step dance.

## 6. First Live Verification

From your Custom GPT chat:

1. Say: "Check the site status"
2. When prompted, click **"Always allow"** for the action call.
3. Confirm the tool call returns a `200` event payload.
4. Then try: "Change the homepage headline to Hello World" — it should execute instantly.

## 7. Available Actions Reference

| Action       | Purpose                                   | Needs command? | Needs confirmToken? |
| ------------ | ----------------------------------------- | -------------- | ------------------- |
| `auto`       | **PREFERRED** — instant plan+apply+deploy | Yes            | No                  |
| `list_pages` | List all site pages                       | No             | No                  |
| `read_page`  | Read content of a specific page           | No             | No                  |
| `status`     | Check deployment health                   | No             | No                  |
| `plan`       | Plan changes (dry run)                    | Yes            | No                  |
| `preview`    | Plan + get confirmToken                   | Yes            | No                  |
| `apply`      | Apply a previewed change                  | Yes            | Yes                 |
| `deploy`     | Deploy latest changes                     | No             | Yes                 |
| `rollback`   | Undo last production change               | No             | Yes                 |
