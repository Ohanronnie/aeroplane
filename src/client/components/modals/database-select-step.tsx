import { ArrowLeft01Icon, DatabaseIcon } from "@hugeicons/core-free-icons";
import { AppIcon } from "../ui/primitives";
import { DATABASE_OPTIONS, type DatabaseType } from "./database-service-options";

interface DatabaseSelectStepProps {
  onSelect: (dbType: DatabaseType) => void;
  onBack: () => void;
}

export function DatabaseSelectStep({ onSelect, onBack }: DatabaseSelectStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid flex-1 content-start border border-white/10 sm:grid-cols-2">
        {DATABASE_OPTIONS.map((db) => (
          <button
            key={db.key}
            type="button"
            onClick={() => onSelect(db.key)}
            className="group flex min-h-16 items-center gap-3 border-b border-white/10 px-4 py-3 text-left transition hover:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white/30 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center">
              {db.logoUrl ? (
                <img
                  src={db.logoUrl}
                  alt=""
                  aria-hidden="true"
                  className={db.logoClassName ?? "h-full w-full object-contain"}
                  loading="lazy"
                />
              ) : (
                <AppIcon icon={DatabaseIcon} size={22} className="text-zinc-400" />
              )}
            </span>

            <span className="min-w-0 flex-1 truncate text-sm text-zinc-300 transition group-hover:text-white">
              {db.name}
            </span>

            <AppIcon icon={ArrowLeft01Icon} size={14} className="rotate-180 text-zinc-700 transition group-hover:text-zinc-300" />
          </button>
        ))}
      </div>

      <div className="mt-4 flex shrink-0 justify-start border-t border-white/10 pt-4">
        <button type="button" className="inline-flex h-8 items-center justify-center gap-2 px-3 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white" onClick={onBack}>
          <AppIcon icon={ArrowLeft01Icon} size={16} />
          Back
        </button>
      </div>
    </div>
  );
}
