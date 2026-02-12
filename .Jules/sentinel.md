## 2026-05-20 - Async Promise Check Bypass
**Vulnerability:** A critical security bypass was found in `worker.js` where an async function `verifySignedUrl` was called inside an `if` condition without `await`.
**Code:** `if (!verifySignedUrl(...))` evaluates the Promise object (which is truthy), so `!Promise` is `false`, skipping the error handling block and allowing invalid signatures to pass.
**Learning:** In JavaScript/TypeScript, always `await` async functions in boolean contexts. `if (asyncFn())` checks if the Promise *exists*, not the result of the function.
**Prevention:** Use `await` for all async calls. Enable linting rules like `no-async-promise-executor` or `@typescript-eslint/no-misused-promises` to catch this automatically.

## 2026-05-20 - Hardcoded Secrets with Insecure Defaults
**Vulnerability:** The same function used a hardcoded fallback secret `"default-secret-change-in-production"` if the environment variable was missing.
**Learning:** Never provide insecure defaults for security-critical secrets. It's better to crash (fail secure) than to run insecurely.
**Prevention:** Throw an error if a required secret is missing during initialization or execution.
