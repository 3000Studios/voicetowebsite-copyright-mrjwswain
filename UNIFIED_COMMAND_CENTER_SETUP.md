# VoiceToWebsite Unified Command Center Setup

## Overview

This configuration unifies command control across **3 entry points**:

1. **Continue.dev Chat** (in VS Code)
2. **Custom GPT** (chat.openai.com)
3. **Voice Commands** (on voicetowebsite.com)

Any command spoken, typed, or written in these 3 places flows through a single unified API to modify
the website UI/UX in **real-time**.

---

## What's Configured

### ✓ Done Now

- [x] Continue.dev config enhanced with MCP servers and commands
- [x] VS Code settings with voice command shortcuts and Continue.dev integration
- [x] MCP Server for UI commands (`mcp-server-ui-commands.mjs`)
- [x] API endpoint handler (`src/functions/uiCommand.js`)
- [x] Voice command integration in `app.js`
- [x] Custom GPT system prompt (`CUSTOM_GPT_SYSTEM_PROMPT.mjs`)

### ✓ To Complete (Local Setup)

---

## Step 1: Deploy API Endpoint

The UI command API needs to be available on your worker:

```bash
# Add this to your wrangler.toml routes (if not already present)
[[routes]]
pattern = "voicetowebsite.com/api/ui-command"
zone_name = "voicetowebsite.com"
```

Then deploy:

```bash
npm run deploy
```

---

## Step 2: Set Up Continue.dev

### A. Install MCP Server Dependencies

```bash
# In your project root
npm install @modelcontextprotocol/sdk
```

### B. Configure Continue Dev

Your `.continue/config.yaml` is already updated with:

- MCP servers for UI commands
- Command definitions
- Voice command settings
- Custom hotkeys

The MCP servers reference local scripts:

- `mcp-server-ui-commands.mjs` - Handles UI commands
- `mcp-server-project.mjs` - Provides project context (create if needed)

### C. Test in Continue Chat

Open VS Code and open Continue.dev chat:

```
/ui-commands list-ui-commands

# Or try directly:
Set the headline to "Welcome to Voice Commands"
```

---

## Step 3: Set Up Custom GPT

### A. Create Custom GPT

1. Go to [chat.openai.com/gpts](https://chat.openai.com/gpts)
2. Click **"Create a GPT"**
3. Name: **"VoiceToWebsite Controller"**
4. Description: **"Control voicetowebsite.com UI/UX in real-time"**

### B. Add System Prompt

Copy the system prompt from `CUSTOM_GPT_SYSTEM_PROMPT.mjs` into the GPT's system prompt:

```
You are the VoiceToWebsite AI Controller. You have full access to modify the website UI...
[paste full content]
```

### C. Add Actions (Webhooks)

In the GPT configuration, add this webhook:

**Name:** `execute-ui-command` **URL:** `https://voicetowebsite.com/api/ui-command` **Method:**
`POST` **Schema:**

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "description": "UI command name"
    },
    "args": {
      "type": "object",
      "description": "Command arguments"
    },
    "source": {
      "type": "string",
      "enum": ["gpt"],
      "default": "gpt"
    }
  }
}
```

### D. Save & Share

- Save as **"Only me"** initially, or **"Everyone"** if you want public access
- Share the link anywhere you want to control the website

---

## Step 4: Voice Commands on Website

Voice commands are **already integrated** into `app.js`.

### Test It

1. Visit [voicetowebsite.com](https://voicetowebsite.com)
2. Look for a **"🎤 Start Voice"** button
3. Click it and say: **"Set headline to Welcome"**

### Supported Voice Patterns

```
"Set headline to [text]"
"Update cta to [text]"
"Apply theme ocean"
"Toggle testimonials"
"Show modal contact-modal"
```

---

## Step 5: Command Usage

### From Continue.dev Chat

```
> Set the headline to "AI-Powered"
✓ UI Command executed: set-headline

> What's the current price?
$ Current UI State: price: ""

> Apply the ocean theme
✓ UI Command executed: apply-theme
```

### From Custom GPT

```
User: "Change the main headline to 'Try Our AI'"
GPT: I'll update that for you now.
→ Calls webhook: execute-ui-command(action="set-headline", args={value:"Try Our AI"})
✓ Headline updated
```

### From Voice on Website

```
User: [clicks 🎤 button] "Update CTA to Get Started"
↓
Voice recognition captures: "Update CTA to Get Started"
↓
parseVoiceCommand() → {action: "set-cta", args: {value: "Get Started"}}
↓
commandHandler.execute("set-cta", {value: "Get Started"}, "voice")
↓
POST /api/ui-command with payload
↓
UI updates instantly
```

---

## Advanced

### Available Commands

| Command               | Usage                  | Source |
| --------------------- | ---------------------- | ------ |
| `set-headline`        | `set-headline {value}` | All 3  |
| `set-cta`             | `set-cta {value}`      | All 3  |
| `apply-theme`         | `apply-theme {theme}`  | All 3  |
| `toggle-testimonials` | `toggle-testimonials`  | All 3  |
| `show-modal`          | `show-modal {name}`    | All 3  |
| `get-state`           | Query current state    | All 3  |
| `list-commands`       | Show all commands      | All 3  |

### Add New Commands

1. Add to `mcp-server-ui-commands.mjs` in the `runCommand()` function
2. Update `commandHandler.parseVoiceCommand()` in `app.js` for voice support
3. Add to Custom GPT system prompt examples
4. Update handler in `src/functions/uiCommand.js`

### Hotkeys in VS Code

```
Alt+Cmd+U → Execute UI command
Alt+Cmd+G → Get current state
Alt+Cmd+L → List UI commands
Alt+Cmd+V → Toggle voice commands
```

---

## Troubleshooting

### Voice Commands Not Working

- Check browser console for errors
- Ensure HTTPS (required for Web Speech API)
- Test: `console.log(commandHandler)` in browser console

### Continue.dev Not Recognizing Commands

- Ensure `mcp-server-ui-commands.mjs` exists and is executable
- Check `.continue/config.yaml` syntax
- Restart VS Code and Continue.dev

### Custom GPT Webhook Failing

- Verify API endpoint is deployed: `npm run deploy`
- Check request/response format in browser Network tab
- Ensure webhook URL is HTTPS

### Commands Not Persisting

- Check Cloudflare KV binding in `wrangler.toml`
- Verify `VTW_CACHE` KV namespace exists
- Test directly: `curl https://voicetowebsite.com/api/ui-command -d '...'`

---

## Testing Checklist

- [ ] Continue.dev chat can list commands
- [ ] Continue.dev chat can execute "set headline" command
- [ ] Custom GPT configured and responds to commands
- [ ] Voice on website: click 🎤, speak "Set headline to Test"
- [ ] Headline updates after voice command
- [ ] Commands appear in browser console logs
- [ ] API endpoint returns successful responses
- [ ] Deploy works without errors (`npm run verify && npm run deploy`)

---

## Files Modified/Created

```
.continue/config.yaml                    ← Updated with MCP & commands
.vscode/settings.json                    ← Added voice/Continue settings
app.js                                   ← Added unified command handler
mcp-server-ui-commands.mjs              ← NEW: MCP server for UI commands
src/functions/uiCommand.js              ← NEW: Command API handler
CUSTOM_GPT_SYSTEM_PROMPT.mjs            ← NEW: GPT system prompt
UNIFIED_COMMAND_CENTER_SETUP.md         ← This file
```

---

## Next Steps

1. **Deploy:** `npm run deploy`
2. **Test Continue.dev:** Open chat and try "set headline"
3. **Set Up Custom GPT:** Follow Step 3 above
4. **Test Voice:** Visit website and use 🎤 button
5. **Iterate:** Add more commands as needed

---

## Support

For issues:

1. Check browser console: `F12 → Console`
2. Check VS Code output: View → Output → Continue
3. Check deployment logs: `wrangler tail voicetowebsite.com`

All changes are automatically logged to `commandHistory` for auditing.

---

**Status:** ✅ Ready for deployment and testing

**Last Updated:** 2026-02-17

**Next Sync:** After first successful full test cycle
