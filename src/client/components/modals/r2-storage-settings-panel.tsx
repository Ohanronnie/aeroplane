import { Cancel01Icon, CheckmarkCircle02Icon, CloudUploadIcon, Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { FormEvent, useEffect, useState } from "react";
import { api, type R2SettingsStatus } from "../../api";
import { Checkbox } from "../ui/checkbox";
import { AppIcon, FormInput } from "../ui/primitives";

type R2FormState = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  createBucket: boolean;
};

type R2StorageSettingsMode = "system" | "account";

const emptyR2: R2SettingsStatus = {
  connected: false,
  accountId: "",
  bucket: "",
  endpoint: "",
  accessKeyIdSuffix: "",
  connectedAt: null,
  updatedAt: null
};

function blankForm(): R2FormState {
  return {
    accountId: "",
    bucket: "aeroplane-backups",
    accessKeyId: "",
    secretAccessKey: "",
    createBucket: true
  };
}

function formFromR2(r2: R2SettingsStatus): R2FormState {
  return {
    accountId: r2.accountId,
    bucket: r2.bucket || "aeroplane-backups",
    accessKeyId: r2.accessKeyIdSuffix ? `******${r2.accessKeyIdSuffix}` : "",
    secretAccessKey: "",
    createBucket: false
  };
}

function modeCopy(mode: R2StorageSettingsMode) {
  return mode === "account"
    ? {
        editTitle: "Edit backup storage",
        connectTitle: "Connect backup storage",
        saved: "Backup storage connection saved.",
        removed: "Backup storage connection removed.",
        loadError: "Could not load backup storage settings"
      }
    : {
        editTitle: "Edit R2 connection",
        connectTitle: "Connect R2",
        saved: "R2 connection saved.",
        removed: "R2 connection removed.",
        loadError: "Could not load R2 settings"
      };
}

export function R2StorageSettingsPanel({ open, mode = "system" }: { open: boolean; mode?: R2StorageSettingsMode }) {
  const [r2, setR2] = useState<R2SettingsStatus>(emptyR2);
  const [form, setForm] = useState<R2FormState>(blankForm);
  const [editing, setEditing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const copy = modeCopy(mode);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setSuccess("");

    const load = mode === "account" ? api.backupR2Settings : api.r2Settings;
    void load()
      .then((result) => {
        if (cancelled) return;
        setR2(result.r2);
        setForm(result.r2.connected ? formFromR2(result.r2) : blankForm());
        setEditing(!result.r2.connected);
        setDisconnecting(false);
      })
      .catch((issue) => {
        if (!cancelled) setError(issue instanceof Error ? issue.message : copy.loadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.loadError, mode, open]);

  async function saveConnection(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const save = mode === "account" ? api.updateBackupR2Settings : api.updateR2Settings;
      const result = await save({
        accountId: form.accountId.trim(),
        bucket: form.bucket.trim(),
        accessKeyId: form.accessKeyId.trim(),
        secretAccessKey: form.secretAccessKey || undefined,
        createBucket: form.createBucket
      });
      setR2(result.r2);
      setForm(formFromR2(result.r2));
      setEditing(false);
      setDisconnecting(false);
      setSuccess(copy.saved);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save R2 connection");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const disconnectR2 = mode === "account" ? api.disconnectBackupR2 : api.disconnectR2;
      const result = await disconnectR2();
      setR2(result.r2);
      setForm(blankForm());
      setEditing(true);
      setDisconnecting(false);
      setSuccess(copy.removed);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not disconnect R2");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl overflow-hidden border border-white/10 bg-black">
      {loading ? (
        <div className="divide-y divide-white/10">
          <div className="h-20 animate-pulse bg-white/[0.02]" />
          <div className="h-44 animate-pulse bg-white/[0.015]" />
        </div>
      ) : null}

      {!loading && !editing && r2.connected ? (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-xl tracking-[-0.03em] text-white">Cloudflare R2</h2>
              <p className="mt-1.5 text-sm text-zinc-500">{r2.bucket}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 pr-2 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300">
                <span className="h-1.5 w-1.5 bg-emerald-400" />
                Connected
              </span>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-zinc-400 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white" onClick={() => setEditing(true)} title="Edit R2 connection" aria-label="Edit R2 connection">
                <AppIcon icon={PencilEdit02Icon} size={15} />
              </button>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-300" onClick={() => setDisconnecting(true)} title="Disconnect R2" aria-label="Disconnect R2">
                <AppIcon icon={Delete02Icon} size={15} />
              </button>
            </div>
          </header>

          <dl className="divide-y divide-white/10 px-5 sm:px-7">
            <div className="grid gap-1 py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs text-zinc-500">Account ID</dt>
              <dd className="truncate font-mono text-xs text-zinc-300">{r2.accountId}</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs text-zinc-500">Endpoint</dt>
              <dd className="truncate font-mono text-xs text-zinc-300">{r2.endpoint}</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs text-zinc-500">Access key</dt>
              <dd className="truncate font-mono text-xs text-zinc-300">••••••{r2.accessKeyIdSuffix}</dd>
            </div>
          </dl>

          {disconnecting ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rose-400/30 bg-rose-400/10 px-5 py-4 sm:px-7">
              <div>
                <div className="text-sm text-rose-100">Disconnect R2?</div>
                <div className="mt-1 text-xs text-rose-200/70">Future uploads to this bucket will stop.</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center border border-rose-400/50 text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-50" onClick={() => void disconnect()} disabled={busy} title="Disconnect" aria-label="Confirm disconnect">
                  <AppIcon icon={CheckmarkCircle02Icon} size={16} />
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] disabled:opacity-50" onClick={() => setDisconnecting(false)} disabled={busy} title="Cancel" aria-label="Cancel disconnect">
                  <AppIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {!loading && editing ? (
        <form onSubmit={saveConnection}>
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-xl tracking-[-0.03em] text-white">{r2.connected ? copy.editTitle : copy.connectTitle}</h2>
              <p className="mt-1.5 text-sm text-zinc-500">Cloudflare R2 credentials for database backups.</p>
            </div>
            <AppIcon icon={CloudUploadIcon} size={18} className="mt-1 text-zinc-500" />
          </header>

          <div className="divide-y divide-white/10 px-5 sm:px-7">
            <div className="grid gap-2 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <label htmlFor="r2-account-id" className="text-xs text-zinc-500">Account ID</label>
              <FormInput id="r2-account-id" value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })} placeholder="Cloudflare account ID" required variant="monochrome" className="!h-9 border-white/15 bg-white/[0.03] text-sm" />
            </div>
            <div className="grid gap-2 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <label htmlFor="r2-bucket" className="text-xs text-zinc-500">Bucket</label>
              <FormInput id="r2-bucket" value={form.bucket} onChange={(event) => setForm({ ...form, bucket: event.target.value })} placeholder="aeroplane-backups" required variant="monochrome" className="!h-9 border-white/15 bg-white/[0.03] text-sm" />
            </div>
            <div className="grid gap-2 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <label htmlFor="r2-access-key" className="text-xs text-zinc-500">Access key ID</label>
              <FormInput id="r2-access-key" value={form.accessKeyId} onChange={(event) => setForm({ ...form, accessKeyId: event.target.value })} placeholder="R2 access key ID" required variant="monochrome" className="!h-9 border-white/15 bg-white/[0.03] text-sm" />
            </div>
            <div className="grid gap-2 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <label htmlFor="r2-secret-key" className="text-xs text-zinc-500">Secret key</label>
              <FormInput
                id="r2-secret-key"
                type="password"
                value={form.secretAccessKey}
                onChange={(event) => setForm({ ...form, secretAccessKey: event.target.value })}
                placeholder={r2.connected ? "Leave blank to keep current secret" : "R2 secret access key"}
                required={!r2.connected}
                variant="monochrome"
                className="!h-9 border-white/15 bg-white/[0.03] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4 sm:px-7">
            <Checkbox
              checked={form.createBucket}
              label="Create or verify bucket"
              onChange={(createBucket) => setForm({ ...form, createBucket })}
            >
              <span className="text-xs text-zinc-400">Create or verify bucket</span>
            </Checkbox>

            <div className="flex items-center gap-2">
              {r2.connected ? (
                <button type="button" className="inline-flex h-9 items-center justify-center border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] disabled:opacity-50" onClick={() => {
                  setForm(formFromR2(r2));
                  setEditing(false);
                }} disabled={busy}>
                  Cancel
                </button>
              ) : null}
              <button type="submit" className="inline-flex h-9 items-center justify-center bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy}>
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {error ? (
        <div className="border-t border-white/10 px-5 py-4 sm:px-7">
          <div className="border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>
        </div>
      ) : null}
      {success ? (
        <div className="flex items-center gap-2 border-t border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-xs text-emerald-300 sm:px-7">
          <AppIcon icon={CheckmarkCircle02Icon} size={13} />
          {success}
        </div>
      ) : null}
    </section>
  );
}
