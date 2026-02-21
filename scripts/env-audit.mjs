import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports", "env-audit.json");
const SCHEMA_PATH = path.join(ROOT, "ENV_SCHEMA.md");

const SOURCE_FILES = [".env", ".env.local", "ENV.example", "wrangler.toml"];
const SCAN_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".html",
  ".json",
  ".toml",
]);
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".wrangler",
  "coverage",
  "test-results",
]);

const USAGE_PATTERNS = [
  /process\.env\.([A-Z][A-Z0-9_]+)/g,
  /import\.meta\.env\.([A-Z][A-Z0-9_]+)/g,
  /\benv\.([A-Z][A-Z0-9_]+)/g,
];

const ALIAS_GROUPS = {
  GH_TOKEN: ["GH_TOKEN", "GITHUB_TOKEN", "GITHUB_PAT", "PERSONAL_ACCESS_TOKEN"],
  GH_REPO: ["GH_REPO", "GITHUB_REPO"],
  CLOUDFLARE_ACCOUNT_ID: ["CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID"],
};

const CRITICAL_GROUPS = [
  ["CONTROL_PASSWORD"],
  ["GH_TOKEN", "GITHUB_TOKEN", "GITHUB_PAT"],
  ["GH_REPO", "GITHUB_REPO"],
  ["CLOUDFLARE_API_TOKEN"],
];

const stableSort = (values) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));

const readJson = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
};

const readText = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

const toComparableReport = (report) => ({
  scannedFiles: report.scannedFiles,
  usedKeys: report.usedKeys,
  definedKeys: report.definedKeys,
  missing: report.missing,
  unused: report.unused,
  criticalMissing: report.criticalMissing,
  usageByKey: report.usageByKey,
});

const walk = (dir, out = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    if (!entry.isFile()) continue;
    const full = path.join(dir, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    out.push(full);
  }
  return out;
};

const parseEnvKeysFromFile = (absolutePath) => {
  if (!fs.existsSync(absolutePath)) return [];
  const content = fs.readFileSync(absolutePath, "utf8");
  const keys = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)\s*=/);
    if (match) keys.push(match[1]);
  }
  return keys;
};

const parseWrangler = (absolutePath) => {
  const vars = new Set();
  const bindings = new Set();
  if (!fs.existsSync(absolutePath)) return { vars, bindings };
  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  let section = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim().toLowerCase();
      continue;
    }
    if (section === "vars") {
      const match = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
      if (match) vars.add(match[1]);
      continue;
    }
    const bindingMatch = line.match(/^binding\s*=\s*"([A-Z][A-Z0-9_]*)"$/);
    if (bindingMatch) bindings.add(bindingMatch[1]);
    const nameMatch = line.match(/^name\s*=\s*"([A-Z][A-Z0-9_]*)"$/);
    if (nameMatch && section.includes("durable_objects.bindings"))
      bindings.add(nameMatch[1]);
  }
  return { vars, bindings };
};

const relative = (absolutePath) =>
  path.relative(ROOT, absolutePath).replace(/\\/g, "/");

const main = async () => {
  const files = walk(ROOT);
  const usageMap = new Map();

  for (const file of files) {
    const rel = relative(file);
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of USAGE_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
        const key = String(match[1] || "").trim();
        if (!key) continue;
        if (!usageMap.has(key)) usageMap.set(key, new Set());
        usageMap.get(key).add(rel);
      }
    }
  }

  const envDefined = new Set();
  for (const filename of [".env", ".env.local", "ENV.example"]) {
    const keys = parseEnvKeysFromFile(path.join(ROOT, filename));
    for (const key of keys) envDefined.add(key);
  }

  const { vars, bindings } = parseWrangler(path.join(ROOT, "wrangler.toml"));
  for (const key of vars) envDefined.add(key);
  for (const key of bindings) envDefined.add(key);

  const usedKeys = stableSort(Array.from(usageMap.keys()));
  const definedKeys = stableSort(Array.from(envDefined));
  const missing = [];

  for (const key of usedKeys) {
    const aliasGroup = Object.values(ALIAS_GROUPS).find((group) =>
      group.includes(key)
    );
    if (aliasGroup) {
      const hasAlias = aliasGroup.some((candidate) =>
        envDefined.has(candidate)
      );
      if (!hasAlias) missing.push(key);
      continue;
    }
    if (!envDefined.has(key)) missing.push(key);
  }

  const unused = definedKeys.filter((key) => !usageMap.has(key));

  const criticalMissing = [];
  for (const group of CRITICAL_GROUPS) {
    const found = group.some((key) => envDefined.has(key));
    if (!found) criticalMissing.push(group[0]);
  }

  const candidateReport = {
    scannedFiles: files.length,
    usedKeys,
    definedKeys,
    missing,
    unused,
    criticalMissing,
    usageByKey: Object.fromEntries(
      usedKeys.map((key) => [
        key,
        stableSort(Array.from(usageMap.get(key) || [])),
      ])
    ),
  };
  const previousReport = readJson(REPORT_PATH);
  const sameAsPrevious =
    previousReport &&
    JSON.stringify(toComparableReport(previousReport)) ===
      JSON.stringify(toComparableReport(candidateReport));
  const report = {
    generatedAt:
      sameAsPrevious && typeof previousReport.generatedAt === "string"
        ? previousReport.generatedAt
        : new Date().toISOString(),
    ...candidateReport,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

  const schemaLines = [];
  schemaLines.push("# ENV Schema");
  schemaLines.push("");
  schemaLines.push(`Generated: ${report.generatedAt}`);
  schemaLines.push("");
  schemaLines.push("## Summary");
  schemaLines.push("");
  schemaLines.push(`- Scanned files: ${report.scannedFiles}`);
  schemaLines.push(`- Used keys: ${report.usedKeys.length}`);
  schemaLines.push(`- Defined keys: ${report.definedKeys.length}`);
  schemaLines.push(`- Missing keys: ${report.missing.length}`);
  schemaLines.push(`- Critical missing keys: ${report.criticalMissing.length}`);
  schemaLines.push("");

  if (report.criticalMissing.length) {
    schemaLines.push("## Critical Missing");
    schemaLines.push("");
    for (const key of report.criticalMissing) schemaLines.push(`- ${key}`);
    schemaLines.push("");
  }

  schemaLines.push("## Key Matrix");
  schemaLines.push("");
  schemaLines.push("| Key | Defined | Used In Files | Status |");
  schemaLines.push("| --- | --- | --- | --- |");

  const tableKeys = stableSort([...report.usedKeys, ...report.definedKeys]);
  for (const key of tableKeys) {
    const usedIn = report.usageByKey[key] || [];
    const defined = report.definedKeys.includes(key) ? "yes" : "no";
    const status = report.missing.includes(key)
      ? "missing"
      : report.unused.includes(key)
        ? "unused"
        : "ok";
    schemaLines.push(`| ${key} | ${defined} | ${usedIn.length} | ${status} |`);
  }
  schemaLines.push("");

  const reportContent = `${JSON.stringify(report, null, 2)}\n`;
  const schemaContent = `${schemaLines.join("\n")}\n`;

  if (readText(REPORT_PATH) !== reportContent) {
    fs.writeFileSync(REPORT_PATH, reportContent);
  }
  if (readText(SCHEMA_PATH) !== schemaContent) {
    fs.writeFileSync(SCHEMA_PATH, schemaContent);
  }
  try {
    execSync("npx prettier --write ENV_SCHEMA.md reports/env-audit.json", {
      cwd: ROOT,
      stdio: "ignore",
    });
  } catch (_) {}

  console.log(`env-audit: report written to ${relative(REPORT_PATH)}`);
  console.log(`env-audit: schema written to ${relative(SCHEMA_PATH)}`);
  console.log(
    `env-audit: used=${report.usedKeys.length} defined=${report.definedKeys.length} missing=${report.missing.length} criticalMissing=${report.criticalMissing.length}`
  );

  if (report.criticalMissing.length) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(`env-audit: failed (${error?.message || "unknown error"})`);
  process.exit(1);
});
