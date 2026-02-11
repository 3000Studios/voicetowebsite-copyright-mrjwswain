# Custom GPT Setup (Execute API)

## 1. Deploy Worker

Run:

```powershell
npm run deploy
```

Capture the stable Worker URL after deploy (for example: `https://<your-worker>.workers.dev`).

## 2. Configure GPT Action Schema

Use `ops/contracts/openapi.execute.json` and set:

- `servers[0].url` to your deployed Worker API base (`https://<your-worker>.workers.dev/api`), or keep `https://voicetowebsite.com/api` if routing through the domain.
- Security header `x-orch-token` value to `supersecret` (or your configured `ORCH_TOKEN` secret).

## 3. Required Instruction Block in Custom GPT

Keep this instruction in your GPT:

- "You must call `executeCommand` for every plan/preview/apply/deploy/status/rollback request before answering."

## 4. First Live Verification

From GPT preview chat:

1. Run: "Verify the current production build."
2. When prompted, click "Always allow" for the action call.
3. Confirm the tool call returns a `200` event payload.
4. For any apply/deploy/rollback call, reuse the same `idempotencyKey` from preview.
