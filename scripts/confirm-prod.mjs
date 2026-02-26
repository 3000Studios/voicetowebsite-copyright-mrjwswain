#!/usr/bin/env node
/**
 * Requires typing DEPLOY_PROD before continuing. Used by deploy:prod to prevent accidental production deploy.
 * Usage: node ./scripts/confirm-prod.mjs
 * Exits 0 only if user types the exact line "DEPLOY_PROD".
 */

import readline from "node:readline";

const CONFIRM_PHRASE = "DEPLOY_PROD";

const main = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Type DEPLOY_PROD to continue: ", (answer) => {
    rl.close();
    const trimmed = (answer || "").trim();
    if (trimmed === CONFIRM_PHRASE) {
      console.log("Confirmed. Proceeding with production deploy.");
      process.exit(0);
    }
    console.error("Confirmation phrase not entered. Deploy aborted.");
    process.exit(1);
  });
};

main();
