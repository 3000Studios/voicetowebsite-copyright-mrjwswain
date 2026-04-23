#!/usr/bin/env node
/**
 * Scan a folder recursively and delete (or quarantine) duplicate files safely using hashing.
 *
 * Usage:
 *   node scripts/dedupe-files.js <folder> [--algo sha256] [--dry-run]
 *        [--action delete|quarantine] [--quarantine-dir <dir>]
 *        [--min-bytes 1] [--follow-symlinks]
 *
 * Notes:
 * - Default action is quarantine (move duplicates) to be safer than delete.
 * - Duplicates are determined by: size -> partial hash -> full hash.
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_ALGO = "sha256";
const DEFAULT_ACTION = "quarantine"; // safer than delete
const PARTIAL_BYTES = 1024 * 1024; // 1MB

function parseArgs(argv) {
  const args = {
    folder: null,
    algo: DEFAULT_ALGO,
    dryRun: false,
    action: DEFAULT_ACTION,
    quarantineDir: null,
    minBytes: 1,
    followSymlinks: false,
  };

  const positionals = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positionals.push(a);
      continue;
    }
    const [flag, maybeValue] = a.includes("=") ? a.split("=", 2) : [a, null];
    const nextValue = () => {
      if (maybeValue != null) return maybeValue;
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) return null;
      i++;
      return v;
    };

    switch (flag) {
      case "--algo": {
        const v = nextValue();
        if (!v) throw new Error("--algo requires a value");
        args.algo = v;
        break;
      }
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--action": {
        const v = nextValue();
        if (!v) throw new Error("--action requires a value");
        if (v !== "delete" && v !== "quarantine") throw new Error("--action must be delete|quarantine");
        args.action = v;
        break;
      }
      case "--quarantine-dir": {
        const v = nextValue();
        if (!v) throw new Error("--quarantine-dir requires a value");
        args.quarantineDir = v;
        break;
      }
      case "--min-bytes": {
        const v = nextValue();
        if (!v) throw new Error("--min-bytes requires a value");
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) throw new Error("--min-bytes must be a non-negative number");
        args.minBytes = n;
        break;
      }
      case "--follow-symlinks":
        args.followSymlinks = true;
        break;
      case "--help":
      case "-h":
        printHelpAndExit(0);
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }

  if (positionals.length < 1) {
    printHelpAndExit(1);
  }

  args.folder = positionals[0];
  return args;
}

function printHelpAndExit(code) {
  const msg = `\
Usage:
  node scripts/dedupe-files.js <folder> [options]

Options:
  --dry-run                 Print actions without changing anything
  --action delete|quarantine Default: quarantine
  --quarantine-dir <dir>    Default: <folder>/.dedupe-quarantine
  --algo <hash>             Default: sha256 (any crypto supported hash)
  --min-bytes <n>           Skip files smaller than n bytes (default: 1)
  --follow-symlinks         Follow symlinks (default: false)
  -h, --help                Show help
`;
  // eslint-disable-next-line no-console
  console.log(msg);
  process.exit(code);
}

async function* walk(dir, { followSymlinks }) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walk(p, { followSymlinks });
    } else if (ent.isFile()) {
      yield p;
    } else if (ent.isSymbolicLink() && followSymlinks) {
      let st;
      try {
        st = await fsp.stat(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) yield* walk(p, { followSymlinks });
      else if (st.isFile()) yield p;
    }
  }
}

async function hashFile(filePath, algo) {
  const h = crypto.createHash(algo);
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => h.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return h.digest("hex");
}

async function partialHash(filePath, algo) {
  const h = crypto.createHash(algo);
  const fd = await fsp.open(filePath, "r");
  try {
    const { size } = await fd.stat();
    const readLen = Math.min(size, PARTIAL_BYTES);
    const buf = Buffer.alloc(readLen);
    const { bytesRead } = await fd.read(buf, 0, readLen, 0);
    h.update(buf.subarray(0, bytesRead));
    return h.digest("hex");
  } finally {
    await fd.close();
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function moveToQuarantine(filePath, quarantineRoot, baseRoot) {
  // preserve relative path structure to avoid name collisions
  const rel = path.relative(baseRoot, filePath);
  const targetDir = path.join(quarantineRoot, path.dirname(rel));
  await ensureDir(targetDir);

  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(targetDir, `${name}.DUP.${stamp}${ext}`);
  await fsp.rename(filePath, target);
  return target;
}

async function main() {
  const opts = parseArgs(process.argv);
  const folder = path.resolve(opts.folder);
  const quarantineDir = path.resolve(opts.quarantineDir ?? path.join(folder, ".dedupe-quarantine"));

  const sizeBuckets = new Map(); // size -> filePaths[]
  const statCache = new Map(); // path -> { size, ino, dev }

  for await (const filePath of walk(folder, { followSymlinks: opts.followSymlinks })) {
    if (filePath.startsWith(quarantineDir + path.sep) || filePath === quarantineDir) continue;
    let st;
    try {
      st = await fsp.stat(filePath);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    if (st.size < opts.minBytes) continue;

    statCache.set(filePath, { size: st.size, ino: st.ino, dev: st.dev });
    const arr = sizeBuckets.get(st.size) ?? [];
    arr.push(filePath);
    sizeBuckets.set(st.size, arr);
  }

  const duplicates = []; // { keep, dup, reason }
  let scanned = 0;
  let candidateGroups = 0;

  for (const [size, files] of sizeBuckets) {
    if (files.length < 2) continue;
    candidateGroups++;

    // First pass: partial hash to reduce full hashing
    const partialMap = new Map(); // partial -> filePaths[]
    for (const fp of files) {
      scanned++;
      const pHash = await partialHash(fp, opts.algo);
      const arr = partialMap.get(pHash) ?? [];
      arr.push(fp);
      partialMap.set(pHash, arr);
    }

    // Second pass: full hash within partial collisions
    for (const [, pFiles] of partialMap) {
      if (pFiles.length < 2) continue;
      const fullMap = new Map(); // full -> filePaths[]
      for (const fp of pFiles) {
        const fHash = await hashFile(fp, opts.algo);
        const arr = fullMap.get(fHash) ?? [];
        arr.push(fp);
        fullMap.set(fHash, arr);
      }
      for (const [, fFiles] of fullMap) {
        if (fFiles.length < 2) continue;

        // Keep the first, mark others as duplicates.
        // Also avoid deleting hardlinks (same inode/dev) by keeping one per inode.
        const keep = fFiles[0];
        const keepStat = statCache.get(keep);

        for (let i = 1; i < fFiles.length; i++) {
          const dup = fFiles[i];
          const dupStat = statCache.get(dup);
          if (keepStat && dupStat && keepStat.ino === dupStat.ino && keepStat.dev === dupStat.dev) {
            // Same underlying file (hardlink); skip as it isn't a true duplicate copy.
            continue;
          }
          duplicates.push({ keep, dup, reason: `same-size(${size})+hash(${opts.algo})` });
        }
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    folder,
    algo: opts.algo,
    action: opts.action,
    dryRun: opts.dryRun,
    quarantineDir: opts.action === "quarantine" ? quarantineDir : null,
    scannedFilesInCandidateGroups: scanned,
    candidateGroups,
    duplicatesFound: duplicates.length,
  }, null, 2));

  if (duplicates.length === 0) return;

  if (opts.action === "quarantine") {
    if (!opts.dryRun) await ensureDir(quarantineDir);
  }

  let acted = 0;
  for (const d of duplicates) {
    if (opts.dryRun) {
      // eslint-disable-next-line no-console
      console.log(`[DRY] ${opts.action.toUpperCase()} ${d.dup} (keep ${d.keep})`);
      continue;
    }
    try {
      if (opts.action === "delete") {
        await fsp.unlink(d.dup);
        // eslint-disable-next-line no-console
        console.log(`[DEL] ${d.dup} (keep ${d.keep})`);
      } else {
        const movedTo = await moveToQuarantine(d.dup, quarantineDir, folder);
        // eslint-disable-next-line no-console
        console.log(`[MOVE] ${d.dup} -> ${movedTo} (keep ${d.keep})`);
      }
      acted++;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[ERR] Failed to ${opts.action} ${d.dup}: ${e?.message ?? String(e)}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ acted }, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
