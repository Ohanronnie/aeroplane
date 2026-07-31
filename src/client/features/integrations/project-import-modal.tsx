import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ComponentType, SVGProps } from "react";
import { RailwayLogo } from "../../components/icons/railway-logo";
import { VercelLogo } from "../../components/icons/vercel-logo";
import { AppIcon } from "../../components/ui/primitives";

export type ProjectImportSource = "railway" | "vercel";

const providers: Array<{
  id: ProjectImportSource;
  name: string;
  logo: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  {
    id: "railway",
    name: "Railway",
    logo: RailwayLogo,
  },
  {
    id: "vercel",
    name: "Vercel",
    logo: VercelLogo,
  },
];

export function ProjectImportModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (source: ProjectImportSource) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-import-title"
          className="w-full max-w-2xl border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-8"
        >
          <header className="flex items-start justify-between gap-5">
            <h2
              id="project-import-title"
              className="pb-1 font-hero text-xl leading-[1.3] tracking-[-0.04em]"
            >
              Import from…
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 flex-none place-items-center border border-white/10 text-zinc-500 transition hover:border-white/25 hover:text-white"
              aria-label="Close project import modal"
            >
              <AppIcon icon={Cancel01Icon} size={15} />
            </button>
          </header>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {providers.map((provider) => {
              const Logo = provider.logo;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => onSelect(provider.id)}
                  className="group border border-white/15 bg-black/20 p-5 text-left transition hover:border-white/40 hover:bg-white/5"
                >
                  <Logo aria-hidden className="h-9 w-9" />
                  <span className="mt-6 block text-base font-medium text-white">
                    {provider.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
