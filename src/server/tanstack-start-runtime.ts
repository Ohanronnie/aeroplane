import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const startPackages = ["@tanstack/react-start", "@tanstack/start"];
const runtimeDir = ".aeroplane";
const runtimeFile = "tanstack-start-server.mjs";
const generatedStartCommand = `node ${runtimeDir}/${runtimeFile}`;
const nitroStartCommand = "node .output/server/index.mjs";

type PackageJson = {
  scripts?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  peerDependencies?: Record<string, unknown>;
  optionalDependencies?: Record<string, unknown>;
};

export type TanStackStartRuntime = {
  startCommand: string;
  message: string;
};

function readPackageJson(appDir: string) {
  const packageJsonPath = join(appDir, "package.json");
  if (!existsSync(packageJsonPath)) return null;

  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
  } catch {
    return null;
  }
}

function dependencyMap(packageJson: PackageJson) {
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies
  };
}

function hasTanStackStartDependency(packageJson: PackageJson) {
  const dependencies = dependencyMap(packageJson);
  return startPackages.some((packageName) => typeof dependencies[packageName] === "string");
}

function packageStartScript(packageJson: PackageJson) {
  const startScript = packageJson.scripts?.start;
  return typeof startScript === "string" ? startScript.trim() : "";
}

function startScriptTargetsFrameworkOutput(startScript: string) {
  return (
    /^node\s+(?:\.\/)?\.output\/server\/index\.mjs(?:\s|$)/.test(startScript) ||
    /^node\s+(?:\.\/)?dist\/server\/(?:server|index)\.(?:cjs|js|mjs)(?:\s|$)/.test(startScript)
  );
}

function configUsesNitro(appDir: string) {
  const configFileNames = [
    "vite.config.ts",
    "vite.config.mts",
    "vite.config.cts",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.cjs",
    "rsbuild.config.ts",
    "rsbuild.config.mts",
    "rsbuild.config.js",
    "rsbuild.config.mjs"
  ];

  for (const fileName of configFileNames) {
    const configPath = join(appDir, fileName);
    if (!existsSync(configPath)) continue;

    try {
      const source = readFileSync(configPath, "utf8");
      if (/(?:from|require\()\s*["']nitro\/vite["']/.test(source) && /\bnitro\s*\(/.test(source)) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

const nodeRuntimeSource = `import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";

const runtimeDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(runtimeDir, "..");
const port = Number(process.env.PORT || "8080");
const host = process.env.HOST || "0.0.0.0";

const serverEntryCandidates = [
  "dist/server/server.js",
  "dist/server/index.js",
  "dist/server/server.mjs",
  "dist/server/index.mjs"
];

const staticRoots = ["dist/client"]
  .map((dir) => resolve(appDir, dir))
  .filter((dir) => {
    try {
      return statSync(dir).isDirectory();
    } catch {
      return false;
    }
  });

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"]
]);

let fetchHandlerPromise;

function contentType(filePath) {
  return mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";
}

function cacheControl(pathname) {
  return pathname.includes("/assets/")
    ? "public, max-age=31536000, immutable"
    : "public, max-age=0, must-revalidate";
}

function safeDecodePath(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function insideDirectory(baseDir, candidatePath) {
  const relativePath = relative(baseDir, candidatePath);
  return relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function findStaticFile(pathname) {
  if (pathname === "/" || pathname.endsWith("/")) return null;
  const decoded = safeDecodePath(pathname);
  if (!decoded) return null;

  for (const root of staticRoots) {
    const candidate = resolve(root, "." + decoded);
    if (!insideDirectory(root, candidate)) continue;
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function writeStaticFile(request, response, filePath, pathname) {
  response.writeHead(200, {
    "content-type": contentType(filePath),
    "cache-control": cacheControl(pathname)
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) response.writeHead(500);
    response.end("Internal Server Error");
  });
  stream.pipe(response);
}

function resolveFetchHandler(moduleExports) {
  const defaultExport = moduleExports.default;
  if (defaultExport && typeof defaultExport.fetch === "function") return defaultExport.fetch.bind(defaultExport);
  if (typeof defaultExport === "function") return defaultExport;
  if (typeof moduleExports.fetch === "function") return moduleExports.fetch.bind(moduleExports);
  if (moduleExports.handler && typeof moduleExports.handler.fetch === "function") {
    return moduleExports.handler.fetch.bind(moduleExports.handler);
  }
  if (typeof moduleExports.handler === "function") return moduleExports.handler;
  return null;
}

async function getFetchHandler() {
  if (fetchHandlerPromise) return fetchHandlerPromise;

  fetchHandlerPromise = (async () => {
    for (const relativePath of serverEntryCandidates) {
      const entryPath = resolve(appDir, relativePath);
      if (!existsSync(entryPath)) continue;

      const moduleExports = await import(pathToFileURL(entryPath).href);
      const handler = resolveFetchHandler(moduleExports);
      if (handler) return handler;
      throw new Error("TanStack Start server entry " + relativePath + " does not export a fetch handler.");
    }

    throw new Error("TanStack Start server entry not found. Expected one of: " + serverEntryCandidates.join(", ") + ".");
  })();

  return fetchHandlerPromise;
}

function requestUrl(request) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || "http";
  const hostHeader = request.headers.host || "127.0.0.1:" + port;
  return proto + "://" + hostHeader + (request.url || "/");
}

function toWebRequest(request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }

  const init = {
    method: request.method,
    headers
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = Readable.toWeb(request);
    init.duplex = "half";
  }

  return new Request(requestUrl(request), init);
}

async function writeWebResponse(webResponse, response, method) {
  const headers = {};
  webResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") headers[key] = value;
  });

  const cookies = typeof webResponse.headers.getSetCookie === "function"
    ? webResponse.headers.getSetCookie()
    : [];
  if (cookies.length > 0) {
    headers["set-cookie"] = cookies;
  } else if (webResponse.headers.has("set-cookie")) {
    headers["set-cookie"] = webResponse.headers.get("set-cookie");
  }

  response.writeHead(webResponse.status, webResponse.statusText, headers);
  if (method === "HEAD" || !webResponse.body) {
    response.end();
    return;
  }

  Readable.fromWeb(webResponse.body).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(requestUrl(request));

    if (url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    const staticFile = findStaticFile(url.pathname);
    if (staticFile) {
      writeStaticFile(request, response, staticFile, url.pathname);
      return;
    }

    const handler = await getFetchHandler();
    const webResponse = await handler(toWebRequest(request));
    await writeWebResponse(webResponse, response, request.method);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    }
    response.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log("TanStack Start server listening on " + host + ":" + port);
});
`;

export function prepareTanStackStartRuntime(options: {
  appDir: string;
  serviceStartCommand: string;
  isStaticService: boolean;
  isWorker: boolean;
}): TanStackStartRuntime | null {
  if (options.serviceStartCommand.trim() || options.isStaticService || options.isWorker) return null;

  const packageJson = readPackageJson(options.appDir);
  if (!packageJson || !hasTanStackStartDependency(packageJson)) return null;

  const startScript = packageStartScript(packageJson);
  if (startScript && !startScriptTargetsFrameworkOutput(startScript)) return null;

  if (configUsesNitro(options.appDir)) {
    return {
      startCommand: nitroStartCommand,
      message: "Detected TanStack Start with Nitro; Aeroplane will start the Nitro server output automatically."
    };
  }

  const outputDir = join(options.appDir, runtimeDir);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, runtimeFile), nodeRuntimeSource, "utf8");

  return {
    startCommand: generatedStartCommand,
    message: "Detected TanStack Start; Aeroplane generated a Node runtime for dist/client and dist/server output."
  };
}
