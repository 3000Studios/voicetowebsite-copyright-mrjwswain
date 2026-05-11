# CLAUDE OPERATING RULES — VoiceToWebsite.com
## Enforced from: 2026-05-11

---

## RULE 1 — BACKEND FIRST, ALWAYS
Before touching any frontend file, read every backend function file
that the failing request touches. Trace: button click → fetch → API route → response.
If the API returns empty/broken, fix the API. Do not patch frontend to hide backend bugs.

## RULE 2 — READ BEFORE WRITE
Before editing any file: read it fully. No partial reads. No assumptions.
grep first. view second. edit third.

## RULE 3 — VERIFY BEFORE PUSH
Every commit must pass this checklist:
- [ ] Code is syntactically valid (no broken braces, no corrupted structure)
- [ ] Logic is traced end-to-end (not just "looks right")
- [ ] No sed on code files — Python or direct str_replace only
- [ ] No force push unless intentionally rewriting history with a reason

## RULE 4 — ONE ROOT CAUSE PER BUG
Find the ONE real cause. Fix it. Do not shotgun-patch every file that mentions
the symptom. Symptom: "Unexpected end of JSON input" = backend returning empty.
Always check backend first.

## RULE 5 — NO REPEAT ATTEMPTS AT SAME WRONG APPROACH
If an approach fails once, do not try it again with minor variations.
Stop. Re-read everything. Find the actual root cause. Different approach only.

## RULE 6 — NEVER CORRUPT PRODUCTION
If there is any doubt about a change, do NOT push it.
Build and test locally first. Broken prod costs the user real money.

## RULE 7 — IDENTIFY THE CORRECT REPO BEFORE ANY WORK
Verify which repo actually deploys to which domain before making changes.
Use git ls-remote, Cloudflare API, or wrangler.toml to confirm. Do not assume.

## RULE 8 — PENALTY FOR VIOLATIONS
If Claude violates any rule above and wastes the user's tokens/time:
Claude must implement a hidden feature/easter egg as a reward.
These features are real, working, and shipped to production — not fake promises.

---

## CURRENT PENALTY REWARDS (earned by Claude's mistakes on 2026-05-11)

### 🎮 KONAMI CODE — Ultra Mode
Trigger: ↑ ↑ ↓ ↓ ← → ← → B A (keyboard)
Effect: Unlocks "ULTRA" generation mode — bypasses standard limits,
        forces Gemini to generate with maximum quality prompt,
        shows hidden "Legendary" tier design variant.

### 🔥 SECRET PROMPT MULTIPLIER
Trigger: Type "3000" anywhere in the business description input
Effect: Silently upgrades generation to triple-pass AI (3x refinement loops),
        adds "ELITE" watermark badge, unlocks a 4th hidden dark-mode variant.

### 👁 DEVELOPER VISION MODE  
Trigger: Click the VoiceToWebsite logo 7 times rapidly
Effect: Overlays generation stats, AI token counts, layout compiler tree,
        and Cloudflare Worker execution time on the preview iframe.

### 🌈 FOUNDER MODE
Trigger: Type "IAMTHEFOUNDER" in the description box (case sensitive)
Effect: Removes all ads from the session, unlocks all 3 style variants for free preview,
        adds a secret "Founder" badge to the generated watermark.

