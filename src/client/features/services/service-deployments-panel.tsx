import { Cancel01Icon, ChatQuestionIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import type { Deployment, DeploymentLog } from "../../api";
import { DeployPlaneIcon } from "../../components/icons/deploy-plane-icon";
import { AppIcon, statusClass } from "../../components/ui/primitives";
import { displayDeploymentStatus } from "../../lib/deployment-status";
import { formatTime, shortSha } from "../../lib/format";
import { DeploymentFailureExplanationModal } from "./deployment-failure-explanation-modal";
import { DeploymentLogsPanel } from "./service-log-panels";
import { formatBuildDuration } from "./service-format";

export function ServiceDeploymentsPanel({
  deployments,
  activeDeployment,
  activeDeploymentId,
  deploymentLogs,
  activeDeploymentDuration,
  busy,
  nowMs,
  onSelectDeployment,
  onDeploy,
  onAbortActiveDeployment
}: {
  deployments: Deployment[];
  activeDeployment: Deployment | null;
  activeDeploymentId: string | null;
  deploymentLogs: DeploymentLog[];
  activeDeploymentDuration: string | null;
  busy: string;
  nowMs: number;
  onSelectDeployment: (deploymentId: string) => void;
  onDeploy: () => void;
  onAbortActiveDeployment: () => void;
}) {
  const [failureModalOpen, setFailureModalOpen] = useState(false);
  const failedDeploymentSelected = activeDeployment?.status === "failed";

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col overflow-hidden border border-white/10 bg-black">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg tracking-[-0.03em] text-white">Deployments</h2>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
            {deployments.length} {deployments.length === 1 ? "deployment" : "deployments"}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center gap-2 bg-white px-3 text-xs text-black transition hover:bg-zinc-200 disabled:opacity-40"
          onClick={onDeploy}
          disabled={busy === "deploy"}
        >
          <DeployPlaneIcon size={13} />
          {busy === "deploy" ? "Deploying…" : "Deploy"}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="flex h-10 items-center justify-between border-b border-white/10 px-4 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
            <span>History</span>
            <span>{deployments.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
          {deployments.map((deployment) => {
            const displayStatus = displayDeploymentStatus(deployment.status);
            const selected = deployment.id === activeDeploymentId;
            const buildDuration = formatBuildDuration(
              deployment.startedAt ?? deployment.createdAt,
              deployment.finishedAt,
              nowMs
            );
            return (
              <button
                key={deployment.id}
                type="button"
                className={
                  selected
                    ? "flex min-h-14 w-full items-center justify-between gap-3 border-b border-white/10 bg-white/[0.08] px-4 py-3 text-left text-white"
                    : "flex min-h-14 w-full items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 text-left text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                }
                onClick={() => onSelectDeployment(deployment.id)}
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs">{shortSha(deployment.commitSha)}</div>
                  <div className={`mt-1 text-[10px] ${selected ? "text-zinc-500" : "text-zinc-600"}`}>
                    {formatTime(deployment.createdAt)}
                    {buildDuration ? ` · ${buildDuration}` : ""}
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] ${statusClass(displayStatus)}`}>
                  {displayStatus}
                </span>
              </button>
            );
          })}
          {deployments.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center px-4 text-center text-xs text-zinc-600">
              No deployments yet.
            </div>
          ) : null}
          </div>
        </aside>

        <div className="min-h-0 min-w-0">
        <DeploymentLogsPanel
          logs={deploymentLogs}
          title="Deploy output"
          meta={
            activeDeploymentDuration
              ? `${activeDeployment?.status === "queued" ? "Queued for" : "Building for"} ${activeDeploymentDuration}`
              : undefined
          }
          actions={
            activeDeployment && (activeDeployment.status === "queued" || activeDeployment.status === "building") ? (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center gap-2 border border-rose-400/40 px-3 text-xs text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-40"
                  onClick={onAbortActiveDeployment}
                  disabled={busy === "abort"}
                >
                  <AppIcon icon={Cancel01Icon} size={13} />
                  Abort build
                </button>
              </div>
            ) : failedDeploymentSelected ? (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center gap-2 border border-white/15 px-3 text-xs text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white"
                  onClick={() => setFailureModalOpen(true)}
                >
                  <AppIcon icon={ChatQuestionIcon} size={13} />
                  What happened?
                </button>
              </div>
            ) : undefined
          }
          emptyLabel="Choose a deployment to inspect its build and deploy logs."
          embedded
        />
        </div>
      </div>
      <DeploymentFailureExplanationModal
        deployment={activeDeployment}
        open={failureModalOpen && failedDeploymentSelected}
        onClose={() => setFailureModalOpen(false)}
      />
    </section>
  );
}
