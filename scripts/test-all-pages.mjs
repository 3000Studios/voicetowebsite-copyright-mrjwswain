#!/usr/bin/env node
/**
 * Comprehensive Page and Link Testing Script
 *
 * Tests all pages and links to ensure they work properly.
 * Generates a detailed report of any issues found.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");

// All pages from vite.config.js
const PAGES = [
  { name: "Home", path: "/" },
  { name: "Sandbox", path: "/sandbox.html" },
  { name: "Admin", path: "/admin/index.html" },
  { name: "Admin Access", path: "/admin/access.html" },
  { name: "Admin Login", path: "/admin/login.html" },
  { name: "Admin Voice Commands", path: "/admin/voice-commands.html" },
  { name: "Admin Analytics", path: "/admin/analytics.html" },
  { name: "Admin Live Stream", path: "/admin/live-stream.html" },
  { name: "Admin Store Manager", path: "/admin/store-manager.html" },
  { name: "Admin App Store", path: "/admin/app-store-manager.html" },
  { name: "Admin Integrated", path: "/admin/integrated-dashboard.html" },
  { name: "Admin Live Room Test", path: "/admin/live-room-test.html" },
  { name: "About", path: "/about.html" },
  { name: "Store", path: "/store.html" },
  { name: "App Store", path: "/appstore.html" },
  { name: "App Store New", path: "/appstore-new.html" },
  { name: "License", path: "/license.html" },
  { name: "How It Works", path: "/how-it-works.html" },
  { name: "Templates", path: "/templates.html" },
  { name: "Features", path: "/features.html" },
  { name: "Features Enhanced", path: "/features-enhanced.html" },
  { name: "Pricing", path: "/pricing.html" },
  { name: "Pricing Enhanced", path: "/pricing-enhanced.html" },
  { name: "Demo", path: "/demo.html" },
  { name: "Search", path: "/search.html" },
  { name: "Search Enhanced", path: "/search-enhanced.html" },
  { name: "Support", path: "/support.html" },
  { name: "Status", path: "/status.html" },
  { name: "Trust", path: "/trust.html" },
  { name: "Partners", path: "/partners.html" },
  { name: "WebForge", path: "/webforge.html" },
  { name: "Cursor Demo", path: "/cursor-demo.html" },
  { name: "Project Planning Hub", path: "/project-planning-hub.html" },
  { name: "Rush Percussion", path: "/rush-percussion.html" },
  { name: "Blog", path: "/blog.html" },
  { name: "Contact", path: "/contact.html" },
  { name: "Contact Enhanced", path: "/contact-enhanced.html" },
  { name: "Gallery", path: "/gallery.html" },
  { name: "Legal", path: "/legal.html" },
  { name: "Copyrights", path: "/copyrights.html" },
  { name: "Livestream", path: "/livestream.html" },
  { name: "Phosphor Nav", path: "/phosphor-nav.html" },
  { name: "Referrals", path: "/referrals.html" },
  { name: "Projects", path: "/projects.html" },
  { name: "Studio 3000", path: "/studio3000.html" },
  { name: "The 3000", path: "/the3000.html" },
  { name: "The 3000 Gallery", path: "/the3000-gallery.html" },
  { name: "Neural Engine", path: "/neural-engine.html" },
  { name: "Strata Design System", path: "/strata-design-system.html" },
  { name: "API Documentation", path: "/api-documentation.html" },
  { name: "Voice to JSON", path: "/voice-to-json.html" },
  { name: "Geological Studies", path: "/geological-studies.html" },
  { name: "Privacy", path: "/privacy.html" },
  { name: "Terms", path: "/terms.html" },
  { name: "Lexicon Pro", path: "/lexicon-pro.html" },
];

const baseFromArg = process.argv[2];
const BASE_URL =
  (
    baseFromArg ||
    process.env.BASE_URL ||
    process.env.VTW_BASE_URL ||
    "http://localhost:5173"
  )
    .trim()
    .replace(/\/+$/, "") || "http://localhost:5173";

async function checkPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const results = {
    url,
    name: page.name,
    status: "unknown",
    loadTime: 0,
    error: null,
    issues: [],
  };

  try {
    const startTime = Date.now();

    // Simple fetch check
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "VTW-Page-Tester/1.0",
      },
    });

    const loadTime = Date.now() - startTime;
    results.loadTime = loadTime;
    results.status = response.status;

    if (response.ok) {
      const text = await response.text();

      // Basic checks
      if (text.includes("404")) {
        results.issues.push("Page contains 404 content");
      }

      if (text.includes("Cannot GET") || text.includes("Cannot find")) {
        results.issues.push("Page contains error messages");
      }

      if (text.length < 100) {
        results.issues.push("Page content seems too short");
      }

      // Check for common error patterns
      const errorPatterns = [
        /Error:/i,
        /TypeError:/i,
        /ReferenceError:/i,
        /Cannot read prop/i,
        /Failed to compile/i,
      ];

      for (const pattern of errorPatterns) {
        if (pattern.test(text)) {
          results.issues.push(`JavaScript error detected: ${pattern.source}`);
          break;
        }
      }
    } else {
      results.issues.push(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    results.error = error.message;
    results.issues.push(`Network error: ${error.message}`);
  }

  return results;
}

async function checkLinks() {
  console.warn("🔗 Checking internal links...");

  const links = [];
  const visited = new Set();

  // Start from home page
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();

    // Extract all internal links
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];

      // Only check internal links
      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !visited.has(href)
      ) {
        visited.add(href);

        // Skip external resources
        if (!href.includes(".") || href.endsWith(".html")) {
          links.push({
            from: "Home",
            to: href,
            status: "pending",
          });
        }
      }
    }
  } catch (error) {
    console.error("Could not extract links from home page:", error.message);
  }

  return links;
}

async function generateReport() {
  console.warn("🧪 Starting comprehensive page and link testing...");
  console.warn(`Base URL: ${BASE_URL}`);

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: [],
    links: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  // Test all pages
  console.warn(`\n📄 Testing ${PAGES.length} pages...`);

  for (const page of PAGES) {
    process.stdout.write(`  Testing ${page.name}... `);
    const result = await checkPage(page);
    results.pages.push(result);

    if (result.issues.length === 0 && result.status === 200) {
      console.warn("✅ OK");
      results.summary.passed++;
    } else {
      console.warn("❌ ISSUES");
      results.summary.failed++;
    }

    results.summary.total++;

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Check links
  const links = await checkLinks();
  results.links = links;

  // Generate summary
  console.warn(`\n📊 SUMMARY`);
  console.warn("=".repeat(50));
  console.warn(`Total pages tested: ${results.summary.total}`);
  console.warn(`Passed: ${results.summary.passed}`);
  console.warn(`Failed: ${results.summary.failed}`);
  console.warn(`Internal links found: ${links.length}`);

  // Show failed pages
  const failedPages = results.pages.filter(
    (p) => p.issues.length > 0 || p.status !== 200
  );
  if (failedPages.length > 0) {
    console.warn(`\n❌ FAILED PAGES (${failedPages.length}):`);
    failedPages.forEach((page) => {
      console.warn(`  ${page.name} (${page.url}):`);
      page.issues.forEach((issue) => console.warn(`    - ${issue}`));
      if (page.error) console.warn(`    Error: ${page.error}`);
    });
  }

  // Show slow pages
  const slowPages = results.pages.filter((p) => p.loadTime > 2000);
  if (slowPages.length > 0) {
    console.warn(`\n⚠️  SLOW PAGES (${slowPages.length}):`);
    slowPages.forEach((page) => {
      console.warn(`  ${page.name}: ${page.loadTime}ms`);
    });
  }

  // Save detailed report
  const reportPath = join(root, "reports", "page-test-report.json");
  try {
    writeFileSync(reportPath, JSON.stringify(results, null, 2) + "\n");
    console.warn(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error(`Could not save report: ${error.message}`);
  }

  return results;
}

// Main execution
async function main() {
  try {
    const results = await generateReport();

    if (results.summary.failed === 0) {
      console.warn("\n🎉 ALL PAGES PASSED!");
      process.exit(0);
    } else {
      console.warn(
        `\n❌ ${results.summary.failed} pages failed. Please fix the issues above.`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error during testing:", error);
    process.exit(1);
  }
}

main();
