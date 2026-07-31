import { useState, useEffect } from "react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  CloudServerIcon,
  GithubIcon,
  PackageIcon,
  Search01Icon,
  WorkflowSquare07Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../../api";
import { RailwayLogo } from "../../components/icons/railway-logo";
import { Checkbox } from "../../components/ui/checkbox";
import { Dropdown } from "../../components/ui/dropdown";
import { AppIcon, FieldLabel, FormInput, shellButton } from "../../components/ui/primitives";
import { ProviderImportShell } from "./provider-import-shell";
import { RailwayMigrationOptions } from "./railway-migration-options";

interface RailwayProject {
  id: string;
  name: string;
  description: string;
  serviceCount: number;
}

interface RailwayImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onBackToProviders?: () => void;
}

type RailwayServiceKind = "git" | "database" | "docker-image" | "unsupported";

type RailwayServiceSourcePreview = {
  kind: RailwayServiceKind;
  sourceLabel: string;
  unsupportedReason: null | string;
  dbType: null | string;
  image: null | string;
};

type RailwayImportServicePreview = RailwayServiceSourcePreview & {
  id: string;
  name: string;
  sourcesByEnvironment: Record<string, RailwayServiceSourcePreview>;
};

function servicePreviewForEnvironment(service: RailwayImportServicePreview, environmentId: string) {
  return service.sourcesByEnvironment[environmentId] ?? service;
}

function importableServicesForEnvironment(services: RailwayImportServicePreview[], environmentId: string) {
  return services.filter((service) => servicePreviewForEnvironment(service, environmentId).kind !== "unsupported");
}

function serviceKindLabel(kind: RailwayServiceKind) {
  if (kind === "database") return "Database";
  if (kind === "docker-image") return "Docker Image";
  if (kind === "git") return "Git Service";
  return "Unsupported";
}

function serviceKindIcon(kind: RailwayServiceKind) {
  if (kind === "database") return CloudServerIcon;
  if (kind === "docker-image") return PackageIcon;
  if (kind === "git") return GithubIcon;
  return Alert02Icon;
}

function serviceKindClass(kind: RailwayServiceKind) {
  if (kind === "unsupported") {
    return "border-white/10 bg-white/5 text-zinc-600";
  }
  return "border-white/15 bg-black/20 text-zinc-300";
}

export function RailwayImportModal({
  open,
  onClose,
  onSuccess,
  onBackToProviders,
}: RailwayImportModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"auth" | "select" | "configure" | "importing" | "success">("auth");
  const [apiToken, setApiToken] = useState("");
  const [projects, setProjects] = useState<RailwayProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<RailwayProject | null>(null);
  const [importedSlug, setImportedSlug] = useState("");
  const [rememberToken, setRememberToken] = useState(() => {
    const saved = localStorage.getItem("railway_remember_token");
    return saved !== "false";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Configuration step states
  const [projectDetails, setProjectDetails] = useState<{
    services: RailwayImportServicePreview[];
    environments: Array<{ id: string; name: string }>;
  } | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>("");
  const [excludeRailwayVars, setExcludeRailwayVars] = useState(true);
  const [importDatabases, setImportDatabases] = useState(true);
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [importDatabaseData, setImportDatabaseData] = useState(true);

  useEffect(() => {
    if (open) {
      const savedToken = localStorage.getItem("railway_api_token");
      if (savedToken) {
        setApiToken(savedToken);
      }
    }
  }, [open]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleConnect() {
    if (!apiToken.trim()) return;
    setBusy(true);
    setError("");
    try {
      const data = await api.railwayProjects(apiToken.trim());
      localStorage.setItem("railway_remember_token", rememberToken ? "true" : "false");
      if (rememberToken) {
        localStorage.setItem("railway_api_token", apiToken.trim());
      } else {
        localStorage.removeItem("railway_api_token");
      }
      setProjects(data.projects);
      setStep("select");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid Railway API Token or connection failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectProject(project: RailwayProject) {
    setSelectedProject(project);
    setBusy(true);
    setError("");
    try {
      const data = await api.railwayProjectDetails(apiToken.trim(), project.id);
      const details = data.details;
      const defaultEnvironmentId = details.environments[0]?.id || "";
      setProjectDetails(details);
      
      // Initialize defaults
      setSelectedServiceIds(importableServicesForEnvironment(details.services, defaultEnvironmentId).map((service) => service.id));
      setSelectedEnvironmentId(defaultEnvironmentId);
      setExcludeRailwayVars(true);
      setImportDatabases(true);
      setAutoDeploy(true);
      setImportDatabaseData(true);
      
      setStep("configure");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project details");
    } finally {
      setBusy(false);
    }
  }

  async function handleExecuteImport() {
    if (!selectedProject) return;
    setStep("importing");
    setBusy(true);
    setError("");
    try {
      const config = {
        environmentId: selectedEnvironmentId,
        excludeRailwayVars,
        importDatabases,
        autoDeploy,
        importDatabaseData: importDatabaseData && importDatabases && autoDeploy,
        selectedServiceIds
      };
      const result = await api.railwayImport(apiToken.trim(), selectedProject.id, config);
      setImportedSlug(result.projectSlug);
      setStep("success");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed");
      setStep("configure");
    } finally {
      setBusy(false);
    }
  }

  function resetState() {
    setStep("auth");
    setApiToken("");
    setProjects([]);
    setSearchQuery("");
    setSelectedProject(null);
    setImportedSlug("");
    setError("");
    setProjectDetails(null);
    setSelectedServiceIds([]);
    setSelectedEnvironmentId("");
    setAutoDeploy(true);
    setImportDatabaseData(true);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleBackToProviders() {
    resetState();
    if (onBackToProviders) {
      onBackToProviders();
    } else {
      onClose();
    }
  }

  return (
    <ProviderImportShell
      open={open}
      onClose={handleClose}
      logo={<RailwayLogo className="h-8 w-8" />}
      title="Import from Railway"
      stepLabel={
        step === "auth"
          ? "01 / Authenticate"
          : step === "select"
          ? "02 / Choose project"
          : step === "configure"
          ? "03 / Configure migration"
          : step === "importing"
          ? "Migration in progress"
          : "Migration complete"
      }
      bodyClassName="min-h-0 flex flex-1 flex-col overflow-hidden"
    >
      {step === "auth" && (
        <div className="space-y-5">
          <div className="text-sm text-zinc-300 leading-relaxed">
            Migrate your Railway stack to your self-hosted Aeroplane control plane. App variables and command overrides are imported, while database engines are recreated with fresh Aeroplane-managed credentials.
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <FieldLabel>Railway Personal API Token</FieldLabel>
              <a
                href="https://railway.app/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400 transition hover:text-white"
              >
                Get token →
              </a>
            </div>
            <FormInput
              variant="monochrome"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="rg_pat_..."
              disabled={busy}
              autoComplete="new-password"
              required
            />
            <div className="mt-3">
              <Checkbox
                variant="monochrome"
                checked={rememberToken}
                onChange={setRememberToken}
                disabled={busy}
                label="Remember my Railway token"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  Remember my Railway token
                </span>
              </Checkbox>
            </div>
          </div>

          {error && (
            <div className="border-l-2 border-white bg-white/10 px-4 py-3 font-mono text-xs text-zinc-200">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              className={shellButton("ghost")}
              onClick={handleBackToProviders}
              disabled={busy}
            >
              <AppIcon icon={ArrowLeft01Icon} size={16} />
              Back
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center bg-white px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-zinc-200 disabled:opacity-60"
              onClick={handleConnect}
              disabled={busy || !apiToken.trim()}
            >
              Connect to Railway
            </button>
          </div>
        </div>
      )}

      {step === "select" && (
        <div className="flex flex-col min-h-full">
          <div className="relative mb-4">
            <AppIcon icon={Search01Icon} size={16} className="pointer-events-none absolute left-3 top-3 text-zinc-500" />
            <FormInput
              variant="monochrome"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Railway projects"
              className="pl-10"
            />
          </div>

          {error && (
            <div className="mb-4 border-l-2 border-white bg-white/10 px-4 py-3 font-mono text-xs text-zinc-200">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden border border-white/10 bg-black/20">
            <div className="max-h-[300px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="px-5 py-8 text-center font-mono text-xs text-zinc-400">
                  No Railway projects found.
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-100">{project.name}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-sm mt-0.5">
                        {project.description || "No description"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center border border-white/15 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-white hover:bg-white hover:text-black"
                      onClick={() => void handleSelectProject(project)}
                      disabled={busy}
                    >
                      Configure Import
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-start border-t border-white/10 pt-5">
            <button
              type="button"
              className={shellButton("ghost")}
              onClick={() => setStep("auth")}
              disabled={busy}
            >
              <AppIcon icon={ArrowLeft01Icon} size={16} />
              Back
            </button>
          </div>
        </div>
      )}

      {step === "configure" && projectDetails && (
        <div className="flex flex-col min-h-full space-y-4">
          <div className="text-sm text-zinc-300 leading-relaxed mb-1">
            Customize how <strong>{selectedProject?.name}</strong> is migrated to your self-hosted stack.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Target Environment</FieldLabel>
              <Dropdown
                variant="monochrome"
                value={selectedEnvironmentId}
                onChange={(environmentId) => {
                  setSelectedEnvironmentId(environmentId);
                  setSelectedServiceIds((current) =>
                    current.filter((serviceId) => {
                      const service = projectDetails.services.find((item) => item.id === serviceId);
                      return service ? servicePreviewForEnvironment(service, environmentId).kind !== "unsupported" : false;
                    })
                  );
                }}
                disabled={busy}
                options={projectDetails.environments.map((env) => ({ value: env.id, label: env.name }))}
              />
              <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">
                Pull app variables and commands from this env
              </div>
            </div>

            <RailwayMigrationOptions
              busy={busy}
              excludeRailwayVars={excludeRailwayVars}
              importDatabases={importDatabases}
              autoDeploy={autoDeploy}
              importDatabaseData={importDatabaseData}
              onExcludeRailwayVarsChange={setExcludeRailwayVars}
              onImportDatabasesChange={(checked) => {
                setImportDatabases(checked);
                if (!checked) setImportDatabaseData(false);
              }}
              onAutoDeployChange={(checked) => {
                setAutoDeploy(checked);
                if (!checked) setImportDatabaseData(false);
              }}
              onImportDatabaseDataChange={setImportDatabaseData}
            />
          </div>

          <div>
            <FieldLabel>Services to Import ({selectedServiceIds.length} selected)</FieldLabel>
            <div className="overflow-hidden border border-white/10 bg-black/20">
              <div className="max-h-[160px] divide-y divide-white/10 overflow-y-auto">
                {projectDetails.services.map((service) => {
                  const preview = servicePreviewForEnvironment(service, selectedEnvironmentId);
                  const isChecked = selectedServiceIds.includes(service.id);
                  const isUnsupported = preview.kind === "unsupported";
                  
                  return (
                    <div
                      key={service.id}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${isUnsupported ? "bg-white/[0.03]" : "hover:bg-white/5"}`}
                    >
                      <Checkbox
                        variant="monochrome"
                        checked={isChecked}
                        onChange={() => {
                          if (isUnsupported) return;
                          if (isChecked) {
                            setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                          } else {
                            setSelectedServiceIds([...selectedServiceIds, service.id]);
                          }
                        }}
                        disabled={busy || isUnsupported}
                        label={`Select ${service.name}`}
                      >
                        <span className="grid min-w-0 gap-1">
                          <span className="text-xs font-semibold text-zinc-100 font-mono">{service.name}</span>
                          <span className={`max-w-[260px] truncate text-[10px] font-mono ${isUnsupported ? "text-zinc-600" : "text-zinc-500"}`}>
                            {preview.unsupportedReason || preview.sourceLabel}
                          </span>
                        </span>
                      </Checkbox>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider font-semibold border ${serviceKindClass(preview.kind)}`}>
                        <AppIcon icon={serviceKindIcon(preview.kind)} size={12} />
                        {serviceKindLabel(preview.kind)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="border-l-2 border-white bg-white/10 px-4 py-3 font-mono text-xs text-zinc-200">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-between gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              className={shellButton("ghost")}
              onClick={() => setStep("select")}
              disabled={busy}
            >
              <AppIcon icon={ArrowLeft01Icon} size={16} />
              Back
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 bg-white px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-zinc-200 disabled:opacity-60"
              onClick={handleExecuteImport}
              disabled={busy || selectedServiceIds.length === 0}
            >
              <AppIcon icon={Globe02Icon} size={16} />
              Start Migration
            </button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            <AppIcon icon={WorkflowSquare07Icon} size={18} className="absolute text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-base">Migrating Project Stacks</h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Importing services from "{selectedProject?.name}"...
            </p>
          </div>
          <div className="relative h-1 w-64 overflow-hidden border border-white/10 bg-black">
            <div className="absolute inset-y-0 w-1/2 animate-marquee bg-white" />
          </div>
          <div className="text-[10px] text-zinc-500 font-mono space-y-1">
            <div>Fetching services, command overrides, and app variable maps...</div>
            <div>Generating self-hosted database credentials...</div>
            <div>Importing custom domains and queueing deploys...</div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black">
            <AppIcon icon={CheckmarkCircle02Icon} size={30} />
          </div>
          <div>
            <h3 className="font-hero text-xl font-bold text-zinc-100">Migration Completed!</h3>
            <p className="text-sm text-zinc-300 max-w-sm mt-2">
              Successfully migrated services, command overrides, app variables, and recreated databases from "{selectedProject?.name}" into your local stack.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 bg-white px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-zinc-200"
            onClick={() => {
              handleClose();
              void navigate({ to: "/$projectSlug", params: { projectSlug: importedSlug } });
            }}
          >
            <AppIcon icon={WorkflowSquare07Icon} size={16} />
            Go to Project Dashboard
          </button>
        </div>
      )}
    </ProviderImportShell>
  );
}
