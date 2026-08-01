import type { Deployment, DeploymentLog, Project, Service } from "./types.js";

type ApiErrorBody = { error?: string; setupRequired?: boolean };

export class AeroplaneApi {
  constructor(
    readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (this.apiKey) headers.set("Authorization", `Bearer ${this.apiKey}`);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Could not reach Aeroplane at ${this.baseUrl}: ${detail}`,
      );
    }

    const body = (await response.json().catch(() => ({}))) as ApiErrorBody & T;
    if (!response.ok) {
      if (body.setupRequired) {
        throw new Error(
          `Aeroplane at ${this.baseUrl} still needs owner setup in the dashboard`,
        );
      }
      throw new Error(
        body.error ?? `Aeroplane returned HTTP ${response.status}`,
      );
    }
    return body;
  }

  async projects() {
    return (await this.request<{ projects: Project[] }>("/api/projects"))
      .projects;
  }

  async createProject(name: string) {
    return (
      await this.request<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
    ).project;
  }

  async createService(projectId: string, input: Record<string, unknown>) {
    return (
      await this.request<{ service: Service }>(
        `/api/projects/${projectId}/services`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      )
    ).service;
  }

  async updateService(serviceId: string, input: Record<string, unknown>) {
    return (
      await this.request<{ service: Service }>(`/api/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    ).service;
  }

  async deploy(serviceId: string) {
    return (
      await this.request<{ deployment: Deployment }>(
        `/api/services/${serviceId}/deployments`,
        {
          method: "POST",
        },
      )
    ).deployment;
  }

  async ensureGitHubWebhook(serviceId: string) {
    return (
      await this.request<{
        webhook: { id: number; active: boolean; url: string };
      }>(`/api/services/${serviceId}/github-webhook`, { method: "POST" })
    ).webhook;
  }

  async deployments(serviceId: string) {
    return (
      await this.request<{ deployments: Deployment[] }>(
        `/api/services/${serviceId}/deployments`,
      )
    ).deployments;
  }

  async deploymentLogs(deploymentId: string) {
    return (
      await this.request<{ logs: DeploymentLog[] }>(
        `/api/deployments/${deploymentId}/logs`,
      )
    ).logs;
  }

  async serviceOverview(serviceId: string) {
    return (
      await this.request<{ service: Service }>(
        `/api/services/${serviceId}/overview`,
      )
    ).service;
  }
}
