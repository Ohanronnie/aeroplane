import { useEffect, useState } from "react";
import { api } from "../../api";

const minConcurrency = 1;
const maxConcurrency = 10;

function clampConcurrency(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(maxConcurrency, Math.max(minConcurrency, Math.round(value)));
}

export function DeploymentSettingsPanel({ open }: { open: boolean }) {
  const [deploymentConcurrency, setDeploymentConcurrency] = useState(3);
  const [savedConcurrency, setSavedConcurrency] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const result = await api.systemSettings();
      const next = clampConcurrency(result.settings.deploymentConcurrency);
      setDeploymentConcurrency(next);
      setSavedConcurrency(next);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load deployment settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadSettings();
  }, [open]);

  async function saveConcurrency(value: number) {
    const nextValue = clampConcurrency(value);
    setDeploymentConcurrency(nextValue);
    setSaving(true);
    setError("");
    try {
      const result = await api.updateSystemSettings({ deploymentConcurrency: nextValue });
      const next = clampConcurrency(result.settings.deploymentConcurrency);
      setDeploymentConcurrency(next);
      setSavedConcurrency(next);
    } catch (issue) {
      setDeploymentConcurrency(savedConcurrency);
      setError(issue instanceof Error ? issue.message : "Could not save deployment settings");
    } finally {
      setSaving(false);
    }
  }

  const busy = loading || saving;

  return (
    <section className="mx-auto max-w-3xl overflow-hidden border border-white/10 bg-black">
      <header className="border-b border-white/10 px-5 py-5 sm:px-7">
        <h2 className="text-xl tracking-[-0.03em] text-white">Concurrent deployments</h2>
        <p className="mt-1.5 text-sm text-zinc-500">Set how many deployments can run at once.</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-7">
        <div>
          <div className="text-sm text-zinc-300">Concurrency limit</div>
          <div className="mt-1 text-xs text-zinc-600">Between {minConcurrency} and {maxConcurrency}</div>
        </div>
        {loading ? (
          <div className="h-9 w-[132px] animate-pulse bg-white/[0.04]" />
        ) : (
          <div className="inline-grid grid-cols-[36px_60px_36px]">
            <button
              type="button"
              className="grid h-9 place-items-center border border-white/15 text-lg text-zinc-300 transition hover:border-white/40 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              onClick={() => void saveConcurrency(deploymentConcurrency - 1)}
              disabled={busy || deploymentConcurrency <= minConcurrency}
              aria-label="Decrease concurrent deployments"
            >
              -
            </button>
            <div className="grid h-9 place-items-center border-y border-white/15 bg-white/[0.03] font-mono text-sm text-zinc-100">
              {deploymentConcurrency}
            </div>
            <button
              type="button"
              className="grid h-9 place-items-center border border-white/15 text-lg text-zinc-300 transition hover:border-white/40 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              onClick={() => void saveConcurrency(deploymentConcurrency + 1)}
              disabled={busy || deploymentConcurrency >= maxConcurrency}
              aria-label="Increase concurrent deployments"
            >
              +
            </button>
          </div>
        )}
      </div>

      {saving ? <div className="border-t border-white/10 px-5 py-3 text-xs text-zinc-500 sm:px-7">Saving…</div> : null}
      {error ? (
        <div className="border-t border-white/10 px-5 py-4 sm:px-7">
          <div className="border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>
        </div>
      ) : null}
    </section>
  );
}
