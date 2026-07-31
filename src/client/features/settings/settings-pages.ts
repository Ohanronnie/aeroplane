import {
  AiBrain01Icon,
  ApiIcon,
  CloudUploadIcon,
  DatabaseExportIcon,
  GithubIcon,
  Globe02Icon,
  HardDriveIcon,
  Key02Icon,
  Queue02Icon,
  Refresh03Icon,
  UserGroupIcon
} from "@hugeicons/core-free-icons";

export const systemSettingsTabValues = [
  "root-domain",
  "dns",
  "github",
  "ai",
  "api-access",
  "users",
  "storage",
  "migration",
  "maintenance",
  "deployments",
  "updates"
] as const;

export type SystemSettingsTab = (typeof systemSettingsTabValues)[number];

export const settingsPageSlugs = [
  "domains",
  "dns",
  "github",
  "ai",
  "api-access",
  "users",
  "storage",
  "migration",
  "maintenance",
  "deployments",
  "updates"
] as const;

export type SettingsPageSlug = (typeof settingsPageSlugs)[number];

export type SettingsPageDefinition = {
  slug: SettingsPageSlug;
  tab: SystemSettingsTab;
  label: string;
  icon: unknown;
  ownerOnly: boolean;
};

export const settingsPages: SettingsPageDefinition[] = [
  { slug: "domains", tab: "root-domain", label: "Domains", icon: Globe02Icon, ownerOnly: true },
  { slug: "dns", tab: "dns", label: "DNS", icon: ApiIcon, ownerOnly: true },
  { slug: "github", tab: "github", label: "GitHub", icon: GithubIcon, ownerOnly: true },
  { slug: "ai", tab: "ai", label: "AI", icon: AiBrain01Icon, ownerOnly: false },
  { slug: "api-access", tab: "api-access", label: "API access", icon: Key02Icon, ownerOnly: false },
  { slug: "users", tab: "users", label: "Users", icon: UserGroupIcon, ownerOnly: true },
  { slug: "storage", tab: "storage", label: "Storage", icon: CloudUploadIcon, ownerOnly: false },
  { slug: "migration", tab: "migration", label: "Migration", icon: DatabaseExportIcon, ownerOnly: true },
  { slug: "maintenance", tab: "maintenance", label: "Maintenance", icon: HardDriveIcon, ownerOnly: true },
  { slug: "deployments", tab: "deployments", label: "Deployments", icon: Queue02Icon, ownerOnly: true },
  { slug: "updates", tab: "updates", label: "Updates", icon: Refresh03Icon, ownerOnly: true }
];

export function isSettingsPageSlug(value: unknown): value is SettingsPageSlug {
  return typeof value === "string" && settingsPageSlugs.includes(value as SettingsPageSlug);
}

export function settingsPageForSlug(slug: SettingsPageSlug) {
  return settingsPages.find((page) => page.slug === slug) ?? settingsPages[0];
}

export function settingsPageForTab(tab: SystemSettingsTab = "root-domain") {
  return settingsPages.find((page) => page.tab === tab) ?? settingsPages[0];
}
