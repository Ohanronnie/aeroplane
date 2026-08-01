import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

type CliConfig = {
  url?: string;
  apiKey?: string;
};

const configPath = join(homedir(), ".config", "aeroplane", "config.json");
const localEnvPaths = [
  process.env.AEROPLANE_ENV_PATH,
  process.env.AEROPLANE_INSTALL_DIR
    ? join(process.env.AEROPLANE_INSTALL_DIR, ".env")
    : undefined,
  "/opt/aeroplane/.env",
].filter((value): value is string => Boolean(value));

async function readSavedConfig(): Promise<CliConfig> {
  try {
    return JSON.parse(await readFile(configPath, "utf8")) as CliConfig;
  } catch {
    return {};
  }
}

function envValue(source: string, key: string) {
  for (const line of source.split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator < 1 || line.slice(0, separator).trim() !== key) continue;
    return line
      .slice(separator + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }
  return undefined;
}

async function localCliToken() {
  for (const path of localEnvPaths) {
    try {
      const token = envValue(
        await readFile(path, "utf8"),
        "AEROPLANE_LOCAL_CLI_TOKEN",
      );
      if (token) return token;
    } catch {
      // Try the next standard installation path.
    }
  }
  return undefined;
}

export async function resolveConnection(overrides: CliConfig = {}) {
  const saved = await readSavedConfig();
  const url = (
    overrides.url ??
    process.env.AEROPLANE_URL ??
    saved.url ??
    "http://127.0.0.1:4310"
  ).replace(/\/$/, "");
  const apiKey =
    overrides.apiKey ??
    process.env.AEROPLANE_API_KEY ??
    saved.apiKey ??
    (await localCliToken());
  return { url, apiKey };
}

export async function saveConnection(config: Required<CliConfig>) {
  await mkdir(dirname(configPath), { recursive: true, mode: 0o700 });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(configPath, 0o600);
  return configPath;
}
