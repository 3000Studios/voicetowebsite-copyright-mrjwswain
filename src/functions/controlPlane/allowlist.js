export function isPathAllowed(path, allowlist) {
  // Simple check: does the path start with any of the allowed pointers?
  return (
    allowlist.includes(path) || allowlist.some((p) => path.startsWith(p + "/"))
  );
}

export function validatePatchOps(ops, allowlist) {
  for (const op of ops) {
    if (!isPathAllowed(op.path, allowlist)) {
      throw new Error(`Path not allowed: ${op.path}`);
    }
  }
  return true;
}
