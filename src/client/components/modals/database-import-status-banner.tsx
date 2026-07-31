import { Alert02Icon, Cancel01Icon, CheckmarkCircle02Icon, DatabaseImportIcon, WorkflowSquare07Icon } from "@hugeicons/core-free-icons";
import type { DatabaseDataImport } from "../../api";
import { formatBytes, formatTime } from "../../lib/format";
import { AppIcon, statusClass } from "../ui/primitives";

function statusIcon(status: string) {
  if (status === "succeeded") return CheckmarkCircle02Icon;
  if (status === "failed") return Alert02Icon;
  if (status === "queued") return DatabaseImportIcon;
  return WorkflowSquare07Icon;
}

function statusLabel(status: string) {
  if (status === "succeeded") return "Imported";
  if (status === "failed") return "Failed";
  if (status === "queued") return "Queued";
  return "Importing";
}

function statusTone(status: string) {
  if (status === "succeeded") return "active";
  if (status === "failed") return "failed";
  if (status === "queued" || status === "running") return "building";
  return "idle";
}

function bannerTone(status: string) {
  if (status === "succeeded") {
    return {
      container: "border-emerald-500/30 bg-emerald-500/10",
      icon: "border-emerald-500/30 text-emerald-300",
      label: "text-emerald-300"
    };
  }
  if (status === "failed") {
    return {
      container: "border-rose-500/30 bg-rose-500/10",
      icon: "border-rose-500/30 text-rose-300",
      label: "text-rose-300"
    };
  }
  return {
    container: "border-amber-500/30 bg-amber-500/10",
    icon: "border-amber-500/30 text-amber-300",
    label: "text-amber-300"
  };
}

export function DatabaseImportStatusBanner({ dataImport, onDismiss }: { dataImport: DatabaseDataImport; onDismiss: () => void }) {
  const Icon = statusIcon(dataImport.status);
  const active = dataImport.status === "queued" || dataImport.status === "running";
  const tone = bannerTone(dataImport.status);
  const details = dataImport.status === "succeeded"
    ? `Imported ${formatBytes(dataImport.dumpSizeBytes)} from ${dataImport.sourceLabel}.`
    : dataImport.status === "failed"
    ? dataImport.error ?? "The background import failed."
    : `${dataImport.sourceLabel} data import is running in the background.`;

  return (
    <div className={`mb-4 border px-3 py-2.5 ${tone.container}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-8 w-8 flex-none place-items-center border bg-black/30 ${tone.icon}`}>
            <AppIcon icon={Icon} size={17} className={active ? "animate-pulse" : ""} />
          </span>
          <div className="min-w-0">
            <div className={`font-mono text-[9px] uppercase tracking-[0.16em] ${tone.label}`}>Database data import</div>
            <div className="mt-1 truncate text-xs text-zinc-300">{details}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${statusClass(statusTone(dataImport.status))}`}>
            {statusLabel(dataImport.status)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {formatTime(dataImport.finishedAt ?? dataImport.startedAt ?? dataImport.createdAt)}
          </span>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-black/20 hover:text-white"
            onClick={onDismiss}
            aria-label="Dismiss database import status"
            title="Dismiss"
          >
            <AppIcon icon={Cancel01Icon} size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
