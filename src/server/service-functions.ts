import { eq } from "drizzle-orm";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db, nowIso } from "./db.js";
import { serviceFunctions, services, type ServiceFunction } from "./schema.js";
import {
  defaultFunctionSource,
  functionRepoFullName,
  functionRuntimeFileNames,
  functionRuntimeForService,
  functionRuntimeLabels,
  type FunctionRuntime,
  normalizeFunctionRuntime
} from "../shared/service-functions.js";

export type PublicFunctionSource = {
  runtime: FunctionRuntime;
  sourceCode: string;
  fileName: string;
  updatedAt: string;
};

const nodeServerSource = [
  'import { createServer } from "node:http";',
  'const mod = await import("./function.mjs");',
  'const userHandler = mod.default ?? mod.handler;',
  'if (typeof userHandler !== "function") {',
  '  throw new Error("Function source must export a default function or a handler function.");',
  '}',
  'function headerRecord(headers) {',
  '  const output = {};',
  '  for (const [key, value] of Object.entries(headers)) {',
  '    output[key] = Array.isArray(value) ? value.join(", ") : String(value ?? "");',
  '  }',
  '  return output;',
  '}',
  'async function readBody(req) {',
  '  const chunks = [];',
  '  for await (const chunk of req) chunks.push(chunk);',
  '  return Buffer.concat(chunks).toString("utf8");',
  '}',
  'function tryJson(body, headers) {',
  '  if (!body) return null;',
  '  const contentType = String(headers["content-type"] ?? "");',
  '  if (!contentType.includes("json")) return null;',
  '  try { return JSON.parse(body); } catch { return null; }',
  '}',
  'function eventFromRequest(req, body) {',
  '  const url = new URL(req.url ?? "/", "http://localhost");',
  '  return {',
  '    method: req.method ?? "GET",',
  '    url: url.toString(),',
  '    path: url.pathname,',
  '    query: Object.fromEntries(url.searchParams.entries()),',
  '    headers: headerRecord(req.headers),',
  '    body,',
  '    json: tryJson(body, req.headers)',
  '  };',
  '}',
  'function applyHeaders(res, headers) {',
  '  if (!headers) return;',
  '  for (const [key, value] of Object.entries(headers)) {',
  '    if (value !== undefined && value !== null) res.setHeader(key, String(value));',
  '  }',
  '}',
  'async function writeResult(res, result) {',
  '  if (typeof Response !== "undefined" && result instanceof Response) {',
  '    res.statusCode = result.status;',
  '    result.headers.forEach((value, key) => res.setHeader(key, value));',
  '    res.end(Buffer.from(await result.arrayBuffer()));',
  '    return;',
  '  }',
  '  if (result == null) {',
  '    res.statusCode = 204;',
  '    res.end();',
  '    return;',
  '  }',
  '  if (typeof result === "object" && !Buffer.isBuffer(result) && ("body" in result || "status" in result || "headers" in result)) {',
  '    res.statusCode = Number(result.status ?? 200);',
  '    applyHeaders(res, result.headers);',
  '    const body = result.body;',
  '    if (body == null) { res.end(); return; }',
  '    if (typeof body === "string" || body instanceof Uint8Array) { res.end(body); return; }',
  '    if (!res.hasHeader("content-type")) res.setHeader("content-type", "application/json");',
  '    res.end(JSON.stringify(body));',
  '    return;',
  '  }',
  '  if (typeof result === "string" || result instanceof Uint8Array) {',
  '    res.end(result);',
  '    return;',
  '  }',
  '  res.setHeader("content-type", "application/json");',
  '  res.end(JSON.stringify(result));',
  '}',
  'const port = Number(process.env.PORT || "8080");',
  'createServer(async (req, res) => {',
  '  try {',
  '    const body = await readBody(req);',
  '    await writeResult(res, await userHandler(eventFromRequest(req, body), { request: req }));',
  '  } catch (error) {',
  '    console.error(error);',
  '    res.statusCode = 500;',
  '    res.setHeader("content-type", "application/json");',
  '    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));',
  '  }',
  '}).listen(port, "0.0.0.0", () => {',
  '  console.log("Function server listening on 0.0.0.0:" + port);',
  '});'
].join("\n");

const bunServerSource = [
  'const mod = await import("./function.mjs");',
  'const userHandler = mod.default ?? mod.handler;',
  'if (typeof userHandler !== "function") {',
  '  throw new Error("Function source must export a default function or a handler function.");',
  '}',
  'function tryJson(body, headers) {',
  '  if (!body) return null;',
  '  const contentType = headers.get("content-type") ?? "";',
  '  if (!contentType.includes("json")) return null;',
  '  try { return JSON.parse(body); } catch { return null; }',
  '}',
  'function eventFromRequest(request, body) {',
  '  const url = new URL(request.url);',
  '  return {',
  '    method: request.method,',
  '    url: request.url,',
  '    path: url.pathname,',
  '    query: Object.fromEntries(url.searchParams.entries()),',
  '    headers: Object.fromEntries(request.headers.entries()),',
  '    body,',
  '    json: tryJson(body, request.headers)',
  '  };',
  '}',
  'function responseFromResult(result) {',
  '  if (result instanceof Response) return result;',
  '  if (result == null) return new Response(null, { status: 204 });',
  '  if (typeof result === "object" && !Array.isArray(result) && ("body" in result || "status" in result || "headers" in result)) {',
  '    const headers = new Headers(result.headers ?? {});',
  '    let body = result.body ?? null;',
  '    if (body != null && typeof body !== "string" && !(body instanceof Uint8Array)) {',
  '      if (!headers.has("content-type")) headers.set("content-type", "application/json");',
  '      body = typeof body === "object" ? JSON.stringify(body) : String(body);',
  '    }',
  '    return new Response(body, { status: result.status ?? 200, headers });',
  '  }',
  '  if (typeof result === "string" || result instanceof Uint8Array) return new Response(result);',
  '  return Response.json(result);',
  '}',
  'const port = Number(process.env.PORT || "8080");',
  'const server = Bun.serve({',
  '  port,',
  '  hostname: "0.0.0.0",',
  '  async fetch(request) {',
  '    const body = await request.text();',
  '    try {',
  '      return responseFromResult(await userHandler(eventFromRequest(request, body), { request }));',
  '    } catch (error) {',
  '      console.error(error);',
  '      return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });',
  '    }',
  '  }',
  '});',
  'console.log("Function server listening on " + server.hostname + ":" + server.port);'
].join("\n");

const pythonServerSource = [
  "from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer",
  "from urllib.parse import parse_qs, urlparse",
  "import importlib.util",
  "import json",
  "import os",
  "import traceback",
  "",
  'spec = importlib.util.spec_from_file_location("user_function", "/app/function.py")',
  "module = importlib.util.module_from_spec(spec)",
  "spec.loader.exec_module(module)",
  'user_handler = getattr(module, "handler", None)',
  "if not callable(user_handler):",
  '    raise RuntimeError("Function source must define a handler(event, context) function.")',
  "",
  "def try_json(body, headers):",
  "    if not body:",
  "        return None",
  '    content_type = headers.get("content-type", "")',
  '    if "json" not in content_type:',
  "        return None",
  "    try:",
  "        return json.loads(body)",
  "    except Exception:",
  "        return None",
  "",
  "def event_from_request(request, body):",
  "    parsed = urlparse(request.path)",
  "    headers = {key.lower(): value for key, value in request.headers.items()}",
  "    return {",
  '        "method": request.command,',
  '        "url": request.path,',
  '        "path": parsed.path,',
  '        "query": {key: values[-1] if values else "" for key, values in parse_qs(parsed.query).items()},',
  '        "headers": headers,',
  '        "body": body,',
  '        "json": try_json(body, headers),',
  "    }",
  "",
  "def body_bytes(value, headers):",
  "    if value is None:",
  '        return b""',
  "    if isinstance(value, bytes):",
  "        return value",
  "    if isinstance(value, (dict, list)):",
  '        if "content-type" not in {key.lower(): item for key, item in headers.items()}:',
  '            headers["content-type"] = "application/json"',
  "        return json.dumps(value).encode()",
  "    return str(value).encode()",
  "",
  "class FunctionRequestHandler(BaseHTTPRequestHandler):",
  '    protocol_version = "HTTP/1.1"',
  "",
  "    def handle_function(self):",
  '        length = int(self.headers.get("content-length") or "0")',
  '        raw_body = self.rfile.read(length).decode("utf-8") if length else ""',
  "        try:",
  "            result = user_handler(event_from_request(self, raw_body), {\"request\": self})",
  "            self.write_result(result)",
  "        except Exception as error:",
  "            traceback.print_exc()",
  '            payload = json.dumps({"error": str(error)}).encode()',
  "            self.send_response(500)",
  '            self.send_header("content-type", "application/json")',
  '            self.send_header("content-length", str(len(payload)))',
  "            self.end_headers()",
  "            if self.command != \"HEAD\":",
  "                self.wfile.write(payload)",
  "",
  "    def write_result(self, result):",
  "        if result is None:",
  "            self.send_response(204)",
  '            self.send_header("content-length", "0")',
  "            self.end_headers()",
  "            return",
  "        if isinstance(result, dict) and any(key in result for key in (\"body\", \"status\", \"headers\")):",
  '            status = int(result.get("status") or 200)',
  '            headers = dict(result.get("headers") or {})',
  '            payload = body_bytes(result.get("body"), headers)',
  "        else:",
  "            status = 200",
  "            headers = {}",
  "            payload = body_bytes(result, headers)",
  "        self.send_response(status)",
  "        for key, value in headers.items():",
  "            self.send_header(str(key), str(value))",
  '        if payload and "content-type" not in {key.lower(): item for key, item in headers.items()}:',
  '            self.send_header("content-type", "text/plain; charset=utf-8")',
  '        self.send_header("content-length", str(len(payload)))',
  "        self.end_headers()",
  "        if self.command != \"HEAD\":",
  "            self.wfile.write(payload)",
  "",
  "    def do_GET(self): self.handle_function()",
  "    def do_POST(self): self.handle_function()",
  "    def do_PUT(self): self.handle_function()",
  "    def do_PATCH(self): self.handle_function()",
  "    def do_DELETE(self): self.handle_function()",
  "    def do_OPTIONS(self): self.handle_function()",
  "    def do_HEAD(self): self.handle_function()",
  "",
  "    def log_message(self, fmt, *args):",
  '        print("%s - %s" % (self.address_string(), fmt % args))',
  "",
  'port = int(os.environ.get("PORT", "8080"))',
  'server = ThreadingHTTPServer(("0.0.0.0", port), FunctionRequestHandler)',
  'print("Function server listening on 0.0.0.0:%s" % port, flush=True)',
  "server.serve_forever()"
].join("\n");

function dockerfileSource(runtime: FunctionRuntime) {
  const baseImage: Record<FunctionRuntime, string> = {
    node: "node:22-alpine",
    bun: "oven/bun:1-alpine",
    python: "python:3.12-alpine"
  };
  const command: Record<FunctionRuntime, string> = {
    node: '["node", "server.mjs"]',
    bun: '["bun", "server.mjs"]',
    python: '["python", "server.py"]'
  };

  return [
    `FROM ${baseImage[runtime]}`,
    "WORKDIR /app",
    "COPY . .",
    "EXPOSE 8080",
    `CMD ${command[runtime]}`,
    ""
  ].join("\n");
}

function serverFileForRuntime(runtime: FunctionRuntime) {
  if (runtime === "python") return { fileName: "server.py", source: pythonServerSource };
  if (runtime === "bun") return { fileName: "server.mjs", source: bunServerSource };
  return { fileName: "server.mjs", source: nodeServerSource };
}

function publicFunctionSource(source: ServiceFunction): PublicFunctionSource {
  const runtime = normalizeFunctionRuntime(source.runtime);
  return {
    runtime,
    sourceCode: source.sourceCode,
    fileName: functionRuntimeFileNames[runtime],
    updatedAt: source.updatedAt
  };
}

export function createServiceFunction(serviceId: string, runtimeInput: unknown, sourceCode?: string) {
  const runtime = normalizeFunctionRuntime(runtimeInput);
  const timestamp = nowIso();

  db.insert(serviceFunctions)
    .values({
      serviceId,
      runtime,
      sourceCode: sourceCode ?? defaultFunctionSource[runtime],
      createdAt: timestamp,
      updatedAt: timestamp
    })
    .run();
}

export function getServiceFunctionSource(serviceId: string) {
  const source = db.select().from(serviceFunctions).where(eq(serviceFunctions.serviceId, serviceId)).get();
  if (source) return publicFunctionSource(source);

  const service = db.select().from(services).where(eq(services.id, serviceId)).get();
  const runtime = service ? functionRuntimeForService(service) : null;
  if (!runtime) return null;

  return {
    runtime,
    sourceCode: defaultFunctionSource[runtime],
    fileName: functionRuntimeFileNames[runtime],
    updatedAt: service.updatedAt
  };
}

export function updateServiceFunctionSource(serviceId: string, input: { runtime?: unknown; sourceCode?: string }) {
  const current = getServiceFunctionSource(serviceId);
  if (!current) {
    throw new Error("Function source not found");
  }

  const runtime = normalizeFunctionRuntime(input.runtime ?? current.runtime);
  const sourceCode = input.sourceCode ?? current.sourceCode;
  if (!sourceCode.trim()) {
    throw new Error("Function source code is required");
  }

  const timestamp = nowIso();
  const existing = db.select().from(serviceFunctions).where(eq(serviceFunctions.serviceId, serviceId)).get();
  if (existing) {
    db.update(serviceFunctions)
      .set({ runtime, sourceCode, updatedAt: timestamp })
      .where(eq(serviceFunctions.serviceId, serviceId))
      .run();
  } else {
    db.insert(serviceFunctions)
      .values({ serviceId, runtime, sourceCode, createdAt: timestamp, updatedAt: timestamp })
      .run();
  }

  db.update(services)
    .set({ repoFullName: functionRepoFullName(runtime), updatedAt: timestamp })
    .where(eq(services.id, serviceId))
    .run();

  return getServiceFunctionSource(serviceId);
}

export function deleteServiceFunctionSource(serviceId: string) {
  db.delete(serviceFunctions).where(eq(serviceFunctions.serviceId, serviceId)).run();
}

export function writeFunctionDeploymentProject(serviceId: string, outputDir: string) {
  const source = getServiceFunctionSource(serviceId);
  if (!source) {
    throw new Error("Function source not found");
  }

  mkdirSync(outputDir, { recursive: true });
  const runtime = source.runtime;
  const serverFile = serverFileForRuntime(runtime);
  writeFileSync(join(outputDir, source.fileName), source.sourceCode, "utf8");
  writeFileSync(join(outputDir, serverFile.fileName), `${serverFile.source}\n`, "utf8");
  writeFileSync(join(outputDir, "Dockerfile"), dockerfileSource(runtime), "utf8");
  return source;
}

export function functionRuntimeLabel(runtime: FunctionRuntime) {
  return functionRuntimeLabels[runtime];
}
