import { Alert02Icon, Refresh03Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type MaintenanceCleanupTarget, type MaintenanceCommandResult, type SystemMaintenanceInfo } from "../../api";
import { AppIcon } from "../ui/primitives";
import { MaintenanceCleanupCard } from "./maintenance-cleanup-card";
import { MaintenanceCommandLog } from "./maintenance-command-log";
import { MaintenanceDockerStorage } from "./maintenance-docker-storage";
import { MaintenanceHistoryChart } from "./maintenance-history-chart";
import { MaintenanceSummaryGrid } from "./maintenance-summary-grid";
import { healthLabel } from "./maintenance-utils";

export function MaintenanceSettingsPanel({ open }: { open: boolean }) {
  const [info, setInfo] = useState<SystemMaintenanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupMode, setCleanupMode] = useState<"" | "safe" | "volumes">("");
  const [commands, setCommands] = useState<MaintenanceCommandResult[]>([]);
  const [confirmVolumes, setConfirmVolumes] = useState(false);
  const [error, setError] = useState("");

  const loadMaintenance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setInfo(await api.systemMaintenance());
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load maintenance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadMaintenance();
  }, [loadMaintenance, open]);

  const dockerMax = useMemo(() => {
    return Math.max(...(info?.docker.rows.map((row) => row.sizeBytes ?? 0) ?? []), 1);
  }, [info]);

  async function runCleanup(mode: "safe" | "volumes", targets: MaintenanceCleanupTarget[]) {
    setCleanupMode(mode);
    setError("");
    setCommands([]);
    try {
      const result = await api.runSystemMaintenanceCleanup(targets);
      setInfo(result.info);
      setCommands(result.commands);
      setConfirmVolumes(false);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Cleanup failed");
    } finally {
      setCleanupMode("");
    }
  }

  const healthTone = !info
    ? "text-zinc-500"
    : info.alerts.some((alert) => alert.includes("90%"))
      ? "text-rose-300"
      : info.alerts.length > 0
        ? "text-amber-300"
        : "text-emerald-300";
  const healthDot = !info
    ? "bg-zinc-600"
    : info.alerts.some((alert) => alert.includes("90%"))
      ? "bg-rose-400"
      : info.alerts.length > 0
        ? "bg-amber-400"
        : "bg-emerald-400";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden border border-white/10 bg-black">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl tracking-[-0.03em] text-white">Host health</h2>
            <p className="mt-1.5 text-sm text-zinc-500">Disk, Docker, logs, and build artifacts.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${healthTone}`}>
              <span className={`h-1.5 w-1.5 ${loading ? "animate-pulse" : ""} ${healthDot}`} />
              {loading ? "Checking" : healthLabel(info)}
            </span>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              onClick={() => void loadMaintenance()}
              disabled={loading || Boolean(cleanupMode)}
            >
              <AppIcon icon={Refresh03Icon} size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div className="px-5 py-4 sm:px-7">
            <div className="border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          </div>
        ) : null}

        {info?.alerts.length ? (
          <div className="divide-y divide-amber-400/15 border-t border-amber-400/20 bg-amber-400/[0.06]">
            {info.alerts.map((alert) => (
              <div key={alert} className="flex items-center gap-2 px-5 py-3 text-sm text-amber-200 sm:px-7">
                <AppIcon icon={Alert02Icon} size={15} />
                {alert}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <MaintenanceSummaryGrid info={info} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MaintenanceHistoryChart history={info?.history ?? []} metric="disk" label="Disk trend" />
        <MaintenanceHistoryChart history={info?.history ?? []} metric="docker" label="Docker reclaimable trend" />
        <MaintenanceHistoryChart history={info?.history ?? []} metric="builds" label="Build artifact trend" />
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <MaintenanceDockerStorage info={info} loading={loading} dockerMax={dockerMax} />
        <MaintenanceCleanupCard
          info={info}
          loading={loading}
          cleanupMode={cleanupMode}
          confirmVolumes={confirmVolumes}
          onConfirmVolumesChange={setConfirmVolumes}
          onRunCleanup={(mode, targets) => void runCleanup(mode, targets)}
        />
      </section>

      <MaintenanceCommandLog commands={commands} />
    </div>
  );
}
