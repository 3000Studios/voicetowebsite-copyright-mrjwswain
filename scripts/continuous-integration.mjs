#!/usr/bin/env node

/**
 * Continuous Integration & Auto-Commit System
 *
 * This script monitors changes, runs comprehensive analysis,
 * and automatically commits/pushes when all checks pass.
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.dirname(__dirname);

class ContinuousIntegration {
  constructor() {
    this.isRunning = false;
    this.lastRun = 0;
    this.debounceTime = 5000; // 5 seconds
    this.minInterval = 30000; // 30 seconds between runs
  }

  async start() {
    console.log("🚀 Starting Continuous Integration & Auto-Commit System...");

    // Initial run
    await this.runPipeline();

    // Set up file watcher
    this.setupWatcher();

    console.log("✅ CI System active - watching for changes...");
  }

  setupWatcher() {
    const { watch } = require("fs");

    const watchDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (this.shouldIgnore(fullPath)) continue;

          if (stat.isDirectory()) {
            watchDir(fullPath);
          }
        }

        watch(dir, { persistent: true }, (eventType, filename) => {
          if (filename && !this.shouldIgnore(path.join(dir, filename))) {
            this.scheduleRun();
          }
        });
      } catch (error) {
        // Ignore permission errors
      }
    };

    watchDir(ROOT);
  }

  shouldIgnore(filePath) {
    const ignorePatterns = [
      "node_modules",
      "dist",
      ".git",
      ".wrangler",
      ".vite",
      "coverage",
      ".DS_Store",
      "Thumbs.db",
      "*.tmp",
      "*.swp",
    ];

    return ignorePatterns.some(
      (pattern) => filePath.includes(pattern) || filePath.endsWith(pattern)
    );
  }

  scheduleRun() {
    if (this.isRunning) return;

    const now = Date.now();
    if (now - this.lastRun < this.minInterval) {
      return; // Too soon since last run
    }

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.runPipeline(), this.debounceTime);
  }

  async runPipeline() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastRun = Date.now();

    try {
      console.log("🔄 Running CI Pipeline...");

      // 1. Advanced Code Analysis
      await this.runAdvancedHeal();

      // 2. Standard Verification
      await this.runVerification();

      // 3. Format Check
      await this.runFormatCheck();

      // 4. Type Check
      await this.runTypeCheck();

      // 5. Build Test
      await this.runBuild();

      // 6. Check if changes exist
      if (await this.hasChanges()) {
        await this.commitAndPush();
      } else {
        console.log("✅ No changes to commit");
      }

      console.log("✅ CI Pipeline completed successfully");
    } catch (error) {
      console.error("❌ CI Pipeline failed:", error.message);

      // Create failure report
      await this.createFailureReport(error);
    } finally {
      this.isRunning = false;
    }
  }

  async runAdvancedHeal() {
    console.log("🔍 Running advanced code analysis...");

    const result = spawnSync("node", ["scripts/advanced-heal.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Advanced code analysis failed");
    }
  }

  async runVerification() {
    console.log("🔧 Running verification...");

    const result = spawnSync("npm", ["run", "verify"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Verification failed");
    }
  }

  async runFormatCheck() {
    console.log("📝 Checking formatting...");

    const result = spawnSync("npm", ["run", "format:check"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      console.log("🔧 Auto-formatting...");
      const formatResult = spawnSync("npm", ["run", "format"], {
        cwd: ROOT,
        stdio: "inherit",
      });

      if (formatResult.status !== 0) {
        throw new Error("Formatting failed");
      }
    }
  }

  async runTypeCheck() {
    console.log("🔍 Running type check...");

    const result = spawnSync("npm", ["run", "type-check"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Type check failed");
    }
  }

  async runBuild() {
    console.log("🏗️ Running build...");

    const result = spawnSync("npm", ["run", "build"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Build failed");
    }
  }

  async hasChanges() {
    const result = spawnSync("git", ["status", "--porcelain"], {
      cwd: ROOT,
      encoding: "utf8",
    });

    return result.stdout.trim().length > 0;
  }

  async commitAndPush() {
    console.log("📤 Committing and pushing changes...");

    // Stage all changes
    const addResult = spawnSync("git", ["add", "-A"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (addResult.status !== 0) {
      throw new Error("Git add failed");
    }

    // Generate commit message
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const commitMessage = `Auto: CI Pipeline ${timestamp}`;

    // Commit
    const commitResult = spawnSync("git", ["commit", "-m", commitMessage], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (commitResult.status !== 0) {
      throw new Error("Git commit failed");
    }

    // Push
    const pushResult = spawnSync("git", ["push"], {
      cwd: ROOT,
      stdio: "inherit",
    });

    if (pushResult.status !== 0) {
      throw new Error("Git push failed");
    }

    console.log("✅ Changes committed and pushed successfully");
  }

  async createFailureReport(error) {
    const report = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      gitStatus: this.getGitStatus(),
      recommendations: this.getRecommendations(error),
    };

    const reportPath = path.join(ROOT, "reports", "ci-failure-report.json");
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Failure report saved to: ${reportPath}`);
  }

  getGitStatus() {
    try {
      const result = spawnSync("git", ["status", "--porcelain"], {
        cwd: ROOT,
        encoding: "utf8",
      });
      return result.stdout.trim();
    } catch {
      return "Unable to get git status";
    }
  }

  getRecommendations(error) {
    const recommendations = [];

    if (error.message.includes("Verification failed")) {
      recommendations.push(
        "Run npm run verify manually to see detailed errors"
      );
    }

    if (error.message.includes("Type check failed")) {
      recommendations.push("Check TypeScript errors in your code");
    }

    if (error.message.includes("Build failed")) {
      recommendations.push("Check build configuration and dependencies");
    }

    if (error.message.includes("Advanced code analysis failed")) {
      recommendations.push(
        "Review code analysis report for manual fixes needed"
      );
    }

    return recommendations;
  }
}

// Start the CI system
const ci = new ContinuousIntegration();
ci.start().catch(console.error);
