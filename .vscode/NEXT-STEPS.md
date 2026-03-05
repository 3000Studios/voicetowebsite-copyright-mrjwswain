# Next Steps (run in a terminal where Node/npm are available)

## 1. Fix deploy auth (one-time)

In PowerShell or your normal dev terminal:

```powershell
npx wrangler login
```

Sign in in the browser. Then deploy works:

```powershell
npm run deploy
```

(Or use an API token: see **DEPLOYMENT.md** → "Fix Authentication failed [code: 9106]".)

---

## 2. Run verify (before every deploy)

```powershell
nvm use 20   # or fnm use 20, or ensure Node 20 is active
npm run verify
```

Fix any failures, then commit/push/deploy.

---

## 3. Local dev + API tests

**Terminal 1 – start Worker:**

```powershell
npx wrangler dev --local
```

Wait for: `Ready on http://127.0.0.1:8787`.

**In the editor:** Open **`.vscode/api-tests.http`** and click **Send Request** above any `###`
block (REST Client extension).

**Smoke test in browser:** Open **http://127.0.0.1:8787** and click through the site.

---

## 4. Run tests (Vitest)

From the **Testing** sidebar (Vitest extension), run all tests, or from terminal:

```powershell
npm test -- --run
```
