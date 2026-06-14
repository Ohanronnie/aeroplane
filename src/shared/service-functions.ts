export const FUNCTION_REPO_URL = "function";
export const FUNCTION_REPO_FULL_NAME_PREFIX = "function:";

export const functionRuntimes = ["node", "bun", "python"] as const;
export type FunctionRuntime = (typeof functionRuntimes)[number];

type FunctionServiceShape = {
  repoFullName: null | string;
  repoUrl: string;
};

export const functionRuntimeLabels: Record<FunctionRuntime, string> = {
  node: "Node.js",
  bun: "Bun",
  python: "Python"
};

export const functionRuntimeFileNames: Record<FunctionRuntime, string> = {
  node: "function.mjs",
  bun: "function.mjs",
  python: "function.py"
};

export const defaultFunctionSource: Record<FunctionRuntime, string> = {
  node: `export default async function handler(event) {
  return {
    status: 200,
    headers: { "content-type": "application/json" },
    body: {
      message: "Hello from Node.js",
      path: event.path,
      method: event.method
    }
  };
}
`,
  bun: `export default async function handler(event) {
  return {
    status: 200,
    headers: { "content-type": "application/json" },
    body: {
      message: "Hello from Bun",
      path: event.path,
      method: event.method
    }
  };
}
`,
  python: `def handler(event, context):
    return {
        "status": 200,
        "headers": {"content-type": "application/json"},
        "body": {
            "message": "Hello from Python",
            "path": event["path"],
            "method": event["method"],
        },
    }
`
};

export function normalizeFunctionRuntime(value: unknown): FunctionRuntime {
  return value === "bun" || value === "python" ? value : "node";
}

export function functionRepoFullName(runtime: FunctionRuntime) {
  return `${FUNCTION_REPO_FULL_NAME_PREFIX}${runtime}`;
}

export function functionRuntimeFromRepoFullName(repoFullName: null | string) {
  if (!repoFullName?.startsWith(FUNCTION_REPO_FULL_NAME_PREFIX)) return null;
  return normalizeFunctionRuntime(repoFullName.slice(FUNCTION_REPO_FULL_NAME_PREFIX.length));
}

export function isFunctionService(service: FunctionServiceShape) {
  return service.repoUrl === FUNCTION_REPO_URL || Boolean(functionRuntimeFromRepoFullName(service.repoFullName));
}

export function functionRuntimeForService(service: FunctionServiceShape) {
  return functionRuntimeFromRepoFullName(service.repoFullName) ?? (service.repoUrl === FUNCTION_REPO_URL ? "node" : null);
}
