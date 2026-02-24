#!/usr/bin/env node

/**
 * Enhanced Pre-commit Hook
 *
 * Runs comprehensive checks before allowing commits
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const checks = [
  {
    name: "Advanced Code Analysis",
    command: "npm",
    args: ["run", "heal:advanced"],
    critical: true,
  },
  {
    name: "Format Check",
    command: "npm",
    args: ["run", "format:check"],
    critical: true,
    fix: "npm run format",
  },
  {
    name: "Type Check",
    command: "npm",
    args: ["run", "type-check"],
    critical: true,
  },
  {
    name: "Build Test",
    command: "npm",
    args: ["run", "build"],
    critical: true,
  },
  {
    name: "CSS Governance",
    command: "npm",
    args: ["run", "check:css-governance"],
    critical: true,
  },
  {
    name: "Link Check",
    command: "npm",
    args: ["run", "check:links"],
    critical: false,
  },
];

function runCheck(check) {
  console.log(`🔍 Running: ${check.name}`);

  const result = spawnSync(check.command, check.args, {
    cwd: ROOT,
    stdio: "pipe",
  });

  if (result.status !== 0) {
    console.log(`❌ ${check.name} failed`);

    if (check.fix) {
      console.log(`🔧 Attempting fix: ${check.fix}`);
      const fixResult = spawnSync(
        check.fix.split(" ")[0],
        check.fix.split(" ").slice(1),
        {
          cwd: ROOT,
          stdio: "inherit",
        }
      );

      if (fixResult.status === 0) {
        console.log(`✅ Fix applied, re-running check...`);
        const recheckResult = spawnSync(check.command, check.args, {
          cwd: ROOT,
          stdio: "pipe",
        });

        if (recheckResult.status === 0) {
          console.log(`✅ ${check.name} passed after fix`);
          return true;
        }
      }
    }

    if (check.critical) {
      console.log(`\n📋 Error output:`);
      console.log(result.stderr.toString() || result.stdout.toString());
      return false;
    } else {
      console.log(`⚠️  ${check.name} failed but not critical`);
      return true;
    }
  }

  console.log(`✅ ${check.name} passed`);
  return true;
}

async function main() {
  console.log("🚀 Running pre-commit checks...\n");

  let allPassed = true;

  for (const check of checks) {
    const passed = runCheck(check);
    if (!passed) {
      allPassed = false;
      if (check.critical) {
        break;
      }
    }
  }

  if (allPassed) {
    console.log("\n✅ All pre-commit checks passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some critical checks failed. Commit aborted.");
    console.log(
      "Fix the issues and try again, or use --no-verify to bypass (not recommended)."
    );
    process.exit(1);
  }
}

main().catch(console.error);
