import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import type { ProjectCard } from "../../api";
import { AppIcon } from "../../components/ui/primitives";
import { formatRelativeTime } from "../../lib/format";
import { ServiceCluster } from "./service-cluster";

export function ProjectOverviewCard({
  project,
  index,
  onOpen,
}: {
  project: ProjectCard;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden border border-white/10 bg-black/25 p-5 text-left transition hover:border-white/30 hover:bg-white/[0.03]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Project {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-2 truncate text-lg font-semibold tracking-tight text-white">
              {project.name}
            </h2>
            {project.description ? (
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-500">
                {project.description}
              </p>
            ) : null}
          </div>
          <span className="grid h-9 w-9 flex-none place-items-center border border-white/15 text-zinc-500 transition group-hover:border-white group-hover:bg-white group-hover:text-black">
            <AppIcon icon={ArrowRight02Icon} size={15} />
          </span>
        </div>

        <div className="mt-5">
          <ServiceCluster project={project} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {project.serviceCount} service
            {project.serviceCount === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600">
            Updated {formatRelativeTime(project.lastUpdatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
