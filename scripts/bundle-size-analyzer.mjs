#!/usr/bin/env node
/**
 * Bundle Size Analyzer
 *
 * Analyzes the bundle size impact of components and provides detailed reports.
 * Focuses on measuring the impact of new components like HomeWireframeBackground.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");

// Configuration for size budgets (in bytes)
const BUDGETS = {
  total: 1024 * 1024, // 1MB total bundle
  component: 50 * 1024, // 50KB per component
  css: 100 * 1024, // 100KB for CSS
  js: 500 * 1024, // 500KB for JavaScript
};

// Component size tracking
const componentSizes = new Map();
const fileTypes = new Map();

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function analyzeFile(filePath) {
  try {
    const stats = statSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const fileName = basename(filePath);

    // Track file types
    if (!fileTypes.has(ext)) {
      fileTypes.set(ext, { count: 0, size: 0 });
    }
    fileTypes.get(ext).count++;
    fileTypes.get(ext).size += stats.size;

    // Analyze component files
    if (filePath.includes("components") && (ext === ".js" || ext === ".css")) {
      const componentName = basename(filePath, ext);
      componentSizes.set(componentName, {
        size: stats.size,
        path: filePath,
        type: ext,
      });
    }

    return stats.size;
  } catch (error) {
    console.warn(`Warning: Could not analyze ${filePath}: ${error.message}`);
    return 0;
  }
}

function scanDirectory(dir, results = []) {
  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        scanDirectory(fullPath, results);
      } else {
        results.push({
          path: fullPath,
          size: analyzeFile(fullPath),
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
  }

  return results;
}

function generateReport(files) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const jsSize = fileTypes.get(".js")?.size || 0;
  const cssSize = fileTypes.get(".css")?.size || 0;

  console.log("\n📊 BUNDLE SIZE ANALYSIS REPORT");
  console.log("=".repeat(50));

  // Overall stats
  console.log("\n📦 Overall Bundle Stats:");
  console.log(
    `Total Size: ${formatBytes(totalSize)} (Budget: ${formatBytes(BUDGETS.total)})`
  );
  console.log(
    `JavaScript: ${formatBytes(jsSize)} (Budget: ${formatBytes(BUDGETS.js)})`
  );
  console.log(
    `CSS: ${formatBytes(cssSize)} (Budget: ${formatBytes(BUDGETS.css)})`
  );

  // Budget status
  console.log("\n🎯 Budget Status:");
  console.log(
    `Total Bundle: ${totalSize <= BUDGETS.total ? "✅" : "❌"} ${formatBytes(totalSize)} / ${formatBytes(BUDGETS.total)}`
  );
  console.log(
    `JavaScript: ${jsSize <= BUDGETS.js ? "✅" : "❌"} ${formatBytes(jsSize)} / ${formatBytes(BUDGETS.js)}`
  );
  console.log(
    `CSS: ${cssSize <= BUDGETS.css ? "✅" : "❌"} ${formatBytes(cssSize)} / ${formatBytes(BUDGETS.css)}`
  );

  // Component analysis
  console.log("\n🧩 Component Analysis:");
  const sortedComponents = Array.from(componentSizes.entries()).sort(
    ([, a], [, b]) => b.size - a.size
  );

  for (const [name, info] of sortedComponents) {
    const status = info.size <= BUDGETS.component ? "✅" : "❌";
    console.log(`${status} ${name}: ${formatBytes(info.size)} (${info.type})`);

    if (info.size > BUDGETS.component) {
      console.warn(
        `  ⚠️  Exceeds component budget by ${formatBytes(info.size - BUDGETS.component)}`
      );
    }
  }

  // File type breakdown
  console.log("\n📄 File Type Breakdown:");
  const sortedTypes = Array.from(fileTypes.entries()).sort(
    ([, a], [, b]) => b.size - a.size
  );

  for (const [ext, info] of sortedTypes) {
    const percentage = ((info.size / totalSize) * 100).toFixed(1);
    console.log(
      `${ext}: ${formatBytes(info.size)} (${info.count} files, ${percentage}%)`
    );
  }

  // Largest files
  console.log("\n🔍 Largest Files:");
  const largestFiles = files.sort((a, b) => b.size - a.size).slice(0, 10);

  for (const file of largestFiles) {
    const relativePath = file.path.replace(distDir + "/", "");
    console.log(`${formatBytes(file.size)} - ${relativePath}`);
  }

  // Recommendations
  console.log("\n💡 Recommendations:");

  if (totalSize > BUDGETS.total) {
    console.log("❌ Bundle exceeds total size budget. Consider:");
    console.log("   • Code splitting for larger components");
    console.log("   • Lazy loading non-critical components");
    console.log("   • Optimizing images and assets");
  }

  if (jsSize > BUDGETS.js) {
    console.log("❌ JavaScript bundle is too large. Consider:");
    console.log("   • Tree shaking unused imports");
    console.log("   • Minification and compression");
    console.log("   • Dynamic imports for heavy dependencies");
  }

  if (cssSize > BUDGETS.css) {
    console.log("❌ CSS bundle is too large. Consider:");
    console.log("   • CSS purging for unused styles");
    console.log("   • Critical CSS extraction");
    console.log("   • Shared utility classes");
  }

  // Check specific components
  const homeWireframeSize = componentSizes.get("HomeWireframeBackground");
  if (homeWireframeSize) {
    console.log(`\n🎨 HomeWireframeBackground Analysis:`);
    console.log(`Size: ${formatBytes(homeWireframeSize.size)}`);

    if (homeWireframeSize.size > BUDGETS.component) {
      console.log("⚠️  Consider optimizing this component:");
      console.log("   • Move inline styles to CSS classes");
      console.log("   • Use CSS custom properties for theming");
      console.log("   • Implement lazy loading for animations");
    } else {
      console.log("✅ Component size is within budget");
    }
  }

  return {
    totalSize,
    jsSize,
    cssSize,
    componentCount: componentSizes.size,
    withinBudget: totalSize <= BUDGETS.total,
  };
}

function main() {
  console.log("🔍 Analyzing bundle size...");

  if (!statSync(distDir).isDirectory()) {
    console.error("❌ Build directory not found. Run 'npm run build' first.");
    process.exit(1);
  }

  const files = scanDirectory(distDir);
  const report = generateReport(files);

  // Exit with error code if over budget
  if (!report.withinBudget) {
    console.log(
      "\n❌ Bundle exceeds size limits. Please optimize before deploying."
    );
    process.exit(1);
  }

  console.log("\n✅ Bundle analysis completed successfully!");
}

// Run the analysis
main();
