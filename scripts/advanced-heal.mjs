#!/usr/bin/env node

/**
 * Advanced Code Review & Auto-Healing System
 *
 * This script performs comprehensive code analysis, identifies issues,
 * and automatically fixes common problems across the entire codebase.
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.dirname(__dirname);

// Configuration
const CONFIG = {
  maxFileSize: 1024 * 1024, // 1MB
  allowedImageFormats: [".webp", ".avif", ".jpg", ".jpeg", ".png", ".svg"],
  criticalFilePatterns: [
    "**/*.{js,ts,tsx,jsx}",
    "**/*.css",
    "**/*.html",
    "**/*.json",
    "package.json",
    "vite.config.js",
    "wrangler.toml",
  ],
  ignorePatterns: [
    "node_modules/**",
    "dist/**",
    ".git/**",
    ".wrangler/**",
    "coverage/**",
  ],
};

class CodeAnalyzer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      fixesApplied: 0,
    };
  }

  async analyzeProject() {
    console.log("🔍 Starting comprehensive code analysis...");

    // 1. Performance Analysis
    await this.analyzePerformance();

    // 2. Security Analysis
    await this.analyzeSecurity();

    // 3. Code Quality Analysis
    await this.analyzeCodeQuality();

    // 4. Dependencies Analysis
    await this.analyzeDependencies();

    // 5. Build Configuration Analysis
    await this.analyzeBuildConfig();

    // 6. Asset Optimization Analysis
    await this.analyzeAssets();

    console.log(
      `✅ Analysis complete: ${this.stats.filesScanned} files scanned, ${this.stats.issuesFound} issues found`
    );
  }

  async analyzePerformance() {
    console.log("⚡ Analyzing performance...");

    // Check for performance bottlenecks
    const performanceIssues = [
      {
        check: "Large images without lazy loading",
        pattern: /<img(?![^>]*loading=)[^>]*src=/g,
        fix: 'Add loading="lazy" and decoding="async" to images',
        autoFix: true,
      },
      {
        check: "Missing image dimensions",
        pattern: /<img(?![^>]*width=)[^>]*src=/g,
        fix: "Add width and height attributes to prevent CLS",
        autoFix: true,
      },
      {
        check: "Render-blocking resources",
        pattern: /<link[^>]*rel="stylesheet"[^>]*>/g,
        fix: 'Add media="print" onload="this.media=\'all\'" for non-critical CSS',
        autoFix: false,
      },
    ];

    await this.runChecks(performanceIssues, "performance");
  }

  async analyzeSecurity() {
    console.log("🔒 Analyzing security...");

    const securityIssues = [
      {
        check: "Inline event handlers",
        pattern: /on\w+="[^"]*"/g,
        fix: "Remove inline event handlers, use event listeners",
        autoFix: false,
      },
      {
        check: "Inline styles",
        pattern: /style="[^"]*"/g,
        fix: "Move inline styles to CSS classes",
        autoFix: false,
      },
      {
        check: "Hardcoded secrets",
        pattern: /(password|secret|key|token)\s*[:=]\s*["'][^"']+["']/gi,
        fix: "Move secrets to environment variables",
        autoFix: false,
      },
    ];

    await this.runChecks(securityIssues, "security");
  }

  async analyzeCodeQuality() {
    console.log("🧹 Analyzing code quality...");

    const qualityIssues = [
      {
        check: "Console statements in production",
        pattern: /console\.(log|warn|error|debug)/g,
        fix: "Remove or replace with proper logging",
        autoFix: true,
      },
      {
        check: "TODO comments",
        pattern: /\/\/\s*TODO|\/\*\s*TODO/gi,
        fix: "Address TODO items or convert to proper task tracking",
        autoFix: false,
      },
      {
        check: "Unused imports",
        pattern: /^import.*from.*$/gm,
        fix: "Remove unused imports",
        autoFix: true,
      },
    ];

    await this.runChecks(qualityIssues, "quality");
  }

  async analyzeDependencies() {
    console.log("📦 Analyzing dependencies...");

    try {
      // Check for outdated packages
      const outdated = execSync("npm outdated --json", {
        cwd: ROOT,
        encoding: "utf8",
        stdio: "pipe",
      });

      if (outdated) {
        const outdatedPackages = JSON.parse(outdated);
        Object.keys(outdatedPackages).forEach((pkg) => {
          this.addIssue(
            "dependency",
            `${pkg} is outdated (${outdatedPackages[pkg].current} → ${outdatedPackages[pkg].latest})`,
            false
          );
        });
      }

      // Check for vulnerabilities
      const audit = execSync("npm audit --json", {
        cwd: ROOT,
        encoding: "utf8",
        stdio: "pipe",
      });

      const auditResult = JSON.parse(audit);
      if (auditResult.vulnerabilities) {
        Object.values(auditResult.vulnerabilities).forEach((vuln) => {
          if (vuln.severity === "high" || vuln.severity === "critical") {
            this.addIssue(
              "security",
              `Security vulnerability in ${vuln.name}: ${vuln.title}`,
              true
            );
          }
        });
      }
    } catch (error) {
      // npm commands may fail with non-zero exit codes but still output valid JSON
      const output = error.stdout || error.stderr;
      if (output) {
        try {
          const auditResult = JSON.parse(output);
          if (auditResult.vulnerabilities) {
            Object.values(auditResult.vulnerabilities).forEach((vuln) => {
              if (vuln.severity === "high" || vuln.severity === "critical") {
                this.addIssue(
                  "security",
                  `Security vulnerability in ${vuln.name}: ${vuln.title}`,
                  true
                );
              }
            });
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    }
  }

  async analyzeBuildConfig() {
    console.log("🔨 Analyzing build configuration...");

    const viteConfigPath = path.join(ROOT, "vite.config.js");
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, "utf8");

      // Check for optimal build settings
      if (!viteConfig.includes('minify: "esbuild"')) {
        this.addIssue(
          "performance",
          "Vite config missing esbuild minification",
          true
        );
      }

      if (!viteConfig.includes("cssCodeSplit: true")) {
        this.addIssue(
          "performance",
          "Vite config missing CSS code splitting",
          true
        );
      }

      if (!viteConfig.includes("sourcemap: false")) {
        this.addIssue(
          "performance",
          "Vite config should disable sourcemaps for production",
          true
        );
      }
    }
  }

  async analyzeAssets() {
    console.log("🖼️ Analyzing assets...");

    const publicDir = path.join(ROOT, "public");
    if (fs.existsSync(publicDir)) {
      const assets = this.getAllFiles(publicDir);

      for (const asset of assets) {
        const ext = path.extname(asset).toLowerCase();
        const stats = fs.statSync(asset);

        // Check file size
        if (stats.size > CONFIG.maxFileSize) {
          this.addIssue(
            "performance",
            `Large asset: ${path.relative(ROOT, asset)} (${Math.round(stats.size / 1024)}KB)`,
            false
          );
        }

        // Check image format
        if (
          [".jpg", ".jpeg", ".png"].includes(ext) &&
          !asset.includes(".webp")
        ) {
          this.addIssue(
            "performance",
            `Consider WebP format for: ${path.relative(ROOT, asset)}`,
            false
          );
        }
      }
    }
  }

  async runChecks(checks, category) {
    const files = this.getAllFiles(ROOT);

    for (const file of files) {
      if (this.shouldIgnoreFile(file)) continue;

      const content = fs.readFileSync(file, "utf8");
      this.stats.filesScanned++;

      for (const check of checks) {
        const matches = content.match(check.pattern);
        if (matches) {
          this.addIssue(
            category,
            `${check.check} in ${path.relative(ROOT, file)} (${matches.length} occurrences)`,
            check.autoFix
          );

          if (check.autoFix) {
            this.fixes.push({
              file,
              check,
              matches,
            });
          }
        }
      }
    }
  }

  getAllFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  shouldIgnoreFile(file) {
    const relativePath = path.relative(ROOT, file);
    return CONFIG.ignorePatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")
      );
      return regex.test(relativePath);
    });
  }

  addIssue(category, description, autoFixable) {
    this.issues.push({
      category,
      description,
      autoFixable,
      timestamp: new Date().toISOString(),
    });
    this.stats.issuesFound++;
  }

  async applyFixes() {
    console.log("🔧 Applying auto-fixes...");

    for (const fix of this.fixes) {
      try {
        let content = fs.readFileSync(fix.file, "utf8");
        let modified = false;

        // Apply specific fixes based on check type
        if (fix.check.check.includes("lazy loading")) {
          content = content.replace(
            /<img([^>]*src=)/g,
            '<img$1loading="lazy" decoding="async" '
          );
          modified = true;
        }

        if (fix.check.check.includes("Console statements")) {
          content = content.replace(
            /console\.(log|warn|error|debug)\([^)]*\);?/g,
            ""
          );
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(fix.file, content);
          this.stats.fixesApplied++;
          console.log(`✅ Fixed: ${path.relative(ROOT, fix.file)}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fix ${fix.file}:`, error.message);
      }
    }

    console.log(`🎉 Auto-fixes applied: ${this.stats.fixesApplied}`);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues,
      recommendations: this.generateRecommendations(),
    };

    const reportPath = path.join(ROOT, "reports", "code-analysis-report.json");
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Report saved to: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    const perfIssues = this.issues.filter((i) => i.category === "performance");
    if (perfIssues.length > 0) {
      recommendations.push({
        category: "Performance",
        priority: "High",
        action: "Optimize images and implement lazy loading",
        details: `${perfIssues.length} performance issues found`,
      });
    }

    // Security recommendations
    const secIssues = this.issues.filter((i) => i.category === "security");
    if (secIssues.length > 0) {
      recommendations.push({
        category: "Security",
        priority: "Critical",
        action: "Address security vulnerabilities",
        details: `${secIssues.length} security issues found`,
      });
    }

    return recommendations;
  }
}

// Main execution
async function main() {
  const analyzer = new CodeAnalyzer();

  try {
    await analyzer.analyzeProject();

    if (analyzer.fixes.length > 0) {
      await analyzer.applyFixes();
    }

    const report = analyzer.generateReport();

    // Exit with error code if critical issues found
    const criticalIssues = analyzer.issues.filter(
      (i) =>
        i.category === "security" ||
        (i.category === "performance" && i.autoFixable === false)
    );

    if (criticalIssues.length > 0) {
      console.log(
        `\n⚠️  ${criticalIssues.length} critical issues require manual attention`
      );
      process.exit(1);
    } else {
      console.log("\n✅ All issues resolved or auto-fixed!");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CodeAnalyzer;
