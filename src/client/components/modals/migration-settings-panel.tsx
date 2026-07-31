import { CheckmarkCircle02Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { FormEvent, useState } from "react";
import { api } from "../../api";
import { formatBytes } from "../../lib/format";
import { AppIcon, FormInput } from "../ui/primitives";

export function MigrationSettingsPanel() {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState<{ fileName: string; sizeBytes: number } | null>(null);

  async function exportBundle(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLastExport(null);
    if (passphrase.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match.");
      return;
    }

    setExporting(true);
    try {
      const result = await api.exportMigrationBundle(passphrase);
      setLastExport(result);
      setPassphrase("");
      setConfirmPassphrase("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not export migration bundle");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl overflow-hidden border border-white/10 bg-black">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
        <div>
          <h2 className="text-xl tracking-[-0.03em] text-white">Export instance</h2>
          <p className="mt-1.5 text-sm text-zinc-500">Create an encrypted migration bundle.</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${
            exporting ? "text-amber-300" : lastExport ? "text-emerald-300" : "text-zinc-500"
          }`}
        >
          <span className={`h-1.5 w-1.5 ${exporting ? "animate-pulse bg-amber-400" : lastExport ? "bg-emerald-400" : "bg-zinc-600"}`} />
          {exporting ? "Exporting" : lastExport ? "Ready" : "Encrypted"}
        </span>
      </header>

      <form onSubmit={exportBundle}>
        <div className="divide-y divide-white/10 px-5 sm:px-7">
          <div className="grid gap-2 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
            <label htmlFor="migration-passphrase" className="text-xs text-zinc-500">Passphrase</label>
            <FormInput
              id="migration-passphrase"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              variant="monochrome"
              className="!h-9 border-white/15 bg-white/[0.03] text-sm"
            />
          </div>
          <div className="grid gap-2 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
            <label htmlFor="migration-confirm-passphrase" className="text-xs text-zinc-500">Confirm passphrase</label>
            <FormInput
              id="migration-confirm-passphrase"
              type="password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.target.value)}
              autoComplete="new-password"
              placeholder="Repeat passphrase"
              variant="monochrome"
              className="!h-9 border-white/15 bg-white/[0.03] text-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="border-t border-white/10 px-5 py-4 sm:px-7">
            <div className="border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          </div>
        ) : null}

        {lastExport ? (
          <div className="flex items-center gap-2 border-t border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-xs text-emerald-300 sm:px-7">
            <AppIcon icon={CheckmarkCircle02Icon} size={14} />
            <span className="min-w-0 truncate">{lastExport.fileName}</span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-emerald-200/70">{formatBytes(lastExport.sizeBytes)}</span>
          </div>
        ) : null}

        <footer className="flex justify-end border-t border-white/10 px-5 py-4 sm:px-7">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={exporting}
          >
            <AppIcon icon={Download01Icon} size={14} className={exporting ? "animate-pulse" : ""} />
            {exporting ? "Creating…" : "Download bundle"}
          </button>
        </footer>
      </form>
    </section>
  );
}
