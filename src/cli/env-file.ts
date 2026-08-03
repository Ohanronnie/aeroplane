import { readFileSync } from "node:fs";

export type EnvFileEntry = { key: string; value: string };

const keyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseValue(raw: string, lineNumber: number) {
  const value = raw.trim();
  if (value.length < 2) return value;
  const quote = value[0];
  if ((quote !== '"' && quote !== "'") || value.at(-1) !== quote) {
    if (value.includes(" #"))
      return value.slice(0, value.indexOf(" #")).trimEnd();
    return value;
  }
  const inner = value.slice(1, -1);
  if (quote === "'") return inner;
  return inner.replace(/\\([\\\"nrt])/g, (_match, escaped: string) => {
    if (escaped === "n") return "\n";
    if (escaped === "r") return "\r";
    if (escaped === "t") return "\t";
    return escaped;
  });
}

export function parseEnvFileText(text: string): EnvFileEntry[] {
  const values = new Map<string, string>();
  text.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const assignment = trimmed.startsWith("export ")
      ? trimmed.slice(7).trimStart()
      : trimmed;
    const separator = assignment.indexOf("=");
    if (separator <= 0)
      throw new Error(
        `Invalid env file line ${lineNumber}: expected KEY=VALUE`,
      );
    const key = assignment.slice(0, separator).trim();
    if (!keyPattern.test(key))
      throw new Error(
        `Invalid env file line ${lineNumber}: '${key}' is not a valid variable name`,
      );
    values.set(key, parseValue(assignment.slice(separator + 1), lineNumber));
  });
  return Array.from(values, ([key, value]) => ({ key, value }));
}

export function readEnvFile(path: string): EnvFileEntry[] {
  try {
    return parseEnvFileText(readFileSync(path, "utf8"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Environment file was not found: ${path}`);
    }
    throw error;
  }
}
