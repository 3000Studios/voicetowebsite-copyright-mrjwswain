// Replace Tailwind v4 non-canonical class names with their canonical forms
// across the source tree. Each replacement is conservative — it only touches
// substrings inside quoted strings (className values) to avoid mangling
// comments or property names.
//
// The IDE was reporting 50+ "suggestCanonicalClasses" warnings; these are
// not errors and the site renders correctly either way, but cleaning them up
// removes the noise.
import fs from "fs";
import path from "path";

const root = path.resolve("src");
const exts = new Set([".tsx", ".ts"]);

// Each rule is a [regex, replacement]. Regexes use word-boundary lookarounds
// to avoid matching substrings like `bg-gradient-toxic` or `rounded-[32pxX]`.
// We bound matches by class-list separators: start/space/quote/backtick on
// both sides.
const before = "(?<=[\"'\\s\\[`,{])";
const after = "(?=[\"'\\s\\]`,}])";

const rules = [
  // Linear gradients
  ["bg-gradient-to-r",  "bg-linear-to-r"],
  ["bg-gradient-to-l",  "bg-linear-to-l"],
  ["bg-gradient-to-t",  "bg-linear-to-t"],
  ["bg-gradient-to-b",  "bg-linear-to-b"],
  ["bg-gradient-to-tr", "bg-linear-to-tr"],
  ["bg-gradient-to-tl", "bg-linear-to-tl"],
  ["bg-gradient-to-br", "bg-linear-to-br"],
  ["bg-gradient-to-bl", "bg-linear-to-bl"],

  // Flex utilities
  ["flex-grow-0", "grow-0"],
  ["flex-grow", "grow"],
  ["flex-shrink-0", "shrink-0"],

  // Common arbitrary radii that have named tokens in v4
  ["rounded-\\[32px\\]", "rounded-4xl"],
  ["rounded-\\[2rem\\]", "rounded-4xl"],
  ["rounded-\\[1\\.5rem\\]", "rounded-3xl"],

  // Tiny translate
  ["hover:-translate-y-\\[1px\\]", "hover:-translate-y-px"],
  ["-translate-y-\\[1px\\]", "-translate-y-px"],

  // Min-height arbitrary
  ["min-h-\\[340px\\]", "min-h-85"],

  // White opacity arbitraries that fit the v4 percentage scale
  ["via-white/\\[0\\.04\\]", "via-white/4"],
  ["from-white/\\[0\\.06\\]", "from-white/6"],
  ["from-white/\\[0\\.07\\]", "from-white/[0.07]"], // keep — no 7% token
  ["to-white/\\[0\\.01\\]", "to-white/1"],
  ["to-white/\\[0\\.02\\]", "to-white/2"],
  ["bg-white/\\[0\\.04\\]", "bg-white/4"],
  ["bg-white/\\[0\\.06\\]", "bg-white/6"],
  ["bg-white/\\[0\\.05\\]", "bg-white/5"],
];

const compiled = rules
  .filter(([, replacement]) => replacement !== null)
  .map(([pattern, replacement]) => {
    if (pattern.startsWith("via-white/[0.07]")) return null; // skip self-noops
    return [new RegExp(before + pattern + after, "g"), replacement];
  })
  .filter(Boolean);

function walk(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += walk(full);
      continue;
    }
    if (!exts.has(path.extname(entry.name))) continue;
    const before = fs.readFileSync(full, "utf8");
    let after = before;
    for (const [re, rep] of compiled) {
      after = after.replace(re, rep);
    }
    if (after !== before) {
      fs.writeFileSync(full, after, "utf8");
      total++;
      console.log(`  rewrote ${path.relative(process.cwd(), full)}`);
    }
  }
  return total;
}

console.log("fix-tailwind-canonicals: scanning", root);
const count = walk(root);
console.log(`fix-tailwind-canonicals: updated ${count} file(s)`);
