import { CheckmarkCircle02Icon, CloudUploadIcon, DatabaseExportIcon } from "@hugeicons/core-free-icons";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { api, type MigrationImportResult } from "../../api";
import { AppIcon } from "../../components/ui/primitives";

export function MigrationImportModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [bundle, setBundle] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MigrationImportResult | null>(null);

  useEffect(() => {
    if (open) return;
    setBundle(null);
    setPassphrase("");
    setImporting(false);
    setError("");
    setResult(null);
  }, [open]);

  function chooseBundle(event: ChangeEvent<HTMLInputElement>) {
    setBundle(event.target.files?.[0] ?? null);
    setResult(null);
    setError("");
  }

  async function importBundle(event: FormEvent) {
    event.preventDefault();
    if (!bundle) {
      setError("Choose a migration bundle.");
      return;
    }
    if (passphrase.length < 8) {
      setError("Enter the migration passphrase.");
      return;
    }

    setImporting(true);
    setError("");
    setResult(null);
    try {
      const response = await api.importMigrationBundle(bundle, passphrase);
      setResult(response.result);
      window.location.replace("/onboarding/success");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not import migration bundle");
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-5 border-b border-white/10 pb-6">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white text-black">
                <AppIcon icon={DatabaseExportIcon} size={17} />
              </span>
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Server migration
                </p>
                <h2 className="mt-1.5 font-hero text-xl tracking-[-0.04em]">
                  Import existing aeroplane
                </h2>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Restore an encrypted bundle from another server.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition hover:text-white"
            >
              Close
            </button>
          </div>

          <form onSubmit={importBundle}>
            <div className="grid gap-y-5">
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Migration bundle
                </span>
                <span className="flex min-h-12 cursor-pointer items-center gap-3 rounded-sm border border-white/15 bg-white/5 px-3.5 font-mono text-xs text-zinc-300 transition hover:border-white/30">
                  <AppIcon icon={CloudUploadIcon} size={15} />
                  <span className="min-w-0 truncate">
                    {bundle?.name ?? "Choose .aeroplane file"}
                  </span>
                  <input
                    type="file"
                    accept=".aeroplane,application/octet-stream"
                    className="sr-only"
                    onChange={chooseBundle}
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Passphrase
                </span>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                  autoComplete="current-password"
                  className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 text-sm text-white outline-none transition hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-5 border-l-2 border-white bg-white/10 px-4 py-3 text-xs text-zinc-200">
                {error}
              </div>
            ) : null}
            {result ? (
              <div className="mt-5 flex items-start gap-3 border border-white/15 bg-white/10 px-4 py-3 text-xs text-zinc-200">
                <AppIcon icon={CheckmarkCircle02Icon} size={14} />
                Restored {result.projects} projects, {result.services} services,
                and {result.restoredDatabases} databases.
              </div>
            ) : null}

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={importing}
                className="h-11 px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="flex h-11 items-center justify-center gap-2 rounded-sm bg-white px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-zinc-200 disabled:opacity-60"
              >
                <AppIcon
                  icon={
                    importing ? DatabaseExportIcon : CheckmarkCircle02Icon
                  }
                  size={14}
                  className={importing ? "animate-pulse" : ""}
                />
                {importing ? "Importing" : "Import"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
