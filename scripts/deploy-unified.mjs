#!/usr/bin/env node
/**
 * Unified deploy — THE SINGLE PATH for deploying to production.
 *
 * Use this from Cursor, VS Code, Custom GPT, CLI, or any other entry point.
 * No matter where you start, run: npm run deploy:live
 *
 * This script runs: verify → deploy (wrangler). It does not commit or push;
 * do that separately with npm run ship && npm run ship:push if needed.
 */

import { spawnSync } from "node:child_process";
import {
  accessSync,
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Enhanced error handling and logging
class DeployError extends Error {
  constructor(message, step, code, originalError = null) {
    super(message);
    this.name = "DeployError";
    this.step = step;
    this.code = code;
    this.originalError = originalError;
    // Preserve original stack trace
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

function logStep(step, message) {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [${step}] ${message}`);
}

function logError(step, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] [${step}] ${error.message}`);
  if (error.code) {
    console.error(`[${timestamp}] [ERROR] [${step}] Exit code: ${error.code}`);
  }
  if (error.stdout) {
    console.error(`[${timestamp}] [ERROR] [${step}] STDOUT:\n${error.stdout}`);
  }
  if (error.stderr) {
    console.error(`[${timestamp}] [ERROR] [${step}] STDERR:\n${error.stderr}`);
  }
}

function run(name, cmd, args, opts = {}) {
  const fullCmd = [cmd, ...args].join(" ");
  logStep(name, `Starting: ${fullCmd}`);

  const startTime = Date.now();
  const env = {
    ...process.env,
    NODE_ENV: "production",
    CI: "true",
  };

  let result;
  if (process.platform === "win32" && cmd === "node") {
    result = spawnSync(process.execPath, args, {
      stdio: "inherit",
      shell: false,
      cwd: root,
      env,
      ...opts,
    });
  } else if (process.platform === "win32") {
    // On Windows, run via cmd.exe so npm/node are found in PATH (same pattern as deploy-safe.mjs).
    result = spawnSync("cmd.exe", ["/d", "/s", "/c", fullCmd], {
      stdio: "inherit",
      shell: false,
      cwd: root,
      env,
      ...opts,
    });
  } else {
    result = spawnSync(cmd, args, {
      stdio: "inherit",
      shell: false,
      cwd: root,
      env,
      ...opts,
    });
  }

  const duration = Date.now() - startTime;

  if (result.error) {
    const error = new DeployError(
      `Command failed to start: ${result.error.message}`,
      name,
      1,
      result.error
    );
    error.duration = duration;
    logError(name, error);
    throw error;
  }

  if (result.status !== 0) {
    const error = new DeployError(
      `Command failed with exit code ${result.status}`,
      name,
      result.status
    );
    error.duration = duration;
    logError(name, error);
    throw error;
  }

  logStep(name, `Completed successfully in ${duration}ms`);

  // Log output for debugging (only in development)
  // Fix: Use consistent environment detection
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment && result.stdout) {
    logStep(name, `Output:\n${result.stdout.toString()}`);
  }

  return result;
}

function resolveLocalBin(binDir, binName) {
  if (process.platform === "win32") {
    const cmdShim = path.join(binDir, `${binName}.cmd`);
    if (existsSync(cmdShim)) return cmdShim;
  }

  const directBin = path.join(binDir, binName);
  if (existsSync(directBin)) return directBin;

  return binName;
}

function runResolvedBin(binDir, binName, args, spawnOpts) {
  const executable = resolveLocalBin(binDir, binName);

  if (
    process.platform === "win32" &&
    executable.toLowerCase().endsWith(".cmd")
  ) {
    const cmdLine = [executable, ...args]
      .map((value) => `"${String(value).replaceAll('"', '\\"')}"`)
      .join(" ");

    return spawnSync("cmd.exe", ["/d", "/s", "/c", cmdLine], spawnOpts);
  }

  return spawnSync(executable, args, spawnOpts);
}

// Run verify steps using current Node (avoids broken npm in some Windows/nvm setups)
function runVerifySteps() {
  const node = process.execPath;
  const nodeDir = path.dirname(node);
  const binDir = path.join(root, "node_modules", ".bin");
  const pathSep = process.platform === "win32" ? ";" : ":";
  const env = {
    ...process.env,
    NODE_ENV: "production",
    CI: "true",
    PATH: nodeDir + pathSep + binDir + pathSep + (process.env.PATH || ""),
  };
  const spawnOpts = { stdio: "inherit", cwd: root, env, shell: false };

  // Steps in same order as package.json "verify" script
  const nodeStepsFirst = [
    ["verify (scripts)", [path.join(root, "scripts", "verify.mjs")]],
    ["env:audit", [path.join(root, "scripts", "env-audit.mjs")]],
    [
      "ops:global-doc:check",
      [path.join(root, "scripts", "update-global-system-doc.mjs"), "--check"],
    ],
  ];
  const binStepFormat = [
    "format:check",
    "prettier",
    ["--check", "--ignore-unknown", "."],
  ];
  const nodeStepsRest = [
    [
      "check:css-governance",
      [path.join(root, "scripts", "check-css-governance.mjs")],
    ],
    [
      "check:css-budget",
      [path.join(root, "scripts", "css-budget-validator.mjs"), "css"],
    ],
    [
      "governance:check",
      [path.join(root, "scripts", "validate-governance.mjs")],
    ],
    ["guard:ui", [path.join(root, "scripts", "guard-ui.mjs")]],
    ["check:links", [path.join(root, "link-checker.js")]],
  ];
  const binStepsRest = [
    ["type-check", "tsc", ["--noEmit"]],
    ["types:check", "wrangler", ["types", "--check"]],
    ["test", "vitest", ["run"]],
    ["build", "vite", ["build"]],
  ];

  for (const [name, args] of nodeStepsFirst) {
    logStep("verify", `Starting: ${name}`);
    const start = Date.now();
    const result = spawnSync(node, args, spawnOpts);
    if (result.error) {
      const err = new DeployError(
        `Command failed to start: ${result.error.message}`,
        "verify",
        1,
        result.error
      );
      logError("verify", err);
      throw err;
    }
    if (result.status !== 0) {
      const err = new DeployError(
        `Command failed with exit code ${result.status}`,
        "verify",
        result.status
      );
      logError("verify", err);
      throw err;
    }
    logStep("verify", `Completed ${name} in ${Date.now() - start}ms`);
  }

  const runBin = (name, binName, args) => {
    logStep("verify", `Starting: ${name}`);
    const start = Date.now();
    const result = runResolvedBin(binDir, binName, args, spawnOpts);
    if (result.error) {
      const err = new DeployError(
        `Command failed to start: ${result.error.message}`,
        "verify",
        1,
        result.error
      );
      logError("verify", err);
      throw err;
    }
    if (result.status !== 0) {
      const err = new DeployError(
        `Command failed with exit code ${result.status}`,
        "verify",
        result.status
      );
      logError("verify", err);
      throw err;
    }
    logStep("verify", `Completed ${name} in ${Date.now() - start}ms`);
  };

  runBin(...binStepFormat);

  for (const [name, args] of nodeStepsRest) {
    logStep("verify", `Starting: ${name}`);
    const start = Date.now();
    const result = spawnSync(node, args, spawnOpts);
    if (result.error) {
      const err = new DeployError(
        `Command failed to start: ${result.error.message}`,
        "verify",
        1,
        result.error
      );
      logError("verify", err);
      throw err;
    }
    if (result.status !== 0) {
      const err = new DeployError(
        `Command failed with exit code ${result.status}`,
        "verify",
        result.status
      );
      logError("verify", err);
      throw err;
    }
    logStep("verify", `Completed ${name} in ${Date.now() - start}ms`);
  }

  for (const [name, binName, args] of binStepsRest) {
    logStep("verify", `Starting: ${name}`);
    const start = Date.now();
    const result = runResolvedBin(binDir, binName, args, spawnOpts);
    if (result.error) {
      const err = new DeployError(
        `Command failed to start: ${result.error.message}`,
        "verify",
        1,
        result.error
      );
      logError("verify", err);
      throw err;
    }
    if (result.status !== 0) {
      const err = new DeployError(
        `Command failed with exit code ${result.status}`,
        "verify",
        result.status
      );
      logError("verify", err);
      throw err;
    }
    logStep("verify", `Completed ${name} in ${Date.now() - start}ms`);
  }
}

// Deployment lock to prevent concurrent deployments
const lockFile = path.join(root, ".deploy-lock");

function acquireLock() {
  try {
    // Check if lock already exists
    accessSync(lockFile);
    const lockContent = readFileSync(lockFile, "utf8");
    const lockTime = parseInt(lockContent);
    const now = Date.now();

    // If lock is older than 10 minutes, assume it's stale
    if (now - lockTime > 10 * 60 * 1000) {
      logStep("LOCK", "Removing stale deployment lock");
      unlinkSync(lockFile);
    } else {
      throw new DeployError(
        "Another deployment is in progress. Please wait for it to complete.",
        "LOCK",
        "DEPLOY_IN_PROGRESS"
      );
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      // No lock file exists, proceed
    } else if (err instanceof DeployError) {
      throw err;
    } else {
      throw new DeployError(
        "Failed to check deployment lock",
        "LOCK",
        "LOCK_CHECK_FAILED",
        err
      );
    }
  }

  // Create lock file with timestamp and process ID for better tracking
  const lockData = `${Date.now()}:${process.pid}`;
  writeFileSync(lockFile, lockData);
  logStep("LOCK", "Deployment lock acquired");
}

function releaseLock() {
  try {
    if (!existsSync(lockFile)) return;
    unlinkSync(lockFile);
    logStep("LOCK", "Deployment lock released");
  } catch (err) {
    logStep(
      "LOCK",
      `Warning: Could not release deployment lock: ${err.message || err}`
    );
  }
}
function preFlightChecks() {
  logStep("PREFLIGHT", "Running pre-flight checks...");

  // Check if we're in a git repository
  const gitCheck = spawnSync("git", ["rev-parse", "--git-dir"], { cwd: root });
  if (gitCheck.status !== 0) {
    throw new DeployError(
      "Not in a git repository",
      "PREFLIGHT",
      gitCheck.status
    );
  }

  // Check for uncommitted changes
  const statusCheck = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    stdio: "pipe",
  });
  if (statusCheck.stdout && statusCheck.stdout.toString().trim()) {
    logStep("PREFLIGHT", "Warning: You have uncommitted changes");
  }

  // Check if required files exist
  const requiredFiles = ["package.json", "wrangler.toml", "worker.js"];

  for (const file of requiredFiles) {
    const filePath = path.join(root, file);
    try {
      accessSync(filePath);
    } catch {
      throw new DeployError(
        `Required file missing: ${file}. Make sure you're in the project root directory.`,
        "PREFLIGHT",
        "FILE_MISSING"
      );
    }
  }

  logStep("PREFLIGHT", "All pre-flight checks passed");
}

// Main deployment flow
async function main() {
  const deployStartTime = Date.now();

  try {
    logStep("DEPLOY", "Starting unified deployment process");

    // Acquire deployment lock to prevent race conditions
    acquireLock();

    try {
      // Run pre-flight checks
      preFlightChecks();

      // Run verify step (using current Node to avoid broken npm on Windows/nvm)
      logStep("VERIFY", "Running verification pipeline");
      runVerifySteps();

      // Run deploy step
      logStep("DEPLOY", "Starting deployment to Cloudflare Workers");
      run("deploy", "node", [path.join(root, "scripts", "deploy-safe.mjs")]);

      const totalDuration = Date.now() - deployStartTime;
      logStep(
        "SUCCESS",
        `🎉 Deployment completed successfully in ${totalDuration}ms`
      );

      // Post-deploy verification
      logStep("POST-DEPLOY", "Running post-deployment checks...");

      // You could add health checks here, like:
      // - Ping the deployed worker
      // - Check specific endpoints
      // - Verify environment variables

      logStep("POST-DEPLOY", "All post-deployment checks passed");
    } finally {
      // Always release lock, even if deployment fails
      releaseLock();
    }
  } catch (error) {
    const totalDuration = Date.now() - deployStartTime;
    logStep("FAILED", `❌ Deployment failed after ${totalDuration}ms`);

    // Release lock if we're bailing (clears stale lock from interrupted runs)
    releaseLock();

    // Provide helpful recovery instructions
    console.error("\n=== RECOVERY INSTRUCTIONS ===");
    console.error("1. Check the error messages above for details");
    console.error("2. Ensure all tests pass: npm run test");
    console.error("3. Check build: npm run build");
    console.error("4. Verify environment variables are set");
    console.error("5. Check Cloudflare API token permissions");
    console.error("6. Try running verify manually: npm run verify");
    console.error("===============================\n");

    const exitCode = typeof error.code === "number" ? error.code : 1;
    process.exit(exitCode);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logStep("FATAL", `Uncaught exception: ${error.message}`);
  releaseLock();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logStep("FATAL", `Unhandled rejection at ${promise}: ${reason}`);
  releaseLock();
  process.exit(1);
});

// Run the main function and handle rejection so lock is released and exit code is numeric
main().catch((error) => {
  logStep("FAILED", `❌ ${error.message || error}`);
  releaseLock();
  const exitCode = typeof error.code === "number" ? error.code : 1;
  process.exit(exitCode);
});
