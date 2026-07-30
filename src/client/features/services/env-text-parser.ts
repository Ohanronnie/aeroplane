export type ParsedEnvEntry = {
  key: string;
  value: string;
};

function parseEnvValue(input: string) {
  let value = input.trim();
  const quote = value[0];

  if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
    value = value.slice(1, -1);
    if (quote === "\"") {
      value = value
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, "\"");
    }
    return value;
  }

  const inlineComment = value.search(/\s+#/);
  return inlineComment >= 0 ? value.slice(0, inlineComment).trimEnd() : value;
}

export function parseEnvText(input: string): ParsedEnvEntry[] {
  const byKey = new Map<string, string>();

  for (const rawLine of input.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) continue;

    byKey.set(key, parseEnvValue(normalized.slice(separatorIndex + 1)));
  }

  return Array.from(byKey.entries()).map(([key, value]) => ({ key, value }));
}
