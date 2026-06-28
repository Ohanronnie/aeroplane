export type ServiceTab = "overview" | "deployments" | "logs" | "environment" | "domains" | "source" | "data" | "sql" | "backups" | "settings";

export const serviceTabs: ServiceTab[] = ["overview", "source", "deployments", "logs", "environment", "domains", "data", "sql", "backups", "settings"];

export type ServiceRouteTab = "overview" | "deployments" | "logs" | "variables" | "domains" | "source-code" | "data" | "console" | "backups" | "settings";

export const serviceRouteTabs: ServiceRouteTab[] = ["overview", "source-code", "deployments", "logs", "variables", "domains", "data", "console", "backups", "settings"];

export const serviceTabToRouteSegment: Record<ServiceTab, ServiceRouteTab> = {
  overview: "overview",
  deployments: "deployments",
  logs: "logs",
  environment: "variables",
  domains: "domains",
  source: "source-code",
  data: "data",
  sql: "console",
  backups: "backups",
  settings: "settings"
};

export function routeSegmentToServiceTab(segment?: string): ServiceTab {
  if (segment === "variables") return "environment";
  if (segment === "console") return "sql";
  if (segment === "source-code") return "source";
  if (segment && serviceTabs.includes(segment as ServiceTab)) return segment as ServiceTab;
  return "overview";
}
