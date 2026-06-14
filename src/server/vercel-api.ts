const vercelApiBase = process.env.VERCEL_API_BASE ?? "https://api.vercel.com";

type VercelRequestOptions = {
  teamId?: string;
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
};

export async function fetchVercel<T = any>(token: string, path: string, options: VercelRequestOptions = {}): Promise<T> {
  const url = new URL(path, vercelApiBase);
  if (options.teamId) {
    url.searchParams.set("teamId", options.teamId);
  }
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const errorBody = (await res.json()) as { error?: { message?: string } };
      if (errorBody?.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      // Response body was not JSON; fall back to the status text.
    }
    throw new Error(`Vercel API request failed: ${message}`);
  }

  return (await res.json()) as T;
}
