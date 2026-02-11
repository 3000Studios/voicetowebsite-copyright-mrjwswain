# Clean GPT Setup Guide

## GPT Builder Configuration

**Name**: VoiceToWebsite Commander  
**Model**: GPT-4o (temperature 0.3)  
**Capabilities**: Web Search ON, others OFF

**Action Setup**:

- URL: `https://voicetowebsite.com/api/execute`
- Method: POST
- Auth: Custom header `x-orch-token`
- Schema: Upload `ops/contracts/openapi.execute.json`

**Instructions**: Paste content from `CUSTOM_GPT_INSTRUCTIONS_CLEAN.txt`

## Knowledge Base Upload (Critical Only)

Upload these 5 files:

1. `GLOBAL_SYSTEM_INSTRUCTIONS.md`
2. `ops/contracts/openapi.execute.json`
3. `styles.css`
4. `nav.js`
5. `AGENTS.md`

## Test Commands

**Status Check**:
"Check production status"

**Text Update**:
"Change headline to Welcome"

**Theme Change**:
"Change theme to ocean"

**High-Risk Change**:
"Create new pricing page"

## Done

That's it. No extra files, no long docs, no conflicting contracts.
