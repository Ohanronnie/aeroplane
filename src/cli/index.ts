#!/usr/bin/env node

import { parseArgs } from "node:util";
import { AeroplaneApi } from "./api-client.js";
import { resolveConnection, saveConnection } from "./config.js";
import { parseRepository } from "./repository.js";
import type { Deployment, Project, Service } from "./types.js";

const terminalStatuses = new Set([
  "running",
  "failed",
  "aborted",
  "superseded",
]);

function help() {
  console.log(`Aeroplane CLI

Usage:
  aeroplane run <repository> [options]        # aeroplane.json / Compose
  aeroplane run <repository> expose <port> [options]
  aeroplane run <repository> --expose <port> [options]
  aeroplane status [service]
  aeroplane deploy <service>
  aeroplane logs <service>
  aeroplane connect <url> --api-key <key>

Run options:
  --name <name>       Service name (defaults to repository name)
  --project <name>    Project name (defaults to repository name)
  --branch <branch>   Git branch (defaults to main)
  --root <directory>  Repository subdirectory
  --start <command>   Start-command override
  --watch             Deploy future pushes through a GitHub webhook
  --no-follow         Queue the deployment without following logs

Connection options:
  --url <url>         Override the Aeroplane server
  --api-key <key>     Override the Aeroplane API key

On an Aeroplane server, the CLI automatically uses http://127.0.0.1:4310 and
the root-only local credential. A remote connection can be saved with connect.`);
}

function parseCommandOptions(args: string[]) {
  return parseArgs({
    args,
    allowPositionals: true,
    allowNegative: true,
    strict: true,
    options: {
      url: { type: "string" },
      "api-key": { type: "string" },
      expose: { type: "string" },
      name: { type: "string" },
      project: { type: "string" },
      branch: { type: "string" },
      root: { type: "string" },
      start: { type: "string" },
      watch: { type: "boolean", default: false },
      follow: { type: "boolean", default: true },
      help: { type: "boolean", short: "h" },
    },
  });
}

async function clientFor(values: Record<string, string | boolean | undefined>) {
  const connection = await resolveConnection({
    url: typeof values.url === "string" ? values.url : undefined,
    apiKey:
      typeof values["api-key"] === "string" ? values["api-key"] : undefined,
  });
  return new AeroplaneApi(connection.url, connection.apiKey);
}

function serviceFromProjects(projects: Project[], selector: string) {
  const matches = projects.flatMap((project) =>
    project.services
      .filter(
        (service) =>
          service.id === selector ||
          service.slug === selector ||
          service.name === selector,
      )
      .map((service) => ({ project, service })),
  );
  if (matches.length === 0)
    throw new Error(`Service '${selector}' was not found`);
  if (matches.length > 1)
    throw new Error(`Service '${selector}' is ambiguous; use its service ID`);
  return matches[0];
}

async function followDeployment(
  api: AeroplaneApi,
  service: Service,
  deployment: Deployment,
) {
  let lastLogId = 0;
  const deadline = Date.now() + 30 * 60 * 1000;

  while (Date.now() < deadline) {
    const logs = await api.deploymentLogs(deployment.id);
    for (const log of logs) {
      if (log.id <= lastLogId) continue;
      console.log(log.line);
      lastLogId = log.id;
    }

    const current = (await api.deployments(service.id)).find(
      (item) => item.id === deployment.id,
    );
    if (current && terminalStatuses.has(current.status)) {
      if (current.status !== "running")
        throw new Error(`Deployment ${current.status}`);
      return api.serviceOverview(service.id);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Deployment did not finish within 30 minutes");
}

async function runCommand(args: string[]) {
  const parsed = parseCommandOptions(args);
  if (parsed.values.help) return help();
  const repositoryInput = parsed.positionals[0];
  if (!repositoryInput) throw new Error("Repository is required");

  let exposedPort = parsed.values.expose;
  if (!exposedPort && parsed.positionals[1] === "expose")
    exposedPort = parsed.positionals[2];
  const repository = parseRepository(repositoryInput);
  const branch = parsed.values.branch ?? "main";
  const githubToken = process.env.AEROPLANE_GITHUB_TOKEN;
  let composeManifest: unknown;
  if (repository.fullName) {
    const response = await fetch(
      `https://api.github.com/repos/${repository.fullName}/contents/aeroplane.json?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          Accept: "application/vnd.github.raw+json",
          "User-Agent": "aeroplane-cli",
          ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
        },
      },
    );
    if (response.ok) composeManifest = await response.json();
    else if (response.status !== 404)
      throw new Error(
        `Could not read aeroplane.json from GitHub: HTTP ${response.status}`,
      );
  }
  const internalPort = Number(exposedPort);
  if (
    composeManifest === undefined &&
    (!Number.isInteger(internalPort) ||
      internalPort < 1 ||
      internalPort > 65535)
  ) {
    throw new Error(
      "Repository has no aeroplane.json; use 'expose <port>' or '--expose <port>'",
    );
  }

  const serviceName = parsed.values.name ?? repository.defaultName;
  const manifestProject =
    composeManifest &&
    typeof composeManifest === "object" &&
    "project" in composeManifest
      ? String((composeManifest as { project: unknown }).project)
      : undefined;
  const projectName =
    parsed.values.project ?? manifestProject ?? repository.defaultName;
  const api = await clientFor(parsed.values);

  const projects = await api.projects();
  let project = projects.find(
    (item) => item.name === projectName || item.slug === projectName,
  );
  if (!project) {
    project = await api.createProject(projectName);
    console.log(`✓ Created project ${project.name}`);
  }

  let service = project.services.find(
    (item) => item.name === serviceName || item.slug === serviceName,
  );
  const serviceInput: Record<string, unknown> = {
    name: serviceName,
    repoFullName: repository.fullName,
    repoUrl: repository.url,
    branch,
    runtimeMode: "web",
    internalPort: composeManifest === undefined ? internalPort : 3000,
  };
  if (composeManifest !== undefined)
    serviceInput.composeManifest = composeManifest;
  if (githubToken) serviceInput.githubToken = githubToken;

  if (service) {
    serviceInput.rootDir = parsed.values.root ?? null;
    serviceInput.startCommand = parsed.values.start ?? null;
  } else {
    if (parsed.values.root) serviceInput.rootDir = parsed.values.root;
    if (parsed.values.start) serviceInput.startCommand = parsed.values.start;
  }

  if (service) {
    service = await api.updateService(service.id, serviceInput);
    console.log(`✓ Updated service ${service.name}`);
  } else {
    service = await api.createService(project.id, serviceInput);
    console.log(`✓ Created service ${service.name}`);
  }

  if (parsed.values.watch) {
    if (!repository.fullName) {
      throw new Error("--watch requires a GitHub owner/name repository");
    }
    const webhook = await api.ensureGitHubWebhook(service.id);
    console.log(
      `✓ Watching ${repository.fullName}@${branch} with webhook ${webhook.id}`,
    );
  }

  const deployment = await api.deploy(service.id);
  console.log(`✓ Queued deployment ${deployment.id}`);
  if (!parsed.values.follow) return;

  const deployed = await followDeployment(api, service, deployment);
  console.log(`✓ ${deployed.primaryUrl ?? `${deployed.name} is running`}`);
}

async function statusCommand(args: string[]) {
  const parsed = parseCommandOptions(args);
  const api = await clientFor(parsed.values);
  const projects = await api.projects();
  const selector = parsed.positionals[0];
  if (selector) {
    const { project, service } = serviceFromProjects(projects, selector);
    const overview = await api.serviceOverview(service.id);
    console.log(
      `${project.name}/${overview.name}\t${overview.status}\t${overview.primaryUrl ?? "-"}`,
    );
    return;
  }
  for (const project of projects) {
    for (const service of project.services) {
      console.log(
        `${project.name}/${service.name}\t${service.status}\t${service.primaryUrl ?? "-"}`,
      );
    }
  }
}

async function deployCommand(args: string[]) {
  const parsed = parseCommandOptions(args);
  const selector = parsed.positionals[0];
  if (!selector) throw new Error("Service is required");
  const api = await clientFor(parsed.values);
  const { service } = serviceFromProjects(await api.projects(), selector);
  const deployment = await api.deploy(service.id);
  console.log(`✓ Queued deployment ${deployment.id}`);
  if (parsed.values.follow) {
    const deployed = await followDeployment(api, service, deployment);
    console.log(`✓ ${deployed.primaryUrl ?? `${deployed.name} is running`}`);
  }
}

async function logsCommand(args: string[]) {
  const parsed = parseCommandOptions(args);
  const selector = parsed.positionals[0];
  if (!selector) throw new Error("Service is required");
  const api = await clientFor(parsed.values);
  const { service } = serviceFromProjects(await api.projects(), selector);
  const deployment = (await api.deployments(service.id))[0];
  if (!deployment) throw new Error(`Service '${selector}' has no deployments`);
  for (const log of await api.deploymentLogs(deployment.id))
    console.log(log.line);
}

async function connectCommand(args: string[]) {
  const parsed = parseCommandOptions(args);
  const url = parsed.positionals[0];
  const apiKey = parsed.values["api-key"];
  if (!url || !apiKey)
    throw new Error("Usage: aeroplane connect <url> --api-key <key>");
  const normalizedUrl = url.replace(/\/$/, "");
  await new AeroplaneApi(normalizedUrl, apiKey).projects();
  const path = await saveConnection({ url: normalizedUrl, apiKey });
  console.log(`✓ Connected to ${normalizedUrl}`);
  console.log(`  Saved credentials to ${path}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  )
    return help();
  if (command === "run") return runCommand(args);
  if (command === "status") return statusCommand(args);
  if (command === "deploy") return deployCommand(args);
  if (command === "logs") return logsCommand(args);
  if (command === "connect") return connectCommand(args);
  throw new Error(`Unknown command '${command}'`);
}

main().catch((error) => {
  console.error(
    `Error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
