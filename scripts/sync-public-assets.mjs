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

const inlineCssImports = (entryFile, stack = []) => {
  const resolvedEntry = path.resolve(entryFile);
  if (stack.includes(resolvedEntry)) {
    const cycle = [...stack, resolvedEntry]
      .map((p) => path.relative(repoRoot, p))
      .join(" -> ");
    throw new Error(`Circular CSS import detected: ${cycle}`);
  }

  if (!fs.existsSync(resolvedEntry)) {
    throw new Error(`Missing CSS import source: ${resolvedEntry}`);
  }

  const source = fs.readFileSync(resolvedEntry, "utf8");
  const baseDir = path.dirname(resolvedEntry);
  const nextStack = [...stack, resolvedEntry];

  return source.replace(
    /^[ \t]*@import\s+(?:url\()?["']([^"']+)["']\)?\s*;[ \t]*$/gm,
    (statement, specifier) => {
      if (
        /^(?:https?:)?\/\//i.test(specifier) ||
        specifier.startsWith("data:")
      ) {
        return statement;
      }

      const importedPath = path.resolve(baseDir, specifier);
      const importedCss = inlineCssImports(importedPath, nextStack).trim();
      const rel = path.relative(repoRoot, importedPath).replace(/\\/g, "/");
      return `/* begin import: ${rel} */\n${importedCss}\n/* end import: ${rel} */`;
    }
  );
};

// Keep canonical "root" UI shell files in sync with Vite's `public/` output.
// This ensures `dist/` contains `/styles.css` + `/nav.js` which the site serves directly.
const bundledStyles = inlineCssImports(
  path.join(repoRoot, "styles.css")
).trim();
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(
  path.join(publicDir, "styles.css"),
  `${bundledStyles}\n`,
  "utf8"
);
copy("nav.js", "public/nav.js");

console.log("[sync-public-assets] OK");
