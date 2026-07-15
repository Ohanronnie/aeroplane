import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, normalize, relative, resolve, sep } from "node:path";

type RailpackCommand = string | { cmd: string; customName?: string } | Record<string, unknown>;

type RailpackConfig = {
  steps?: Record<string, {
    commands?: RailpackCommand[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

const generatedConfigName = ".aeroplane-railpack.generated.json";

function safeRelativeConfigPath(configFile: string) {
  const normalized = normalize(configFile.trim());
  if (!normalized || normalized.startsWith("..") || normalized.includes(`${sep}..${sep}`) || normalized.startsWith(sep)) {
    throw new Error("Railpack config file must be relative to the service root.");
  }
  return normalized;
}

function readRailpackConfig(appDir: string, configFile: null | string) {
  if (!configFile) return {};
  const relativePath = safeRelativeConfigPath(configFile);
  const fullPath = resolve(appDir, relativePath);
  if (!existsSync(fullPath)) return {};

  try {
    return JSON.parse(readFileSync(fullPath, "utf8")) as RailpackConfig;
  } catch (error) {
    const name = basename(relativePath);
    const message = error instanceof Error ? error.message : "Invalid JSON";
    throw new Error(`Could not read ${name} before adding the prebuild command: ${message}`);
  }
}

export function writeRailpackPrebuildConfig({
  appDir,
  configuredConfigFile,
  prebuildCommand
}: {
  appDir: string;
  configuredConfigFile: null | string;
  prebuildCommand: string;
}) {
  const baseConfig = readRailpackConfig(appDir, configuredConfigFile);
  const existingBuildStep = baseConfig.steps?.build ?? {};
  const existingCommands = existingBuildStep.commands ?? ["..."];
  const generatedConfig: RailpackConfig = {
    ...baseConfig,
    steps: {
      ...baseConfig.steps,
      build: {
        ...existingBuildStep,
        commands: [
          { cmd: prebuildCommand, customName: "Prebuild command" },
          ...existingCommands
        ]
      }
    }
  };

  const outputPath = join(appDir, generatedConfigName);
  writeFileSync(outputPath, `${JSON.stringify(generatedConfig, null, 2)}\n`, "utf8");
  return relative(appDir, outputPath);
}
