# What to Put in Your Custom GPT to Make It Work

**VoiceToWebsite Commander (this project’s GPT):**
[https://chatgpt.com/g/g-698a3140739c819196fda7f3badb2754-voicetowebsite-commander](https://chatgpt.com/g/g-698a3140739c819196fda7f3badb2754-voicetowebsite-commander)

Use this checklist to configure your Custom GPT so it can change your site and (optionally) trigger
deploy.

---

## 1. Instructions (required)

**Where:** Custom GPT → Configure → **Instructions**

**What to paste:** One of these. (Instructions are limited to 8000 characters; use short block +
Knowledge if needed.)

| Option                           | File to copy from                                                           | Use when                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Full behavior + UI/UX**        | `docs/CUSTOM_GPT_UI_UX_BRIEF.md`                                            | You want natural language, media, monetization, evolution to-do, etc.                           |
| **Compact + scoring + deploy**   | `docs/CUSTOM_GPT_FULL_CONFIG.md` → “SINGLE COMBINED INSTRUCTIONS BLOCK”     | You want one block with scoring, brand memory, deploy logic                                     |
| **Both**                         | Paste **UI_UX_BRIEF** first, then **FULL_CONFIG** combined block at the end | Maximum behavior in one Instructions field                                                      |
| **Short (under 8K) + Knowledge** | `docs/CUSTOM_GPT_INSTRUCTIONS_UNDER_8K.md` → copy the code block only       | **Recommended.** Fits 8K limit; attach `CUSTOM_GPT_UI_UX_BRIEF.md` as Knowledge for full rules. |

**Minimum that works:** Paste the **short block** from
**`docs/CUSTOM_GPT_INSTRUCTIONS_UNDER_8K.md`** into Instructions (under 8K), then in **Knowledge**
upload **`docs/CUSTOM_GPT_UI_UX_BRIEF.md`**. That gives the GPT full behavior without exceeding the
character limit.

---

## 2. Capabilities to turn on

**Where:** Custom GPT → Configure → **Capabilities**

- **Code Interpreter** — On (so it can reason about code and suggest edits).
- **Web Browsing** — Optional (only if you want it to look up docs).
- **DALL·E / Image** — Optional (only if you want it to suggest or reference images).

---

## 3. How the GPT can actually change your site

Custom GPTs **cannot** push to GitHub or call your API by themselves. You have two patterns:

### Option A: You apply the changes (simplest)

- **Instructions:** Use `CUSTOM_GPT_UI_UX_BRIEF.md` (and optionally `CUSTOM_GPT_FULL_CONFIG.md`).
- **Flow:** You describe what you want → GPT gives you production-ready HTML/CSS/JS and tells you
  which file to edit → you (or Cursor) paste the code and run `npm run ship` or `npm run deploy`
  locally.
- **Nothing else to put in the GPT.** No tokens, no APIs. Just the Instructions (and optional
  Conversation starters).

### Option B: GPT triggers deploy via your site (needs setup)

So the GPT can “push and go live” you need:

1. **Something that can push to GitHub**
   - Either you give the GPT a **GitHub token** (in Instructions or as a “secret” instruction) and
     tell it to use the GitHub API to create a commit and push to `main`,
   - Or the GPT outputs the diff/code and you push (or a different tool pushes).

2. **Something that runs deploy**
   - Either you run **`npm run ship`** or **`npm run deploy`** yourself after the GPT gives you
     code,
   - Or you set up the **deploy hook** (see below) so the GPT can call your site to trigger deploy.

3. **If you want the GPT to trigger deploy via your site:**
   - In **Instructions**, add the block from **`docs/CUSTOM_GPT_DEPLOY.md`** → “Copy-paste
     instructions for your Custom GPT” (the 4-step flow: edit → commit/push → POST to
     `/api/admin/trigger-deploy` → confirm).
   - In **Cloudflare Worker** env: set `ALLOW_REMOTE_DEPLOY_TRIGGER=1` and
     `CF_DEPLOY_HOOK_URL=<URL of your deploy runner>`.
   - In **Worker secrets**: set `ADMIN_BEARER_TOKEN` to a secret value.
   - In the GPT’s **Instructions** (or in a private “secret” instruction): tell the GPT the **site
     URL** (e.g. `https://voicetowebsite.com`) and: “When triggering deploy, send:
     `Authorization: Bearer <ADMIN_BEARER_TOKEN>`” (paste the real token where it says that).
   - Your **deploy runner** (server or serverless that receives the hook) runs
     `node scripts/remote-deploy.mjs` with `CF_API_TOKEN` and `CF_ACCOUNT_ID` set.

So **what to put in the Custom GPT** for Option B:

- Instructions: UI/UX brief + deploy 4-step flow from `CUSTOM_GPT_DEPLOY.md`.
- Secret instruction (or a single private note in Instructions): “Site URL: https://yourdomain.com.
  When calling the deploy trigger, use Authorization: Bearer YOUR_TOKEN_HERE.”
- If the GPT can use a GitHub token: add a note like “Use this GitHub token for repo writes:
  ghp_xxx” (store the token in a secret instruction, not in public Instructions).

---

## 4. Conversation starters (optional)

**Where:** Custom GPT → Configure → **Conversation starters**

Add 2–3 so the GPT knows your site and flow, e.g.:

- “Audit the home page and suggest the top 3 improvements.”
- “Add a hero video and keep performance green.”
- “How do I make money on this page? Then implement option 2.”

---

## 5. Quick checklist

| What                      | Where                              | Action                                                                                              |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Instructions**          | Configure → Instructions           | Paste `CUSTOM_GPT_UI_UX_BRIEF.md` (and optionally combined block from `CUSTOM_GPT_FULL_CONFIG.md`). |
| **Deploy flow**           | Same Instructions                  | If you use deploy hook, add the 4-step deploy block from `CUSTOM_GPT_DEPLOY.md`.                    |
| **Site URL + token**      | Secret instruction or private note | Only if GPT triggers deploy: site URL + `Authorization: Bearer <ADMIN_BEARER_TOKEN>`.               |
| **GitHub token**          | Secret instruction                 | Only if you want the GPT to push via API (and your GPT supports it).                                |
| **Code Interpreter**      | Capabilities                       | Turn on.                                                                                            |
| **Conversation starters** | Configure                          | Optional; add 2–3 for your site.                                                                    |

---

## 6. Minimal “make it work” setup

If you only want the GPT to **give you the right code and behavior** and you’ll run deploy yourself:

1. Open **`docs/CUSTOM_GPT_UI_UX_BRIEF.md`**.
2. Copy **all** of it.
3. In Custom GPT → Configure → **Instructions**, paste that content.
4. Turn **Code Interpreter** on.
5. Save.

Then you ask the GPT for changes; it gives you production-ready code and file names; you (or Cursor)
apply the edits and run **`npm run ship`** or **`npm run deploy`** locally. No deploy hook or tokens
in the GPT required.
