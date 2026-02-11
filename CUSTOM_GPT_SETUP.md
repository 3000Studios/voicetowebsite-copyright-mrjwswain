# Custom GPT Setup (Execute API)

## 1. Deploy Worker

Run:

```powershell
npm run deploy
```

Capture the stable Worker URL after deploy (for example: `https://<your-worker>.workers.dev`).

## 2. Configure GPT Action Schema

Use `ops/contracts/openapi.execute.json` and set:

- `servers[0].url` to `https://voicetowebsite.com/api` (production only).
- Security header `x-orch-token` value to `supersecret` (or your configured `ORCH_TOKEN` secret).

## 3. Configure Deployment Trigger (Required for voice -> live deploy)

Set one of these Worker environment options:

- `CF_DEPLOY_HOOK_URL` (preferred explicit deploy hook), or
- `CF_WORKERS_BUILDS_AUTO_DEPLOY=1` (if Cloudflare Workers Builds is connected to `main`).

Without one of these, apply/deploy can commit but deployment status will be `skipped`.

If using Workers Builds auto-deploy, also set Build settings in Cloudflare:

- Worker -> Settings -> Build -> API token: select a valid token named `VOICETOWEBSITE_WORKERS_BUILD_TOKEN`.
- Build variable `CLOUDFLARE_ACCOUNT_ID` must be set to your Cloudflare account id.
- Keep production branch set to `main`.

## 4. Required Instruction Block in Custom GPT

Keep this instruction in your GPT:

- "You must call `executeCommand` for every plan/preview/apply/deploy/status/rollback request before answering."

## 5. First Live Verification

From GPT preview chat:

1. Run: "Verify the current production build."
2. When prompted, click "Always allow" for the action call.
3. Confirm the tool call returns a `200` event payload.
4. For any apply/deploy/rollback call, reuse the same `idempotencyKey` from preview.
