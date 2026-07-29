import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { AppIcon } from "../../components/ui/primitives";

export function ProviderImportShell({
  open,
  title,
  stepLabel,
  logo,
  onClose,
  children,
  width = "max-w-xl",
  bodyClassName = "min-h-0 flex-1 overflow-y-auto",
}: {
  open: boolean;
  title: string;
  stepLabel: string;
  logo: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  bodyClassName?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`flex max-h-[min(760px,calc(100dvh-2rem))] min-h-[420px] w-full ${width} flex-col border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-8`}
        >
          <header className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-9 w-9 flex-none place-items-center">
                {logo}
              </span>
              <div className="min-w-0">
                <h2 className="truncate pb-1 font-hero text-lg leading-[1.3] tracking-[-0.04em]">
                  {title}
                </h2>
                <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {stepLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 flex-none place-items-center border border-white/10 text-zinc-500 transition hover:border-white/25 hover:text-white"
              aria-label={`Close ${title}`}
            >
              <AppIcon icon={Cancel01Icon} size={15} />
            </button>
          </header>

          <div className={`mt-7 ${bodyClassName}`}>{children}</div>
        </section>
      </div>
    </div>
  );
}
