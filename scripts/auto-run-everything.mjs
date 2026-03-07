#!/usr/bin/env node

/**
 * Auto-Run Everything System
 *
 * This script configures and runs comprehensive automation for:
 * - Development servers (frontend + worker)
 * - File watching and auto-rebuilding
 * - Auto-commit and push on changes
 * - Auto-deployment on successful builds
 * - Continuous testing and validation
 * - Performance monitoring
 */

import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.dirname(__dirname);

class AutoRunEverything {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
    this.config = {
      // Dev servers
      runDevFrontend: true,
      runDevWorker: true,

      // Automation
      autoCommit: true,
      autoPush: true,
      autoDeploy: true,
      autoTest: true,

      // Monitoring
      watchFiles: true,
      performanceMonitoring: true,

      // Timing
      debounceMs: 3000,
      minIntervalMs: 15000,
      deployDelayMs: 5000,

      // Environment
      nodeVersion: "20",
      environment: "development",
    };

    this.lastCommit = 0;
    this.lastDeploy = 0;
    this.changeQueue = [];
  }

  async start() {
    console.log("🚀 Starting Auto-Run Everything System...");
    console.log("📋 Configuration:", this.config);

    // Ensure correct Node version
    await this.ensureNodeVersion();

    // Start development servers
    await this.startDevServers();

    // Start file watching
    if (this.config.watchFiles) {
      this.startFileWatcher();
    }

    // Start continuous integration
    if (this.config.autoCommit) {
      this.startContinuousIntegration();
    }

    // Start performance monitoring
    if (this.config.performanceMonitoring) {
      this.startPerformanceMonitoring();
    }

    console.log("✅ Auto-Run Everything System is now active!");
    console.log("🔄 All systems are running in parallel...");

    // Keep the process alive
    this.keepAlive();
  }

  async ensureNodeVersion() {
    console.log("📦 Ensuring Node.js version...");

    const result = spawnSync("nvm", ["use", this.config.nodeVersion], {
      stdio: "inherit",
      shell: true,
    });

    if (result.status !== 0) {
      console.warn("⚠️  Could not switch Node version, using current");
    }
  }

  async startDevServers() {
    console.log("🖥️  Starting development servers...");

    // Frontend dev server
    if (this.config.runDevFrontend) {
      const frontend = spawn("npm", ["run", "dev"], {
        cwd: ROOT,
        stdio: ["inherit", "pipe", "inherit"],
        shell: true,
      });

      frontend.stdout.on("data", (data) => {
        const output = data.toString();
        if (output.includes("Local:")) {
          console.log("🌐 Frontend:", output.trim());
        }
      });

      this.processes.set("frontend", frontend);
    }

    // Worker dev server
    if (this.config.runDevWorker) {
      const worker = spawn("npm", ["run", "dev:worker"], {
        cwd: ROOT,
        stdio: ["inherit", "pipe", "inherit"],
        shell: true,
      });

      worker.stdout.on("data", (data) => {
        const output = data.toString();
        if (output.includes("ready")) {
          console.log("⚡ Worker:", output.trim());
        }
      });

      this.processes.set("worker", worker);
    }

    // Wait a bit for servers to start
    await this.sleep(3000);
  }

  startFileWatcher() {
    console.log("👁️  Starting file watcher...");

    const { watch } = require("fs");

    const watchRecursive = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (this.shouldIgnore(fullPath)) continue;

          if (stat.isDirectory()) {
            watchRecursive(fullPath);
          } else {
            watch(fullPath, (eventType) => {
              if (eventType === "change") {
                this.handleFileChange(fullPath);
              }
            });
          }
        }

        // Watch the directory itself for new files
        watch(dir, (eventType, filename) => {
          if (filename && eventType === "rename") {
            const fullPath = path.join(dir, filename);
            if (fs.existsSync(fullPath)) {
              // New file added
              if (!this.shouldIgnore(fullPath)) {
                this.handleFileChange(fullPath);
              }
            }
          }
        });
      } catch (error) {
        // Skip directories we can't read
      }
    };

    watchRecursive(ROOT);
  }

  startContinuousIntegration() {
    console.log("🔄 Starting continuous integration...");

    // Run initial validation
    this.runValidationPipeline();

    // Set up periodic validation
    setInterval(() => {
      if (this.hasChanges()) {
        this.runValidationPipeline();
      }
    }, this.config.minIntervalMs);
  }

  startPerformanceMonitoring() {
    console.log("📊 Starting performance monitoring...");

    setInterval(() => {
      this.checkPerformance();
    }, 60000); // Every minute
  }

  handleFileChange(filePath) {
    console.log(`📝 File changed: ${path.relative(ROOT, filePath)}`);

    // Debounce rapid changes
    clearTimeout(this.changeTimeout);
    this.changeTimeout = setTimeout(() => {
      this.processChange(filePath);
    }, this.config.debounceMs);
  }

  async processChange(filePath) {
    this.changeQueue.push({
      path: filePath,
      timestamp: Date.now(),
    });

    if (this.config.autoCommit) {
      await this.autoCommit();
    }
  }

  async runValidationPipeline() {
    console.log("🔍 Running validation pipeline...");

    try {
      // Run tests
      if (this.config.autoTest) {
        await this.runCommand("npm", ["test"]);
      }

      // Type checking
      await this.runCommand("npm", ["run", "type-check"]);

      // Build check
      await this.runCommand("npm", ["run", "build"]);

      console.log("✅ Validation pipeline passed");

      if (this.config.autoDeploy && this.canDeploy()) {
        await this.autoDeploy();
      }
    } catch (error) {
      console.error("❌ Validation pipeline failed:", error.message);
    }
  }

  async autoCommit() {
    const now = Date.now();
    if (now - this.lastCommit < this.config.minIntervalMs) {
      return; // Too soon since last commit
    }

    try {
      // Check if there are changes
      const status = spawnSync("git", ["status", "--porcelain"], {
        cwd: ROOT,
        encoding: "utf8",
      });

      if (!status.stdout.trim()) {
        return; // No changes to commit
      }

      console.log("📦 Auto-committing changes...");

      // Add all changes
      await this.runCommand("git", ["add", "."]);

      // Commit with auto-generated message
      const commitMsg = `Auto: ${new Date().toISOString()} - Automated commit`;
      await this.runCommand("git", ["commit", "-m", commitMsg]);

      this.lastCommit = now;

      if (this.config.autoPush) {
        await this.autoPush();
      }
    } catch (error) {
      console.error("❌ Auto-commit failed:", error.message);
    }
  }

  async autoPush() {
    try {
      console.log("📤 Auto-pushing to remote...");
      await this.runCommand("git", ["push", "origin", "main"]);
      console.log("✅ Pushed successfully");
    } catch (error) {
      console.error("❌ Auto-push failed:", error.message);
    }
  }

  async autoDeploy() {
    const now = Date.now();
    if (now - this.lastDeploy < this.config.deployDelayMs) {
      return; // Too soon since last deploy
    }

    try {
      console.log("🚀 Auto-deploying with Wrangler...");

      // Use Wrangler CLI for deployment
      await this.runCommand("npx", ["wrangler", "deploy"]);

      this.lastDeploy = now;
      console.log("✅ Deployed successfully with Wrangler");
    } catch (error) {
      console.error("❌ Auto-deploy failed:", error.message);

      // Fallback to deploy script
      try {
        console.log("🔄 Trying fallback deployment script...");
        await this.runCommand("npm", ["run", "deploy"]);
        this.lastDeploy = now;
        console.log("✅ Fallback deployment successful");
      } catch (fallbackError) {
        console.error(
          "❌ Fallback deployment also failed:",
          fallbackError.message
        );
      }
    }
  }

  async checkPerformance() {
    // Simple performance check
    const memUsage = process.memoryUsage();
    console.log(`📊 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

    // Check if processes are still running
    for (const [name, proc] of this.processes) {
      if (proc.killed || proc.exitCode !== null) {
        console.warn(`⚠️  Process ${name} stopped, restarting...`);
        await this.restartProcess(name);
      }
    }
  }

  async restartProcess(name) {
    if (name === "frontend" && this.config.runDevFrontend) {
      const frontend = spawn("npm", ["run", "dev"], {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
      });
      this.processes.set("frontend", frontend);
    } else if (name === "worker" && this.config.runDevWorker) {
      const worker = spawn("npm", ["run", "dev:worker"], {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
      });
      this.processes.set("worker", worker);
    }
  }

  hasChanges() {
    const status = spawnSync("git", ["status", "--porcelain"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return status.stdout.trim().length > 0;
  }

  canDeploy() {
    const now = Date.now();
    return now - this.lastDeploy > this.config.deployDelayMs;
  }

  shouldIgnore(fullPath) {
    const ignorePatterns = [
      ".git",
      "node_modules",
      "dist",
      ".wrangler",
      ".vite",
      "coverage",
      ".DS_Store",
      "Thumbs.db",
      "*.log",
    ];

    return ignorePatterns.some(
      (pattern) =>
        fullPath.includes(pattern) || path.basename(fullPath).startsWith(".")
    );
  }

  runCommand(cmd, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  keepAlive() {
    // Keep the process running
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down Auto-Run Everything...");

      // Kill all child processes
      for (const proc of this.processes.values()) {
        proc.kill();
      }

      process.exit(0);
    });

    // Prevent the process from exiting
    setInterval(() => {
      // Heartbeat
    }, 30000);
  }
}

// Start the system
if (import.meta.url === `file://${process.argv[1]}`) {
  const autoRun = new AutoRunEverything();
  autoRun.start().catch(console.error);
}

export default AutoRunEverything;
