import type { ReactNode } from "react";
import { AppIcon } from "../../components/ui/primitives";

export function OnboardingSuccessSummaryRow({
  icon,
  label,
  value,
  status,
  active,
  logo,
}: {
  icon?: unknown;
  label: string;
  value: string;
  status: string;
  active: boolean;
  logo?: ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-white/10 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center border border-white/15 bg-white/5 text-zinc-200">
          {logo ?? <AppIcon icon={icon} size={16} />}
        </span>
        <span className="min-w-0">
          <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </span>
          <span className="mt-1 block truncate text-sm text-white">
            {value}
          </span>
        </span>
      </div>
      <span
        className={`w-fit px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${
          active
            ? "bg-white text-black"
            : "border border-white/15 text-zinc-500"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export function OnboardingSuccessSummarySkeleton() {
  return (
    <div className="grid animate-pulse gap-4 border-b border-white/10 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex items-start gap-3">
        <span className="h-9 w-9 flex-none bg-white/10" />
        <span className="min-w-0 flex-1">
          <span className="block h-2.5 w-24 bg-white/10" />
          <span className="mt-3 block h-4 w-2/3 bg-white/10" />
        </span>
      </div>
      <span className="h-6 w-20 bg-white/10" />
    </div>
  );
}
