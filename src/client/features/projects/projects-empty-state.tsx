import { Add01Icon, FolderCodeIcon } from "@hugeicons/core-free-icons";
import { AppIcon } from "../../components/ui/primitives";

export function ProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="relative min-h-[420px] overflow-hidden border border-dashed border-white/15 bg-black/20 p-7 sm:p-10">
      <div className="relative z-10 max-w-lg">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white">
          <AppIcon icon={FolderCodeIcon} size={18} />
        </span>
        <p className="mt-8 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Empty workspace
        </p>
        <h2 className="mt-3 font-hero text-3xl tracking-[-0.05em] text-white">
          Create your first project
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">
          Projects organize services, deployments, environment variables, and
          domains into one workspace.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-8 flex h-11 items-center gap-2 bg-white px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-zinc-200"
        >
          <AppIcon icon={Add01Icon} size={15} />
          New project
        </button>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 -right-36 h-[520px] w-[520px] rounded-full border border-white/[0.05]"
      >
        <span className="absolute inset-20 rounded-full border border-white/[0.07]" />
        <span className="absolute inset-40 rounded-full border border-white/10" />
      </div>
    </section>
  );
}
