import type { SystemMaintenanceInfo } from "../../api";
import { formatBytes } from "../../lib/format";
import { MaintenanceUsageBar } from "./maintenance-usage-bar";
import { diskTone, dockerReclaimableDetail, dockerReclaimablePercent, pathMetric } from "./maintenance-utils";

export function MaintenanceSummaryGrid({ info, loading }: { info: SystemMaintenanceInfo | null; loading: boolean }) {
  const diskPercent = info?.disk?.usedPercent ?? 0;
  const buildPath = pathMetric(info, "build-artifacts");
  const buildPercent = info?.disk && buildPath?.bytes
    ? Math.min(100, (buildPath.bytes / info.disk.totalBytes) * 100)
    : 0;
  const dockerPercent = dockerReclaimablePercent(info);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <MaintenanceUsageBar
        label="Disk utilization"
        value={info?.disk ? `${Math.round(diskPercent)}%` : loading ? "Loading" : "Unknown"}
        detail={info?.disk
          ? `${formatBytes(info.disk.usedBytes)} used · ${formatBytes(info.disk.availableBytes)} free · ${formatBytes(info.disk.totalBytes)} total on ${info.disk.mount}`
          : "Measured from the server root filesystem."}
        percent={diskPercent}
        percentLabel={info?.disk ? `${formatBytes(info.disk.availableBytes)} free` : undefined}
        tone={diskTone(diskPercent)}
      />
      <MaintenanceUsageBar
        label="Docker reclaimable"
        value={formatBytes(info?.docker.reclaimableBytes ?? null)}
        detail={dockerReclaimableDetail(info)}
        percent={dockerPercent}
        percentLabel={info?.disk ? `${dockerPercent.toFixed(dockerPercent < 1 ? 1 : 0)}% of disk` : undefined}
        tone={info?.docker.reclaimableBytes && info.docker.reclaimableBytes > 3 * 1000 ** 3 ? "amber" : "teal"}
      />
      <MaintenanceUsageBar
        label="Build artifacts"
        value={formatBytes(buildPath?.bytes ?? null)}
        detail={buildPath?.available
          ? `${buildPath.label} · ${buildPath.path}`
          : buildPath?.error ?? "No build artifact directory yet."}
        percent={buildPercent}
        percentLabel={info?.disk && buildPath?.bytes
          ? `${buildPercent.toFixed(buildPercent < 1 ? 1 : 0)}% of disk`
          : "No usage"}
        tone={buildPath?.bytes && buildPath.bytes > 2 * 1000 ** 3 ? "amber" : "teal"}
      />
    </div>
  );
}
