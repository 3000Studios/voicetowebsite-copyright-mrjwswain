// CF Pages keeps prior-deployment files even when we remove them locally.
// Rather than try to delete them server-side (no API path for that), we
// OVERWRITE every conflicting .html with the SPA index.html so that even if
// CF serves /pricing.html, the user gets the React app which routes to
// /pricing via window.location.pathname.
//
// For paths that match a current SPA route, the React Router pathname
// detection will catch /pricing.html and react accordingly. We also rewrite
// the <script> src in each to be correct.
//
// The legacy multi-page Vite build was emitting 100+ static .html files
// (pricing.html, features.html, etc.) that compete with SPA routes.
import fs from "fs";
import path from "path";

const dist = path.resolve("dist");
if (!fs.existsSync(dist)) {
  console.log("strip-spa-conflicts: dist/ does not exist, skipping");
  process.exit(0);
}

const indexPath = path.join(dist, "index.html");
if (!fs.existsSync(indexPath)) {
  console.log("strip-spa-conflicts: dist/index.html missing, skipping");
  process.exit(0);
}
const indexHtml = fs.readFileSync(indexPath, "utf8");

let replaced = 0;
let removed = 0;
for (const entry of fs.readdirSync(dist)) {
  if (entry === "index.html") continue;
  if (!entry.endsWith(".html")) continue;
  const full = path.join(dist, entry);
  fs.writeFileSync(full, indexHtml, "utf8");
  replaced++;
}

// Strip nested .html files (admin/, src/, test/) — delete instead since they
// were never SPA-routable.
for (const sub of ["admin", "src", "test"]) {
  const subPath = path.join(dist, sub);
  if (!fs.existsSync(subPath)) continue;
  walk(subPath);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      // Replace with SPA shell so previously-deployed copies serve React
      fs.writeFileSync(full, indexHtml, "utf8");
      replaced++;
    }
  }
}

console.log(`strip-spa-conflicts: rewrote ${replaced} legacy .html files to SPA shell, removed ${removed}`);
