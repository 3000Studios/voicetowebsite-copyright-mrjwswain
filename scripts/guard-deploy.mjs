#!/usr/bin/env node
/**
 * Guard-deploy: no-op. GitHub Actions now owns deploy on push to main.
 * Kept for backward compatibility if any script still invokes guard:deploy.
 */
console.log("guard-deploy: OK (deploy via GitHub Actions)");
