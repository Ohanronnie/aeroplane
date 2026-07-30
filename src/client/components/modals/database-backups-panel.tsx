import {
  ArchiveRestoreIcon,
  CheckmarkCircle02Icon,
  DatabaseBackup,
  Delete02Icon,
  Refresh03Icon,
  Settings01Icon
} from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useState } from "react";
import { api, type BackupScheduleEnabled, type BackupStorageTarget, type DatabaseBackup as DatabaseBackupRecord, type DatabaseBackupSettings, type R2SettingsStatus } from "../../api";
import { AppIcon } from "../ui/primitives";
import { ConfirmationDialog } from "./confirmation-dialog";
import { defaultSettings, disabledBackupScheduleEnabled, storageLabel } from "./database-backups/backup-format";
import { BackupList } from "./database-backups/backup-list";
import { BackupSettingsModal } from "./database-backups/backup-settings-modal";

export function DatabaseBackupsPanel({ serviceId }: { serviceId: string }) {
  const [backups, setBackups] = useState<DatabaseBackupRecord[]>([]);
  const [settings, setSettings] = useState<DatabaseBackupSettings | null>(null);
  const [r2, setR2] = useState<R2SettingsStatus | null>(null);
  const [busy, setBusy] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [restoreId, setRestoreId] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftStorage, setDraftStorage] = useState<BackupStorageTarget>("disk");
  const [draftScheduleEnabled, setDraftScheduleEnabled] = useState<BackupScheduleEnabled>({
    ...disabledBackupScheduleEnabled
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const r2Connected = r2?.connected ?? false;
  const r2Available = r2Connected;
  const activeSettings = settings ?? defaultSettings(r2Available);

  const loadBackups = useCallback(async () => {
    setBusy((current) => current || "load");
    setError("");
    try {
      const result = await api.databaseBackups(serviceId);
      setBackups(result.backups);
      setSettings(result.settings);
      setDraftStorage(result.settings.storage);
      setDraftScheduleEnabled({ ...result.settings.scheduleEnabled });
      setR2(result.r2);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load backups");
    } finally {
      setBusy((current) => (current === "load" ? "" : current));
    }
  }, [serviceId]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  async function createBackup() {
    setBusy("backup");
    setError("");
    setSuccess("");
    try {
      const result = await api.createDatabaseBackup(serviceId);
      setBackups((current) => [result.backup, ...current.filter((backup) => backup.id !== result.backup.id)]);
      setSuccess(`Backup saved to ${storageLabel(result.backup.storage, Boolean(result.backup.r2Key))}.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not create backup");
      await loadBackups();
    } finally {
      setBusy("");
    }
  }

  async function saveSettings() {
    setBusy("settings");
    setError("");
    setSuccess("");
    try {
      const result = await api.updateDatabaseBackupSettings(serviceId, {
        storage: draftStorage,
        scheduleEnabled: draftScheduleEnabled
      });
      setSettings(result.settings);
      setSettingsOpen(false);
      setSuccess("Backup settings saved.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save backup settings");
    } finally {
      setBusy("");
    }
  }

  async function restoreBackup(backupId: string) {
    setBusy(`restore:${backupId}`);
    setError("");
    setSuccess("");
    try {
      await api.restoreDatabaseBackup(serviceId, backupId);
      setRestoreId("");
      setSuccess("Backup restored.");
      await loadBackups();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not restore backup");
      setRestoreId("");
    } finally {
      setBusy("");
    }
  }

  async function deleteBackup(backupId: string) {
    setBusy(`delete:${backupId}`);
    setError("");
    setSuccess("");
    try {
      await api.deleteDatabaseBackup(serviceId, backupId);
      setBackups((current) => current.filter((backup) => backup.id !== backupId));
      setDeleteId("");
      setSuccess("Backup deleted.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete backup");
      setDeleteId("");
    } finally {
      setBusy("");
    }
  }

  function openSettings() {
    setDraftStorage(activeSettings.storage);
    setDraftScheduleEnabled({ ...activeSettings.scheduleEnabled });
    setSettingsOpen(true);
  }

  function updateDraftSchedule(trigger: keyof BackupScheduleEnabled, enabled: boolean) {
    setDraftScheduleEnabled((current) => ({
      ...current,
      [trigger]: enabled
    }));
  }

  const loading = busy === "load";
  const creating = busy === "backup";
  const savingSettings = busy === "settings";
  const restoreBackupRecord = backups.find((backup) => backup.id === restoreId) ?? null;
  const deleteBackupRecord = backups.find((backup) => backup.id === deleteId) ?? null;

  return (
    <>
      <section className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col overflow-hidden border border-white/10 bg-black">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg tracking-[-0.03em] text-white">Backups</h2>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
              {backups.length} {backups.length === 1 ? "backup" : "backups"} · {storageLabel(activeSettings.storage, r2Available)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              onClick={openSettings}
              title="Backup settings"
              aria-label="Backup settings"
            >
              <AppIcon icon={Settings01Icon} size={14} />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              onClick={() => void loadBackups()}
              disabled={loading || creating}
              title="Refresh backups"
              aria-label="Refresh backups"
            >
              <AppIcon icon={Refresh03Icon} size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-2 bg-white px-3 text-xs text-black transition hover:bg-zinc-200 disabled:opacity-40"
              onClick={() => void createBackup()}
              disabled={creating || loading}
            >
              <AppIcon icon={creating ? Refresh03Icon : DatabaseBackup} size={13} className={creating ? "animate-spin" : ""} />
              Create backup
            </button>
          </div>
        </header>

        {r2Available ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-zinc-600 sm:px-5">
            <span className="uppercase text-zinc-400">R2 connected</span>
            <span>{r2?.bucket}</span>
            <span className="truncate">{r2?.endpoint}</span>
          </div>
        ) : null}

        {error || success ? (
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            {error ? <div className="border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div> : null}
            {success ? (
              <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200">
                <AppIcon icon={CheckmarkCircle02Icon} size={13} />
                {success}
              </div>
            ) : null}
          </div>
        ) : null}

        <BackupList
          serviceId={serviceId}
          backups={backups}
          automaticEnabled={activeSettings.automaticEnabled}
          loading={loading}
          busy={busy}
          showRemoteStorageDetails={true}
          onDeletePrompt={setDeleteId}
          onRestorePrompt={setRestoreId}
        />
      </section>

      <BackupSettingsModal
        open={settingsOpen}
        activeSettings={activeSettings}
        r2Connected={r2Available}
        showRemoteStorageOptions={true}
        draftStorage={draftStorage}
        draftScheduleEnabled={draftScheduleEnabled}
        saving={savingSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={() => void saveSettings()}
        onDraftStorageChange={setDraftStorage}
        onDraftScheduleChange={updateDraftSchedule}
      />
      <ConfirmationDialog
        open={Boolean(restoreBackupRecord)}
        title="Restore this backup?"
        subject={restoreBackupRecord?.fileName ?? restoreBackupRecord?.id}
        description="The current database contents will be replaced with the data stored in this backup."
        confirmLabel="Restore backup"
        eyebrow="Database restore"
        icon={ArchiveRestoreIcon}
        confirmIcon={ArchiveRestoreIcon}
        tone="warning"
        busy={busy.startsWith("restore:")}
        onClose={() => setRestoreId("")}
        onConfirm={() => restoreBackupRecord ? restoreBackup(restoreBackupRecord.id) : undefined}
      />
      <ConfirmationDialog
        open={Boolean(deleteBackupRecord)}
        title="Delete this backup?"
        subject={deleteBackupRecord?.fileName ?? deleteBackupRecord?.id}
        description="This permanently removes the backup file. It cannot be restored afterward."
        confirmLabel="Delete backup"
        eyebrow="Backup storage"
        icon={Delete02Icon}
        confirmIcon={Delete02Icon}
        busy={busy.startsWith("delete:")}
        onClose={() => setDeleteId("")}
        onConfirm={() => deleteBackupRecord ? deleteBackup(deleteBackupRecord.id) : undefined}
      />
    </>
  );
}
