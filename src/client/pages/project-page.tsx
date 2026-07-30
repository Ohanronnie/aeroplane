import { useNavigate } from "@tanstack/react-router";
import {
  Add01Icon,
  CloudServerIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Delete02Icon,
  PencilEdit02Icon
} from "@hugeicons/core-free-icons";
import {
  FormEvent,
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react";
import { api, type ProjectCard, type ProjectDetail, type ToolCheck } from "../api";
import { useAuthStatus } from "../components/auth/auth-context";
import { AppIcon, FormInput } from "../components/ui/primitives";
import { CreateServiceModal } from "../components/modals/create-service-modal";
import { DeleteProjectModal } from "../components/modals/delete-project-modal";
import { ProjectPageSkeleton } from "../features/projects/project-page-skeleton";
import { ProjectPageToolbar } from "../features/projects/project-page-toolbar";
import { ProjectServiceCard } from "../features/projects/project-service-card";
import { ProjectsDashboardSidebar } from "../features/projects/projects-dashboard-sidebar";
import type { ServiceFormPayload } from "../features/services/service-form-types";
import { serviceIsDeploying } from "../lib/deployment-status";
import { usePageTitle } from "../lib/page-title";

export function ProjectPage({ projectSlug }: { projectSlug: string }) {
  const navigate = useNavigate();
  const authStatus = useAuthStatus();
  const [project, setProject] = useState<null | ProjectDetail>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [tools, setTools] = useState<ToolCheck[]>([]);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentProject = project?.slug === projectSlug ? project : null;
  const currentUser = authStatus?.user ?? null;
  const owner = currentUser?.role === "owner";

  const loadProject = useCallback(async () => {
    try {
      const [projectData, projectListData] = await Promise.all([
        api.project(projectSlug),
        api.projects().catch(() => ({ projects: [] }))
      ]);
      startTransition(() => {
        setProject(projectData.project);
        setProjects(projectListData.projects);
        setError("");
        setLoading(false);
      });
    } catch (issue) {
      startTransition(() => {
        setError(
          issue instanceof Error ? issue.message : "Could not load project",
        );
        setLoading(false);
      });
    }
  }, [projectSlug]);

  useEffect(() => {
    setProject(null);
    setProjects([]);
    setLoading(true);
    void loadProject();
  }, [loadProject, projectSlug]);

  useEffect(() => {
    if (!owner) {
      setTools([]);
      return;
    }

    let cancelled = false;
    void api.system()
      .then((result) => {
        if (!cancelled) setTools(result.tools);
      })
      .catch(() => {
        if (!cancelled) setTools([]);
      });

    return () => {
      cancelled = true;
    };
  }, [owner]);

  useEffect(() => {
    if (!currentProject) return;

    const hasDeployingService = currentProject.services.some((service) =>
      serviceIsDeploying(service.status),
    );
    const interval = setInterval(() => {
      void loadProject();
    }, hasDeployingService ? 1500 : 6000);
    return () => clearInterval(interval);
  }, [currentProject?.id, currentProject?.services, loadProject]);

  useEffect(() => {
    if (!currentProject || editingProject) return;
    setProjectForm({
      name: currentProject.name,
      description: currentProject.description ?? "",
    });
  }, [currentProject, editingProject]);

  const projectTitle = currentProject?.name ?? projectSlug;
  usePageTitle(projectTitle);

  async function createService(payload: ServiceFormPayload) {
    if (!currentProject) return;
    const result = await api.createService(currentProject.id, payload);
    await api.createDeployment(result.service.id);
    await loadProject();
    void navigate({
      to: "/$projectSlug/$serviceSlug/$serviceTab",
      params: {
        projectSlug,
        serviceSlug: result.service.slug,
        serviceTab: "deployments",
      },
    });
  }

  function navigateToProjects() {
    void navigate({ to: "/" });
  }

  function navigateToProject(nextProjectSlug: string) {
    void navigate({
      to: "/$projectSlug",
      params: { projectSlug: nextProjectSlug },
    });
  }

  function navigateToServiceOverview(serviceSlug: string) {
    void navigate({
      to: "/$projectSlug/$serviceSlug",
      params: { projectSlug, serviceSlug },
    });
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    if (!currentProject) return;
    setSavingProject(true);
    setError("");
    try {
      const result = await api.updateProject(currentProject.id, {
        name: projectForm.name,
        description: projectForm.description,
      });
      startTransition(() => {
        setProject(result.project);
        setProjects((current) =>
          current.map((item) =>
            item.id === result.project.id ? result.project : item,
          ),
        );
        setEditingProject(false);
      });
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Could not update project",
      );
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteProject() {
    if (!currentProject) return;
    setDeletingProject(true);
    try {
      await api.deleteProject(currentProject.id);
      void navigate({ to: "/" });
    } finally {
      setDeletingProject(false);
    }
  }

  return (
    <>
      <main className="min-h-dvh bg-black text-white">
        <div className="grid min-h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
          <ProjectsDashboardSidebar currentUser={currentUser} tools={tools} owner={owner} />

          <section className="min-w-0 bg-zinc-950">
            <div className="mx-auto w-full max-w-[1680px] px-5 pb-20 pt-6 sm:px-8 lg:px-10">
              {loading || (!currentProject && !error) ? (
                <ProjectPageSkeleton />
              ) : (
                <>
                  <header className="border-b border-white/10 pb-6">
                    <ProjectPageToolbar
                      projects={projects}
                      currentProject={currentProject}
                      fallbackProjectName={projectSlug}
                      onBack={navigateToProjects}
                      onProjectSelect={navigateToProject}
                    />

                    {editingProject ? (
                      <form onSubmit={saveProject} className="mt-5 max-w-3xl overflow-hidden border border-white/10 bg-black">
                        <div className="divide-y divide-white/10 px-5">
                          <div className="grid gap-2 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                            <label htmlFor="project-name" className="text-xs text-zinc-500">Name</label>
                            <FormInput
                              id="project-name"
                              value={projectForm.name}
                              onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                              required
                              variant="monochrome"
                              className="!h-9 border-white/15 bg-white/[0.03] text-sm"
                            />
                          </div>
                          <div className="grid gap-2 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                            <label htmlFor="project-description" className="text-xs text-zinc-500">Description</label>
                            <FormInput
                              id="project-description"
                              value={projectForm.description}
                              onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })}
                              placeholder="Optional"
                              variant="monochrome"
                              className="!h-9 border-white/15 bg-white/[0.03] text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
                          <button
                            type="button"
                            className="inline-flex h-9 items-center justify-center gap-2 border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] disabled:opacity-50"
                            onClick={() => {
                              setProjectForm({
                                name: currentProject?.name ?? "",
                                description: currentProject?.description ?? ""
                              });
                              setEditingProject(false);
                            }}
                            disabled={savingProject}
                          >
                            <AppIcon icon={Cancel01Icon} size={14} />
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:opacity-50"
                            disabled={savingProject || !currentProject}
                          >
                            <AppIcon icon={CheckmarkCircle02Icon} size={14} />
                            {savingProject ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <h1 className="truncate text-3xl tracking-[-0.04em] text-white sm:text-4xl">
                              {currentProject?.name ?? projectSlug}
                            </h1>
                            <button
                              type="button"
                              className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white"
                              onClick={() => setEditingProject(true)}
                              aria-label="Edit project"
                              disabled={!currentProject}
                            >
                              <AppIcon icon={PencilEdit02Icon} size={15} />
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-zinc-500">
                            {currentProject?.description || `${currentProject?.serviceCount ?? 0} service${currentProject?.serviceCount === 1 ? "" : "s"}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:opacity-50"
                            onClick={() => setCreateServiceOpen(true)}
                            disabled={!currentProject}
                          >
                            <AppIcon icon={Add01Icon} size={15} />
                            New service
                          </button>
                          <button
                            type="button"
                            className="grid h-10 w-10 place-items-center border border-white/15 text-zinc-500 transition hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
                            onClick={() => setDeleteProjectOpen(true)}
                            aria-label="Delete project"
                            disabled={!currentProject}
                          >
                            <AppIcon icon={Delete02Icon} size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </header>

                  {error ? (
                    <div className="mt-6 border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6">
                    {currentProject && currentProject.services.length === 0 ? (
                      <section className="flex min-h-72 items-center justify-center border border-white/10 bg-black px-6 py-12 text-center">
                        <div>
                          <AppIcon icon={CloudServerIcon} size={22} className="mx-auto text-zinc-600" />
                          <h2 className="mt-4 text-lg text-zinc-100">No services</h2>
                          <p className="mt-1.5 text-sm text-zinc-600">Add the first service to this project.</p>
                          <button
                            type="button"
                            className="mt-5 inline-flex h-9 items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200"
                            onClick={() => setCreateServiceOpen(true)}
                          >
                            <AppIcon icon={Add01Icon} size={14} />
                            Add service
                          </button>
                        </div>
                      </section>
                    ) : currentProject ? (
                      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {currentProject.services.map((service) => (
                          <ProjectServiceCard
                            key={service.id}
                            service={service}
                            onOpen={() => navigateToServiceOverview(service.slug)}
                          />
                        ))}
                      </section>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <CreateServiceModal
        projectId={currentProject?.id ?? ""}
        open={createServiceOpen}
        onClose={() => setCreateServiceOpen(false)}
        onCreate={createService}
      />
      <DeleteProjectModal
        open={deleteProjectOpen}
        projectName={currentProject?.name ?? projectSlug}
        busy={deletingProject}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={() => void deleteProject()}
      />
    </>
  );
}
