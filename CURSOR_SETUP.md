# Cursor Setup (Free-First + BYO API)

This workspace is now configured for a safe default in Cursor:

- No auto-commit or auto-push from editor settings
- Lower memory overhead for smoother performance
- Free local AI defaults via Ollama in `.continue/config.yaml`

## 1) Free Mode (no paid API required)

Install and run Ollama, then pull models:

```powershell
ollama pull qwen2.5-coder:7b
ollama pull llama3.2:3b
ollama pull nomic-embed-text
ollama serve
```

Then use Continue in Cursor with the default models from `.continue/config.yaml`.

## 2) Use Your API Keys (optional)

Set API keys in your local environment (not committed files):

```powershell
setx OPENAI_API "your_openai_key_here"
```

Restart Cursor after setting env vars so extensions can read them.

The Continue model `OpenAI GPT-4o Mini (BYO API)` is already defined and can be selected in
Continue.

## 3) Files updated in this repo

- `.vscode/settings.json`
- `.continue/config.yaml`
- `.continue/agents.yaml`

## 4) Security note

Do not place real API keys into tracked files like `.env`, `ENV.example`, or YAML configs committed
to git.
