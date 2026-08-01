import { randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { config } from "./config.js";
import { nowIso, sqlite } from "./db.js";
import type { Service } from "./schema.js";

const routeKey = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const manifestSchema = z.object({
  project: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  domain: z.string().trim().toLowerCase().optional(),
  compose: z.string().trim().min(1).default("compose.yaml"),
  routes: z.record(
    routeKey,
    z.object({
      service: z.string().trim().min(1),
      port: z.number().int().min(1).max(65535),
      expose: z.boolean().default(true),
    }),
  ),
  services: z
    .record(
      z.string(),
      z.object({
        expose: z.boolean().optional(),
        ignore: z.boolean().optional(),
      }),
    )
    .default({}),
});

export type ComposeStack = z.infer<typeof manifestSchema> & {
  project: string;
  domain: string;
  hostPorts: Record<string, number>;
};

function allocatedPorts() {
  const ports = new Set<number>();
  for (const row of sqlite
    .prepare("SELECT host_port AS port FROM projects")
    .all() as Array<{ port: number }>)
    ports.add(row.port);
  for (const row of sqlite
    .prepare("SELECT manifest_json AS json FROM compose_stacks")
    .all() as Array<{ json: string }>) {
    const value = JSON.parse(row.json) as {
      hostPorts?: Record<string, number>;
    };
    Object.values(value.hostPorts ?? {}).forEach((port) => ports.add(port));
  }
  return ports;
}

function allocatePort(used: Set<number>) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const port = randomInt(20000, 45000);
    if (!used.has(port)) {
      used.add(port);
      return port;
    }
  }
  throw new Error("Could not allocate a Compose route port");
}

export function parseComposeManifest(
  input: unknown,
  fallbackProject: string,
  fallbackDomain: string,
) {
  const parsed = manifestSchema.parse(input);
  if (!parsed.domain && !fallbackDomain)
    throw new Error(
      "aeroplane.json must set domain because Aeroplane has no root domain configured",
    );
  return {
    ...parsed,
    project: parsed.project ?? fallbackProject,
    domain: parsed.domain ?? fallbackDomain,
  };
}

export function saveComposeStack(
  serviceId: string,
  input: unknown,
  fallbackProject: string,
  fallbackDomain: string,
) {
  const parsed = parseComposeManifest(input, fallbackProject, fallbackDomain);
  const existing = getComposeStack(serviceId);
  const used = allocatedPorts();
  const hostPorts: Record<string, number> = {};
  for (const [key, route] of Object.entries(parsed.routes)) {
    if (!route.expose) continue;
    hostPorts[key] = existing?.hostPorts[key] ?? allocatePort(used);
  }
  const value: ComposeStack = { ...parsed, hostPorts };
  const timestamp = nowIso();
  sqlite
    .prepare(
      `INSERT INTO compose_stacks (service_id, manifest_json, created_at, updated_at)
    VALUES (?, ?, ?, ?) ON CONFLICT(service_id) DO UPDATE SET manifest_json = excluded.manifest_json, updated_at = excluded.updated_at`,
    )
    .run(serviceId, JSON.stringify(value), timestamp, timestamp);
  return value;
}

export function getComposeStack(serviceId: string): ComposeStack | null {
  const row = sqlite
    .prepare(
      "SELECT manifest_json AS json FROM compose_stacks WHERE service_id = ?",
    )
    .get(serviceId) as { json: string } | undefined;
  return row ? (JSON.parse(row.json) as ComposeStack) : null;
}

export function composeHostname(stack: ComposeStack, route: string) {
  return `${route === "root" ? "" : `${route}-`}${stack.project}.${stack.domain}`;
}

export function composeWorkspace(serviceId: string) {
  return resolve(config.dataDir, "compose", serviceId, "source");
}

export function composeProjectName(serviceId: string) {
  return `aeroplane-${serviceId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
}

export function composeArgs(
  stack: ComposeStack,
  serviceId: string,
  sourceDir = composeWorkspace(serviceId),
) {
  const composeFile = resolve(sourceDir, stack.compose);
  const overrideFile = resolve(dirname(composeFile), ".aeroplane.compose.yaml");
  return {
    composeFile,
    overrideFile,
    args: [
      "compose",
      "-p",
      composeProjectName(serviceId),
      "-f",
      composeFile,
      "-f",
      overrideFile,
    ],
  };
}

export function writeComposeOverride(
  stack: ComposeStack,
  serviceId: string,
  sourceDir: string,
  composeServices: string[],
) {
  const { composeFile, overrideFile } = composeArgs(
    stack,
    serviceId,
    sourceDir,
  );
  if (!existsSync(composeFile))
    throw new Error(`Compose file not found: ${stack.compose}`);
  const routePorts = new Map<string, string[]>();
  for (const [key, route] of Object.entries(stack.routes)) {
    const hostPort = stack.hostPorts[key];
    if (!composeServices.includes(route.service))
      throw new Error(
        `Route '${key}' references unknown Compose service '${route.service}'`,
      );
    if (route.expose && hostPort) {
      const ports = routePorts.get(route.service) ?? [];
      ports.push(`127.0.0.1:${hostPort}:${route.port}`);
      routePorts.set(route.service, ports);
    }
  }
  const lines = ["services:"];
  for (const service of composeServices) {
    lines.push(`  ${JSON.stringify(service)}:`);
    lines.push("    ports: !override");
    const ports = routePorts.get(service) ?? [];
    if (ports.length === 0) lines.push("      []");
    else
      for (const port of ports) lines.push(`      - ${JSON.stringify(port)}`);
  }
  writeFileSync(overrideFile, `${lines.join("\n")}\n`);
  return { composeFile, overrideFile };
}

export function readManifestFromWorkspace(sourceDir: string) {
  const path = resolve(sourceDir, "aeroplane.json");
  if (!existsSync(path))
    throw new Error("aeroplane.json was not found in the repository root");
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

export function composeRoutesForService(service: Service) {
  const stack = getComposeStack(service.id);
  if (!stack) return [];
  return Object.entries(stack.routes)
    .filter(([, route]) => route.expose)
    .map(([key, route]) => ({
      hostname: composeHostname(stack, key),
      hostPort: stack.hostPorts[key],
      containerPort: route.port,
      composeService: route.service,
    }));
}
