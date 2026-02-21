/**
 * CSS Budget Enforcement Build Pipeline
 *
 * Integrates with Vite build process to enforce performance budgets,
 * canary branch separation, revenue optimization, and WAF compatibility
 */

import { defineConfig } from "vite";
import { resolve } from "path";

// CSS Budget Constants
const CSS_BUDGETS = {
  critical: {
    maxBytes: 25 * 1024, // 25KB gzipped
    maxUncompressed: 50 * 1024, // 50KB uncompressed
    loadTimeTarget: 100, // 100ms on 3G
  },
  total: {
    maxBytes: 150 * 1024, // 150KB total
    chunkSize: 25 * 1024, // 25KB per chunk
    loadTimeTarget: 500, // 500ms per chunk
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

// Revenue Optimization Config
const REVENUE_CONFIG = {
  ctaVariants: ["control", "high-density", "minimal"],
  layoutVariants: ["cta-dominant", "donation-heavy", "sponsor-focus"],
  adDensityLevels: ["standard", "high"],
  checkoutFlows: ["optimized", "steps"],
};

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // CSS Code Splitting Strategy
        manualChunks: {
          // Critical CSS - inline in head
          critical: ["src/critical.css"],

          // Component chunks - lazy loaded
          navigation: ["src/components/navigation.css"],
          revenue: ["src/components/revenue.css"],
          admin: ["src/components/admin.css"],
          store: ["src/components/store.css"],
          live: ["src/components/live.css"],
          forms: ["src/components/forms.css"],
        },

        // Asset naming for cache busting
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return `assets/[name]-[hash].css`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
      },
    },

    // CSS Processing Pipeline
    cssCodeSplit: true,
    cssMinify: true,

    // Custom CSS processing plugin
    plugins: [
      cssBudgetEnforcer(),
      wafCompatibilityChecker(),
      revenueOptimizer(),
      canaryBranchProcessor(),
    ],
  },

  // Development server configuration
  server: {
    fs: {
      // Allow serving files from project root
      allow: [".."],
    },
  },
});

// CSS Budget Enforcement Plugin
function cssBudgetEnforcer() {
  return {
    name: "css-budget-enforcer",
    generateBundle(options, bundle) {
      const cssAssets = Object.keys(bundle).filter((key) =>
        key.endsWith(".css")
      );

      cssAssets.forEach((assetName) => {
        const asset = bundle[assetName];

        // Check critical CSS budget
        if (assetName.includes("critical")) {
          if (asset.code.length > CSS_BUDGETS.critical.maxUncompressed) {
            this.warn(
              `Critical CSS budget exceeded: ${asset.code.length} bytes (max: ${CSS_BUDGETS.critical.maxUncompressed})`
            );
          }
        }

        // Check total CSS budget
        if (asset.code.length > CSS_BUDGETS.total.chunkSize) {
          this.warn(
            `CSS chunk budget exceeded: ${asset.code.length} bytes (max: ${CSS_BUDGETS.total.chunkSize})`
          );
        }

        // Add budget tracking comments
        asset.code += `/* CSS Size: ${asset.code.length} bytes */`;
      });
    },
  };
}

// WAF Compatibility Checker Plugin
function wafCompatibilityChecker() {
  return {
    name: "waf-compatibility-checker",
    generateBundle(options, bundle) {
      const cssAssets = Object.keys(bundle).filter((key) =>
        key.endsWith(".css")
      );

      cssAssets.forEach((assetName) => {
        const asset = bundle[assetName];
        const css = asset.code;

        // Check for forbidden selectors
        WAF_RULES.forbiddenSelectors.forEach((forbidden) => {
          if (css.includes(forbidden)) {
            this.warn(
              `WAF-unsafe selector found: ${forbidden} in ${assetName}`
            );
          }
        });

        // Check selector depth
        const selectorDepths = css.match(/[^{}]+(?=\s*{)/g) || [];
        selectorDepths.forEach((selector) => {
          const depth = (selector.match(/ /g) || []).length + 1;
          if (depth > WAF_RULES.maxSelectorDepth) {
            this.warn(
              `Selector depth ${depth} exceeds limit ${WAF_RULES.maxSelectorDepth}: ${selector.trim()}`
            );
          }
        });

        // Check attribute selectors
        const attributeSelectors = css.match(/\[[^\]]+\]/g) || [];
        attributeSelectors.forEach((selector) => {
          const attrCount = (selector.match(/=/g) || []).length;
          if (attrCount > WAF_RULES.maxAttributeSelectors) {
            this.warn(`Complex attribute selector: ${selector}`);
          }
        });
      });
    },
  };
}

// Revenue Optimization Plugin
function revenueOptimizer() {
  return {
    name: "revenue-optimizer",
    generateBundle(options, bundle) {
      const cssAssets = Object.keys(bundle).filter((key) =>
        key.includes("revenue")
      );

      cssAssets.forEach((assetName) => {
        const asset = bundle[assetName];
        let css = asset.code;

        // Add revenue optimization classes
        const revenueVariants = `
/* Revenue Optimization Variants */
.canary-revenue-layout-high-density .vt-cta {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.canary-revenue-layout-minimal .vt-cta {
  padding: 0.5rem 1.5rem;
  font-size: 0.9rem;
}

.revenue-layout-cta-dominant .vt-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.revenue-layout-donation-heavy .vt-donation-section {
  order: -1;
  margin-bottom: 3rem;
}

.revenue-layout-sponsor-focus .vt-sponsor-banner {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
}

.revenue-density-standard .vt-ad-slot { max-width: 300px; }
.revenue-density-high .vt-ad-slot { max-width: 400px; }
`;

        asset.code += revenueVariants;
      });
    },
  };
}

// Canary Branch Processor Plugin
function canaryBranchProcessor() {
  return {
    name: "canary-branch-processor",
    generateBundle(options, bundle) {
      const cssAssets = Object.keys(bundle).filter((key) =>
        key.endsWith(".css")
      );

      cssAssets.forEach((assetName) => {
        const asset = bundle[assetName];
        let css = asset.code;

        // Add canary feature flags
        const canaryFlags = `
/* Canary Branch Feature Flags */
:root {
  --canary-revenue-layout: var(--env-canary-revenue-layout, 'control');
  --canary-cta-variants: var(--env-canary-cta-variants, 'control');
  --canary-payment-flow: var(--env-canary-payment-flow, 'control');
  
  /* Revenue optimization toggles */
  --revenue-cta-density: var(--env-revenue-density, 'standard');
  --revenue-ad-strategy: var(--env-revenue-ad-strategy, 'balanced');
  --revenue-checkout-flow: var(--env-revenue-checkout-flow, 'optimized');
}
`;

        // Prepend canary flags to critical CSS
        if (assetName.includes("critical")) {
          asset.code = canaryFlags + css;
        } else {
          asset.code += canaryFlags;
        }
      });
    },
  };
}

// Critical CSS Extractor (for build-time analysis)
export function extractCriticalCSS() {
  return {
    name: "critical-css-extractor",
    generateBundle(options, bundle) {
      // This would integrate with a headless browser to extract critical CSS
      // For now, we'll create a placeholder
      this.warn(
        "Critical CSS extraction requires headless browser integration"
      );
    },
  };
}

// Performance Monitoring
export class CSSPerformanceMonitor {
  constructor() {
    this.metrics = {
      criticalSize: 0,
      totalSize: 0,
      chunkCount: 0,
      wafViolations: 0,
      revenueVariants: 0,
    };
  }

  recordMetric(metric, value) {
    this.metrics[metric] = value;
  }

  generateReport() {
    return {
      ...this.metrics,
      withinBudget: this.metrics.totalSize <= CSS_BUDGETS.total.maxBytes,
      wafCompliant: this.metrics.wafViolations === 0,
      performance: this.metrics.criticalSize <= CSS_BUDGETS.critical.maxBytes,
    };
  }
}

// Export configuration for use in build scripts
export { CSS_BUDGETS, WAF_RULES, REVENUE_CONFIG };
