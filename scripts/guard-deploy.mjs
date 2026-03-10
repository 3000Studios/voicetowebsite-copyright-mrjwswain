#!/usr/bin/env node
/**
 * Guard-deploy: no-op compatibility shim.
 * The canonical live path is npm run deploy:live; CI currently verifies only.
 * Kept for backward compatibility if any script still invokes guard:deploy.
 */
console.log(
  "guard-deploy: OK (use npm run deploy:live for production deploys)"
);
