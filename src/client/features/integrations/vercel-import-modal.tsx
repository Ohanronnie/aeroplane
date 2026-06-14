import { useState, useEffect } from "react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  GithubIcon,
  Search01Icon,
  WorkflowSquare07Icon,
  Globe02Icon,
  Settings01Icon
} from "@hugeicons/core-free-icons";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../../api";
import { ModalShell } from "../../components/modals/modal-shell";
import { Checkbox } from "../../components/ui/checkbox";
import { Dropdown } from "../../components/ui/dropdown";
import { AppIcon, FieldLabel, FormInput, shellButton } from "../../components/ui/primitives";
import { VercelMigrationOptions } from "./vercel-migration-options";

interface VercelTeam {
  id: string;
  slug: string;
  name: string;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  kind: "git" | "unsupported";
  sourceLabel: string;
}

type VercelEnvTarget = "production" | "preview" | "development";

interface VercelProjectDetails {
  id: string;
  name: string;
  framework: string | null;
  rootDirectory: string | null;
  buildCommand: string | null;
  installCommand: string | null;
  branch: string | null;
  kind: "git" | "unsupported";
  sourceLabel: string;
  unsupportedReason: string | null;
  targets: VercelEnvTarget[];
}

interface VercelImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PERSONAL_SCOPE = "";

const targetLabel: Record<VercelEnvTarget, string> = {
  production: "Production",
  preview: "Preview",
  development: "Development"
};

export function VercelImportModal({ open, onClose, onSuccess }: VercelImportModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"auth" | "select" | "configure" | "importing" | "success">("auth");
  const [apiToken, setApiToken] = useState("");
  const [teams, setTeams] = useState<VercelTeam[]>([]);
  const [scope, setScope] = useState<string>(PERSONAL_SCOPE);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<VercelProject | null>(null);
  const [projectDetails, setProjectDetails] = useState<VercelProjectDetails | null>(null);
  const [importedSlug, setImportedSlug] = useState("");
  const [rememberToken, setRememberToken] = useState(() => {
    const saved = localStorage.getItem("vercel_remember_token");
    return saved !== "false";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [target, setTarget] = useState<VercelEnvTarget>("production");
  const [excludeSystemVars, setExcludeSystemVars] = useState(true);
  const [autoDeploy, setAutoDeploy] = useState(true);

  useEffect(() => {
    if (open) {
      const savedToken = localStorage.getItem("vercel_api_token");
      if (savedToken) {
        setApiToken(savedToken);
      }
    }
  }, [open]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sourceLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function loadProjectsForScope(token: string, teamId: string) {
    const data = await api.vercelProjects(token, teamId || undefined);
    setProjects(data.projects);
  }

  async function handleConnect() {
    if (!apiToken.trim()) return;
    const token = apiToken.trim();
    setBusy(true);
    setError("");
    try {
      const teamData = await api.vercelTeams(token).catch(() => ({ teams: [] }));
      await loadProjectsForScope(token, PERSONAL_SCOPE);
      localStorage.setItem("vercel_remember_token", rememberToken ? "true" : "false");
      if (rememberToken) {
        localStorage.setItem("vercel_api_token", token);
      } else {
        localStorage.removeItem("vercel_api_token");
      }
      setTeams(teamData.teams);
      setScope(PERSONAL_SCOPE);
      setStep("select");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid Vercel API Token or connection failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleScopeChange(nextScope: string) {
    setScope(nextScope);
    setBusy(true);
    setError("");
    try {
      await loadProjectsForScope(apiToken.trim(), nextScope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Vercel projects");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectProject(project: VercelProject) {
    setSelectedProject(project);
    setBusy(true);
    setError("");
    try {
      const data = await api.vercelProjectDetails(apiToken.trim(), project.id, scope || undefined);
      setProjectDetails(data.details);
      setTarget(data.details.targets[0] ?? "production");
      setExcludeSystemVars(true);
      setAutoDeploy(true);
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
      const config = { target, excludeSystemVars, autoDeploy };
      const result = await api.vercelImport(apiToken.trim(), selectedProject.id, scope || undefined, config);
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

  function handleClose() {
    setStep("auth");
    setApiToken("");
    setTeams([]);
    setScope(PERSONAL_SCOPE);
    setProjects([]);
    setSearchQuery("");
    setSelectedProject(null);
    setProjectDetails(null);
    setImportedSlug("");
    setError("");
    setTarget("production");
    setExcludeSystemVars(true);
    setAutoDeploy(true);
    onClose();
  }

  const modalIcon =
    step === "auth"
      ? Settings01Icon
      : step === "select"
      ? Search01Icon
      : step === "configure"
      ? Settings01Icon
      : step === "importing"
      ? WorkflowSquare07Icon
      : CheckmarkCircle02Icon;

  const isUnsupported = projectDetails?.kind === "unsupported";

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      icon={modalIcon}
      title="Import Project from Vercel"
      meta={
        step === "auth"
          ? "Step 1: Authenticate"
          : step === "select"
          ? "Step 2: Choose Project"
          : step === "configure"
          ? "Step 3: Configure Migration"
          : step === "importing"
          ? "Migration In Progress"
          : "Migration Complete"
      }
      width="max-w-xl"
      bodyClassName="min-h-0 flex flex-1 flex-col overflow-hidden"
    >
      {step === "auth" && (
        <div className="space-y-5">
          <div className="text-sm text-zinc-300 leading-relaxed">
            Migrate a Vercel project to your self-hosted Aeroplane control plane. The connected Git repository, build
            commands, environment variables, and custom domains are imported. Builds then run through Railpack on your
            own server.
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <FieldLabel>Vercel API Token</FieldLabel>
              <a
                href="https://vercel.com/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-zinc-200 hover:underline uppercase tracking-wider"
              >
                Get token →
              </a>
            </div>
            <FormInput
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="vercel_..."
              disabled={busy}
              autoComplete="new-password"
              required
            />
            <div className="mt-3">
              <Checkbox
                checked={rememberToken}
                onChange={setRememberToken}
                disabled={busy}
                label="Remember my Vercel token"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  Remember my Vercel token
                </span>
              </Checkbox>
            </div>
          </div>

          {error && (
            <div className="border border-rose-500/35 bg-rose-950/20 px-4 py-3 text-xs text-rose-300 font-mono">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4 mt-5">
            <button type="button" className={shellButton("ghost")} onClick={handleClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 border border-zinc-100/40 bg-zinc-100/10 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-100 transition hover:bg-zinc-100/20 disabled:opacity-60"
              onClick={handleConnect}
              disabled={busy || !apiToken.trim()}
            >
              Connect to Vercel
            </button>
          </div>
        </div>
      )}

      {step === "select" && (
        <div className="flex flex-col min-h-full">
          <div className="mb-4">
            <FieldLabel>Scope</FieldLabel>
            <Dropdown
              value={scope}
              onChange={handleScopeChange}
              disabled={busy}
              options={[
                { value: PERSONAL_SCOPE, label: "Personal Account" },
                ...teams.map((team) => ({ value: team.id, label: team.name }))
              ]}
            />
          </div>

          <div className="relative mb-4">
            <AppIcon icon={Search01Icon} size={16} className="pointer-events-none absolute left-3 top-3 text-zinc-500" />
            <FormInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Vercel projects"
              className="pl-10"
            />
          </div>

          {error && (
            <div className="border border-rose-500/35 bg-rose-950/20 px-4 py-3 text-xs text-rose-300 font-mono mb-4">
              {error}
            </div>
          )}

          <div className="overflow-hidden border border-zinc-700 bg-zinc-900/85 flex-1 min-h-0">
            <div className="max-h-[300px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="px-5 py-8 text-center font-mono text-xs text-zinc-400">No Vercel projects found.</div>
              ) : (
                filteredProjects.map((project) => {
                  const unsupported = project.kind === "unsupported";
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-100">{project.name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate max-w-sm mt-0.5 font-mono">
                          <AppIcon icon={unsupported ? Alert02Icon : GithubIcon} size={12} />
                          {project.sourceLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 border border-zinc-100/40 bg-zinc-100/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-100 transition hover:bg-zinc-100/20 disabled:opacity-50"
                        onClick={() => void handleSelectProject(project)}
                        disabled={busy || unsupported}
                      >
                        Configure Import
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-start border-t border-zinc-800 pt-4 mt-5">
            <button type="button" className={shellButton("ghost")} onClick={() => setStep("auth")} disabled={busy}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Environment Variables Target</FieldLabel>
              <Dropdown
                value={target}
                onChange={(value) => setTarget(value as VercelEnvTarget)}
                disabled={busy}
                options={projectDetails.targets.map((value) => ({ value, label: targetLabel[value] }))}
              />
              <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">
                Pull env vars from this Vercel target
              </div>
            </div>

            <VercelMigrationOptions
              busy={busy}
              excludeSystemVars={excludeSystemVars}
              autoDeploy={autoDeploy}
              onExcludeSystemVarsChange={setExcludeSystemVars}
              onAutoDeployChange={setAutoDeploy}
            />
          </div>

          <div>
            <FieldLabel>Source</FieldLabel>
            <div className="border border-zinc-700 bg-zinc-900/85 px-4 py-3 space-y-1.5 font-mono text-[11px]">
              {isUnsupported ? (
                <div className="flex items-start gap-2 text-amber-200">
                  <AppIcon icon={Alert02Icon} size={14} className="mt-0.5 shrink-0" />
                  <span>{projectDetails.unsupportedReason}</span>
                </div>
              ) : (
                <>
                  <SummaryRow icon={GithubIcon} label="Repository" value={projectDetails.sourceLabel} />
                  <SummaryRow label="Branch" value={projectDetails.branch || "main"} />
                  {projectDetails.framework && <SummaryRow label="Framework" value={projectDetails.framework} />}
                  {projectDetails.rootDirectory && <SummaryRow label="Root" value={projectDetails.rootDirectory} />}
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="border border-rose-500/35 bg-rose-950/20 px-4 py-3 text-xs text-rose-300 font-mono">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-3 border-t border-zinc-800 pt-4 mt-5">
            <button type="button" className={shellButton("ghost")} onClick={() => setStep("select")} disabled={busy}>
              <AppIcon icon={ArrowLeft01Icon} size={16} />
              Back
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 border border-zinc-100/40 bg-zinc-100/10 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-100 transition hover:bg-zinc-100/20 disabled:opacity-60"
              onClick={handleExecuteImport}
              disabled={busy || isUnsupported}
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
            <div className="h-12 w-12 rounded-full border-2 border-t-2 border-zinc-700 border-t-zinc-100 animate-spin" />
            <AppIcon icon={WorkflowSquare07Icon} size={18} className="absolute text-zinc-100" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-base">Migrating Project</h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">Importing "{selectedProject?.name}" from Vercel...</p>
          </div>
          <div className="w-64 h-1 border border-zinc-800 bg-zinc-950 overflow-hidden relative">
            <div className="absolute inset-y-0 bg-gradient-to-r from-zinc-100 to-zinc-500 w-1/2 rounded-full animate-marquee" />
          </div>
          <div className="text-[10px] text-zinc-500 font-mono space-y-1">
            <div>Resolving Git source and build commands...</div>
            <div>Importing environment variables...</div>
            <div>Importing custom domains and queueing the deploy...</div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
          <div className="h-14 w-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <AppIcon icon={CheckmarkCircle02Icon} size={30} />
          </div>
          <div>
            <h3 className="font-hero text-xl font-bold text-zinc-100">Migration Completed!</h3>
            <p className="text-sm text-zinc-300 max-w-sm mt-2">
              Successfully imported "{selectedProject?.name}" from Vercel, including its Git source, build commands, and
              environment variables.
            </p>
          </div>

          <button
            type="button"
            className={shellButton("primary")}
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
    </ModalShell>
  );
}

function SummaryRow({ icon, label, value }: { icon?: typeof GithubIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-300">
      <span className="inline-flex items-center gap-1.5 w-24 shrink-0 text-zinc-500 uppercase tracking-wider text-[10px]">
        {icon && <AppIcon icon={icon} size={12} />}
        {label}
      </span>
      <span className="truncate text-zinc-100">{value}</span>
    </div>
  );
}
