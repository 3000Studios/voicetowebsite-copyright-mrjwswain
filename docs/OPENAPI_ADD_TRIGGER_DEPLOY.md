# Add triggerDeploy to Your Custom GPT OpenAPI Schema

**Easiest:** Use the full schema in **`docs/openapi-voicetowebsite.json`**. Copy its contents (or
import from URL if your GPT builder supports it) into Edit actions → Schema. It includes `/health`,
`/execute`, and `/admin/trigger-deploy`. Then set Authentication → API Key to your ORCH_TOKEN.

---

Your schema is correct for `/health` and `/execute`. Two things to change:

---

## 1. Fill in the API Key (required)

In **Edit actions** → **Authentication** → **API Key**, enter the value your Worker expects:

- **Recommended:** Your **ORCH_TOKEN** (or **X_ORCH_TOKEN**) from the Worker’s env. The GPT will
  send it as the `x-orch-token` header. This same token now works for both `/api/execute` and
  `/api/admin/trigger-deploy`.
- Alternatively, if you use Bearer for the execute endpoint, use that token and ensure the schema’s
  security scheme matches (e.g. Bearer).

If this field is empty, the GPT will get **401 Unauthorized** on execute and trigger-deploy.

---

## 2. Add the triggerDeploy action (optional but recommended)

To let the GPT trigger a code deploy after pushing changes (without GitHub Actions), add this path
to your schema’s **paths** object.

In the **Schema** text area, find the closing of the `/execute` block so it looks like:

```json
    "/execute": {
      "post": { ... }
    }
  },
  "components": {
```

Change it to (add a comma after the `}` that closes `"/execute"`, then add this block):

```json
    "/execute": {
      "post": { ... }
    },
    "/admin/trigger-deploy": {
      "post": {
        "operationId": "triggerDeploy",
        "tags": ["Orchestration"],
        "summary": "Trigger remote code deployment via deploy hook",
        "description": "Triggers the configured deploy runner to pull, build, and deploy the latest code. Use after pushing changes to main. Auth: x-orch-token (same as execute).",
        "security": [{ "OrchestratorToken": [] }],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "commit": { "type": "string", "description": "Optional commit hash (default: latest)." },
                  "intent": {
                    "type": "object",
                    "properties": {
                      "source": { "type": "string", "enum": ["custom_gpt"] },
                      "ts": { "type": "string", "format": "date-time" }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Deploy triggered",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "ok": { "type": "boolean" },
                    "status": { "type": "integer" },
                    "body": { "type": "object" }
                  }
                }
              }
            }
          },
          "401": { "description": "Unauthorized." },
          "502": { "description": "Deploy hook request failed." },
          "503": { "description": "Deploy hook not configured." }
        }
      }
    }
  },
  "components": {
```

After saving, the GPT will show **triggerDeploy** in **Available actions** and can call it with the
same API Key (x-orch-token) as execute.

---

## Summary

| Item                         | Action                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| **Authentication → API Key** | Set to your **ORCH_TOKEN** (or **X_ORCH_TOKEN**) value.                                       |
| **Schema → paths**           | Add a comma after the `"/execute"` block and paste the `"/admin/trigger-deploy"` block above. |

Worker change: `/api/admin/trigger-deploy` now accepts **x-orch-token** in addition to Bearer and
admin cookie, so one token works for both execute and trigger-deploy.
