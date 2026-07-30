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

  return (
    <div className="border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
        <h3 className="text-sm text-zinc-100">Docker storage</h3>
        <span className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${available ? "text-emerald-300" : "text-rose-300"}`}>
          <span className={`h-1.5 w-1.5 ${available ? "bg-emerald-400" : "bg-rose-400"}`} />
          {available ? "Available" : "Unavailable"}
        </span>
      </div>
      <div className="divide-y divide-white/10">
        {(info?.docker.rows ?? []).length > 0 ? (
          info?.docker.rows.map((row) => {
            const percent = Math.max(2, Math.min(100, ((row.sizeBytes ?? 0) / dockerMax) * 100));
            const reclaimable = row.reclaimableBytes ?? 0;

            return (
              <div key={row.type} className="grid gap-3 px-4 py-3 md:grid-cols-[160px_minmax(0,1fr)_240px] md:items-center">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">{row.type}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {row.activeCount ?? "?"}/{row.totalCount ?? "?"} active
                  </div>
                </div>
                <div className="h-1 bg-white/10">
                  <div className="h-full bg-white/50" style={{ width: `${percent}%` }} />
                </div>
                <div className="font-mono text-xs text-zinc-300">
                  {formatBytes(row.sizeBytes)}
                  <span className={`ml-2 ${reclaimable > 0 ? "text-amber-200" : "text-zinc-600"}`}>{formatBytes(row.reclaimableBytes)} candidate</span>
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
          Docker can keep image layers listed as candidates after safe cleanup when running services still reference them.
        </div>
      ) : null}
    </div>
  );
}
