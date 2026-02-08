import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WF_DIR = path.join(ROOT, ".github", "workflows");

const forbiddenPatterns = [
  /cloudflare\/wrangler-action@/i,
  /wrangler-action@/i,
  /^\s*name:\s*deploy to cloudflare\s*$/im,
  /^\s*command:\s*deploy\s*$/im,
  /\bwrangler\s+deploy\b/i,
];

const listWorkflowFiles = () => {
  try {
    return fs
      .readdirSync(WF_DIR)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .map((f) => path.join(WF_DIR, f));
  } catch {
    return [];
  }
};

const main = () => {
  const files = listWorkflowFiles();
  const violations = [];

  for (const file of files) {
    const base = path.basename(file).toLowerCase();
    const text = fs.readFileSync(file, "utf8");

    // Enforce: no deploy workflow besides the disabled stub.
    if (base === "deploy.yml" || base === "deploy.yaml") {
      violations.push(`${path.relative(ROOT, file)}: deploy workflow file name is not allowed`);
    }

    for (const re of forbiddenPatterns) {
      if (re.test(text)) {
        violations.push(`${path.relative(ROOT, file)}: forbidden deploy pattern matched (${re})`);
      }
    }
  }

  if (violations.length) {
    console.error("guard-deploy: FAIL");
    for (const v of violations) console.error(`- ${v}`);
    console.error(
      "This repo is locked to local production deploy via `npm run auto:ship` (wrangler deploy workaround)."
    );
    process.exit(1);
  }

  console.log("guard-deploy: OK");
};

main();
