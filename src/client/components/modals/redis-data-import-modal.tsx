import { Alert02Icon, CheckmarkCircle02Icon, DatabaseImportIcon, WorkflowSquare07Icon } from "@hugeicons/core-free-icons";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, type RedisDataImportResult, type ServiceImportSource } from "../../api";
import { formatBytes } from "../../lib/format";
import { Checkbox } from "../ui/checkbox";
import { FormInput, statusClass } from "../ui/primitives";
import { ModalShell } from "./modal-shell";
import { RedisImportSourcePicker } from "./redis-import-source-picker";

type ImportMode = "railway" | "redis-url";
type ImportPhase = "form" | "progress";

const importLabelClass = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600";
const importSecondaryButtonClass = "inline-flex h-9 items-center justify-center border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-40";
const importPrimaryButtonClass = "inline-flex h-9 items-center justify-center bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:opacity-40";

function metadataText(source: ServiceImportSource, key: string) {
  const value = source.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function nextProgressValue(current: number) {
  if (current < 20) return current + 4;
  if (current < 55) return current + 2;
  if (current < 80) return current + 1;
  return current + 0.35;
}

export function RedisDataImportModal({
  open,
  serviceId,
  onClose,
  onImported
}: {
  open: boolean;
  serviceId: string;
  onClose: () => void;
  onImported: () => Promise<void> | void;
}) {
  const [mode, setMode] = useState<ImportMode>("railway");
  const [sources, setSources] = useState<ServiceImportSource[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [railwayToken, setRailwayToken] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>("form");
  const [progressPercent, setProgressPercent] = useState(0);
  const [loadingSources, setLoadingSources] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RedisDataImportResult | null>(null);

  const railwaySource = useMemo(() => sources.find((source) => source.provider === "railway") ?? null, [sources]);
  const railwayProjectName = railwaySource ? metadataText(railwaySource, "projectName") : null;
  const railwayEnvironmentName = railwaySource ? metadataText(railwaySource, "environmentName") : null;

  async function loadSources() {
    setLoadingSources(true);
    try {
      const response = await api.serviceImportSources(serviceId);
      setSources(response.sources);
      setMode(response.sources.some((source) => source.provider === "railway") ? "railway" : "redis-url");
    } catch {
      setSources([]);
      setMode("redis-url");
    } finally {
      setLoadingSources(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setError("");
    setResult(null);
    setSourceUrl("");
    setConfirmed(false);
    setPhase("form");
    setProgressPercent(0);
    setRailwayToken(localStorage.getItem("railway_api_token") ?? "");
    void loadSources();
  }, [open, serviceId]);

  useEffect(() => {
    if (phase !== "progress") return;
    if (result) {
      setProgressPercent(100);
      return;
    }
    if (error) {
      setProgressPercent((current) => Math.max(current, 12));
      return;
    }
    if (!busy) return;

    const interval = window.setInterval(() => {
      setProgressPercent((current) => Math.min(94, nextProgressValue(current)));
    }, 550);

    return () => window.clearInterval(interval);
  }, [busy, error, phase, result]);

  function closeModal() {
    if (busy) return;
    setPhase("form");
    setProgressPercent(0);
    onClose();
  }

  async function submitImport(event: FormEvent) {
    event.preventDefault();
    if (!confirmed || busy) return;

    setBusy(true);
    setPhase("progress");
    setProgressPercent(7);
    setError("");
    setResult(null);
    try {
      const response = mode === "railway"
        ? await api.importRedisDataFromRailway(serviceId, railwayToken.trim())
        : await api.importRedisDataFromUrl(serviceId, sourceUrl.trim());
      setResult(response.result);
      await onImported();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not import Redis data");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = confirmed
    && !busy
    && (mode === "railway" ? Boolean(railwaySource && railwayToken.trim()) : Boolean(sourceUrl.trim()));

  if (phase === "progress") {
    const progressIcon = result ? CheckmarkCircle02Icon : error ? Alert02Icon : WorkflowSquare07Icon;
    const progressTitle = result ? "Redis Data Imported" : error ? "Import Failed" : "Importing Redis Data";
    const progressStatus = result ? "active" : error ? "failed" : "building";
    const progressLabel = result ? "Complete" : error ? "Failed" : "Running";
    const sourceLabel = mode === "railway" ? railwaySource?.externalServiceName ?? "Railway Redis" : "Redis URL";

    return (
      <ModalShell
        open={open}
        onClose={closeModal}
        icon={progressIcon}
        title={progressTitle}
        width="max-w-lg"
        minHeight="min-h-0"
        variant="monochrome"
      >
        <div className="space-y-4">
          <div className="border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">Source</div>
                <div className="mt-1 text-xs text-zinc-200">{sourceLabel}</div>
              </div>
              <span className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${statusClass(progressStatus)}`}>
                {progressLabel}
              </span>
            </div>
            <div className="mt-4 h-1 overflow-hidden bg-white/10">
              <div
                className={`h-full transition-[width,background-color] duration-500 ${error ? "bg-rose-400" : result ? "bg-emerald-400" : "bg-white"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {result
                ? "The source RDB snapshot was loaded into this Aeroplane Redis service."
                : error
                ? "The import stopped before completion. Review the error below, then adjust the source and try again."
                : "Aeroplane is creating a Redis RDB snapshot, replacing the target dump, and restarting this Redis service."}
            </p>
          </div>

          {error ? <div className="border border-rose-500/35 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div> : null}

          {result ? (
            <div className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200">
              Imported {formatBytes(result.dumpSizeBytes)} from {result.sourceLabel}
              {result.sourceVariableKey ? ` using ${result.sourceVariableKey}` : ""}.
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            {error ? (
              <button
                type="button"
                className={importSecondaryButtonClass}
                onClick={() => {
                  setError("");
                  setProgressPercent(0);
                  setPhase("form");
                }}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className={result ? importPrimaryButtonClass : importSecondaryButtonClass}
              onClick={closeModal}
              disabled={busy}
            >
              {result ? "Done" : "Import in progress"}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onClose={closeModal}
      icon={DatabaseImportIcon}
      title="Import Redis data"
      width="max-w-lg"
      minHeight="min-h-0"
      variant="monochrome"
    >
      <form onSubmit={submitImport} className="space-y-4">
        <RedisImportSourcePicker
          value={mode}
          railwayAvailable={Boolean(railwaySource)}
          loading={loadingSources}
          onChange={setMode}
        />

        {mode === "railway" ? (
          <div className="space-y-3 border border-white/10 bg-white/[0.02] p-3">
            {railwaySource ? (
              <div className="grid gap-3 text-xs text-zinc-400 sm:grid-cols-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">Project</div>
                  <div className="mt-1 truncate text-zinc-100">{railwayProjectName ?? railwaySource.externalProjectId ?? "Railway project"}</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">Environment</div>
                  <div className="mt-1 truncate text-zinc-100">{railwayEnvironmentName ?? railwaySource.externalEnvironmentId ?? "Railway environment"}</div>
                </div>
              </div>
            ) : (
              <div className="border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                No saved Railway source is available.
              </div>
            )}

            <div>
              <label htmlFor="redis-import-railway-token" className={importLabelClass}>Railway API token</label>
              <FormInput
                id="redis-import-railway-token"
                type="password"
                value={railwayToken}
                onChange={(event) => setRailwayToken(event.target.value)}
                disabled={busy || !railwaySource}
                autoComplete="new-password"
                placeholder="rg_pat_..."
                variant="monochrome"
                className="!h-9 border-white/15 bg-black text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="border border-white/10 bg-white/[0.02] p-3">
            <label htmlFor="redis-import-source-url" className={importLabelClass}>Source Redis URL</label>
            <FormInput
              id="redis-import-source-url"
              type="password"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              disabled={busy}
              autoComplete="new-password"
              placeholder="redis://default:password@host:6379"
              variant="monochrome"
              className="!h-9 border-white/15 bg-black font-mono text-xs"
            />
          </div>
        )}

        <div className="border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
          <Checkbox checked={confirmed} onChange={setConfirmed} disabled={busy} label="Replace existing Redis data" variant="monochrome">
            <span className="text-xs text-rose-200">Replace all existing keys</span>
          </Checkbox>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
          <button type="button" className={importSecondaryButtonClass} onClick={closeModal} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={importPrimaryButtonClass} disabled={!canSubmit}>
            Import data
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
