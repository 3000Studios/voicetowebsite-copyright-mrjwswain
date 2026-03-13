**VoiceToWebsite Continue Setup**

The workspace Continue setup is now local-first, repo-aware, and aligned with the deployment lock in
`AGENTS.md`.

**What changed**

- Removed the broken placeholder OpenAI agent profile.
- Kept Ollama as the primary fast path for chat, edit, and autocomplete.
- Added a local memory MCP server instead of the failing remote `memory-mcp` dependency.
- Routed MCP servers through PowerShell launchers so Continue does not depend on brittle PATH
  resolution.
- Updated the workspace agent to use the repo-safe command flow: `npm run verify` -> `npm run ship`
  -> `npm run ship:push` -> `npm run deploy:live`
- Pinned VS Code Vitest to the current `node.exe` path used by this machine.

**Recommended Continue UI settings**

- `Multiline Autocompletions`: `Auto`
- `Autocomplete Timeout (ms)`: `150`
- `Autocomplete Debounce (ms)`: `250`
- `Disable autocomplete in files`: `**/*.{txt,md,log}`
- `Add Current File by Default`: `On`
- `Enable experimental tools`: `On`
- `Only use system message tools`: `Off`
- `@Codebase: use tool calling only`: `Off`
- `Stream after tool rejection`: `Off`

**Profiles**

- `Workspace Autonomous Agent`: heavier repo work, verification, and release-safe operations
- `VoiceToWebsite Fast Edit`: faster day-to-day code and UI edits

**Local MCP servers**

- `memory`
- `project-context`
- `ui-commands`

They are launched from:

- `scripts/continue-mcp-memory.ps1`
- `scripts/continue-mcp-project.ps1`
- `scripts/continue-mcp-ui-commands.ps1`

**Quick start**

1. Make sure Ollama is running on `http://localhost:11434`.
2. Pull the local models you actually want to use.
3. Set `OPENAI_API` only if you want the hosted fallback profile.
4. Reload Continue so it re-reads `.continue/config.yaml`, `.continue/agents`, and
   `.continue/mcpServers`.
5. Run the doctor script:

```powershell
pwsh -NoLogo -NoProfile -File .\scripts\continue-doctor.ps1
```

If the doctor script is green, the Continue side of this workspace is ready.
