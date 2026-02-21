#!/usr/bin/env node

/**
 * CSS Budget Validation Script
 *
 * Enforces performance budgets, WAF compatibility, and revenue optimization
 * as part of the build pipeline
 */

import fs from "fs";
import path from "path";
import { gzipSync } from "zlib";

// Budget Configuration
const BUDGETS = {
  critical: {
    maxBytes: 25 * 1024, // 25KB gzipped
    maxUncompressed: 50 * 1024, // 50KB uncompressed
  },
  total: {
    maxBytes: 150 * 1024, // 150KB total
    chunkSize: 25 * 1024, // 25KB per chunk
  },
};

// WAF Safety Rules
const WAF_RULES = {
  maxSelectorDepth: 3,
  forbiddenSelectors: [
    ":nth-child",
    ":not(",
    ":has(",
    ":where(",
    ":is(",
    "[*]",
    '[attr~=""]',
    '[attr|=""]',
    '[attr^=""]',
    '[attr$=""]',
    '[attr*=""]',
  ],
  maxAttributeSelectors: 1,
};

class CSSBudgetValidator {
  constructor(buildDir = "dist/assets") {
    this.buildDir = buildDir;
    this.violations = [];
    this.metrics = {
      criticalSize: 0,
      totalSize: 0,
      chunkCount: 0,
      wafViolations: 0,
      revenueVariants: 0,
    };
  }

  validateAll() {
    console.log("🔍 Validating CSS budgets...");

    if (!fs.existsSync(this.buildDir)) {
      console.error(`❌ Build directory not found: ${this.buildDir}`);
      process.exit(1);
    }

    const cssFiles = fs
      .readdirSync(this.buildDir)
      .filter((file) => file.endsWith(".css"));

    if (cssFiles.length === 0) {
      console.log("✅ No CSS files found - validation passed");
      return;
    }

    console.log(`📁 Found ${cssFiles.length} CSS files`);

    // Validate each CSS file
    cssFiles.forEach((file) => {
      const filePath = path.join(this.buildDir, file);
      this.validateFile(filePath, file);
    });

    // Check total budget
    this.validateTotalBudget();

    // Generate report
    this.generateReport();

    // Exit with error code if violations found
    if (this.violations.length > 0) {
      console.error(
        `❌ CSS validation failed with ${this.violations.length} violations`
      );
      process.exit(1);
    } else {
      console.log("✅ CSS validation passed");
    }
  }

  validateFile(filePath, fileName) {
    const content = fs.readFileSync(filePath, "utf8");
    const size = Buffer.byteLength(content, "utf8");
    const gzippedSize = gzipSync(content).length;

    this.metrics.totalSize += size;
    this.metrics.chunkCount++;

    // Check if this is critical CSS
    if (fileName.includes("critical") || fileName.includes("index")) {
      this.validateCriticalCSS(content, gzippedSize, fileName);
    }

    // Check chunk size budget
    if (size > BUDGETS.total.chunkSize) {
      this.addViolation(
        "CHUNK_SIZE_EXCEEDED",
        `File ${fileName}: ${size} bytes (max: ${BUDGETS.total.chunkSize})`
      );
    }

    // WAF compatibility check
    this.validateWAFCompatibility(content, fileName);

    // Revenue optimization check
    this.validateRevenueOptimization(content, fileName);
  }

  validateCriticalCSS(content, gzippedSize, fileName) {
    this.metrics.criticalSize = gzippedSize;

    // Check critical CSS budgets
    if (gzippedSize > BUDGETS.critical.maxBytes) {
      this.addViolation(
        "CRITICAL_BUDGET_EXCEEDED",
        `Critical CSS ${fileName}: ${gzippedSize} bytes gzipped (max: ${BUDGETS.critical.maxBytes})`
      );
    }

    const uncompressedSize = Buffer.byteLength(content, "utf8");
    if (uncompressedSize > BUDGETS.critical.maxUncompressed) {
      this.addViolation(
        "CRITICAL_UNCOMPRESSED_EXCEEDED",
        `Critical CSS ${fileName}: ${uncompressedSize} bytes uncompressed (max: ${BUDGETS.critical.maxUncompressed})`
      );
    }
  }

  validateWAFCompatibility(content, fileName) {
    // Check for forbidden selectors
    WAF_RULES.forbiddenSelectors.forEach((forbidden) => {
      if (content.includes(forbidden)) {
        this.addViolation(
          "WAF_UNSAFE_SELECTOR",
          `WAF-unsafe selector '${forbidden}' found in ${fileName}`
        );
        this.metrics.wafViolations++;
      }
    });

    // Check selector depth
    const selectors = content.match(/[^{}]+(?=\s*{)/g) || [];
    selectors.forEach((selector) => {
      const depth = (selector.match(/ /g) || []).length + 1;
      if (depth > WAF_RULES.maxSelectorDepth) {
        this.addViolation(
          "SELECTOR_DEPTH_EXCEEDED",
          `Selector depth ${depth} exceeds limit ${WAF_RULES.maxSelectorDepth} in ${fileName}: ${selector.trim()}`
        );
        this.metrics.wafViolations++;
      }
    });

    // Check attribute selectors
    const attributeSelectors = content.match(/\[[^\]]+\]/g) || [];
    attributeSelectors.forEach((selector) => {
      const attrCount = (selector.match(/=/g) || []).length;
      if (attrCount > WAF_RULES.maxAttributeSelectors) {
        this.addViolation(
          "COMPLEX_ATTRIBUTE_SELECTOR",
          `Complex attribute selector in ${fileName}: ${selector}`
        );
        this.metrics.wafViolations++;
      }
    });
  }

  validateRevenueOptimization(content, fileName) {
    // Check for revenue optimization classes
    const revenueClasses = [
      "canary-revenue-layout",
      "revenue-layout-",
      "revenue-density-",
      "vt-cta",
      "vt-pricing-card",
      "vt-checkout-",
    ];

    revenueClasses.forEach((className) => {
      if (content.includes(className)) {
        this.metrics.revenueVariants++;
      }
    });

    // Ensure revenue components have optimization variants
    if (
      content.includes(".vt-cta") &&
      !content.includes("canary-revenue-layout")
    ) {
      this.addViolation(
        "MISSING_REVENUE_VARIANTS",
        `CTA found in ${fileName} but no revenue layout variants`
      );
    }
  }

  validateTotalBudget() {
    if (this.metrics.totalSize > BUDGETS.total.maxBytes) {
      this.addViolation(
        "TOTAL_BUDGET_EXCEEDED",
        `Total CSS size: ${this.metrics.totalSize} bytes (max: ${BUDGETS.total.maxBytes})`
      );
    }
  }

  addViolation(type, message) {
    this.violations.push({
      type,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  generateReport() {
    console.log("\n📊 CSS Budget Report");
    console.log("==================");
    console.log(`Critical CSS: ${this.metrics.criticalSize} bytes`);
    console.log(`Total CSS: ${this.metrics.totalSize} bytes`);
    console.log(`Chunk Count: ${this.metrics.chunkCount}`);
    console.log(`WAF Violations: ${this.metrics.wafViolations}`);
    console.log(`Revenue Variants: ${this.metrics.revenueVariants}`);
    console.log(`Violations: ${this.violations.length}`);

    if (this.violations.length > 0) {
      console.log("\n❌ Violations:");
      this.violations.forEach((violation, index) => {
        console.log(`${index + 1}. [${violation.type}] ${violation.message}`);
      });
    }

    // Write detailed report to file
    const reportPath = path.join(process.cwd(), "css-budget-report.json");
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          metrics: this.metrics,
          violations: this.violations,
          budgets: BUDGETS,
          wafRules: WAF_RULES,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(`\n📄 Detailed report written to: ${reportPath}`);
  }
}

// Revenue Optimization Validator
class RevenueOptimizationValidator {
  constructor() {
    this.requiredVariants = {
      cta: ["control", "high-density", "minimal"],
      layout: ["cta-dominant", "donation-heavy", "sponsor-focus"],
      density: ["standard", "high"],
    };
  }

  validate(filePath) {
    console.log("💰 Validating revenue optimization...");

    const content = fs.readFileSync(filePath, "utf8");
    const violations = [];

    // Check for required CTA variants
    this.requiredVariants.cta.forEach((variant) => {
      if (!content.includes(`canary-revenue-layout-${variant}`)) {
        violations.push(`Missing CTA variant: ${variant}`);
      }
    });

    // Check for required layout variants
    this.requiredVariants.layout.forEach((variant) => {
      if (!content.includes(`revenue-layout-${variant}`)) {
        violations.push(`Missing layout variant: ${variant}`);
      }
    });

    // Check for density controls
    this.requiredVariants.density.forEach((level) => {
      if (!content.includes(`revenue-density-${level}`)) {
        violations.push(`Missing density level: ${level}`);
      }
    });

    if (violations.length > 0) {
      console.error("❌ Revenue optimization validation failed:");
      violations.forEach((violation) => console.error(`  - ${violation}`));
      process.exit(1);
    } else {
      console.log("✅ Revenue optimization validation passed");
    }
  }
}

// Performance Budget Monitor
class PerformanceBudgetMonitor {
  constructor() {
    this.targets = {
      lighthouse: 95, // Lighthouse performance score
      fcp: 1800, // First Contentful Paint (1.8s)
      lcp: 2500, // Largest Contentful Paint (2.5s)
      cls: 0.1, // Cumulative Layout Shift
      fid: 100, // First Input Delay (100ms)
    };
  }

  validate() {
    console.log("⚡ Performance budget validation...");
    console.log(
      "Note: This requires Lighthouse integration for full validation"
    );
    console.log("✅ Performance budget targets configured");
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "css":
      const validator = new CSSBudgetValidator();
      validator.validateAll();
      break;

    case "revenue":
      if (args.length < 2) {
        console.error("Usage: node css-budget-validator.js revenue <css-file>");
        process.exit(1);
      }
      const revenueValidator = new RevenueOptimizationValidator();
      revenueValidator.validate(args[1]);
      break;

    case "performance":
      const perfMonitor = new PerformanceBudgetMonitor();
      perfMonitor.validate();
      break;

    case "all":
      // Run all validations
      const cssValidator = new CSSBudgetValidator();
      cssValidator.validateAll();

      const perfMon = new PerformanceBudgetMonitor();
      perfMon.validate();
      break;

    default:
      console.log("CSS Budget Validator");
      console.log("Usage:");
      console.log(
        "  node css-budget-validator.js css          # Validate CSS budgets"
      );
      console.log(
        "  node css-budget-validator.js revenue <file> # Validate revenue optimization"
      );
      console.log(
        "  node css-budget-validator.js performance  # Validate performance budgets"
      );
      console.log(
        "  node css-budget-validator.js all          # Run all validations"
      );
      break;
  }
}

// Export classes for use in other scripts
export {
  CSSBudgetValidator,
  RevenueOptimizationValidator,
  PerformanceBudgetMonitor,
};

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
