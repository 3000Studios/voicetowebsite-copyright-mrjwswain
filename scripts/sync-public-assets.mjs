import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");

const copy = (fromRel, toRel) => {
  const from = path.join(repoRoot, fromRel);
  const to = path.join(repoRoot, toRel);
  if (!fs.existsSync(from)) {
    throw new Error(`Missing source file: ${fromRel}`);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

// Keep canonical "root" UI shell files in sync with Vite's `public/` output.
// This ensures `dist/` contains `/styles.css` + `/nav.js` which the site serves directly.
copy("styles.css", "public/styles.css");
copy("nav.js", "public/nav.js");

console.log("[sync-public-assets] OK");
