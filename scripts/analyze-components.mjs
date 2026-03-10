#!/usr/bin/env node
/**
 * Component Impact Analyzer
 *
 * Analyzes the performance and bundle impact of specific components,
 * with focus on HomeWireframeBackground and other new components.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const srcDir = join(root, "src");

// Component analysis configuration
const COMPONENTS_TO_ANALYZE = [
  "HomeWireframeBackground",
  "AudioWaveform",
  "BioluminescentHeader",
  "VitreousLogo",
];

function analyzeComponent(componentName) {
  const componentPath = join(srcDir, "components", `${componentName}.tsx`);

  try {
    const content = readFileSync(componentPath, "utf8");
    const lines = content.split("\n");

    const analysis = {
      name: componentName,
      lines: lines.length,
      imports: extractImports(content),
      hooks: extractHooks(content),
      inlineStyles: extractInlineStyles(content),
      animations: extractAnimations(content),
      performance: {
        hasUseEffect: content.includes("useEffect"),
        hasUseMemo: content.includes("useMemo"),
        hasUseCallback: content.includes("useCallback"),
        hasLazyLoad: content.includes("lazy("),
        hasPerformanceMonitoring: content.includes("performance.now"),
      },
      accessibility: {
        hasAriaLabels: content.includes("aria-"),
        hasSemanticHtml: /<(header|main|nav|section|article|aside|footer)/.test(
          content
        ),
        hasReducedMotion:
          content.includes("useReducedMotion") ||
          content.includes("prefers-reduced-motion"),
      },
    };

    return analysis;
  } catch (error) {
    return {
      name: componentName,
      error: `Could not analyze: ${error.message}`,
    };
  }
}

function extractImports(content) {
  const importRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function extractHooks(content) {
  const hookRegex = /use[A-Z]\w*/g;
  const hooks = [];
  let match;

  while ((match = hookRegex.exec(content)) !== null) {
    hooks.push(match[0]);
  }

  return [...new Set(hooks)];
}

function extractInlineStyles(content) {
  const styleRegex = /style=\{\{([^}]+)\}\}/g;
  const styles = [];
  let match;

  while ((match = styleRegex.exec(content)) !== null) {
    styles.push(match[1]);
  }

  return styles.length;
}

function extractAnimations(content) {
  return {
    framerMotion:
      content.includes("motion.") || content.includes('from "framer-motion"'),
    cssAnimations:
      content.includes("animation:") || content.includes("@keyframes"),
    transitions:
      content.includes("transition:") || content.includes("useTransition"),
  };
}

function generateRecommendations(analysis) {
  const recommendations = [];

  // Performance recommendations
  if (analysis.performance.hasUseEffect && !analysis.performance.hasUseMemo) {
    recommendations.push(
      "Consider using useMemo for expensive computations in useEffect"
    );
  }

  if (analysis.inlineStyles > 5) {
    recommendations.push(
      "High number of inline styles - consider moving to CSS classes"
    );
  }

  if (!analysis.performance.hasLazyLoad && analysis.lines > 100) {
    recommendations.push("Consider lazy loading for large components");
  }

  if (!analysis.performance.hasPerformanceMonitoring) {
    recommendations.push(
      "Add performance monitoring for better optimization insights"
    );
  }

  // Accessibility recommendations
  if (!analysis.accessibility.hasAriaLabels) {
    recommendations.push("Add ARIA labels for better accessibility");
  }

  if (
    !analysis.accessibility.hasReducedMotion &&
    analysis.animations.framerMotion
  ) {
    recommendations.push("Add reduced motion support for animations");
  }

  // Bundle size recommendations
  const heavyImports = analysis.imports.filter(
    (imp) =>
      imp.includes("framer-motion") ||
      imp.includes("three") ||
      imp.includes("d3")
  );

  if (heavyImports.length > 0) {
    recommendations.push(
      `Heavy imports detected: ${heavyImports.join(", ")} - consider dynamic imports`
    );
  }

  return recommendations;
}

function generateReport(analyses) {
  console.warn("\n🧩 COMPONENT IMPACT ANALYSIS");
  console.warn("=".repeat(50));

  for (const analysis of analyses) {
    if (analysis.error) {
      console.error(`❌ ${analysis.name}: ${analysis.error}`);
      continue;
    }

    console.warn(`\n📋 ${analysis.name}`);
    console.warn("-".repeat(30));

    // Basic stats
    console.warn(`Lines of code: ${analysis.lines}`);
    console.warn(`Imports: ${analysis.imports.length}`);
    console.warn(`React hooks: ${analysis.hooks.join(", ")}`);
    console.warn(`Inline styles: ${analysis.inlineStyles}`);

    // Performance
    console.warn("\n⚡ Performance:");
    console.warn(
      `  useEffect: ${analysis.performance.hasUseEffect ? "✅" : "❌"}`
    );
    console.warn(`  useMemo: ${analysis.performance.hasUseMemo ? "✅" : "❌"}`);
    console.warn(
      `  useCallback: ${analysis.performance.hasUseCallback ? "✅" : "❌"}`
    );
    console.warn(
      `  Lazy loading: ${analysis.performance.hasLazyLoad ? "✅" : "❌"}`
    );
    console.warn(
      `  Performance monitoring: ${analysis.performance.hasPerformanceMonitoring ? "✅" : "❌"}`
    );

    // Animations
    console.warn("\n🎨 Animations:");
    console.warn(
      `  Framer Motion: ${analysis.animations.framerMotion ? "✅" : "❌"}`
    );
    console.warn(
      `  CSS Animations: ${analysis.animations.cssAnimations ? "✅" : "❌"}`
    );
    console.warn(
      `  Transitions: ${analysis.animations.transitions ? "✅" : "❌"}`
    );

    // Accessibility
    console.warn("\n♿ Accessibility:");
    console.warn(
      `  ARIA labels: ${analysis.accessibility.hasAriaLabels ? "✅" : "❌"}`
    );
    console.warn(
      `  Semantic HTML: ${analysis.accessibility.hasSemanticHtml ? "✅" : "❌"}`
    );
    console.warn(
      `  Reduced motion: ${analysis.accessibility.hasReducedMotion ? "✅" : "❌"}`
    );

    // Recommendations
    const recommendations = generateRecommendations(analysis);
    if (recommendations.length > 0) {
      console.warn("\n💡 Recommendations:");
      recommendations.forEach((rec) => console.warn(`  • ${rec}`));
    } else {
      console.warn("\n✅ No recommendations - component looks well optimized!");
    }
  }

  // Summary
  console.warn("\n📊 SUMMARY");
  console.warn("=".repeat(30));

  const validAnalyses = analyses.filter((a) => !a.error);
  const totalLines = validAnalyses.reduce((sum, a) => sum + a.lines, 0);
  const avgLines = Math.round(totalLines / validAnalyses.length);

  console.warn(`Total components analyzed: ${validAnalyses.length}`);
  console.warn(`Total lines of code: ${totalLines}`);
  console.warn(`Average component size: ${avgLines} lines`);

  const withPerformanceMonitoring = validAnalyses.filter(
    (a) => a.performance.hasPerformanceMonitoring
  ).length;
  const withReducedMotion = validAnalyses.filter(
    (a) => a.accessibility.hasReducedMotion
  ).length;
  const withLazyLoading = validAnalyses.filter(
    (a) => a.performance.hasLazyLoad
  ).length;

  console.warn(
    `Components with performance monitoring: ${withPerformanceMonitoring}/${validAnalyses.length}`
  );
  console.warn(
    `Components with reduced motion support: ${withReducedMotion}/${validAnalyses.length}`
  );
  console.warn(
    `Components with lazy loading: ${withLazyLoading}/${validAnalyses.length}`
  );

  // Generate JSON report
  const reportData = {
    timestamp: new Date().toISOString(),
    components: validAnalyses,
    summary: {
      totalComponents: validAnalyses.length,
      totalLines,
      averageLines: avgLines,
      withPerformanceMonitoring,
      withReducedMotion,
      withLazyLoading,
    },
  };

  const reportPath = join(root, "reports", "component-analysis.json");
  try {
    writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.warn(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error(`Could not save report: ${error.message}`);
  }
}

function main() {
  console.warn("🔍 Analyzing component performance and impact...");

  const analyses = COMPONENTS_TO_ANALYZE.map(analyzeComponent);
  generateReport(analyses);

  console.warn("\n✅ Component analysis completed!");
}

main();
