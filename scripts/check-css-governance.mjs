import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const repoRoot = process.cwd();
const styleManifest = path.join(repoRoot, "styles.css");

const expectedImports = [
  "./src/design-system.css",
  "./src/layout-system.css",
  "./styles/base.css",
  "./styles/components.css",
  "./styles/animations.css",
  "./styles/utilities.css",
];

const importPattern = /^[ \t]*@import\s+(?:url\()?"([^"]+)"\)?\s*;[ \t]*$/gm;

const cssBudgetFiles = expectedImports.map((item) =>
  path.resolve(path.dirname(styleManifest), item)
);

const MAX_RAW_BYTES = 130 * 1024;
const MAX_GZIP_BYTES = 26 * 1024;

const read = (filePath) => fs.readFileSync(filePath, "utf8");

function assertManifestIntegrity() {
  if (!fs.existsSync(styleManifest)) {
    throw new Error("styles.css manifest is missing");
  }

  const manifest = read(styleManifest);
  const imports = [...manifest.matchAll(importPattern)].map((m) => m[1]);

  if (imports.length !== expectedImports.length) {
    throw new Error(
      `styles.css import count mismatch (expected ${expectedImports.length}, got ${imports.length})`
    );
  }

  for (let i = 0; i < expectedImports.length; i += 1) {
    if (imports[i] !== expectedImports[i]) {
      throw new Error(
        `styles.css import order mismatch at index ${i}: expected ${expectedImports[i]}, got ${imports[i]}`
      );
    }
  }

  for (const cssPath of cssBudgetFiles) {
    if (!fs.existsSync(cssPath)) {
      const rel = path.relative(repoRoot, cssPath).replace(/\\/g, "/");
      throw new Error(`Missing imported stylesheet: ${rel}`);
    }
  }
}

function assertNoDuplicateKeyframes() {
  const keyframePattern = /@keyframes\s+([a-zA-Z0-9_-]+)/g;
  const keyframeIndex = new Map();

  for (const cssPath of cssBudgetFiles) {
    const content = read(cssPath);
    const rel = path.relative(repoRoot, cssPath).replace(/\\/g, "/");

    for (const match of content.matchAll(keyframePattern)) {
      const name = match[1];
      const previous = keyframeIndex.get(name);
      if (previous) {
        throw new Error(
          `Duplicate @keyframes \"${name}\" in ${rel} (already declared in ${previous})`
        );
      }
      keyframeIndex.set(name, rel);
    }
  }
}

function assertFooterCanonicalization() {
  const componentsPath = path.join(repoRoot, "styles", "components.css");
  const content = read(componentsPath);
  const matches = content.match(/^\.vt-footer\s*\{/gm) || [];

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one .vt-footer block in styles/components.css, found ${matches.length}`
    );
  }
}

function assertCssBudget() {
  const buffers = cssBudgetFiles.map((cssPath) => fs.readFileSync(cssPath));
  const rawBytes = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const gzipBytes = zlib.gzipSync(Buffer.concat(buffers), { level: 9 }).length;

  if (rawBytes > MAX_RAW_BYTES) {
    throw new Error(
      `CSS raw budget exceeded: ${rawBytes} bytes (limit ${MAX_RAW_BYTES})`
    );
  }

  if (gzipBytes > MAX_GZIP_BYTES) {
    throw new Error(
      `CSS gzip budget exceeded: ${gzipBytes} bytes (limit ${MAX_GZIP_BYTES})`
    );
  }

  console.log(
    `css-governance: budget OK (raw ${rawBytes} bytes, gzip ${gzipBytes} bytes)`
  );
}

try {
  assertManifestIntegrity();
  assertNoDuplicateKeyframes();
  assertFooterCanonicalization();
  assertCssBudget();
  console.log("css-governance: OK");
} catch (error) {
  console.error("css-governance: FAILED", error.message);
  process.exit(1);
}
