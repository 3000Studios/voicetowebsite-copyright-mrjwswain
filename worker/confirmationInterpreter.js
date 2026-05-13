const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function interpretConfirmation(rawInput, synonyms) {
  const t = normalize(rawInput);
  const map = synonyms || {};

  // Exact phrase mapping first.
  for (const [k, v] of Object.entries(map)) {
    if (!k) continue;
    if (t === normalize(k)) return { command: String(v || "").trim() };
  }

  // Fuzzy contains fallback.
  for (const [k, v] of Object.entries(map)) {
    if (!k) continue;
    if (t.includes(normalize(k))) return { command: String(v || "").trim() };
  }

  return { command: "" };
}
