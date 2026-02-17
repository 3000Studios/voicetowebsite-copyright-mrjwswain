import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, "GLOBAL_SYSTEM_INSTRUCTIONS.md");
const CHECK_ONLY = process.argv.includes("--check");

const AUTO_START = "<!-- AUTO-GENERATED:START -->";
const AUTO_END = "<!-- AUTO-GENERATED:END -->";

const readJsonSafe = (p, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};

const readTextSafe = (p, fallback = "") => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return fallback;
  }
};

const listDir = (dir, filterFn = () => true) => {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter(filterFn)
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
};

const toRoute = (htmlFile) => {
  const n = htmlFile.replace(/\.html$/i, "");
  return n === "index" ? "/" : `/${n}`;
};

const toAdminRoute = (htmlFile) => {
  const n = htmlFile.replace(/\.html$/i, "");
  return n === "index" ? "/admin" : `/admin/${n}`;
};

const getPublicHtml = () =>
  listDir(
    ROOT,
    (d) =>
      d.isFile() &&
      d.name.toLowerCase().endsWith(".html") &&
      !d.name.toLowerCase().startsWith("verification_error")
  );

const getAdminHtml = () =>
  listDir(
    path.join(ROOT, "admin"),
    (d) => d.isFile() && d.name.toLowerCase().endsWith(".html")
  );

const getAppStorePages = () => {
  const base = path.join(ROOT, "app Store apps to Sell");
  const out = [];
  const entries = listDir(base, (d) => d.isDirectory());
  for (const folder of entries) {
    const folderPath = path.join(base, folder);
    const html = listDir(
      folderPath,
      (d) => d.isFile() && d.name.toLowerCase().endsWith(".html")
    );
    for (const f of html) {
      const route =
        f.toLowerCase() === "index.html"
          ? `/apps/${folder}`
          : `/apps/${folder}/${f.replace(/\.html$/i, "")}`;
      out.push({ route, asset: `app Store apps to Sell/${folder}/${f}` });
    }
  }
  return out.sort((a, b) => a.route.localeCompare(b.route));
};

const getTopLevelAppStoreHtml = () => {
  const base = path.join(ROOT, "app Store apps to Sell");
  return listDir(
    base,
    (d) => d.isFile() && d.name.toLowerCase().endsWith(".html")
  ).map((f) => ({
    route: `/apps/${f.replace(/\.html$/i, "")}`,
    asset: `app Store apps to Sell/${f}`,
  }));
};

const getEnvKeys = () => {
  const keys = new Set();
  const scan = (txt) => {
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
      if (m) keys.add(m[1]);
    }
  };
  scan(readTextSafe(path.join(ROOT, "ENV.example")));
  scan(readTextSafe(path.join(ROOT, ".env.example")));
  return [...keys].sort((a, b) => a.localeCompare(b));
};

const toBulletList = (arr, empty = "_None found_") => {
  if (!arr.length) return empty;
  return arr.map((x) => `- ${x}`).join("\n");
};

const toRouteRows = (rows, empty = "_None found_") => {
  if (!rows.length) return empty;
  return rows.map((r) => `- \`${r.route}\` -> \`${r.asset}\``).join("\n");
};

const buildAutoBlock = () => {
  const pkg = readJsonSafe(path.join(ROOT, "package.json"), { scripts: {} });
  const vscodeExt = readJsonSafe(
    path.join(ROOT, ".vscode", "extensions.json"),
    { recommendations: [] }
  );
  const scriptsDir = listDir(path.join(ROOT, "scripts"), (d) => d.isFile());
  const huskyHooks = listDir(
    path.join(ROOT, ".husky"),
    (d) => d.isFile() && d.name !== "_"
  );
  const docs = [
    "AGENTS.md",
    "DEPLOYMENT.md",
    "SYSTEM_OPERATIONS.md",
    "EXECUTION.md",
    "ENV_GUIDE.md",
    "GLOBAL_SYSTEM_INSTRUCTIONS.md",
  ].filter((f) => fs.existsSync(path.join(ROOT, f)));

  const publicHtml = getPublicHtml();
  const adminHtml = getAdminHtml();
  const appStoreRoutes = [
    ...getAppStorePages(),
    ...getTopLevelAppStoreHtml(),
  ].sort((a, b) => a.route.localeCompare(b.route));
  const envKeys = getEnvKeys();

  const highValueScripts = [
    "dev:all",
    "verify",
    "deploy",
    "auto:ship",
    "sync",
    "ship",
    "ship:push",
  ]
    .filter((k) => pkg.scripts && pkg.scripts[k])
    .map((k) => `- \`${k}\`: \`${pkg.scripts[k]}\``)
    .join("\n");

  const publicRoutes = publicHtml.map((f) => ({ route: toRoute(f), asset: f }));
  const adminRoutes = adminHtml.map((f) => ({
    route: toAdminRoute(f),
    asset: `admin/${f}`,
  }));

  return `
## Auto-Generated Workbook Snapshot

### Runtime Profile
- Runtime: Cloudflare Workers + Vite static assets (\`worker.js\` + \`dist/\` via \`ASSETS\` binding)
- Deploy lock: local Wrangler deploy only (\`npm run deploy\`)
- Deploy safety: \`npm run verify\` must pass before deploy/commit

### Canonical Commands (from package.json)
${highValueScripts || "_No canonical scripts found_"}

### Route Inventory (Detected)
Public pages:
${toRouteRows(publicRoutes)}

Admin pages:
${toRouteRows(adminRoutes)}

App Store pages:
${toRouteRows(appStoreRoutes)}

### Bot Tooling & Workspace
Scripts available:
${toBulletList(scriptsDir.map((s) => `\`scripts/${s}\``))}

Git hooks:
${toBulletList(huskyHooks.map((h) => `\`.husky/${h}\``))}

Recommended VS Code extensions:
${toBulletList((vscodeExt.recommendations || []).map((e) => `\`${e}\``))}

Core governance docs present:
${toBulletList(docs.map((d) => `\`${d}\``))}

### Environment Keys (Detected, names only)
${toBulletList(envKeys.map((k) => `\`${k}\``))}

### Auto-Update Contract
- This snapshot is generated by \`scripts/update-global-system-doc.mjs\`.
- Pre-commit runs update automatically and stages this file.
- Verify enforces freshness with \`npm run ops:global-doc:check\`.
`;
};

const ensureBaseDoc = () => {
  if (fs.existsSync(DOC_PATH)) return;
  const base = `# GLOBAL SYSTEM INSTRUCTIONS (UPLOADABLE MASTER FILE)

## Mission
- Operate VoiceToWebsite as a stable, fast, monetizable, and secure production system.
- Run autonomous changes without breaking deployment, routing, payments, admin, or trust.

## Commander
- Commander identity: \`Mr.jwswain@gmail.com\` (Bossman).
- Authority model: Bossman is final business and product authority.
- Hard boundary: no secret leakage, no security sabotage, no destructive bypass of deploy safeguards.

## Agent Behavior Rules
- No silent failures.
- No half-wired UI.
- No duplicate logic.
- No dead code without quarantine reason.
- Every change must be reversible or have a forward-fix plan.

## Cross-Agent Collaboration
- Always converge with multi-agent review before high-impact changes:
  - Windsurf: implementation surface + UX assembly
  - Codex: parallel engineering + tests + refactors
  - Gemini: architecture/context + integration reasoning
  - Jules: safety, hygiene, and operational quality
- Canonical invariants:
  - one command parser
  - one action schema
  - one executor with dryRun parity
  - one deploy line

## Deploy Laws (Never Break)
- \`npm run verify\` must pass before commit/deploy.
- \`npm run deploy\` remains: \`npm run verify && wrangler deploy --keep-vars\`.
- Keep Worker wiring intact in \`wrangler.toml\`:
  - \`main = "worker.js"\`
  - \`assets = { directory = "dist", binding = "ASSETS" }\`
  - production routes for \`voicetowebsite.com/*\` and \`www.voicetowebsite.com/*\`
- Keep \`cloudflare.pages.toml.disabled\` disabled.
- Never add CI deploy workflow if guard policy forbids it.

## Security Laws (Never Break)
- Never commit secrets.
- Never expose secrets to client/runtime injection (\`window.__ENV\`).
- Treat any \`VITE_*\` value as public.
- Rotate compromised keys immediately.

## Monetization + Growth Priorities
- Keep checkout + entitlement + webhook verification reliable.
- Protect AdSense compliance (no deceptive UI, no forced autoplay audio).
- Optimize performance and conversion together (speed, clarity, trust).

## Change Workbook
- This file is both policy and workbook.
- All structural/ops changes must be reflected here.
- Auto-generated snapshot below must remain fresh.

${AUTO_START}
_pending generation_
${AUTO_END}
`;
  fs.writeFileSync(DOC_PATH, base.replace(/\r\n/g, "\n"), "utf8");
};

const updateDoc = () => {
  ensureBaseDoc();
  const text = readTextSafe(DOC_PATH);
  const generated = `${AUTO_START}\n${buildAutoBlock().trim()}\n${AUTO_END}`;

  const hasMarkers = text.includes(AUTO_START) && text.includes(AUTO_END);
  const next = hasMarkers
    ? text.replace(
        new RegExp(`${AUTO_START}[\\s\\S]*?${AUTO_END}`, "m"),
        generated
      )
    : `${text.trimEnd()}\n\n${generated}\n`;

  return { before: text, after: next };
};

const formatMarkdown = async (text) => {
  try {
    const prettier = await import("prettier");
    const out = await prettier.format(text, { parser: "markdown" });
    return out.replace(/\r\n/g, "\n");
  } catch {
    return text.replace(/\r\n/g, "\n");
  }
};

const { before, after } = updateDoc();
const normalizedBefore = before.replace(/\r\n/g, "\n");
const formattedAfter = await formatMarkdown(after);

// Write the formatted file first
fs.writeFileSync(DOC_PATH, formattedAfter, "utf8");

// Then format with prettier to ensure consistency
try {
  const prettier = await import("prettier");
  const prettierFormatted = await prettier.format(formattedAfter, {
    parser: "markdown",
  });
  const finalContent = prettierFormatted.replace(/\r\n/g, "\n");
  fs.writeFileSync(DOC_PATH, finalContent, "utf8");
} catch {
  // Keep the formatted version if prettier fails
}

if (normalizedBefore === formattedAfter) {
  process.exit(0);
}

if (CHECK_ONLY) {
  console.error(
    "GLOBAL_SYSTEM_INSTRUCTIONS.md is out of date. Run: npm run ops:global-doc:update"
  );
  process.exit(1);
}

console.log("Updated GLOBAL_SYSTEM_INSTRUCTIONS.md");
