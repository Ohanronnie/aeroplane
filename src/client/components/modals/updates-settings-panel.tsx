import { CheckmarkCircle02Icon, Refresh03Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type SystemUpdateInfo, type SystemUpdateRun } from "../../api";
import { AppIcon } from "../ui/primitives";
import { UpdateConfirmationModal } from "./update-confirmation-modal";

function formatCommitDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function updateStatusTone(status: SystemUpdateInfo["status"]) {
  if (status === "current") return { text: "text-emerald-300", dot: "bg-emerald-400" };
  if (status === "available") return { text: "text-amber-300", dot: "bg-amber-400" };
  if (status === "diverged") return { text: "text-rose-300", dot: "bg-rose-400" };
  return { text: "text-zinc-500", dot: "bg-zinc-600" };
}

function updateStatusLabel(info: SystemUpdateInfo | null) {
  if (!info) return "Not checked";
  if (info.installType === "image" && info.status === "unknown") return "Image install";
  if (info.status === "current") return "Up to date";
  if (info.status === "available") return `${info.commits.length} update${info.commits.length === 1 ? "" : "s"}`;
  if (info.status === "diverged") return "Manual update";
  return "Unknown";
}

function runStatusLabel(run: SystemUpdateRun) {
  if (run.status === "running") return "Updating";
  if (run.status === "succeeded") return "Update complete";
  if (run.status === "failed") return "Update failed";
  return "Idle";
}

function handledRestartRunKey() {
  try {
    return window.sessionStorage.getItem("aeroplane:handled-update-restart") ?? "";
  } catch {
    return "";
  }
}

function rememberHandledRestartRun(runKey: string) {
  try {
    window.sessionStorage.setItem("aeroplane:handled-update-restart", runKey);
  } catch {
    // Storage can be unavailable in locked-down browsers; the in-memory guard still handles the current page.
  }
}

export function UpdatesSettingsPanel({ open }: { open: boolean }) {
  const [info, setInfo] = useState<SystemUpdateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [confirmingUpdate, setConfirmingUpdate] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const handledRunRef = useRef("");

  const loadUpdates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.systemUpdates();
      setInfo(result);
      if (result.error) {
        setError(result.error);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not check updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadUpdates();
  }, [loadUpdates, open]);

  useEffect(() => {
    if (!open || info?.updateRun.status !== "running") return;
    const interval = window.setInterval(() => void loadUpdates(), 2500);
    return () => window.clearInterval(interval);
  }, [info?.updateRun.status, loadUpdates, open]);

  useEffect(() => {
    const run = info?.updateRun;
    if (!run || run.status === "idle" || !run.finishedAt) return;

    const runKey = `${run.status}:${run.finishedAt}`;
    if (handledRunRef.current === runKey) return;
    handledRunRef.current = runKey;

    if (run.status === "succeeded") {
      const restartAlreadyHandled = handledRestartRunKey() === runKey;
      setError("");
      setSuccess(
        run.restartQueued
          ? restartAlreadyHandled
            ? "Update applied. Aeroplane is restarting."
            : "Update applied. Aeroplane is restarting, then this page will refresh."
          : "Update built. Restart Aeroplane to load server changes."
      );
      if (run.restartQueued && !restartAlreadyHandled) {
        rememberHandledRestartRun(runKey);
        window.setTimeout(() => window.location.reload(), 5000);
      }
    }

    if (run.status === "failed") {
      setSuccess("");
      setError(run.error || "Update failed");
    }
  }, [info?.updateRun]);

  async function applyUpdate() {
    if (!info || info.status !== "available") return;

    setConfirmingUpdate(false);
    setApplying(true);
    setError("");
    setSuccess("");
    try {
      const result = await api.applySystemUpdate();
      setInfo((current) => (current ? { ...current, updateRun: result.updateRun } : current));
      setSuccess("Update started.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not start update");
    } finally {
      setApplying(false);
    }
  }

  const run = info?.updateRun;
  const updateRunning = run?.status === "running";
  const canUpdate = Boolean(info && info.status === "available" && !info.dirty && info.canApplyUpdate && !updateRunning && !applying);
  const statusTone = updateStatusTone(info?.status ?? "unknown");

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="overflow-hidden border border-white/10 bg-black">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl tracking-[-0.03em] text-white">Release channel</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              {info?.installType === "image" ? "Docker image" : "Git checkout"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${statusTone.text}`}>
              <span className={`h-1.5 w-1.5 ${loading ? "animate-pulse" : ""} ${statusTone.dot}`} />
              {loading ? "Checking" : updateStatusLabel(info)}
            </span>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              onClick={() => void loadUpdates()}
              disabled={loading || updateRunning}
            >
              <AppIcon icon={Refresh03Icon} size={13} className={loading ? "animate-spin" : ""} />
              Check
            </button>
          </div>
        </header>

        <dl className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="px-5 py-4 sm:px-7 md:px-5">
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">Repository</dt>
            <dd className="mt-1.5 truncate font-mono text-xs text-zinc-300">{info?.repo ?? "xt42io/aeroplane"}</dd>
          </div>
          <div className="px-5 py-4">
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">Installed</dt>
            <dd className="mt-1.5 font-mono text-xs text-zinc-300">{info?.currentShortCommit ?? "unknown"}</dd>
          </div>
          <div className="px-5 py-4 sm:px-7 md:px-5">
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">GitHub</dt>
            <dd className="mt-1.5 font-mono text-xs text-zinc-300">
              {info?.remoteShortCommit ?? "unknown"}
              {info?.branch ? <span className="ml-2 text-zinc-500">/{info.branch}</span> : null}
            </dd>
          </div>
        </dl>
      </section>

      {info?.dirty ? (
        <div className="border-l-2 border-amber-400 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
          The Aeroplane checkout has local changes. Commit, deploy, or discard those changes before using the updater.
        </div>
      ) : null}

      {info?.installType === "image" ? (
        <section className="border border-white/10 bg-black">
          <header className="border-b border-white/10 px-5 py-3.5">
            <h3 className="text-sm text-zinc-100">{info.canApplyUpdate ? "Docker image updates" : "Update from server"}</h3>
          </header>
          <p className="px-5 py-4 text-sm leading-relaxed text-zinc-500">
            {!info.currentCommit
              ? "This image was built without commit metadata, so Aeroplane cannot compare it with GitHub yet. Publish the image with AEROPLANE_COMMIT_SHA to enable one-click updates."
              : info.canApplyUpdate
                ? "Aeroplane will pull the latest GHCR image through a short-lived updater container, then replace the running app container."
                : "This container does not include a git checkout, and one-click image updates are not configured for this install. Publish a new GHCR image, then run this on the server."}
          </p>
          {!info.canApplyUpdate || info.status === "unknown" ? (
            <pre className="overflow-x-auto border-t border-white/10 bg-white/[0.02] px-5 py-3 font-mono text-[11px] leading-relaxed text-zinc-300">
              {info.updateCommand ?? "cd /opt/aeroplane && sudo docker compose pull aeroplane && sudo docker compose up -d aeroplane"}
            </pre>
          ) : null}
        </section>
      ) : null}

      {info?.status === "current" && !updateRunning ? (
        <section className="flex items-center gap-3 border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4">
          <AppIcon icon={CheckmarkCircle02Icon} size={18} className="text-emerald-300" />
          <div>
            <h3 className="text-sm text-zinc-100">Aeroplane is up to date</h3>
            <p className="mt-0.5 text-xs text-zinc-500">Installed commit matches GitHub.</p>
          </div>
        </section>
      ) : null}

      {info?.status === "available" ? (
        <section className="border border-white/10 bg-black">
          <header className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm text-zinc-100">Pending commits</h3>
              <p className="mt-1 text-xs text-zinc-600">{info.commits.length} ready to apply</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:opacity-50"
              onClick={() => setConfirmingUpdate(true)}
              disabled={!canUpdate}
            >
              <AppIcon icon={Refresh03Icon} size={13} className={applying || updateRunning ? "animate-spin" : ""} />
              {updateRunning ? "Updating..." : info.installType === "image" ? "Pull latest image" : "Update Aeroplane"}
            </button>
          </header>

          <div className="max-h-[360px] overflow-y-auto">
            {info.commits.map((commit) => {
              const content = (
                <>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">{commit.shortSha}</div>
                  <div className="mt-1 text-sm text-zinc-100">{commit.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-zinc-500">
                    {commit.author} · {formatCommitDate(commit.date)}
                  </div>
                </>
              );

              return commit.url ? (
                <a
                  key={commit.sha}
                  href={commit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border-b border-white/10 px-5 py-3.5 transition hover:bg-white/[0.04]"
                >
                  {content}
                </a>
              ) : (
                <div key={commit.sha} className="border-b border-white/10 px-5 py-3.5">
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {info?.status === "diverged" ? (
        <div className="border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm leading-relaxed text-rose-200">
          {info.installType === "image"
            ? "The running image commit is not an ancestor of GitHub main, so Aeroplane will not update automatically. Publish a fresh image manually."
            : "This checkout has diverged from GitHub, so Aeroplane will not update automatically. Pull or reconcile the repository manually."}
        </div>
      ) : null}

      {run && run.status !== "idle" ? (
        <section className="border border-white/10 bg-black">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
            <h3 className="text-sm text-zinc-100">Update activity</h3>
            <span className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${
              run.status === "failed" ? "text-rose-300" : run.status === "running" ? "text-amber-300" : "text-emerald-300"
            }`}>
              <span className={`h-1.5 w-1.5 ${
                run.status === "failed" ? "bg-rose-400" : run.status === "running" ? "animate-pulse bg-amber-400" : "bg-emerald-400"
              }`} />
              {runStatusLabel(run)}
            </span>
          </header>
          <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap px-5 py-4 font-mono text-[11px] leading-relaxed text-zinc-400">
            {run.logs.join("\n") || "No update output yet."}
          </pre>
        </section>
      ) : null}

      {error ? <div className="border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      {success ? (
        <div className="flex items-center gap-2 border-l-2 border-emerald-400 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          <AppIcon icon={CheckmarkCircle02Icon} size={13} />
          {success}
        </div>
      ) : null}

      <UpdateConfirmationModal
        applying={applying}
        installType={info?.installType ?? "git"}
        open={confirmingUpdate}
        onCancel={() => setConfirmingUpdate(false)}
        onConfirm={() => void applyUpdate()}
      />
    </div>
  );
}
