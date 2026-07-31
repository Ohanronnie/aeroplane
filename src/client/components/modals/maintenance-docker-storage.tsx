import type { SystemMaintenanceInfo } from "../../api";
import { formatBytes } from "../../lib/format";

export function MaintenanceDockerStorage({
  info,
  loading,
  dockerMax
}: {
  info: SystemMaintenanceInfo | null;
  loading: boolean;
  dockerMax: number;
}) {
  const available = Boolean(info?.docker.available);
  const rows = info?.docker.rows ?? [];
  const totalSize = rows.reduce((total, row) => total + (row.sizeBytes ?? 0), 0);
  const reclaimableSize = info?.docker.reclaimableBytes ?? 0;

  return (
    <div className="border border-white/10 bg-black">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5">
        <div>
          <h3 className="text-sm text-zinc-100">Docker storage</h3>
          <p className="mt-1 text-xs text-zinc-600">
            {available ? `${formatBytes(totalSize)} tracked across ${rows.length} categories` : "Docker metrics are not available"}
          </p>
        </div>
        <div className="text-right">
          <div className={`font-mono text-[9px] uppercase tracking-[0.16em] ${reclaimableSize > 0 ? "text-amber-300" : available ? "text-emerald-300" : "text-rose-300"}`}>
            {available ? `${formatBytes(reclaimableSize)} reclaimable` : "Unavailable"}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-700">
            {available ? `${rows.reduce((total, row) => total + (row.activeCount ?? 0), 0)} active objects` : info?.docker.error}
          </div>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="hidden grid-cols-[130px_90px_minmax(120px,1fr)_90px_110px] gap-3 border-b border-white/10 px-4 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-700 md:grid">
          <span>Type</span>
          <span>Objects</span>
          <span>Relative size</span>
          <span className="text-right">Size</span>
          <span className="text-right">Reclaimable</span>
        </div>
      ) : null}

      <div className="divide-y divide-white/10">
        {rows.length > 0 ? (
          rows.map((row) => {
            const percent = Math.max(2, Math.min(100, ((row.sizeBytes ?? 0) / dockerMax) * 100));
            const reclaimable = row.reclaimableBytes ?? 0;

            return (
              <div key={row.type} className="grid gap-3 px-4 py-3 md:grid-cols-[130px_90px_minmax(120px,1fr)_90px_110px] md:items-center">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">{row.type}</div>
                <div className="font-mono text-[10px] text-zinc-500">
                  <span className="text-zinc-300">{row.activeCount ?? "—"}</span>
                  <span className="px-1 text-zinc-700">/</span>
                  {row.totalCount ?? "—"}
                </div>
                <div className="h-1 bg-white/10">
                  <div className="h-full bg-white/70" style={{ width: `${percent}%` }} />
                </div>
                <div className="text-left font-mono text-[10px] text-zinc-300 md:text-right">
                  {formatBytes(row.sizeBytes)}
                </div>
                <div className={`text-left font-mono text-[10px] md:text-right ${reclaimable > 0 ? "text-amber-200" : "text-zinc-600"}`}>
                  {formatBytes(row.reclaimableBytes)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid min-h-28 place-items-center px-4 py-8 text-sm text-zinc-500">{loading ? "Loading Docker usage..." : "No Docker usage data."}</div>
        )}
      </div>
      {info?.docker.available && info.docker.reclaimableBytes > 0 ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-zinc-600">
          Reclaimable is Docker's estimate. Active services may still retain shared image layers after cleanup.
        </div>
      ) : null}
    </div>
  );
}
